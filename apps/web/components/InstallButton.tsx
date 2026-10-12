"use client";

import { useEffect, useState } from "react";

// Visible install entry: Chrome/Edge fire beforeinstallprompt; iOS Safari
// needs the manual Share → Add to Home Screen path instead.
export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator as any).standalone);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;
  if (prompt) {
    return (
      <button
        className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700"
        onClick={async () => {
          prompt.prompt();
          await prompt.userChoice.catch(() => {});
          setPrompt(null);
        }}
      >
        ⤓ Install app
      </button>
    );
  }
  if (ios) {
    return (
      <span className="text-xs text-indigo-200" title="Open Share, then Add to Home Screen">
        Share → Add to Home Screen to install
      </span>
    );
  }
  return null;
}
