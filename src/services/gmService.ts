import http from "../utils/http";

export interface ServerStatusResponse {
  running: boolean;
  version?: string;
  uptime?: number;
  message?: string;
}

// Simple in-memory mock state used in dev when backend is not ready
let mockState: ServerStatusResponse = {
  running: false,
  version: "1.0.0",
  uptime: 0,
  message: "未连接真实后端，使用 mock 数据",
};

const simulateDelay = <T>(result: T, delay = 500) => {
  return new Promise<T>((resolve) => setTimeout(() => resolve(result), delay));
};

export class GMService {
  static async getServerStatus(): Promise<ServerStatusResponse> {
    if (import.meta.env.DEV) {
      // simulate uptime increase
      if (mockState.running) mockState.uptime = (mockState.uptime || 0) + 60;
      return simulateDelay(mockState, 400);
    }

    const resp = await http.get<ServerStatusResponse>(`/gm/server/status`);
    return resp.data;
  }

  static async startServer(): Promise<any> {
    if (import.meta.env.DEV) {
      mockState = { ...mockState, running: true, message: "已通过 mock 启动", uptime: 0 };
      return simulateDelay({ success: true }, 400);
    }

    return http.post(`/gm/server/start`);
  }

  static async stopServer(): Promise<any> {
    if (import.meta.env.DEV) {
      mockState = { ...mockState, running: false, message: "已通过 mock 停止" };
      return simulateDelay({ success: true }, 400);
    }

    return http.post(`/gm/server/stop`);
  }

  static async updateServer(): Promise<any> {
    if (import.meta.env.DEV) {
      const nextVersion = mockState.version ? mockState.version.replace(/(\d+)$/, (m) => String(Number(m) + 1)) : "1.0.1";
      mockState = { ...mockState, version: nextVersion, message: "已通过 mock 完成更新" };
      return simulateDelay({ success: true, version: nextVersion }, 800);
    }

    return http.post(`/gm/server/update`);
  }
}

export default GMService;
