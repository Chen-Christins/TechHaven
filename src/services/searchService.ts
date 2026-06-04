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
    const parts: string[] = [];
    parts.push(`q=${encodeURIComponent(params.q)}`);
    parts.push(`page=${params.page ?? 1}`);
    parts.push(`per_page=${params.per_page ?? 20}`);
    if (params.user_id) parts.push(`user_id=${params.user_id}`);
    if (params.category_id) parts.push(`category_id=${params.category_id}`);
    if (params.label_id) parts.push(`label_id=${params.label_id}`);
    if (params.state !== undefined) parts.push(`state=${params.state}`);

    const response = await http.get<SearchResponse>(`/search?${parts.join("&")}`);
    return response.data;
  }
}

export default SearchService;
