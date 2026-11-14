(() => {
  const SUPABASE_URL = "https://trzqbkncoqnkghccjofq.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_4x6efujUG2BLenJN9SUy4A_E3MjqK-Z";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.flowSupabaseClient = client;
  const updateAccountLink = (session) => {
    const loginButton = document.querySelector("body.index .login-button");
    if (loginButton) {
      loginButton.textContent = session ? "Account" : "Login";
      loginButton.href = session ? "account.html" : "auth.html";
    }
  };

  client.auth.onAuthStateChange((_event, session) => {
    updateAccountLink(session);
  });

  window.flowAccountReady = client.auth.getSession().then(({ data, error }) => {
    if (error) throw error;

    updateAccountLink(data.session);
    const userId = data.session?.user.id;
    window.flowStoragePrefix = userId ? `flow:${userId}:` : "";

    if (!userId || localStorage.getItem("flow:legacy-data-migrated")) return;

    const legacyKeys = [];
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

    for (const key of legacyKeys) {
      const accountKey = `${window.flowStoragePrefix}${key}`;
      if (localStorage.getItem(accountKey) === null) {
        const value = localStorage.getItem(key);
        if (value !== null) localStorage.setItem(accountKey, value);
      }
    }

    localStorage.setItem("flow:legacy-data-migrated", "true");
  });

  if (document.body.hasAttribute("data-load-app")) {
    if (window.flowAppInitialized) return;
    window.flowAppInitialized = true;

    window.flowAccountReady
      .then(() => {
        const appScript = document.createElement("script");
        appScript.src = `java/app.js?v=${Date.now()}`;
        appScript.async = false;
        document.body.append(appScript);
      })
      .catch((error) => {
        console.error("Could not initialize account storage:", error);
        const message = document.createElement("p");
        message.setAttribute("role", "alert");
        message.textContent = "Could not load your account data. Please reload the page.";
        document.body.append(message);
      });
  }
})();
