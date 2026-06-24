/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss（本地时间，自动补零）。
 * 接受 ISO 字符串、时间戳（毫秒/秒）或 Date 对象。
 */
export function formatDateTime(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(typeof input === "number" && input < 1e12 ? input * 1000 : input);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 格式化为口语化的相对时间，如"刚刚"、"5 分钟前"、"3 小时前"、"2 天前"、"1 个月前"、"1 年前"。
 * 接受 ISO 字符串、时间戳（毫秒/秒）或 Date 对象。无效输入返回 "-"。
 */
export function formatRelativeTime(input: string | number | Date): string {
  const now = Date.now();
  const d = input instanceof Date ? input : new Date(typeof input === "number" && input < 1e12 ? input * 1000 : input);
  if (isNaN(d.getTime())) return "-";

  const diff = now - d.getTime();

  if (diff < 0) return formatDateTime(input);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "刚刚";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;

  const years = Math.floor(months / 12);
  return `${years} 年前`;
}

export function formatToChinaTime(timestamp: number) {
  // 1. 秒级转毫秒级 + 补偿8小时时差（关键）
  const date = new Date(timestamp * 1000 + 8 * 3600000);

  // 2. 使用UTC方法获取时间组件（避免本地时区干扰）
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
