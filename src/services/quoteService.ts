export interface DailyQuote {
  content: string;
  source: string;
  author: string;
}

interface HitokotoResponse {
  hitokoto: string;
  from: string;
  from_who: string | null;
}

/**
 * 获取每日名言（一言 API，免鉴权、支持 CORS）
 * 文档：https://developer.hitokoto.cn/
 */
export const getDailyQuote = async (): Promise<DailyQuote> => {
  const response = await fetch("https://v1.hitokoto.cn/", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`获取名言失败 (HTTP ${response.status})`);
  }

  const data = (await response.json()) as HitokotoResponse;

  return {
    content: data.hitokoto,
    source: data.from || "",
    author: data.from_who || "",
  };
};

export default getDailyQuote;
