import indexData from "../../content/index.json";

interface ArticleIndex {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  createdAt: string;
  published: boolean;
}

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  relatedSlugs: string[];
  coverImage: string;
  content: string;
  published: boolean;
}

const articleModules = import.meta.glob<Article>("../../content/articles/*.json", {
  eager: true,
  import: "default",
});

export function getArticleList(): ArticleIndex[] {
  return (indexData as ArticleIndex[])
    .filter((a) => a.published && articleModules[`../../content/articles/${a.slug}.json`])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getArticle(slug: string): Article | undefined {
  const key = `../../content/articles/${slug}.json`;
  return articleModules[key];
}

export function getAllSlugs(): string[] {
  return (indexData as ArticleIndex[]).map((a) => a.slug);
}
