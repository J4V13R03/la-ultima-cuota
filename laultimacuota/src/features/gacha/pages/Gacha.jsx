import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useToast } from '../../../shared/context/ToastContext';
import { useAuth } from '../../../shared/context/AuthContext';
import api from '../../../shared/services/api';

function Gacha() {
  const { user } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handlePull = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await api.post('/api/gacha/pull');
      if (response.data.success) {
        setResult(response.data.data);
        showToast(`Nuevo caballo: ${response.data.data.caballo.nombre}`, 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al realizar la tirada';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
            <i className="bi bi-dice-5 me-2" style={{ color: 'var(--color-primary)' }}></i>Gacha
          </h2>
          <p className="text-muted mb-0">Obtén caballos nuevos con una tirada aleatoria</p>
        </Col>
      </Row>

      <div
        className="mb-4 p-3"
        style={{
          backgroundColor: 'rgba(21, 189, 15, 0.08)',
          border: '1px solid var(--color-primary)',
          borderRadius: '12px',
          color: 'var(--color-text-dark)',
        }}
      >
        <strong>Cómo funciona el Gacha:</strong> Pagas un costo fijo en $CC y recibes un caballo
        nuevo con estadísticas aleatorias. Los caballos se suman a tu establo automáticamente.
      </div>

      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="border-0 shadow-sm text-center" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <Card.Body className="p-5">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: 'rgba(21, 189, 15, 0.1)',
                }}
              >
                <i className="bi bi-dice-5" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}></i>
              </div>

              <h4 className="font-heading fw-bold mb-2">Tirada de Gacha</h4>
              <p className="text-muted mb-4">
                Costo: <span className="font-mono fw-bold" style={{ color: 'var(--color-primary)' }}>$300 CC</span>
              </p>
              <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                Tu saldo: <span className="font-mono fw-bold">${(user?.saldo ?? 0).toLocaleString('es-CL')} CC</span>
              </p>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                  {error}
                </Alert>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-100"
                disabled={loading || (user?.saldo ?? 0) < 300}
                onClick={handlePull}
                style={{ borderRadius: '12px', padding: '0.8rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Tirando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-dice-5 me-2"></i>Tirar Gacha
                  </>
                )}
              </Button>

              {(user?.saldo ?? 0) < 300 && (
                <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
                  Saldo insuficiente para una tirada
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {result && (
        <Row className="justify-content-center mt-4">
          <Col md={6} lg={5}>
            <Card
              className="border-0 shadow-sm"
              style={{ borderTop: '4px solid var(--color-secondary)' }}
            >
              <Card.Body className="text-center p-4">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '70px',
                    height: '70px',
                    backgroundColor: 'rgba(98, 241, 90, 0.15)',
                  }}
                >
                  <i className="bi bi-trophy" style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}></i>
                </div>
                <h5 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
                  Nuevo Caballo
                </h5>
                <h3 className="font-heading fw-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                  {result.caballo.nombre}
                </h3>
                <p className="text-muted mb-3">
                  Edad: {result.caballo.edad} años
                </p>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                  Saldo restante: <span className="font-mono fw-bold">${result.saldo.toLocaleString('es-CL')} CC</span>
                </p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setResult(null)}
                  style={{ borderRadius: '8px' }}
                >
                  Cerrar
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Gacha;
