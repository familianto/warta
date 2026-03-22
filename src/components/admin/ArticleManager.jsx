import { useState, useEffect, useCallback } from "react";
import ArticleEditor from "./ArticleEditor.jsx";
import * as GitHub from "./GitHubService.js";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function TokenInput({ token, onTokenChange }) {
  const [show, setShow] = useState(false);

  return (
    <div className="token-section">
      <label className="token-label">GitHub Personal Access Token</label>
      <div className="token-input-row">
        <input
          type={show ? "text" : "password"}
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          className="token-input"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="btn btn-small"
        >
          {show ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <details className="token-help">
        <summary>Cara membuat Personal Access Token</summary>
        <ol>
          <li>
            Buka{" "}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/settings/tokens
            </a>
          </li>
          <li>Klik "Generate new token" → "Generate new token (classic)"</li>
          <li>
            Centang scope <strong>repo</strong> (Full control of private
            repositories)
          </li>
          <li>Klik "Generate token" dan copy token-nya</li>
          <li>Paste token di field di atas</li>
        </ol>
        <p className="token-note">
          Token hanya disimpan di session browser ini dan tidak pernah dikirim ke
          server selain GitHub API.
        </p>
      </details>
    </div>
  );
}

function MessageBar({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className={`message-bar message-${message.type}`}>
      <span>{message.text}</span>
      <button onClick={onDismiss} className="message-dismiss">
        &times;
      </button>
    </div>
  );
}

export default function ArticleManager({ config }) {
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [githubToken, setGithubToken] = useState(() => {
    return sessionStorage.getItem("warta_gh_token") || "";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [message, setMessage] = useState(null);

  // Configure GitHub service
  useEffect(() => {
    if (config?.github) {
      GitHub.setConfig(config.github);
    }
  }, [config]);

  useEffect(() => {
    GitHub.setToken(githubToken);
    if (githubToken) {
      sessionStorage.setItem("warta_gh_token", githubToken);
    }
  }, [githubToken]);

  const loadArticles = useCallback(async () => {
    if (!githubToken) return;
    setIsLoadingArticles(true);
    try {
      const { articles: list } = await GitHub.getArticleList();
      setArticles(list);
    } catch (err) {
      setMessage({ type: "error", text: `Gagal memuat artikel: ${err.message}` });
    } finally {
      setIsLoadingArticles(false);
    }
  }, [githubToken]);

  useEffect(() => {
    if (githubToken) loadArticles();
  }, [githubToken, loadArticles]);

  const handleNewArticle = () => {
    setCurrentArticle(null);
    setIsEditing(true);
  };

  const handleEdit = async (slug) => {
    if (!githubToken) {
      setMessage({ type: "error", text: "Masukkan GitHub Token terlebih dahulu." });
      return;
    }
    try {
      setIsLoadingArticles(true);
      const { article } = await GitHub.getArticle(slug);
      setCurrentArticle(article);
      setIsEditing(true);
    } catch (err) {
      setMessage({ type: "error", text: `Gagal memuat artikel: ${err.message}` });
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!githubToken) {
      setMessage({ type: "error", text: "Masukkan GitHub Token terlebih dahulu." });
      return;
    }
    if (!window.confirm(`Hapus artikel "${slug}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    try {
      setIsSaving(true);
      await GitHub.deleteArticle(slug);
      const newArticles = articles.filter((a) => a.slug !== slug);
      await GitHub.updateIndex(newArticles);
      setArticles(newArticles);
      setMessage({ type: "success", text: "Artikel berhasil dihapus." });
    } catch (err) {
      setMessage({ type: "error", text: `Gagal menghapus: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (formData) => {
    if (!githubToken) {
      setMessage({ type: "error", text: "Masukkan GitHub Token terlebih dahulu." });
      return;
    }
    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "Judul artikel wajib diisi." });
      return;
    }
    if (!formData.content || formData.content === "<p></p>") {
      setMessage({ type: "error", text: "Konten artikel tidak boleh kosong." });
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !currentArticle;
      const slug = isNew ? slugify(formData.title) : currentArticle.slug;
      const now = new Date().toISOString();

      const articleData = {
        slug,
        title: formData.title,
        subtitle: formData.subtitle || "",
        author: config.authorName || "",
        createdAt: currentArticle?.createdAt || now,
        updatedAt: now,
        tags: formData.tags,
        relatedSlugs: formData.relatedSlugs,
        coverImage: formData.coverImage || "",
        content: formData.content,
        published: formData.published,
      };

      await GitHub.saveArticle(slug, articleData);

      // Update index
      const indexEntry = {
        slug,
        title: articleData.title,
        subtitle: articleData.subtitle,
        tags: articleData.tags,
        createdAt: articleData.createdAt,
        published: articleData.published,
      };

      let newIndex;
      if (isNew) {
        newIndex = [indexEntry, ...articles];
      } else {
        newIndex = articles.map((a) => (a.slug === slug ? indexEntry : a));
      }
      await GitHub.updateIndex(newIndex);
      setArticles(newIndex);

      setMessage({ type: "success", text: `Artikel "${articleData.title}" berhasil disimpan.` });
      setIsEditing(false);
      setCurrentArticle(null);
    } catch (err) {
      setMessage({ type: "error", text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentArticle(null);
  };

  // Editor view
  if (isEditing) {
    return (
      <div className="manager-editor-view">
        <MessageBar message={message} onDismiss={() => setMessage(null)} />
        {isSaving && <div className="saving-overlay">Menyimpan...</div>}
        <ArticleEditor
          article={currentArticle}
          onSave={handleSave}
          onCancel={handleCancel}
          existingSlugs={articles.map((a) => a.slug)}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="manager-list-view">
      <TokenInput token={githubToken} onTokenChange={setGithubToken} />
      <MessageBar message={message} onDismiss={() => setMessage(null)} />

      <div className="list-header">
        <h2>Artikel</h2>
        <button
          onClick={handleNewArticle}
          className="btn btn-primary"
          disabled={!githubToken}
        >
          + Artikel Baru
        </button>
      </div>

      {isLoadingArticles && <p className="loading-text">Memuat artikel...</p>}

      {!githubToken && (
        <p className="empty-text">
          Masukkan GitHub Personal Access Token di atas untuk memulai.
        </p>
      )}

      {githubToken && !isLoadingArticles && articles.length === 0 && (
        <p className="empty-text">Belum ada artikel.</p>
      )}

      {articles.length > 0 && (
        <div className="article-list">
          {articles.map((article) => (
            <div key={article.slug} className="article-row">
              <div className="article-info">
                <span className="article-title">{article.title}</span>
                <span className="article-meta">
                  {new Date(article.createdAt).toLocaleDateString("id-ID")} ·{" "}
                  <span
                    className={`status-badge ${article.published ? "status-published" : "status-draft"}`}
                  >
                    {article.published ? "Published" : "Draft"}
                  </span>
                </span>
              </div>
              <div className="article-actions">
                <button
                  onClick={() => handleEdit(article.slug)}
                  className="btn btn-small"
                  disabled={isSaving}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(article.slug)}
                  className="btn btn-small btn-danger"
                  disabled={isSaving}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
