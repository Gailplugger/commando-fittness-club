(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl || !("serviceWorker" in navigator)) return;

  const scopeUrl = new URL("../", scriptUrl);
  navigator.serviceWorker.register(new URL("../sw.js", scriptUrl), { scope: scopeUrl.pathname })
    .catch((error) => console.error("App install support could not be enabled:", error));

  let installPrompt = null;
  let installButton = null;

  const removeInstallButton = () => {
    installButton?.remove();
    installButton = null;
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) return;

    installButton = document.createElement("button");
    installButton.className = "pwa-install-button";
    installButton.type = "button";
    installButton.textContent = "Install app";
    installButton.setAttribute("aria-label", "Install Commando Fittness Club app");
    installButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      await installPrompt.prompt();
      installPrompt = null;
      removeInstallButton();
    });
    document.body.append(installButton);
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    removeInstallButton();
  });
})();
