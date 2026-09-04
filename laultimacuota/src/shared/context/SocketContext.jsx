import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const showToast = useToast();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const connect = () => {
      if (socketRef.current?.connected) return;
      const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });
      socketRef.current = socket;

      socket.on('race_started', (data) => {
        if (data?.carrera_id) {
          showToast(`Carrera #${data.carrera_id} ha comenzado!`, 'info');
        }
      });
    };

    connect();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (socketRef.current) {
        socketRef.current.off('race_started');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}
