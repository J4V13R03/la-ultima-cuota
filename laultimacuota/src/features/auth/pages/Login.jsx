import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: 'calc(100vh - 56px)' }}
    >
      <Row className="w-100" style={{ maxWidth: '440px' }}>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <h2
                  className="font-heading fw-bold mb-1"
                  style={{ color: 'var(--color-text-dark)' }}
                >
                  Iniciar Sesión
                </h2>
                <p className="text-muted mb-0">
                  Accede a tu cuenta para apostar
                </p>
              </div>

              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError('')}
                  style={{
                    backgroundColor: '#fef2f2',
                    borderColor: '#dc3545',
                    color: 'var(--color-contrast-dark)',
                  }}
                >
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginEmail">
                  <Form.Label className="fw-medium">Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="loginPassword">
                  <Form.Label className="fw-medium">Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                  style={{
                    borderRadius: '8px',
                    padding: '0.7rem',
                    fontSize: '1rem',
                  }}
                >
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </Button>
              </Form>

              <div className="text-center">
                <span className="text-muted">¿No tienes cuenta? </span>
                <Link
                  to="/register"
                  className="fw-semibold"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  Regístrate aquí
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
