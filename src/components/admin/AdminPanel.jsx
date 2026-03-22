import AuthGuard from "./AuthGuard.jsx";
import ArticleManager from "./ArticleManager.jsx";

export default function AdminPanel({ config }) {
  return (
    <AuthGuard
      allowedGoogleEmail={config.security.allowedGoogleEmail}
      googleClientId={config.security.googleClientId}
      sessionTimeoutMinutes={config.security.sessionTimeoutMinutes}
      maxLoginAttempts={config.security.maxLoginAttempts}
      lockoutMinutes={config.security.lockoutMinutes}
    >
      <ArticleManager config={config} />
    </AuthGuard>
  );
}
