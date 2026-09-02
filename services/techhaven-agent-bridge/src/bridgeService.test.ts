import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { BridgeError, BridgeService } from "./bridgeService.js";
import { LegacyBackendError } from "./legacyClient.js";
import { JsonlOperationLedger } from "./ledger.js";
import type { LegacyBackendPort, TicketKind, TicketPage, TicketRecord, TrendSummary } from "./types.js";

class FakeLegacy implements LegacyBackendPort {
  status = "new";
  updates = 0;
  updateBehavior: "ok" | "commit-then-throw" | "throw" = "ok";

  ticket(orgId = 1): TicketRecord {
    return {
      id: 1,
      kind: "bug",
      orgId,
      title: "白屏",
      description: "",
      status: this.status,
      priority: "high",
      assignee: "",
      creator: "",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
  }

  async getTicket(orgId: number): Promise<TicketRecord | null> {
    return this.ticket(orgId);
  }
  async listTickets(): Promise<TicketPage> {
    return { total: 1, page: 1, pageSize: 20, items: [this.ticket()] };
  }
  async searchRequirements(): Promise<TicketPage> {
    return { total: 0, page: 1, pageSize: 20, items: [] };
  }
  async getTrendSummary(orgId: number, days: number): Promise<TrendSummary> {
    return {
      orgId,
      days,
      byKind: {
        requirement: { open: 0, closed: 0, total: 0 },
        bug: { open: 1, closed: 0, total: 1 },
        task: { open: 0, closed: 0, total: 0 },
      },
      newlyCreated: 0,
      newlyClosed: 0,
    };
  }
  async updateTicketStatus(_orgId: number, _kind: TicketKind, _id: number, toStatus: string): Promise<void> {
    this.updates += 1;
    if (this.updateBehavior === "throw") {
      throw new LegacyBackendError("LEGACY_UNAVAILABLE", "网络断开", 502, true);
    }
    this.status = toStatus;
    if (this.updateBehavior === "commit-then-throw") {
      throw new LegacyBackendError("LEGACY_UNAVAILABLE", "响应丢失", 502, true);
    }
  }
}

function input(reason = "确认问题已经复现") {
  return {
    sessionId: "s_1",
    orgId: 1,
    kind: "bug" as const,
    id: 1,
    toStatus: "accepted",
    reason,
    expectedFromStatus: "new",
    idempotencyKey: "p_1",
  };
}

test("并发重复请求只写旧后端一次，并返回幂等重放", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "techhaven-bridge-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const legacy = new FakeLegacy();
  const service = new BridgeService(legacy, new JsonlOperationLedger(join(dir, "operations.jsonl")));

  const [first, replay] = await Promise.all([service.transition(input()), service.transition(input())]);

  assert.equal(legacy.updates, 1);
  assert.equal(first.ticket.status, "accepted");
  assert.equal(replay.operation.replayed, true);
});

test("同一幂等键不能用于不同请求", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "techhaven-bridge-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const service = new BridgeService(new FakeLegacy(), new JsonlOperationLedger(join(dir, "operations.jsonl")));
  await service.transition(input());
  await assert.rejects(
    () => service.transition(input("另一个完全不同的原因")),
    (error: unknown) => error instanceof BridgeError && error.code === "IDEMPOTENCY_CONFLICT",
  );
  await assert.rejects(
    () => service.transition({ ...input(), sessionId: "s_other" }),
    (error: unknown) => error instanceof BridgeError && error.code === "IDEMPOTENCY_CONFLICT",
  );
});

test("旧后端提交后响应丢失时通过读后端完成对账", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "techhaven-bridge-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const legacy = new FakeLegacy();
  legacy.updateBehavior = "commit-then-throw";
  const service = new BridgeService(legacy, new JsonlOperationLedger(join(dir, "operations.jsonl")));

  const result = await service.transition(input());

  assert.equal(result.operation.reconciled, true);
  assert.equal(result.ticket.status, "accepted");
});

test("无法确认的写入进入 uncertain，重复调用不会盲目重试", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "techhaven-bridge-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const legacy = new FakeLegacy();
  legacy.updateBehavior = "throw";
  const service = new BridgeService(legacy, new JsonlOperationLedger(join(dir, "operations.jsonl")));

  await assert.rejects(() => service.transition(input()), /网络断开/);
  await assert.rejects(
    () => service.transition(input()),
    (error: unknown) => error instanceof BridgeError && error.code === "OPERATION_UNCERTAIN",
  );
  assert.equal(legacy.updates, 1);
});
