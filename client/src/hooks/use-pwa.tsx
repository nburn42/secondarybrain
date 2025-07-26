import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if running in standalone mode (PWA is installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    window.navigator.standalone === true;

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (isStandalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  const dismissPrompt = () => {
    setInstallPrompt(null);
  };

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    isStandalone,
    promptInstall,
    dismissPrompt,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission;
  };

  const subscribe = async (): Promise<PushSubscription | null> => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // Replace with your VAPID public key when implementing server-side push
            'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIBAOOhBLXOVz4TGW5Y8pEoOwE6zCyYLOtNyJFhCK7VKQMHJ7tXHI'
          ),
        });
        
        setSubscription(subscription);
        return subscription;
      } catch (error) {
        console.error('Failed to subscribe for push notifications:', error);
        return null;
      }
    }
    return null;
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (subscription) {
      try {
        const success = await subscription.unsubscribe();
        if (success) {
          setSubscription(null);
        }
        return success;
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        return false;
      }
    }
    return false;
  };

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}