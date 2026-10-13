"use client";

import { useEffect, useState } from "react";

// Always-visible install entry. Browsers only offer the one-click install
// prompt (beforeinstallprompt) sometimes — e.g. never on iPhone, and never
// again for months after the user dismisses it once. So the button is always
// shown (until the app is installed): it triggers the prompt when the
// browser offers one, and otherwise opens short device-specific instructions.
export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent;
    setPlatform(
      /iphone|ipad|ipod/i.test(ua) ? "ios" : /android/i.test(ua) ? "android" : "desktop"
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (prompt) {
      prompt.prompt();
      try {
        await prompt.userChoice;
      } catch {
        // Dismissed: keep the button; the help dialog remains available.
      }
      setPrompt(null);
      return;
    }
    setShowHelp(true);
  }

  const steps =
    platform === "ios"
      ? [
          "Tap the Share button (square with an arrow, at the bottom of Safari).",
          "Scroll down and tap “Add to Home Screen”.",
          "Tap “Add”. MechMate appears on your home screen.",
        ]
      : platform === "android"
        ? [
            "Tap the three-dots menu ⋮ (top-right of Chrome).",
            "Tap “Install app” (or “Add to Home screen”).",
            "Tap “Install”. MechMate appears on your home screen.",
          ]
        : [
            "Look for the install icon (a screen with a down-arrow) at the right end of the address bar, click it, then “Install”.",
            "No icon? Click the browser menu ⋮ → “Install MechMate AI…” / “Save and share → Install”.",
            "The app opens in its own window, like a real app.",
          ];

  return (
    <>
      <button
        className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700"
        onClick={install}
        aria-label="Install MechMate app"
      >
        ⤓ Install app
      </button>
      {showHelp && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="How to install the app"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="mm-card w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mm-eyebrow">Install MechMate</div>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <button
              className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => setShowHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
