(() => {
  const client = window.flowSupabaseClient;
  const message = document.getElementById("msg");
  const logout = document.getElementById("logout");

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
      message.textContent = "Could not load your account. Please reload the page.";
      message.setAttribute("role", "alert");
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
      message.textContent = error instanceof Error ? error.message : "Could not sign out.";
      message.setAttribute("role", "alert");
      logout.disabled = false;
    }
  });
})();
