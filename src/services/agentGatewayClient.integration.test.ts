import { describe, expect, it } from "vitest";
import { AgentGatewayClient } from "./agentGatewayClient";

// 本测试文件使用 node 进程环境；根 tsconfig 面向浏览器（types: ["vite/client"]），
// 这里用文件内声明避免把 @types/node 的全局 setTimeout 等拖进整个编译
declare const process: { env: Record<string, string | undefined> };

/**
 * 真实 Gateway 集成验证（R1 门禁）：
 * 仅在设置 TECHHAVEN_GATEWAY_URL 时运行（CI 默认跳过）。
 * 本地：先 `npm run dev`（mock 驱动 + TECHHAVEN_GATEWAY_TOKEN=dev-token）启动网关，
 * 再执行 TECHHAVEN_GATEWAY_URL=http://127.0.0.1:3091 npm test。
 * 验证：创建会话 → SSE 事件信封流 → 权限审批应答（approve）→ 会话 succeeded 且流以 end 关闭。
 */
const GATEWAY_URL = process.env.TECHHAVEN_GATEWAY_URL;

function authFetch(token: string): typeof fetch {
  return (input, init) =>
    fetch(input, {
      ...init,
      headers: { ...(init?.headers as Record<string, string> | undefined), authorization: `Bearer ${token}` },
    });
}

describe.skipIf(!GATEWAY_URL)("AgentGatewayClient × 本机 Gateway（integration）", () => {
  it("创建会话 → SSE 信封流 → 审批 → 终态关闭", async () => {
    const token = process.env.TECHHAVEN_GATEWAY_TOKEN ?? "dev-token";
    const client = new AgentGatewayClient(GATEWAY_URL, authFetch(token));

    const created = await client.createSession({
      orgId: 1,
      subjectType: "bug",
      subjectId: "bug_1",
      prompt: "集成验证：读取缺陷并分析。",
    });
    expect(created.sid).toBeTruthy();
    expect(["queued", "running"]).toContain(created.status);

    let events = 0;
    let sawToolCall = false;
    let sawPermission = false;
    let sawSucceeded = false;
    let endReason: string | undefined;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unwatch();
        reject(new Error(`超时（events=${events}，end=${endReason}）`));
      }, 30_000);
      const unwatch = client.subscribeEvents(created.sid, {
        onEvent: (env) => {
          events += 1;
          if (env.type === "assistant_chunk") expect(env.payload.text.length).toBeGreaterThan(0);
          if (env.type === "tool_call") sawToolCall = true;
          if (env.type === "permission_request") {
            sawPermission = true;
            // 真实审批流：同意后 mock 驱动继续执行直到 succeeded
            void client.answerPermission(created.sid, env.payload.requestId, "approve").catch((err) => {
              reject(err as Error);
            });
          }
          if (env.type === "status_change" && env.payload.status === "succeeded") sawSucceeded = true;
        },
        onEnd: (reason) => {
          endReason = reason;
          clearTimeout(timeout);
          unwatch();
          resolve();
        },
      });
    });

    expect(endReason).toBe("completed");
    expect(events).toBeGreaterThan(0);
    expect(sawToolCall).toBe(true);
    expect(sawPermission).toBe(true);
    expect(sawSucceeded).toBe(true);
  }, 45_000);
});
