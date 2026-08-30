import { describe, expect, it } from "vitest";
import type { EventEnvelope } from "../../contracts";
import { AgentGatewayClient } from "./agentGatewayClient";

function envelope(sid: string, seq: number, text = `event-${seq}`): EventEnvelope {
  return {
    schemaVersion: 1,
    eventId: `${sid}:${seq}`,
    sessionId: sid,
    orgId: 1,
    seq,
    type: "assistant_chunk",
    occurredAt: "2026-08-29T00:00:00.000Z",
    traceId: "",
    payload: { text },
  };
}

function sseResponse(items: Array<EventEnvelope | "end" | string>): Response {
  const body = items
    .map((item) => {
      if (item === "end") return "event: end\ndata: {}\n\n";
      const data = typeof item === "string" ? item : JSON.stringify(item);
      return `data: ${data}\n\n`;
    })
    .join("");
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

function waitForEnd(client: AgentGatewayClient, sid: string): Promise<{ seqs: number[]; reason: string; errors: string[] }> {
  return new Promise((resolve) => {
    const seqs: number[] = [];
    const errors: string[] = [];
    client.subscribeEvents(sid, {
      onEvent: (env) => seqs.push(env.seq),
      onProtocolError: (message) => errors.push(message),
      onEnd: (reason) => resolve({ seqs, reason, errors }),
    });
  });
}

describe("AgentGatewayClient SSE contract", () => {
  it("断线后携带 after 续传，并按 sid + seq 丢弃重复回放", async () => {
    const sid = "s_resume";
    const urls: string[] = [];
    let calls = 0;
    const fetchImpl: typeof fetch = async (input) => {
      urls.push(String(input));
      calls += 1;
      return calls === 1
        ? sseResponse([envelope(sid, 1), envelope(sid, 2)])
        : sseResponse([envelope(sid, 2, "duplicate"), envelope(sid, 3), "end"]);
    };
    const client = new AgentGatewayClient("http://gateway.test", fetchImpl, {
      retryBaseMs: 0,
      retryMaxMs: 0,
      retryLimit: 2,
    });

    const result = await waitForEnd(client, sid);

    expect(result).toEqual({ seqs: [1, 2, 3], reason: "completed", errors: [] });
    expect(urls).toEqual([`http://gateway.test/v1/sessions/${sid}/events`, `http://gateway.test/v1/sessions/${sid}/events?after=2`]);
  });

  it("拒绝畸形与跨会话信封，但继续处理后续合法事件", async () => {
    const sid = "s_contract";
    const wrongSid = envelope("s_other", 1);
    const fetchImpl: typeof fetch = async () => sseResponse(["{bad-json", wrongSid, envelope(sid, 1), "end"]);
    const client = new AgentGatewayClient("http://gateway.test", fetchImpl, {
      retryBaseMs: 0,
      retryMaxMs: 0,
      retryLimit: 0,
    });

    const result = await waitForEnd(client, sid);

    expect(result.seqs).toEqual([1]);
    expect(result.reason).toBe("completed");
    expect(result.errors).toEqual(["事件帧 JSON 解析失败", `事件帧 sessionId 不匹配（期望 ${sid}）`]);
  });

  it("空 200 流不会无限重置重试预算", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return sseResponse([]);
    };
    const client = new AgentGatewayClient("http://gateway.test", fetchImpl, {
      retryBaseMs: 0,
      retryMaxMs: 0,
      retryLimit: 2,
    });

    const result = await waitForEnd(client, "s_empty");

    expect(result.reason).toBe("failed");
    expect(result.seqs).toEqual([]);
    expect(calls).toBe(3);
  });

  it("取消请求命中编码后的会话端点", async () => {
    let request: { url: string; init?: RequestInit } | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      request = { url: String(input), init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const client = new AgentGatewayClient("http://gateway.test", fetchImpl);

    await client.cancel("s/with space");

    expect(request?.url).toBe("http://gateway.test/v1/sessions/s%2Fwith%20space/cancel");
    expect(request?.init?.method).toBe("POST");
  });
});
