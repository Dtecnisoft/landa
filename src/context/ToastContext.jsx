import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);

    const newToast = {
      id,
      title: title || (type === 'success' ? '¡Éxito!' : type === 'error' ? 'Atención' : type === 'warning' ? 'Advertencia' : 'Información'),
      message,
      type,
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active toasts

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return dummy fallback if hook is used outside ToastProvider
    return { showToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="landa-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`landa-toast-card ${toast.type}`}>
          <div className="toast-icon-box">
            {toast.type === 'success' && '✨'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'warning' && '⚠️'}
            {toast.type === 'info' && '🔔'}
          </div>
          <div className="toast-content">
            <h4 className="toast-title">{toast.title}</h4>
            <p className="toast-msg">{toast.message}</p>
          </div>
          <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
