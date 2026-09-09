import React, { createContext, useState, useCallback, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const variantMap = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer
        position="bottom-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={toast.show}
            bg={variantMap[toast.type] || 'success'}
            delay={4000}
            autohide
          >
            <Toast.Body className="d-flex align-items-center gap-2 text-white fw-medium">
              <i className={`bi ${
                toast.type === 'success' ? 'bi-check-circle-fill' :
                toast.type === 'error' ? 'bi-x-circle-fill' :
                toast.type === 'warning' ? 'bi-exclamation-triangle-fill' :
                'bi-info-circle-fill'
              }`}></i>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export default ToastContext;
