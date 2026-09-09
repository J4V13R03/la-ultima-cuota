import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { useToast } from '../../../shared/context/ToastContext';
import { useAuth } from '../../../shared/context/AuthContext';
import api from '../../../shared/services/api';

const PAGE_SIZE = 10;

function Market() {
  const { user } = useAuth();
  const showToast = useToast();
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('price_asc');
  const [buyModal, setBuyModal] = useState({ show: false, horse: null });
  const [page, setPage] = useState(1);

  const fetchHorses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      const response = await api.get(`/api/market?${params.toString()}`);
      if (response.data.success) setHorses(response.data.data.horses);
    } catch {
      showToast('Error al cargar el mercado', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, sort, showToast]);

  useEffect(() => { fetchHorses(); }, [fetchHorses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHorses();
  };

  const handleBuy = async () => {
    const horse = buyModal.horse;
    if (!horse) return;
    try {
      const response = await api.post(`/api/market/${horse.id}/buy`);
      if (response.data.success) {
        showToast(`Compraste a ${horse.nombre} por $${horse.precio_venta.toLocaleString('es-CL')} CC`, 'success');
        setBuyModal({ show: false, horse: null });
        setPage(1);
        fetchHorses();
        window.location.reload();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al comprar', 'error');
    }
  };

  const getWinrate = (h) => {
    if (!h.carreras_totales || h.carreras_totales === 0) return '0%';
    return `${((h.victorias / h.carreras_totales) * 100).toFixed(0)}%`;
  };

  const totalPages = Math.max(1, Math.ceil(horses.length / PAGE_SIZE));
  const paginatedHorses = horses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
            <i className="bi bi-shop me-2" style={{ color: 'var(--color-primary)' }}></i>Mercado
          </h2>
          <p className="text-muted mb-0">Compra caballos de otros jugadores</p>
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
        <strong>Mercado de caballos:</strong> Aquí puedes comprar caballos que otros jugadores
        pusieron a la venta. El precio lo define el vendedor. La transacción es instantánea.
      </div>

      <Row className="mb-4 g-2 align-items-end">
        <Col md={6}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderRadius: '8px 0 0 8px' }}
              />
              <Button variant="primary" type="submit" style={{ borderRadius: '0 8px 8px 0' }}>
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={3}>
          <Form.Select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            style={{ borderRadius: '8px' }}
          >
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="wins">Más victorias</option>
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : horses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-shop" style={{ fontSize: '3rem', color: 'var(--color-contrast-medium)' }}></i>
            <h5 className="font-heading fw-bold mt-3" style={{ color: 'var(--color-text-dark)' }}>
              No hay caballos en venta
            </h5>
            <p className="text-muted mb-0">
              Vuelve pronto o revisa tu establo para poner caballos a la venta.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-3">
            {paginatedHorses.map((horse) => (
              <Col xs={12} sm={6} lg={4} key={horse.id}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="d-flex flex-column">
                    <h5 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
                      {horse.nombre}
                    </h5>
                    <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                      Vendedor: <span className="fw-medium">{horse.dueno_username}</span>
                    </p>

                    <div className="mb-3" style={{ fontSize: '0.85rem' }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Victorias / Carreras</span>
                        <span className="font-mono fw-bold">{horse.victorias}/{horse.carreras_totales}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Winrate</span>
                        <span className="font-mono fw-bold">{getWinrate(horse)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Fatiga</span>
                        <span className="font-mono fw-bold">{horse.fatiga}%</span>
                      </div>
                    </div>

                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <span
                        className="font-mono fw-bold"
                        style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}
                      >
                        ${horse.precio_venta.toLocaleString('es-CL')} CC
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={horse.dueno_username === user?.username}
                        onClick={() => setBuyModal({ show: true, horse })}
                        style={{ borderRadius: '8px' }}
                      >
                        {horse.dueno_username === user?.username ? 'Tu caballo' : 'Comprar'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
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
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ borderRadius: '8px' }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      <Modal show={buyModal.show} onHide={() => setBuyModal({ show: false, horse: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-heading fw-bold">Confirmar compra</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {buyModal.horse && (
            <>
              <p>
                Estás por comprar a <strong>{buyModal.horse.nombre}</strong> por{' '}
                <span className="font-mono fw-bold" style={{ color: 'var(--color-primary)' }}>
                  ${buyModal.horse.precio_venta.toLocaleString('es-CL')} CC
                </span>.
              </p>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                Tu saldo actual: ${(user?.saldo ?? 0).toLocaleString('es-CL')} CC
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBuyModal({ show: false, horse: null })}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleBuy}>Confirmar compra</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Market;
