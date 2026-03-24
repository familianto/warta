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

function encodeContent(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeContent(base64) {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ""))));
}

async function fetchSha(url) {
  const data = await apiRequest(url + `?ref=${_config.contentBranch}`);
  return data.sha;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await delay(1000);
    }
  }
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
  const content = decodeContent(data.content);
  return { articles: JSON.parse(content), sha: data.sha };
}

export async function getArticle(slug) {
  const url =
    repoUrl(`${_config.contentPath}/articles/${slug}.json`) +
    `?ref=${_config.contentBranch}`;
  const data = await apiRequest(url);
  const content = decodeContent(data.content);
  return { article: JSON.parse(content), sha: data.sha };
}

export async function saveArticle(slug, articleData) {
  const path = `${_config.contentPath}/articles/${slug}.json`;
  const url = repoUrl(path);
  const content = encodeContent(JSON.stringify(articleData, null, 2));

  return withRetry(async () => {
    let sha;
    try {
      sha = await fetchSha(url);
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
  });
}

export async function deleteArticle(slug) {
  const path = `${_config.contentPath}/articles/${slug}.json`;
  const url = repoUrl(path);

  // Delete the article file with retry; treat 404 as already deleted
  try {
    await withRetry(async () => {
      const sha = await fetchSha(url);
      return apiRequest(url, {
        method: "DELETE",
        body: JSON.stringify({
          message: `artikel: hapus ${slug}`,
          sha,
          branch: _config.contentBranch,
        }),
      });
    });
  } catch (err) {
    if (!err.message.includes("Not Found")) throw err;
    // File already gone, continue to index update
  }
}

export async function updateIndex(indexData) {
  const path = `${_config.contentPath}/index.json`;
  const url = repoUrl(path);
  const content = encodeContent(JSON.stringify(indexData, null, 2));

  return withRetry(async () => {
    const sha = await fetchSha(url);
    return apiRequest(url, {
      method: "PUT",
      body: JSON.stringify({
        message: "artikel: update index",
        content,
        sha,
        branch: _config.contentBranch,
      }),
    });
  });
}
