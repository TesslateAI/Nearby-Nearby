import { useState, useEffect, useCallback } from 'react';

// Store the deferred prompt globally so it persists across component unmounts
let deferredPrompt = null;

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // If we already have a deferred prompt from a previous mount, we're installable
    if (deferredPrompt) {
      setIsInstallable(true);
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      deferredPrompt = null;
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { outcome: 'unavailable' };
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        deferredPrompt = null;
        setIsInstallable(false);
      }

      return { outcome };
    } catch (error) {
      console.error('PWA install error:', error);
      return { outcome: 'error', error };
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall
  };
}

export default usePWAInstall;
