(() => {
  const SUPABASE_URL = "https://trzqbkncoqnkghccjofq.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_4x6efujUG2BLenJN9SUy4A_E3MjqK-Z";
  const LAST_USER_KEY = "flow:last-user-id";
  const SESSION_TIMEOUT_MS = 5000;

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* хранилище недоступно */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* хранилище недоступно */ }
    }
  };

  // Если CDN с Supabase не загрузился, сайт всё равно работает в гостевом режиме
  const client = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  if (!client) {
    console.error("Supabase did not load. Running in guest mode.");
  }

  window.flowSupabaseClient = client;
  window.flowStoragePrefix = "";

  const setPrefix = (userId) => {
    window.flowStoragePrefix = userId ? `flow:${userId}:` : "";
  };

  const updateAccountLink = (session) => {
    const loginButton = document.querySelector("body.index .login-button");
    if (loginButton) {
      loginButton.textContent = session ? "Account" : "Login";
      loginButton.href = session ? "account.html" : "auth.html";
    }
  };

  if (client) {
    client.auth.onAuthStateChange((event, session) => {
      updateAccountLink(session);
      if (event === "SIGNED_OUT") storage.remove(LAST_USER_KEY);
    });
  }

  // Переносит гостевые данные в аккаунт при первом входе
  const migrateLegacyData = () => {
    if (storage.get("flow:legacy-data-migrated")) return;

    const legacyKeys = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (
          key === "lists" ||
          key?.startsWith("content:") ||
          key?.startsWith("topics:") ||
          key?.startsWith("items:")
        ) {
          legacyKeys.push(key);
        }
      }
    } catch {
      return;
    }

    for (const key of legacyKeys) {
      const accountKey = `${window.flowStoragePrefix}${key}`;
      if (storage.get(accountKey) === null) {
        const value = storage.get(key);
        if (value !== null) storage.set(accountKey, value);
      }
    }

    storage.set("flow:legacy-data-migrated", "true");
  };

  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session check timed out")), ms)
      )
    ]);

  // Никогда не отклоняется: при любой ошибке используем последнего известного пользователя
  window.flowAccountReady = (async () => {
    if (!client) return;

    try {
      const { data, error } = await withTimeout(client.auth.getSession(), SESSION_TIMEOUT_MS);
      if (error) throw error;

      updateAccountLink(data.session);
      const userId = data.session?.user.id;

      if (userId) storage.set(LAST_USER_KEY, userId);
      else storage.remove(LAST_USER_KEY);

      setPrefix(userId);
      if (userId) migrateLegacyData();
    } catch (error) {
      console.error("Could not read session, using last known account:", error);
      setPrefix(storage.get(LAST_USER_KEY));
    }
  })();

  if (document.body.hasAttribute("data-load-app") && !window.flowAppInitialized) {
    window.flowAppInitialized = true;

    window.flowAccountReady.finally(() => {
      const appScript = document.createElement("script");
      appScript.src = "java/app.js";
      appScript.async = false;
      document.body.append(appScript);
    });
  }
})();
