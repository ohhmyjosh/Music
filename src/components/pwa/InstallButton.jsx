import { useEffect, useState } from "react";
import { Download, Share, Check } from "lucide-react";

// Installs Josh-Fy to the device home screen as a PWA.
//
// Chrome/Edge (Android + desktop) fire `beforeinstallprompt`; we stash the event
// and trigger the native install sheet on tap. iOS Safari has no such API, so we
// show the manual "Share -> Add to Home Screen" instructions instead.
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onPrompt = (event) => {
      event.preventDefault(); // stop Chrome's mini-infobar; we drive it ourselves
      setDeferredPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <Check size={16} />
        Josh-Fy is installed on this device.
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-400"
      >
        <Download size={16} />
        Install Josh-Fy
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-300">
        <Share size={16} className="shrink-0 text-accent-300" />
        In Safari, tap <span className="font-semibold text-white">Share</span>, then
        <span className="font-semibold text-white">&nbsp;Add to Home Screen</span>.
      </p>
    );
  }

  return (
    <p className="text-sm text-slate-300">
      Open Josh-Fy in Chrome, then use the browser menu (⋮) →{" "}
      <span className="font-semibold text-white">Install app</span> /{" "}
      <span className="font-semibold text-white">Add to Home screen</span>.
    </p>
  );
}
