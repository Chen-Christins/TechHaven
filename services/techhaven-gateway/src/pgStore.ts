import pg from "pg";
import type { EngineEvent, SessionStatus } from "./types.js";

const ACTIVE_STATUSES: readonly SessionStatus[] = ["queued", "running", "awaiting_permission"];

export interface PersistedGatewaySession {
  sid: string;
  orgId: number;
  subjectType?: string;
  subjectId?: string;
  status: SessionStatus;
  createdAt: string;
  endedAt?: string;
  events: EngineEvent[];
}

interface SessionRow {
  id: string;
  sid: string;
  org_id: number;
  status: SessionStatus;
  created_at: Date | string;
  ended_at: Date | string | null;
  exit_info: { subject_type?: unknown; subject_id?: unknown } | null;
}

interface EventRow {
  sid: string;
  seq: string;
  ts: Date | string;
  type: EngineEvent["type"];
  payload: Record<string, unknown>;
}

export class PgQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PgQuotaError";
  }
}

/** PostgreSQL 权威的 Gateway session/event adapter；JSONL 仅由 registry 继续作为 spool。 */
export class GatewayPgStore {
  private constructor(private readonly pool: pg.Pool) {}

  static async connect(dbUrl: string, schema = "public"): Promise<GatewayPgStore> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error(`PostgreSQL schema 非法：${schema}`);
    const pool = new pg.Pool({
      connectionString: dbUrl,
      max: 8,
      connectionTimeoutMillis: 5_000,
      options: `-c search_path=${schema}`,
    });
    try {
      await pool.query("SELECT 1");
      return new GatewayPgStore(pool);
    } catch (error) {
      await pool.end().catch(() => undefined);
      throw error;
    }
  }

  async restore(retentionMinutes: number): Promise<PersistedGatewaySession[]> {
    const params: unknown[] = [];
    let retention = "";
    if (retentionMinutes > 0) {
      params.push(retentionMinutes);
      retention = `WHERE s.ended_at IS NULL OR s.ended_at > now() - ($1::text || ' minutes')::interval`;
    }
    const sessions = await this.pool.query<SessionRow>(
      `SELECT s.id, s.sid, s.org_id, s.status, s.created_at, s.ended_at, s.exit_info
         FROM agent_sessions s
         ${retention}
        ORDER BY s.created_at, s.id`,
      params,
    );
    if (sessions.rows.length === 0) return [];
    const ids = sessions.rows.map((row) => row.id);
    const events = await this.pool.query<EventRow>(
      `SELECT s.sid, e.seq, e.ts, e.type, e.payload
         FROM agent_events e
         JOIN agent_sessions s ON s.id = e.session_id
        WHERE e.session_id = ANY($1::bigint[])
        ORDER BY e.session_id, e.seq`,
      [ids],
    );
    const bySid = new Map<string, EngineEvent[]>();
    for (const row of events.rows) {
      const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {};
      const event = {
        ...payload,
        type: row.type,
        seq: Number(row.seq),
        ts: new Date(row.ts).toISOString(),
      } as EngineEvent;
      const list = bySid.get(row.sid) ?? [];
      list.push(event);
      bySid.set(row.sid, list);
    }
    return sessions.rows.map((row) => ({
      sid: row.sid,
      orgId: Number(row.org_id),
      ...(typeof row.exit_info?.subject_type === "string" ? { subjectType: row.exit_info.subject_type } : {}),
      ...(typeof row.exit_info?.subject_id === "string" ? { subjectId: row.exit_info.subject_id } : {}),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      ...(row.ended_at ? { endedAt: new Date(row.ended_at).toISOString() } : {}),
      events: bySid.get(row.sid) ?? [],
    }));
  }

  /** advisory transaction lock + authoritative count prevents multi-instance quota oversubscription. */
  async createSession(
    input: {
      sid: string;
      orgId: number;
      subjectType?: string;
      subjectId?: string;
      createdAt: string;
    },
    maxSessionsPerOrg: number,
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(141402, $1)", [input.orgId]);
      const count = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM agent_sessions
          WHERE org_id = $1 AND status = ANY($2::agent_session_status[])`,
        [input.orgId, ACTIVE_STATUSES],
      );
      const active = Number(count.rows[0]?.count ?? 0);
      if (active >= maxSessionsPerOrg) {
        throw new PgQuotaError(`组织 ${input.orgId} 活动会话数已达配额（${active}/${maxSessionsPerOrg}）`);
      }
      const identity = await client.query<{ id: string }>(
        `INSERT INTO agent_identities (org_id, name, kind, created_by)
         VALUES ($1, 'techhaven-gateway', 'pipeline', 0)
         ON CONFLICT (org_id, name) DO UPDATE SET status = 'active'
         RETURNING id`,
        [input.orgId],
      );
      const identityId = identity.rows[0]?.id;
      if (!identityId) throw new Error("Gateway PG identity upsert 未返回 id");
      await client.query(
        `INSERT INTO agent_sessions
           (sid, identity_id, org_id, engine, engine_version, profile, status, created_at, exit_info)
         VALUES ($1, $2, $3, 'techhaven-gateway', '0.1.0', 'managed', 'queued', $4,
                 jsonb_strip_nulls(jsonb_build_object('subject_type', $5::text, 'subject_id', $6::text)))`,
        [input.sid, identityId, input.orgId, input.createdAt, input.subjectType ?? null, input.subjectId ?? null],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /** 事件先提交 PG，再由 registry 更新内存/SSE；false 表示 sid+seq 已存在。 */
  async appendEvent(sid: string, event: EngineEvent): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const session = await client.query<{ id: string; status: SessionStatus }>(
        `SELECT id, status FROM agent_sessions WHERE sid = $1 FOR UPDATE`,
        [sid],
      );
      const row = session.rows[0];
      if (!row) throw new Error(`Gateway PG 中不存在会话：${sid}`);
      const { seq, ts, type, ...payload } = event;
      const inserted = await client.query(
        `INSERT INTO agent_events (session_id, seq, ts, type, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (session_id, seq) DO NOTHING`,
        [row.id, seq, ts, type, JSON.stringify(payload)],
      );
      if (inserted.rowCount !== 1) {
        await client.query("ROLLBACK");
        return false;
      }
      if (event.type === "status_change") {
        const terminal = event.status === "succeeded" || event.status === "failed" || event.status === "cancelled";
        await client.query(
          `UPDATE agent_sessions
              SET status = $1,
                  started_at = CASE WHEN $1 = 'running' THEN COALESCE(started_at, $2::timestamptz) ELSE started_at END,
                  ended_at = CASE WHEN $3::boolean THEN $2::timestamptz ELSE ended_at END,
                  exit_info = CASE WHEN $3::boolean
                    THEN COALESCE(exit_info, '{}'::jsonb) || jsonb_build_object('detail', $4::text)
                    ELSE exit_info END
            WHERE id = $5`,
          [event.status, event.ts, terminal, event.detail ?? null, row.id],
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async ping(): Promise<void> {
    await this.pool.query("SELECT 1");
  }
}
