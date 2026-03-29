import { getArticleList, getArticle } from "./articles";

export interface MindMapNode {
  id: string;
  title: string;
  tags: string[];
  url: string;
}

export interface MindMapEdge {
  source: string;
  target: string;
  type: "manual" | "tag";
  label: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export function getMindMapData(baseUrl: string): MindMapData {
  const articleList = getArticleList();
  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];

  const articles = articleList.map((item) => {
    const full = getArticle(item.slug);
    return {
      slug: item.slug,
      title: item.title,
      tags: item.tags,
      relatedSlugs: full?.relatedSlugs ?? [],
    };
  });

  // Build nodes
  for (const article of articles) {
    nodes.push({
      id: article.slug,
      title: article.title,
      tags: article.tags,
      url: `${baseUrl}artikel/${article.slug}/`,
    });
  }

  // Build manual edges (bidirectional, deduplicated)
  const slugSet = new Set(articles.map((a) => a.slug));
  const manualEdgeKeys = new Set<string>();
  for (const article of articles) {
    for (const relatedSlug of article.relatedSlugs) {
      if (!slugSet.has(relatedSlug)) continue;
      const key = [article.slug, relatedSlug].sort().join(":::");
      if (!manualEdgeKeys.has(key)) {
        manualEdgeKeys.add(key);
        edges.push({
          source: article.slug,
          target: relatedSlug,
          type: "manual",
          label: "terkait",
        });
      }
    }
  }

  // Build tag edges (for each shared tag between two articles)
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const a = articles[i];
      const b = articles[j];
      const sharedTags = a.tags.filter((tag) => b.tags.includes(tag));
      for (const tag of sharedTags) {
        edges.push({
          source: a.slug,
          target: b.slug,
          type: "tag",
          label: tag,
        });
      }
    }
  }

  return { nodes, edges };
}
