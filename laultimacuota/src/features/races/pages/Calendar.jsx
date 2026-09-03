import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, ButtonGroup, Alert } from 'react-bootstrap';
import api from '../../../shared/services/api';

const STATUS_LABELS = {
  programada: 'Programada',
  en_curso: 'En Curso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

const STATUS_FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'proximas', label: 'Próximas' },
  { key: 'en_curso', label: 'En Curso' },
  { key: 'finalizada', label: 'Finalizadas' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Calendar() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('todas');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const response = await api.get('/api/races');
        if (response.data.success) {
          setRaces(response.data.data.races);
        } else {
          setError('No se pudieron cargar las carreras.');
        }
      } catch {
        setError('Error de conexión al cargar las carreras.');
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  const filteredRaces = races.filter((race) => {
    switch (activeFilter) {
      case 'proximas':
        return race.status === 'programada';
      case 'en_curso':
        return race.status === 'en_curso';
      case 'finalizada':
        return race.status === 'finalizada';
      default:
        return true;
    }
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando carreras...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2
            className="font-heading fw-bold mb-1"
            style={{ color: 'var(--color-text-dark)' }}
          >
            <i className="bi bi-calendar2-event me-2" style={{ color: 'var(--color-primary)' }}></i>Calendario de Carreras
          </h2>
          <p className="text-muted mb-0">
            Elige una carrera y haz tu apuesta
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <ButtonGroup className="flex-wrap" style={{ gap: '0.4rem' }}>
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
                style={{
                  borderRadius: '20px',
                  fontWeight: 600,
                  padding: '0.4rem 1.2rem',
                  ...(activeFilter === filter.key
                    ? {}
                    : {
                        borderColor: 'var(--color-contrast-medium)',
                        color: 'var(--color-contrast-medium)',
                      }),
                }}
              >
                {filter.label}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {!error && filteredRaces.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted fs-5 mb-0">
            No hay carreras para mostrar con este filtro.
          </p>
        </div>
      )}

      <Row className="g-3">
        {filteredRaces.map((race) => {
          const isExpanded = expandedId === race.id;
          return (
            <Col xs={12} key={race.id}>
              <Card
                className="border-0 shadow-sm"
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${
                    race.status === 'en_curso'
                      ? '#fd7e14'
                      : race.status === 'finalizada'
                      ? '#6c757d'
                      : race.status === 'cancelada'
                      ? '#dc3545'
                      : '#0d6efd'
                  }`,
                }}
                onClick={() => toggleExpand(race.id)}
              >
                <Card.Body className="p-3 p-md-4">
                  <Row className="align-items-center">
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                      <h5
                        className="font-heading fw-bold mb-1"
                        style={{ color: 'var(--color-text-dark)' }}
                      >
                        {race.name || race.nombre}
                      </h5>
                      <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.9rem' }}>
                        <span><i className="bi bi-calendar3 me-1"></i>{formatDate(race.date || race.fecha)}</span>
                        {(race.date || race.fecha) && (
                          <span><i className="bi bi-clock me-1"></i>{formatTime(race.date || race.fecha)}</span>
                        )}
                      </div>
                    </Col>

                    <Col xs={6} md={3} className="mb-2 mb-md-0 text-md-center">
                      <Badge
                        className={`badge-${race.status} px-3 py-2`}
                        style={{ fontSize: '0.8rem', borderRadius: '20px' }}
                      >
                        {STATUS_LABELS[race.status] || race.status}
                      </Badge>
                    </Col>

                    <Col xs={6} md={3} className="mb-2 mb-md-0 text-md-center">
                      <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                        Cupo
                      </span>
                      <span
                        className="font-mono fw-bold"
                        style={{ color: 'var(--color-contrast-dark)' }}
                      >
                        {race.current_participants ?? race.participantes_actuales ?? 0}
                        {' / '}
                        {race.max_participants ?? race.maximo ?? '∞'}
                      </span>
                    </Col>

                    <Col xs={12} md={2} className="text-md-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        style={{
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(race.id);
                        }}
                      >
                        {isExpanded ? 'Ocultar' : 'Ver más'}
                      </Button>
                    </Col>
                  </Row>

                  {isExpanded && (
                    <div
                      className="mt-3 pt-3"
                      style={{ borderTop: '1px solid rgba(100, 43, 43, 0.1)' }}
                    >
                      <Row>
                        <Col sm={6}>
                          <p className="mb-1">
                            <strong className="text-muted">Hipódromo:</strong>{' '}
                            {race.hippodrome || race.hipodromo || '—'}
                          </p>
                          <p className="mb-1">
                            <strong className="text-muted">Distancia:</strong>{' '}
                            {race.distance || race.distancia || '—'}
                          </p>
                          <p className="mb-0">
                            <strong className="text-muted">Tipo:</strong>{' '}
                            {race.type || race.tipo || '—'}
                          </p>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1">
                            <strong className="text-muted">Premio:</strong>{' '}
                            <span className="font-mono fw-bold" style={{ color: 'var(--color-primary)' }}>
                              ${(race.prize || race.premio || 0).toLocaleString('es-CL')}
                            </span>
                          </p>
                          <p className="mb-1">
                            <strong className="text-muted">Condición:</strong>{' '}
                            {race.condition || race.condicion || '—'}
                          </p>
                          <p className="mb-0">
                            <strong className="text-muted">Superficie:</strong>{' '}
                            {race.surface || race.superficie || '—'}
                          </p>
                        </Col>
                      </Row>
                      {race.status === 'programada' && (
                        <div className="mt-3">
                          <Button
                            variant="primary"
                            size="sm"
                            style={{ borderRadius: '8px' }}
                          >
                            Apostar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}

export default Calendar;
