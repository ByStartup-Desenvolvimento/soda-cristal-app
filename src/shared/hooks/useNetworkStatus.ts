import { useState, useEffect } from 'react';

// Expandindo o Navigator para suportar a API Experimental de Conexão (Network Information API)
interface ExtendedNavigator extends Navigator {
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
}

export function useNetworkStatus() {
  // Inicializa o estado com o valor nativo na abertura do navegador
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Handlers para queda total e restabelecimento da internet
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handlers para lentidão da internet via Network Information API
    const nav = navigator as ExtendedNavigator;
    const connection = nav.connection;

    const checkConnectionSpeed = () => {
      if (connection) {
        const type = connection.effectiveType;
        // Consideramos 2g e slow-2g como lentos para nosso caso de uso operacional
        if (type === 'slow-2g' || type === '2g') {
          setIsSlowConnection(true);
        } else {
          setIsSlowConnection(false);
        }
      }
    };

    if (connection) {
      checkConnectionSpeed();
      connection.addEventListener('change', checkConnectionSpeed);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', checkConnectionSpeed);
      }
    };
  }, []);

  return { isOffline, isSlowConnection };
}
