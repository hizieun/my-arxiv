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
