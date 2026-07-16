import http from "../utils/http";

export type FeedbackType = "bug" | "feature" | "other";

export interface HelpFaq {
  id: string;
  q: string;
  a: string;
  cat: string;
}

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  content: string;
  contact?: string;
  created_at: number;
}

export class HelpService {
  static async getFaqs(keyword?: string) {
    const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    return http.get<HelpFaq[]>(`/help/faqs${params}`);
  }

  static async submitFeedback(payload: { type: FeedbackType; content: string; contact?: string }) {
    return http.post("/help/feedback", payload);
  }

  // ----- 管理员接口 -----

  static async getFeedbacks() {
    return http.get<FeedbackItem[]>("/admin/feedback/list");
  }

  static async deleteFeedback(id: string) {
    return http.post("/admin/feedback/delete", { id });
  }

  static async convertFeedback(
    id: string,
    target: "faq" | "requirement" | "bug",
    data: { title: string; content: string; cat?: string },
  ) {
    return http.post("/admin/feedback/convert", { id, target, ...data });
  }
}
