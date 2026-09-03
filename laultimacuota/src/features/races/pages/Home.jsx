import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';

function Home() {
  const { user } = useAuth();
  const balance = user?.balance ?? user?.saldo ?? 0;

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1
            className="font-heading fw-bold"
            style={{ color: 'var(--color-text-dark)' }}
          >
            ¡Hola, {user?.username || 'Jugador'}!
          </h1>
          <p className="text-muted fs-5 mb-0">
            Bienvenido a La Última Cuota — tu simulador de apuestas hípicas.
          </p>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(21, 189, 15, 0.12)',
                }}
              >
                <i className="bi bi-wallet2" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Tu Saldo</h6>
              <p
                className="font-mono fw-bold mb-0"
                style={{
                  fontSize: '1.6rem',
                  color: 'var(--color-primary)',
                }}
              >
                ${balance.toLocaleString('es-CL')}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(98, 241, 90, 0.15)',
                }}
              >
                <i className="bi bi-trophy" style={{ fontSize: '1.5rem', color: 'var(--color-secondary)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Monedas Diarias</h6>
              <p
                className="font-mono fw-bold mb-0"
                style={{
                  fontSize: '1.6rem',
                  color: 'var(--color-secondary)',
                }}
              >
                Disponible
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(65, 28, 28, 0.08)',
                }}
              >
                <i className="bi bi-bar-chart-line" style={{ fontSize: '1.5rem', color: 'var(--color-contrast-dark)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Apuestas Activas</h6>
              <p
                className="font-mono fw-bold mb-0"
                style={{
                  fontSize: '1.6rem',
                  color: 'var(--color-contrast-dark)',
                }}
              >
                0
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(100, 43, 43, 0.08)',
                }}
              >
                <i className="bi bi-bullseye" style={{ fontSize: '1.5rem', color: 'var(--color-contrast-medium)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Historial</h6>
              <p
                className="font-mono fw-bold mb-0"
                style={{
                  fontSize: '1.6rem',
                  color: 'var(--color-contrast-medium)',
                }}
              >
                0
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ borderTop: '3px solid var(--color-primary)' }}
          >
            <Card.Body className="p-4">
              <h5 className="font-heading fw-bold mb-3">
                <i className="bi bi-calendar-event me-2" style={{ color: 'var(--color-primary)' }}></i>Próximas Carreras
              </h5>
              <p className="text-muted mb-3">
                Consulta el calendario de carreras disponibles y elige en cuáles apostar.
              </p>
              <Link
                to="/calendario"
                className="btn btn-primary"
                style={{ borderRadius: '8px' }}
              >
                Ver Calendario
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ borderTop: '3px solid var(--color-secondary)' }}
          >
            <Card.Body className="p-4">
              <h5 className="font-heading fw-bold mb-3">
                <i className="bi bi-gift me-2" style={{ color: 'var(--color-secondary)' }}></i>Monedas Diarias
              </h5>
              <p className="text-muted mb-3">
                Reclama tus monedas gratis cada 24 horas para seguir apostando.
              </p>
              <button
                className="btn btn-success"
                style={{ borderRadius: '8px' }}
              >
                Reclamar
              </button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
