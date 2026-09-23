/**
 * usePwaInstall — Detects and manages PWA install prompt & status.
 */
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true);
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(isAppleDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if installed after the fact
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!prompt) return false;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Error during prompt:', err);
      return false;
    }
  };

  return {
    /** True when the browser has native install prompt ready */
    canInstall: !!prompt,
    /** True when running in standalone mode (installed app) */
    isInstalled,
    /** True when running on an iOS device */
    isIos,
    /** Trigger native install prompt */
    install,
  };
}
