/**
 * usePwaInstall — Global Singleton PWA Install Prompt & State Management
 */
import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Global window event listener — captured immediately on script load
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });

  window.addEventListener('appinstalled', () => {
    window.__pwaDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed-event'));
  });
}

export function usePwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? (window.__pwaDeferredPrompt || null) : null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true)
    );
  });

  const [isIos, setIsIos] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  });

  useEffect(() => {
    const handlePromptAvailable = () => {
      if (window.__pwaDeferredPrompt) {
        setPrompt(window.__pwaDeferredPrompt);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setPrompt(null);
    };

    // If already available on mount
    if (window.__pwaDeferredPrompt) {
      setPrompt(window.__pwaDeferredPrompt);
    }

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-installed-event', handleInstalled);

    // Also direct event listener as fallback
    const directPromptHandler = (e: Event) => {
      e.preventDefault();
      window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', directPromptHandler);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-installed-event', handleInstalled);
      window.removeEventListener('beforeinstallprompt', directPromptHandler);
    };
  }, []);

  /**
   * Directly triggers the native browser install dialog.
   * Returns:
   *  'installed' -> User clicked Install and it succeeded.
   *  'dismissed' -> User closed the native install dialog.
   *  'manual'    -> Browser does not support native prompt API (e.g., iOS Safari) — fallback to guide.
   */
  const install = useCallback(async (): Promise<'installed' | 'dismissed' | 'manual'> => {
    const activePrompt = prompt || window.__pwaDeferredPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setPrompt(null);
          window.__pwaDeferredPrompt = null;
          return 'installed';
        }
        return 'dismissed';
      } catch (err) {
        console.error('[PWA] Prompt error:', err);
      }
    }

    return 'manual';
  }, [prompt]);

  return {
    /** True when the browser has native install prompt ready */
    canInstall: !!prompt || !!(typeof window !== 'undefined' && window.__pwaDeferredPrompt),
    /** True when running in standalone mode (installed app) */
    isInstalled,
    /** True when running on an iOS device */
    isIos,
    /** Trigger native install prompt */
    install,
  };
}
