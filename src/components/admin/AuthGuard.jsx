import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_KEY = "warta_admin_session";
const ATTEMPTS_KEY = "warta_login_attempts";
const LOCKOUT_KEY = "warta_lockout_until";
const ACTIVITY_KEY = "warta_last_activity";

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  sessionStorage.setItem(ACTIVITY_KEY, Date.now().toString());
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ACTIVITY_KEY);
}

function getLoginAttempts() {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).filter((t) => Date.now() - t < 5 * 60 * 1000);
  } catch {
    return [];
  }
}

function addLoginAttempt() {
  const attempts = getLoginAttempts();
  attempts.push(Date.now());
  sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

function isLockedOut(maxAttempts) {
  const lockoutUntil = sessionStorage.getItem(LOCKOUT_KEY);
  if (lockoutUntil && Date.now() < parseInt(lockoutUntil, 10)) {
    return true;
  }
  if (lockoutUntil && Date.now() >= parseInt(lockoutUntil, 10)) {
    sessionStorage.removeItem(LOCKOUT_KEY);
    sessionStorage.removeItem(ATTEMPTS_KEY);
  }
  return getLoginAttempts().length >= maxAttempts;
}

function setLockout(minutes) {
  sessionStorage.setItem(
    LOCKOUT_KEY,
    (Date.now() + minutes * 60 * 1000).toString()
  );
}

function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function AuthGuard({
  allowedGoogleEmail,
  googleClientId,
  sessionTimeoutMinutes = 30,
  maxLoginAttempts = 3,
  lockoutMinutes = 15,
  children,
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const activityTimer = useRef(null);
  const gsiLoaded = useRef(false);

  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    if (activityTimer.current) clearInterval(activityTimer.current);
  }, []);

  // Check session timeout
  const checkActivity = useCallback(() => {
    const lastActivity = sessionStorage.getItem(ACTIVITY_KEY);
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > sessionTimeoutMinutes * 60 * 1000) {
        logout();
      }
    }
  }, [sessionTimeoutMinutes, logout]);

  // Record activity on user interaction
  const recordActivity = useCallback(() => {
    if (isAuthenticated) {
      sessionStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const events = ["mousedown", "keydown", "scroll", "touchstart"];
      events.forEach((e) => window.addEventListener(e, recordActivity));
      activityTimer.current = setInterval(checkActivity, 60 * 1000);
      return () => {
        events.forEach((e) => window.removeEventListener(e, recordActivity));
        if (activityTimer.current) clearInterval(activityTimer.current);
      };
    }
  }, [isAuthenticated, recordActivity, checkActivity]);

  // Restore session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const lastActivity = sessionStorage.getItem(ACTIVITY_KEY);
      const elapsed = lastActivity
        ? Date.now() - parseInt(lastActivity, 10)
        : Infinity;
      if (elapsed < sessionTimeoutMinutes * 60 * 1000) {
        setUser(session);
        setIsAuthenticated(true);
      } else {
        clearSession();
      }
    }
    setIsLoading(false);
  }, [sessionTimeoutMinutes]);

  // Handle Google credential response
  const handleCredentialResponse = useCallback(
    (response) => {
      if (isLockedOut(maxLoginAttempts)) {
        setLockout(lockoutMinutes);
        setError(
          `Terlalu banyak percobaan. Coba lagi dalam ${lockoutMinutes} menit.`
        );
        return;
      }

      const payload = decodeJwtPayload(response.credential);
      if (!payload) {
        addLoginAttempt();
        setError("Gagal memproses login. Silakan coba lagi.");
        return;
      }

      if (allowedGoogleEmail && payload.email !== allowedGoogleEmail) {
        addLoginAttempt();
        if (isLockedOut(maxLoginAttempts)) {
          setLockout(lockoutMinutes);
          setError(
            `Terlalu banyak percobaan. Coba lagi dalam ${lockoutMinutes} menit.`
          );
        } else {
          setError("Akses ditolak. Email tidak diizinkan.");
        }
        return;
      }

      const userData = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      saveSession(userData);
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      sessionStorage.removeItem(ATTEMPTS_KEY);
      sessionStorage.removeItem(LOCKOUT_KEY);
    },
    [allowedGoogleEmail, maxLoginAttempts, lockoutMinutes]
  );

  // Load Google Identity Services
  useEffect(() => {
    if (isAuthenticated || gsiLoaded.current) return;

    const loadGsi = () => {
      if (window.google?.accounts?.id) {
        initializeGsi();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      script.onerror = () => setError("Gagal memuat Google Sign-In.");
      document.head.appendChild(script);
    };

    const initializeGsi = () => {
      if (gsiLoaded.current) return;
      gsiLoaded.current = true;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });
      const btnContainer = document.getElementById("warta-gsi-btn");
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          locale: "id",
        });
      }
    };

    loadGsi();
  }, [isAuthenticated, googleClientId, handleCredentialResponse]);

  if (isLoading) {
    return (
      <div className="auth-loading">
        <p>Memuat...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const locked = isLockedOut(maxLoginAttempts);
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Kelola Warta</h1>
          <p className="auth-subtitle">Masuk untuk mengelola artikel</p>
          {error && <div className="auth-error">{error}</div>}
          {locked ? (
            <p className="auth-locked">
              Terlalu banyak percobaan. Coba lagi dalam {lockoutMinutes} menit.
            </p>
          ) : (
            <div id="warta-gsi-btn" className="auth-btn-wrapper" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-brand">Kelola Warta</h1>
        </div>
        <div className="admin-header-right">
          {user?.picture && (
            <img src={user.picture} alt="" className="admin-avatar" />
          )}
          <span className="admin-user-name">{user?.name}</span>
          <button onClick={logout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
