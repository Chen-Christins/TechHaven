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

export interface FeedbackListParams {
  page?: number;
  page_size?: number;
  type?: string;
}

export interface FeedbackListResponse {
  list: FeedbackItem[];
  total: number;
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

  static async getFeedbacks(params?: FeedbackListParams) {
    return http.get<FeedbackListResponse>("/admin/feedback/list", { params });
  }

  static async deleteFeedback(id: string) {
    return http.post("/admin/feedback/delete", { id });
  }

  static async convertFeedback(
    id: string,
    target: "faq" | "requirement" | "bug",
    data: { title: string; content: string; cat?: string; org_id?: string },
  ) {
    return http.post("/admin/feedback/convert", { id, target, ...data });
  }

  static async deleteFaq(id: string) {
    return http.post("/admin/faq/delete", { id });
  }

  static async updateFaq(id: string, data: { q: string; a: string; cat: string }) {
    return http.post("/admin/faq/edit", { id, ...data });
  }
}
