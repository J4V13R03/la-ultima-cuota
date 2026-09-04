import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Tab, Tabs, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';

function Landing() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginData.email.trim() || !loginData.password) {
      setLoginError('Todos los campos son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(loginData.email.trim(), loginData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setLoginError(result.message);
      }
    } catch {
      setLoginError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (!registerData.username.trim() || !registerData.email.trim() || !registerData.password || !registerData.confirmPassword) {
      setRegisterError('Todos los campos son obligatorios.');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }
    if (registerData.password.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const result = await register(registerData.username.trim(), registerData.email.trim(), registerData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setRegisterError(result.message);
      }
    } catch {
      setRegisterError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--color-bg-light)' }}>
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Row className="w-100 justify-content-center">
          <Col lg={5} className="mb-5 mb-lg-0 text-center text-lg-start">
            <div className="mb-4">
              <img
                src="/logo.svg"
                alt="La Ultima Cuota"
                style={{ height: '80px', width: 'auto' }}
              />
            </div>
            <h1
              className="font-heading fw-bold mb-3"
              style={{ fontSize: '2.8rem', color: 'var(--color-text-dark)', lineHeight: 1.1 }}
            >
              La Última Cuota
            </h1>
            <p
              className="fs-4 mb-4"
              style={{ color: 'var(--color-contrast-medium)', fontWeight: 500 }}
            >
              Tu simulador de apuestas hípicas
            </p>
            <div className="d-flex flex-column gap-3" style={{ maxWidth: '400px', margin: window.innerWidth >= 992 ? '0' : '0 auto' }}>
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21, 189, 15, 0.12)' }}
                >
                  <i className="bi bi-dice-5" style={{ color: 'var(--color-primary)' }}></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Gacha</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    Obtén caballos nuevos con tiradas aleatorias
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21, 189, 15, 0.12)' }}
                >
                  <i className="bi bi-flag" style={{ color: 'var(--color-primary)' }}></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Carreras</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    Inscribe tus caballos y apuesta en carreras en vivo
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21, 189, 15, 0.12)' }}
                >
                  <i className="bi bi-shop" style={{ color: 'var(--color-primary)' }}></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Mercado</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    Compra y vende caballos con otros jugadores
                  </p>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm" style={{ minHeight: '420px' }}>
              <Card.Body className="p-4">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-3"
                  fill
                >
                  <Tab eventKey="login" title="Iniciar Sesión">
                    {loginError && (
                      <Alert variant="danger" dismissible onClose={() => setLoginError('')} className="mb-3">
                        {loginError}
                      </Alert>
                    )}
                    <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Correo Electrónico</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="tu@email.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-medium">Contraseña</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                        />
                      </Form.Group>
                      <Button
                        type="submit"
                        className="w-100"
                        disabled={loading}
                        style={{ borderRadius: '8px', padding: '0.7rem' }}
                      >
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                      </Button>
                    </Form>
                  </Tab>

                  <Tab eventKey="register" title="Registrarse">
                    {registerError && (
                      <Alert variant="danger" dismissible onClose={() => setRegisterError('')} className="mb-3">
                        {registerError}
                      </Alert>
                    )}
                    <Form onSubmit={handleRegister}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Nombre de Usuario</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Tu apodo"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Correo Electrónico</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="tu@email.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Contraseña</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-medium">Confirmar Contraseña</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Repite tu contraseña"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                        />
                      </Form.Group>
                      <Button
                        type="submit"
                        className="w-100"
                        disabled={loading}
                        style={{ borderRadius: '8px', padding: '0.7rem' }}
                      >
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                      </Button>
                    </Form>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Landing;
