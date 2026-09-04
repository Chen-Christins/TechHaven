import test from "node:test";
import assert from "node:assert/strict";
import type pg from "pg";
import { GatewayPgStore } from "./pgStore.js";

test("PG session owner survives create/restore; historical sessions remain ownerless", async () => {
  let owner: unknown;
  const query = async (sql: string, values: unknown[] = []) => {
    if (sql.includes("count(*)")) return { rows: [{ count: "0" }] };
    if (sql.includes("INSERT INTO agent_identities")) return { rows: [{ id: "1" }] };
    if (sql.includes("INSERT INTO agent_sessions")) {
      assert.match(sql, /'owner_actor', \$7::text/);
      owner = values[6];
    }
    if (sql.includes("SELECT s.id, s.sid"))
      return {
        rows: [
          { id: "1", sid: "new", org_id: 7, status: "succeeded", created_at: new Date(), exit_info: { owner_actor: owner } },
          { id: "2", sid: "old", org_id: 7, status: "succeeded", created_at: new Date(), exit_info: null },
        ],
      };
    return { rows: [] };
  };
  const store = GatewayPgStore.forTesting({ query, connect: async () => ({ query, release() {} }) } as unknown as pg.Pool);
  await store.createSession({ sid: "new", orgId: 7, ownerActor: "user:100", createdAt: new Date().toISOString() }, 3);
  const restored = await store.restore(0);
  assert.equal(restored[0].ownerActor, "user:100");
  assert.equal(restored[1].ownerActor, undefined);
});
