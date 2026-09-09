import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { useToast } from '../../../shared/context/ToastContext';
import api from '../../../shared/services/api';

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  ganada: 'Ganada',
  perdida: 'Perdida',
  cancelada: 'Cancelada',
};

const STATUS_VARIANTS = {
  pendiente: 'warning',
  ganada: 'success',
  perdida: 'danger',
  cancelada: 'secondary',
};

function History() {
  const showToast = useToast();
  const [bets, setBets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filter) params.set('estado', filter);
      const response = await api.get(`/api/history/bets?${params.toString()}`);
      if (response.data.success) {
        setBets(response.data.data.bets);
        setPagination(response.data.data.pagination);
      }
    } catch {
      showToast('Error al cargar historial', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, page, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/history/stats');
      if (response.data.success) setStats(response.data.data.stats);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchBets(); }, [fetchBets]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
            <i className="bi bi-clock-history me-2" style={{ color: 'var(--color-primary)' }}></i>Historial de Apuestas
          </h2>
          <p className="text-muted mb-0">Tus apuestas y estadísticas</p>
        </Col>
      </Row>

      {stats && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-3">
                <h6 className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Total Apuestas</h6>
                <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.4rem', color: 'var(--color-text-dark)' }}>
                  {stats.total_apuestas}
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-3">
                <h6 className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Ganadas</h6>
                <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>
                  {stats.apuestas_ganadas}
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-3">
                <h6 className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Total Ganado</h6>
                <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>
                  ${Number(stats.total_ganado).toLocaleString('es-CL')}
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-3">
                <h6 className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Total Perdido</h6>
                <p className="font-mono fw-bold mb-0" style={{ fontSize: '1.4rem', color: 'var(--color-contrast-dark)' }}>
                  ${Number(stats.total_perdido).toLocaleString('es-CL')}
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mb-3">
        <Col>
          <ButtonGroup className="flex-wrap" style={{ gap: '0.4rem' }}>
            {[
              { key: '', label: 'Todas' },
              { key: 'pendiente', label: 'Pendientes' },
              { key: 'ganada', label: 'Ganadas' },
              { key: 'perdida', label: 'Perdidas' },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => { setFilter(f.key); setPage(1); }}
                style={{ borderRadius: '20px', fontWeight: 600, padding: '0.4rem 1rem' }}
              >
                {f.label}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : bets.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: 'var(--color-contrast-medium)' }}></i>
            <h5 className="font-heading fw-bold mt-3" style={{ color: 'var(--color-text-dark)' }}>
              Sin apuestas registradas
            </h5>
            <p className="text-muted mb-0">Tus apuestas aparecerán aquí.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Caballo</th>
                  <th>Monto</th>
                  <th>Cuota</th>
                  <th>Estado</th>
                  <th>Ganancia</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id}>
                    <td className="fw-medium">{bet.carrera_nombre}</td>
                    <td>{bet.caballo_nombre}</td>
                    <td className="font-mono">${Number(bet.monto).toLocaleString('es-CL')}</td>
                    <td className="font-mono">{Number(bet.cuota).toFixed(2)}x</td>
                    <td>
                      <Badge bg={STATUS_VARIANTS[bet.estado]} style={{ borderRadius: '20px', fontSize: '0.75rem' }}>
                        {STATUS_LABELS[bet.estado]}
                      </Badge>
                    </td>
                    <td className="font-mono fw-bold" style={{ color: bet.monto_ganado ? 'var(--color-primary)' : 'inherit' }}>
                      {bet.monto_ganado ? `+$${Number(bet.monto_ganado).toLocaleString('es-CL')}` : '---'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(bet.created_at).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ borderRadius: '8px' }}
              >
                Anterior
              </Button>
              <span className="align-self-center text-muted" style={{ fontSize: '0.85rem' }}>
                Página {page} de {pagination.pages}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                style={{ borderRadius: '8px' }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default History;
