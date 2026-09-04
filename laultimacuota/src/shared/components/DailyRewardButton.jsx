import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

function formatTimeRemaining(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function DailyRewardButton({ variant = 'success', size = 'sm', className = '' }) {
  const { user } = useAuth();
  const showToast = useToast();
  const [status, setStatus] = useState({ available: false, retryAfter: 0, amount: 500 });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/daily/status');
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (user) fetchStatus();
  }, [user, fetchStatus]);

  useEffect(() => {
    if (status.retryAfter <= 0) return;
    const interval = setInterval(() => {
      setStatus((prev) => {
        if (prev.retryAfter <= 1) {
          clearInterval(interval);
          return { ...prev, available: true, retryAfter: 0 };
        }
        return { ...prev, retryAfter: prev.retryAfter - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status.retryAfter]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/daily/claim');
      if (response.data.success) {
        showToast(`Reclamaste $${response.data.data.monto.toLocaleString('es-CL')} CC`, 'success');
        setStatus({ available: false, retryAfter: 86400, amount: response.data.data.monto });
        window.location.reload();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al reclamar';
      if (err.response?.status === 409 && err.response?.data?.retryAfter) {
        setStatus((prev) => ({ ...prev, retryAfter: err.response.data.retryAfter }));
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={`d-flex align-items-center gap-2 fw-semibold ${className}`}
      disabled={!status.available || loading}
      onClick={handleClaim}
      style={{ borderRadius: '8px' }}
    >
      <i className={`bi ${status.available ? 'bi-gift-fill' : 'bi-clock-history'}`}></i>
      {status.available
        ? `Reclamar $${status.amount.toLocaleString('es-CL')}`
        : formatTimeRemaining(status.retryAfter)}
    </Button>
  );
}

export default DailyRewardButton;
