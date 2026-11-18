(() => {
  const sb = window.flowSupabaseClient;
  const $ = (id) => document.getElementById(id);

  const returnUrl = new URL("index.html", window.location.href).href;
  const authUrl = new URL("auth.html", window.location.href).href;

  let mode = "login";
  // Ссылка из письма «сброс пароля» содержит type=recovery
  let recoveryMode =
    new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";

  function say(text, type) {
    $("msg").textContent = text;
    $("msg").className = type || "";
  }

  $("back-home").onclick = () => { window.location.href = "index.html"; };

  if (!sb) {
    say("Could not connect to the account service. Please reload the page.", "err");
    ["submit", "forgot", "save-password", "logout"].forEach((id) => { $(id).disabled = true; });
    return;
  }

  function setMode(m) {
    mode = m;
    $("tab-login").classList.toggle("active", m === "login");
    $("tab-signup").classList.toggle("active", m === "signup");
    $("submit").textContent = m === "login" ? "Sign In" : "Sign Up";
    $("password").autocomplete = m === "login" ? "current-password" : "new-password";
    say("");
  }
  $("tab-login").onclick = () => setMode("login");
  $("tab-signup").onclick = () => setMode("signup");

  // Enter в полях email и пароля
  ["email", "password"].forEach((id) => {
    $(id).addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        $("submit").click();
      }
    });
  });

  $("submit").onclick = async () => {
    const email = $("email").value.trim();
    const password = $("password").value;
    if (!email || password.length < 8) {
      return say("Please enter your email and a password with at least 8 characters", "err");
    }

    $("submit").disabled = true;
    say("Waiting…");

    try {
      const { data, error } = mode === "signup"
        ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: returnUrl } })
        : await sb.auth.signInWithPassword({ email, password });

      if (error) return say(error.message, "err");

      if (mode === "signup" && !data.session) {
        say("Registration successful. Check your email and confirm your address to continue.", "ok");
      } else {
        window.location.replace(returnUrl);
      }
    } catch (error) {
      say(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
        "err"
      );
    } finally {
      $("submit").disabled = false;
    }
  };

  $("forgot").onclick = async () => {
    const email = $("email").value.trim();
    if (!email) return say("Please enter your email above", "err");

    $("forgot").disabled = true;
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: authUrl });
      say(error ? error.message : "Email to reset your password sent. Check your inbox.", error ? "err" : "ok");
    } catch (error) {
      say(error instanceof Error ? error.message : "Could not send the email.", "err");
    } finally {
      $("forgot").disabled = false;
    }
  };

  $("save-password").onclick = async () => {
    const password = $("new-password").value;
    if (password.length < 8) return say("Password must be at least 8 characters", "err");

    $("save-password").disabled = true;
    try {
      const { error } = await sb.auth.updateUser({ password });
      if (error) return say(error.message, "err");

      recoveryMode = false;
      window.location.replace(returnUrl);
    } catch (error) {
      say(error instanceof Error ? error.message : "Could not update the password.", "err");
    } finally {
      $("save-password").disabled = false;
    }
  };

  $("logout").onclick = async () => {
    try {
      const { error } = await sb.auth.signOut();
      if (error) say(error.message, "err");
    } catch (error) {
      say(error instanceof Error ? error.message : "Could not sign out.", "err");
    }
  };

  // Показывает нужный блок в зависимости от состояния входа
  function render(session) {
    $("guest").hidden = !!session;
    $("recovery").hidden = !(session && recoveryMode);
    $("user").hidden = !session || recoveryMode;

    if (session && !recoveryMode) {
      $("user-email").textContent = session.user.email || "";
      say("");
    }
  }

  sb.auth.getSession()
    .then(({ data }) => render(data.session))
    .catch((error) => {
      console.error("Could not read session:", error);
      say("Could not check your login state. Please reload the page.", "err");
    });

  sb.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") recoveryMode = true;

    render(session);

    const isAuthCallback =
      window.location.hash.includes("access_token=") ||
      new URLSearchParams(window.location.search).has("code");

    if (event === "SIGNED_IN" && session && isAuthCallback && !recoveryMode) {
      window.location.replace(returnUrl);
    }
  });
})();
