import http from "../utils/http";

export interface ServerStatusResponse {
  status?: string;
  version?: string;
  run_time?: number | string;
  detail?: string;
}

export interface ServerListResponse {
  list?: string[];
  total?: number;
}

const unwrapPayload = <T>(resp: unknown): T => {
  const maybeWrapped = resp as { data?: T };
  return (maybeWrapped?.data ?? (resp as T)) as T;
};

export class GMService {
  static async getServerList(): Promise<ServerListResponse> {
    const resp = await http.get<ServerListResponse>(`/game_server/list`);
    return unwrapPayload<ServerListResponse>(resp);
  }

  static async getServerStatus(): Promise<ServerStatusResponse> {
    const resp = await http.get<ServerStatusResponse>(`/game_server/status`);
    return unwrapPayload<ServerStatusResponse>(resp);
  }

  static async startServer(): Promise<any> {
    return http.post(`/game_server/start`);
  }

  static async stopServer(): Promise<any> {
    return http.post(`/game_server/stop`);
  }

  static async updateServer(): Promise<any> {
    return http.post(`/game_server/update`);
  }
}

export default GMService;
