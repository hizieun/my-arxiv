export type PaperSource = "arxiv" | "huggingface" | "paperswithcode";

export interface Paper {
  id: string;
  source: PaperSource;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  updatedAt?: string;
  categories: string[];
  pdfUrl?: string;
  htmlUrl: string;
  popularity?: number;
  hfDaily?: boolean;
}

export interface ArxivCategory {
  code: string;
  name: string;
  group: string;
}

// ── 커뮤니티 (Supabase) ──

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  body: string; // 마크다운 원문
  tags: string[];
  created_at: string;
  updated_at: string;
}

// 목록/상세에서 작성자 프로필을 join 해서 함께 가져온 형태
export interface PostWithAuthor extends Post {
  author: Pick<Profile, "username" | "avatar_url"> | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, "username" | "avatar_url"> | null;
}
