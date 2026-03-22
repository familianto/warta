const API_BASE = "https://api.github.com";

let _token = "";
let _config = {
  owner: "",
  repo: "",
  contentBranch: "main",
  contentPath: "content",
};

function headers() {
  return {
    Authorization: `token ${_token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

function repoUrl(path) {
  return `${API_BASE}/repos/${_config.owner}/${_config.repo}/contents/${path}`;
}

async function apiRequest(url, options = {}) {
  const res = await fetch(url, { ...options, headers: headers() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.message || `GitHub API error: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

export function setToken(token) {
  _token = token;
}

export function getToken() {
  return _token;
}

export function setConfig(config) {
  _config = { ..._config, ...config };
}

export async function getArticleList() {
  const url =
    repoUrl(`${_config.contentPath}/index.json`) +
    `?ref=${_config.contentBranch}`;
  const data = await apiRequest(url);
  const content = atob(data.content.replace(/\n/g, ""));
  return { articles: JSON.parse(content), sha: data.sha };
}

export async function getArticle(slug) {
  const url =
    repoUrl(`${_config.contentPath}/articles/${slug}.json`) +
    `?ref=${_config.contentBranch}`;
  const data = await apiRequest(url);
  const content = atob(data.content.replace(/\n/g, ""));
  return { article: JSON.parse(content), sha: data.sha };
}

export async function saveArticle(slug, articleData) {
  const path = `${_config.contentPath}/articles/${slug}.json`;
  const url = repoUrl(path);
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(articleData, null, 2))));

  // Try to get existing file SHA
  let sha;
  try {
    const existing = await apiRequest(
      url + `?ref=${_config.contentBranch}`
    );
    sha = existing.sha;
  } catch {
    // File doesn't exist yet, that's fine
  }

  const body = {
    message: `artikel: ${sha ? "update" : "tambah"} ${articleData.title}`,
    content,
    branch: _config.contentBranch,
  };
  if (sha) body.sha = sha;

  return apiRequest(url, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteArticle(slug) {
  const path = `${_config.contentPath}/articles/${slug}.json`;
  const url = repoUrl(path);

  // Get current SHA
  const existing = await apiRequest(
    url + `?ref=${_config.contentBranch}`
  );

  return apiRequest(url, {
    method: "DELETE",
    body: JSON.stringify({
      message: `artikel: hapus ${slug}`,
      sha: existing.sha,
      branch: _config.contentBranch,
    }),
  });
}

export async function updateIndex(indexData) {
  const path = `${_config.contentPath}/index.json`;
  const url = repoUrl(path);

  // Get current SHA
  const existing = await apiRequest(
    url + `?ref=${_config.contentBranch}`
  );

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(indexData, null, 2))));

  return apiRequest(url, {
    method: "PUT",
    body: JSON.stringify({
      message: "artikel: update index",
      content,
      sha: existing.sha,
      branch: _config.contentBranch,
    }),
  });
}
