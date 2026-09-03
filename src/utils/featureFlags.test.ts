import { describe, expect, it } from "vitest";
import { resolveAgentLabEnabled } from "./featureFlags";

describe("resolveAgentLabEnabled", () => {
  it("在 Vite 开发服务器中默认开启", () => {
    expect(resolveAgentLabEnabled({ DEV: true })).toBe(true);
  });

  it("允许测试站通过显式构建开关开启", () => {
    expect(resolveAgentLabEnabled({ DEV: false, VITE_ENABLE_AGENT_TEST: " true " })).toBe(true);
    expect(resolveAgentLabEnabled({ DEV: false, VITE_ENABLE_AGENT_TEST: "TRUE" })).toBe(true);
  });

  it("在普通生产构建中默认关闭", () => {
    expect(resolveAgentLabEnabled({ DEV: false })).toBe(false);
    expect(resolveAgentLabEnabled({ DEV: false, VITE_ENABLE_AGENT_TEST: "false" })).toBe(false);
  });
});
