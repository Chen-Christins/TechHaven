/** Execute the reviewed Agent DB DDL/migration/seed against an explicit PostgreSQL instance. */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import pg from "pg";

const { values } = parseArgs({
  options: {
    url: { type: "string" },
    schema: { type: "string" },
    mode: { type: "string" },
    seed: { type: "boolean" },
  },
});
const dbUrl = values.url ?? process.env.TECHHAVEN_GATEWAY_DB_URL ?? process.env.TECHHAVEN_DB_URL ?? "";
const schema = values.schema ?? process.env.TECHHAVEN_GATEWAY_DB_SCHEMA ?? "public";
const mode = values.mode ?? "upgrade";
if (!dbUrl) throw new Error("缺少数据库地址：--url / TECHHAVEN_GATEWAY_DB_URL / TECHHAVEN_DB_URL");
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error(`PostgreSQL schema 非法：${schema}`);
if (mode !== "fresh" && mode !== "upgrade") throw new Error(`--mode 只能是 fresh | upgrade，收到：${mode}`);

async function main(): Promise<void> {
  if (schema !== "public") {
    const admin = new pg.Pool({ connectionString: dbUrl, max: 1, connectionTimeoutMillis: 5_000 });
    try {
      await admin.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    } finally {
      await admin.end();
    }
  }
  const pool = new pg.Pool({
    connectionString: dbUrl,
    max: 1,
    connectionTimeoutMillis: 5_000,
    options: `-c search_path=${schema}`,
  });
  try {
    const sql = readFileSync(
      mode === "fresh"
        ? new URL("../../../docs/agent-db/schema.sql", import.meta.url)
        : new URL("../../../docs/agent-db/migrations/002-v0.2-to-v0.3-authoritative.sql", import.meta.url),
      "utf8",
    );
    await pool.query(sql);
    console.log(`Agent DB ${mode} migration applied (schema=${schema})`);
    if (values.seed) {
      const seed = readFileSync(new URL("../../../docs/agent-db/seed-semantics.sql", import.meta.url), "utf8");
      await pool.query(seed);
      console.log("Agent DB semantics seed applied idempotently");
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
