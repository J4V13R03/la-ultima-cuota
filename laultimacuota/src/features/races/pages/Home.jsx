import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import DailyRewardButton from '../../../shared/components/DailyRewardButton';
import api from '../../../shared/services/api';

function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, ganadas: 0 });
  const [wins, setWins] = useState([]);

  useEffect(() => {
    api.get('/api/history/stats')
      .then((res) => {
        if (res.data.success) setStats(res.data.data.stats);
      })
      .catch(() => {});

    api.get('/api/history/wins')
      .then((res) => {
        if (res.data.success) setWins(res.data.data.wins);
      })
      .catch(() => {});
  }, []);

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="font-heading fw-bold" style={{ color: 'var(--color-text-dark)' }}>
            Hola, {user?.username || 'Jugador'}!
          </h1>
          <p className="text-muted fs-5 mb-0">
            Bienvenido a La Última Cuota
          </p>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '56px', height: '56px', backgroundColor: 'rgba(21, 189, 15, 0.12)' }}
              >
                <i className="bi bi-wallet2" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Tu Saldo</h6>
              <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.6rem', color: 'var(--color-primary)' }}>
                ${(user?.saldo ?? 0).toLocaleString('es-CL')} CC
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4 d-flex flex-column align-items-center justify-content-center">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '56px', height: '56px', backgroundColor: 'rgba(98, 241, 90, 0.15)' }}
              >
                <i className="bi bi-gift" style={{ fontSize: '1.5rem', color: 'var(--color-secondary)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-2">Moneda Diaria</h6>
              <DailyRewardButton variant="success" size="sm" />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '56px', height: '56px', backgroundColor: 'rgba(65, 28, 28, 0.08)' }}
              >
                <i className="bi bi-bar-chart-line" style={{ fontSize: '1.5rem', color: 'var(--color-contrast-dark)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Apuestas</h6>
              <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.6rem', color: 'var(--color-contrast-dark)' }}>
                {stats.total_apuestas}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '56px', height: '56px', backgroundColor: 'rgba(21, 189, 15, 0.12)' }}
              >
                <i className="bi bi-trophy" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}></i>
              </div>
              <h6 className="text-muted fw-medium mb-1">Victorias</h6>
              <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.6rem', color: 'var(--color-primary)' }}>
                {stats.apuestas_ganadas}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4 justify-content-center">
        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderTop: '3px solid var(--color-primary)' }}>
            <Card.Body className="p-4 text-center">
              <h5 className="font-heading fw-bold mb-3">
                <i className="bi bi-calendar-event me-2" style={{ color: 'var(--color-primary)' }}></i>Carreras
              </h5>
              <p className="text-muted mb-3">Consulta el calendario y elige en cuáles apostar.</p>
              <Link to="/calendario" className="btn btn-primary" style={{ borderRadius: '8px' }}>
                Ver Calendario
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderTop: '3px solid var(--color-secondary)' }}>
            <Card.Body className="p-4 text-center">
              <h5 className="font-heading fw-bold mb-3">
                <i className="bi bi-grid me-2" style={{ color: 'var(--color-secondary)' }}></i>Establo
              </h5>
              <p className="text-muted mb-3">Gestiona tus caballos, renómbralos o ponlos a la venta.</p>
              <Link to="/establo" className="btn btn-success" style={{ borderRadius: '8px' }}>
                Mi Establo
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderTop: '3px solid #fd7e14' }}>
            <Card.Body className="p-4 text-center">
              <h5 className="font-heading fw-bold mb-3">
                <i className="bi bi-dice-5 me-2" style={{ color: '#fd7e14' }}></i>Gacha
              </h5>
              <p className="text-muted mb-3">Obtén caballos nuevos con tiradas aleatorias.</p>
              <Link to="/gacha" className="btn btn-warning text-dark" style={{ borderRadius: '8px' }}>
                Tirar Gacha
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {wins.length > 0 && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h5 className="font-heading fw-bold mb-3">
              <i className="bi bi-trophy me-2" style={{ color: 'var(--color-primary)' }}></i>Victorias recientes
            </h5>
            <div className="d-flex flex-column gap-2">
              {wins.map((w, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center">
                  <span className="fw-medium">{w.carrera_nombre || `Carrera #${w.carrera_id}`}</span>
                  <span className="font-mono fw-bold" style={{ color: 'var(--color-primary)' }}>
                    +${Number(w.ganancia).toLocaleString('es-CL')} CC
                  </span>
                </div>
              ))}
            </div>
            <Link to="/historial" className="btn btn-outline-primary btn-sm mt-3" style={{ borderRadius: '8px' }}>
              Ver historial completo
            </Link>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default Home;
