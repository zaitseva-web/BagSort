(() => {
  const client = window.flowSupabaseClient;
  const message = document.getElementById("msg");
  const logout = document.getElementById("logout-button");

  const showError = (text) => {
    message.textContent = text;
    message.setAttribute("role", "alert");
  };

  if (!client) {
    showError("Could not connect to the account service. Please reload the page.");
    logout.disabled = true;
    return;
  }

  window.flowAccountReady
    .then(async () => {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        window.location.replace("auth.html");
        return;
      }
      document.getElementById("user-email").textContent = data.session.user.email || "";
    })
    .catch((error) => {
      console.error("Could not load account:", error);
      showError("Could not load your account. Please reload the page.");
    });

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      window.location.replace("auth.html");
    }
  });

  logout.addEventListener("click", async () => {
    logout.disabled = true;
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Could not sign out:", error);
      showError(error instanceof Error ? error.message : "Could not sign out.");
      logout.disabled = false;
    }
  });
})();
