import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * R&D 平台专用导航 hook。
 * 自动保留当前 URL 中的 org 查询参数，确保组织选择在页面跳转和刷新后不会丢失。
 * 不使用 localStorage，完全基于 URL 持久化。
 */
export function useRdNavigate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (to: string) => {
    const org = searchParams.get("org");
    if (!org) {
      navigate(to);
      return;
    }
    // 避免重复追加 org 参数
    if (to.includes("org=")) {
      navigate(to);
      return;
    }
    const separator = to.includes("?") ? "&" : "?";
    navigate(`${to}${separator}org=${org}`);
  };
}
