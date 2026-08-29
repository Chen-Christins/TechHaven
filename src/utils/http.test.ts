import { describe, expect, it, beforeEach } from "vitest";
import { HttpClient, HttpError, tokenManager, setUnauthorizedHandler } from "./http";

/** 模拟后端业务未授权（errno 1101），复用 axios adapter 注入 */
const unauthorizedAdapter: import("axios").AxiosRequestConfig["adapter"] = async (config) => ({
  data: { code: 200, errno: 1101, message: "未登录", msg: "未登录", data: null, success: false },
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

describe("HTTP 未授权（1101）处理", () => {
  beforeEach(() => {
    tokenManager.clearToken();
    setUnauthorizedHandler(null);
  });

  it("收到 1101 时抛出 HttpError 并清空内存 token", async () => {
    tokenManager.setToken("tok-123");
    const client = new HttpClient({ baseURL: "http://test.local" });
    await expect(client.get("/x", { adapter: unauthorizedAdapter })).rejects.toMatchObject({
      errno: 1101,
      code: 200,
    });
    expect(tokenManager.getToken()).toBeNull();
  });

  it("收到 1101 时通过注册回调同步清空 AuthContext 登录态", async () => {
    let notified = 0;
    setUnauthorizedHandler(() => {
      notified += 1;
    });
    tokenManager.setToken("tok-123");
    const client = new HttpClient({ baseURL: "http://test.local" });
    await expect(client.get("/x", { adapter: unauthorizedAdapter })).rejects.toBeInstanceOf(HttpError);
    expect(notified).toBe(1);
    expect(tokenManager.getToken()).toBeNull();
  });

  it("请求拦截器为已登录请求附加 Bearer token", async () => {
    tokenManager.setToken("tok-456");
    let captured: import("axios").AxiosRequestConfig | undefined;
    const client = new HttpClient({ baseURL: "http://test.local" });
    await client.get("/ok", {
      adapter: async (config) => {
        captured = config;
        return {
          data: { errno: 0, success: true, data: { ok: true } },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });
    expect(captured?.headers?.Authorization).toBe("Bearer tok-456");
  });
});
