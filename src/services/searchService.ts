import http from "../utils/http";

export interface SearchParams {
  q: string;
  page?: number;
  per_page?: number;
  user_id?: string | number;
  category_id?: string | number;
  label_id?: string | number;
  state?: number;
}

export interface SearchResultItem {
  id: string | number;
  author: string;
  title: string;
  summary: string;
  type: number;
  state: number;
  views: number;
  praise: number;
  favorites: number;
  publish_time: number;
  categories?: Array<{ id: number; name: string }>;
  labels?: Array<{ id: number; name: string; color: string }>;
}

export interface SearchResponse {
  total: number;
  list: SearchResultItem[];
}

export class SearchService {
  static async search(params: SearchParams): Promise<SearchResponse> {
    const query = new URLSearchParams();

    query.set("q", params.q);
    query.set("page", String(params.page ?? 1));
    query.set("per_page", String(params.per_page ?? 20));
    if (params.user_id !== undefined && params.user_id !== null) query.set("user_id", String(params.user_id));
    if (params.category_id !== undefined && params.category_id !== null) query.set("category_id", String(params.category_id));
    if (params.label_id !== undefined && params.label_id !== null) query.set("label_id", String(params.label_id));
    if (params.state !== undefined && params.state !== null) query.set("state", String(params.state));

    const response = await http.get<SearchResponse>(`/search?${query.toString()}`);
    return response.data;
  }
}

export default SearchService;
