/** 引擎驱动类型：mock=脚本化闭环；dsh=真实引擎（drivers/dsh.ts 经官方 SDK 驱动） */
export type EngineDriverKind = "mock" | "dsh";
export type GatewayStoreKind = "jsonl" | "postgres";

export interface Config {
  /** Bearer 令牌：除 /healthz 外所有 API 的鉴权凭据（TECHHAVEN_GATEWAY_TOKEN，必填） */
  gatewayToken: string;
  /** HTTP 监听端口（TECHHAVEN_GATEWAY_PORT，默认 3091） */
  port: number;
  /** 引擎驱动（TECHHAVEN_ENGINE_DRIVER，默认 mock） */
  driver: EngineDriverKind;
  /** 会话事件 / 审计 JSONL 目录（TECHHAVEN_GATEWAY_DATA_DIR，默认 ./data） */
  dataDir: string;
  /** 权威存储：jsonl=单实例 PoC；postgres=PG 权威且 JSONL 仅作 spool */
  store: GatewayStoreKind;
  /** TECHHAVEN_GATEWAY_DB_URL；store=postgres 时必填 */
  dbUrl: string;
  /** PostgreSQL schema（默认 public；测试可用隔离 schema） */
  dbSchema: string;
  /** JSONL proposal 共享文件；store=jsonl 时与 techhaven-mcp ProposalStore 共用 */
  proposalsFile: string;
  /** 单组织活动会话数配额（TECHHAVEN_MAX_SESSIONS_PER_ORG，默认 3，正整数） */
  maxSessionsPerOrg: number;
  /** 终态会话驻留分钟数：到点从注册表淘汰（TECHHAVEN_SESSION_RETENTION_MINUTES，默认 30；0 = 不淘汰） */
  sessionRetentionMinutes: number;
  /** 会话空闲超时分钟数：超时合成 failed 终态（TECHHAVEN_SESSION_IDLE_TIMEOUT_MINUTES，默认 30；0 = 关闭） */
  sessionIdleTimeoutMinutes: number;
  /** dsh 可执行文件路径（drivers/dsh.ts 经驱动构造器消费；TECHHAVEN_DSH_BIN） */
  dshBin?: string;
  /** dsh 引擎 profile 名：由 Gateway 经 DshSdkDriver 构造器统一下发，前端不可指定（TECHHAVEN_DSH_PROFILE） */
  dshProfile?: string;
  /** dsh 引擎主目录 / 工作区根（drivers/dsh.ts 经驱动构造器消费；TECHHAVEN_DSH_HOME） */
  dshHome?: string;
}

/** 配置错误（≈ services/techhaven-mcp/src/config.ts 的 ConfigError 同构孪生，防漂移） */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const gatewayToken = env.TECHHAVEN_GATEWAY_TOKEN?.trim() ?? "";
  if (!gatewayToken) {
    throw new ConfigError("缺少 TECHHAVEN_GATEWAY_TOKEN（网关 API 的 Bearer 鉴权令牌）");
  }

  // 端口：空 = 默认；给了就必须是 1~65535 的整数（宁可起不来也不带病监听）
  let port = 3091;
  const portRaw = env.TECHHAVEN_GATEWAY_PORT?.trim() ?? "";
  if (portRaw) {
    const parsed = Number(portRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      throw new ConfigError(`TECHHAVEN_GATEWAY_PORT 必须是 1~65535 的整数，收到：${portRaw}`);
    }
    port = parsed;
  }

  const driverRaw = (env.TECHHAVEN_ENGINE_DRIVER ?? "mock").trim().toLowerCase();
  if (driverRaw !== "mock" && driverRaw !== "dsh") {
    throw new ConfigError(`TECHHAVEN_ENGINE_DRIVER 只能是 mock | dsh，收到：${driverRaw}`);
  }
  const driver = driverRaw as EngineDriverKind;

  const dataDir = env.TECHHAVEN_GATEWAY_DATA_DIR?.trim() || "./data";

  const storeRaw = (env.TECHHAVEN_GATEWAY_STORE ?? "jsonl").trim().toLowerCase();
  if (storeRaw !== "jsonl" && storeRaw !== "postgres") {
    throw new ConfigError(`TECHHAVEN_GATEWAY_STORE 只能是 jsonl | postgres，收到：${storeRaw}`);
  }
  const store = storeRaw as GatewayStoreKind;
  const dbUrl = env.TECHHAVEN_GATEWAY_DB_URL?.trim() ?? "";
  if (store === "postgres" && !dbUrl) {
    throw new ConfigError("TECHHAVEN_GATEWAY_STORE=postgres 时必须设置 TECHHAVEN_GATEWAY_DB_URL");
  }
  const dbSchema = env.TECHHAVEN_GATEWAY_DB_SCHEMA?.trim() || "public";
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbSchema)) {
    throw new ConfigError(`TECHHAVEN_GATEWAY_DB_SCHEMA 不是合法标识符：${dbSchema}`);
  }
  const proposalsFile = env.TECHHAVEN_PROPOSALS_FILE?.trim() || "../techhaven-mcp/audit/proposals.jsonl";

  // 配额：正整数；空 = 默认 3
  const maxRaw = (env.TECHHAVEN_MAX_SESSIONS_PER_ORG ?? "3").trim();
  const maxSessionsPerOrg = Number(maxRaw);
  if (!Number.isInteger(maxSessionsPerOrg) || maxSessionsPerOrg <= 0) {
    throw new ConfigError(`TECHHAVEN_MAX_SESSIONS_PER_ORG 必须是正整数，收到：${maxRaw}`);
  }

  // 终态会话驻留分钟数：正整数或 0（0 = 不淘汰）；空 = 默认 30
  const retentionRaw = env.TECHHAVEN_SESSION_RETENTION_MINUTES?.trim() || "30";
  const sessionRetentionMinutes = Number(retentionRaw);
  if (!Number.isInteger(sessionRetentionMinutes) || sessionRetentionMinutes < 0) {
    throw new ConfigError(`TECHHAVEN_SESSION_RETENTION_MINUTES 必须是正整数或 0（0 = 不淘汰），收到：${retentionRaw}`);
  }

  // 会话空闲超时分钟数：正整数或 0（0 = 关闭看门狗）；空 = 默认 30
  const idleRaw = env.TECHHAVEN_SESSION_IDLE_TIMEOUT_MINUTES?.trim() || "30";
  const sessionIdleTimeoutMinutes = Number(idleRaw);
  if (!Number.isInteger(sessionIdleTimeoutMinutes) || sessionIdleTimeoutMinutes < 0) {
    throw new ConfigError(`TECHHAVEN_SESSION_IDLE_TIMEOUT_MINUTES 必须是正整数或 0（0 = 关闭），收到：${idleRaw}`);
  }

  return {
    gatewayToken,
    port,
    driver,
    dataDir,
    store,
    dbUrl,
    dbSchema,
    proposalsFile,
    maxSessionsPerOrg,
    sessionRetentionMinutes,
    sessionIdleTimeoutMinutes,
    // dsh 驱动选项：透传收集，经 index.ts 的 DshSdkDriver 构造器统一下发
    dshBin: env.TECHHAVEN_DSH_BIN?.trim() || undefined,
    dshProfile: env.TECHHAVEN_DSH_PROFILE?.trim() || undefined,
    dshHome: env.TECHHAVEN_DSH_HOME?.trim() || undefined,
  };
}
