import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useToast } from '../../../shared/context/ToastContext';
import api from '../../../shared/services/api';

const PAGE_SIZE = 10;

function Stable() {
  const showToast = useToast();
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [renameModal, setRenameModal] = useState({ show: false, id: null, nombre: '' });
  const [sellModal, setSellModal] = useState({ show: false, id: null, precio: '' });
  const [historyModal, setHistoryModal] = useState({ show: false, id: null, history: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, nombre: '' });

  const fetchHorses = useCallback(async () => {
    try {
      const response = await api.get('/api/stable');
      if (response.data.success) setHorses(response.data.data.horses);
    } catch {
      showToast('Error al cargar el establo', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchHorses(); }, [fetchHorses]);

  const handleRename = async () => {
    if (!renameModal.nombre.trim()) return;
    try {
      await api.patch(`/api/stable/${renameModal.id}/rename`, { nombre: renameModal.nombre.trim() });
      showToast('Caballo renombrado', 'success');
      setRenameModal({ show: false, id: null, nombre: '' });
      fetchHorses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al renombrar', 'error');
    }
  };

  const handleSell = async () => {
    const precio = Number(sellModal.precio);
    if (!precio || precio <= 0) return;
    try {
      await api.patch(`/api/stable/${sellModal.id}/sell`, { precio });
      showToast('Caballo puesto a la venta', 'success');
      setSellModal({ show: false, id: null, precio: '' });
      fetchHorses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al poner a la venta', 'error');
    }
  };

  const handleUnsell = async (id) => {
    try {
      await api.patch(`/api/stable/${id}/unsell`);
      showToast('Caballo removido de la venta', 'success');
      fetchHorses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/stable/${deleteModal.id}`);
      showToast('Caballo eliminado del establo', 'success');
      setDeleteModal({ show: false, id: null, nombre: '' });
      setPage(1);
      fetchHorses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  const showHistory = async (id) => {
    try {
      const response = await api.get(`/api/stable/${id}/history`);
      if (response.data.success) {
        setHistoryModal({ show: true, id, history: response.data.data.history });
      }
    } catch {
      showToast('Error al cargar historial', 'error');
    }
  };

  const getWinrate = (h) => {
    if (!h.carreras_totales || h.carreras_totales === 0) return '0%';
    return `${((h.victorias / h.carreras_totales) * 100).toFixed(0)}%`;
  };

  const totalPages = Math.max(1, Math.ceil(horses.length / PAGE_SIZE));
  const paginatedHorses = horses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
            <i className="bi bi-grid me-2" style={{ color: 'var(--color-primary)' }}></i>Mi Establo
          </h2>
          <p className="text-muted mb-0">{horses.length} caballo{horses.length !== 1 ? 's' : ''} en tu establo</p>
        </Col>
      </Row>

      {horses.length > 0 && (
        <div
          className="mb-4 p-3"
          style={{
            backgroundColor: 'rgba(21, 189, 15, 0.08)',
            border: '1px solid var(--color-primary)',
            borderRadius: '12px',
            color: 'var(--color-text-dark)',
          }}
        >
          <strong>Tu establo:</strong> Aquí ves todos tus caballos. Puedes renombrarlos, ponerlos a la venta
          o eliminarlos. Los caballos con fatiga alta no pueden competir hasta que se recuperen.
        </div>
      )}

      {horses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-house-heart" style={{ fontSize: '3rem', color: 'var(--color-contrast-medium)' }}></i>
            <h5 className="font-heading fw-bold mt-3" style={{ color: 'var(--color-text-dark)' }}>
              Tu establo está vacío
            </h5>
            <p className="text-muted mb-3">
              Usa el Gacha para obtener tu primer caballo o visita el Mercado para comprar uno.
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
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="font-heading fw-bold mb-0" style={{ color: 'var(--color-text-dark)' }}>
                        {horse.nombre}
                      </h5>
                      {horse.en_venta && (
                        <Badge bg="warning" style={{ fontSize: '0.7rem' }}>En venta</Badge>
                      )}
                    </div>

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
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: '60px', height: '6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>
                            <div
                              style={{
                                width: `${horse.fatiga}%`,
                                height: '100%',
                                backgroundColor: horse.fatiga >= 80 ? '#dc3545' : horse.fatiga >= 50 ? '#ffc107' : 'var(--color-primary)',
                                borderRadius: '3px',
                              }}
                            ></div>
                          </div>
                          <span className="font-mono" style={{ fontSize: '0.8rem' }}>{horse.fatiga}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto d-flex flex-wrap gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        style={{ borderRadius: '6px', fontSize: '0.78rem' }}
                        onClick={() => setRenameModal({ show: true, id: horse.id, nombre: horse.nombre })}
                      >
                        <i className="bi bi-pencil me-1"></i>Renombrar
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        style={{ borderRadius: '6px', fontSize: '0.78rem' }}
                        onClick={() => showHistory(horse.id)}
                      >
                        <i className="bi bi-clock-history me-1"></i>Historial
                      </Button>
                      {horse.en_venta ? (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          style={{ borderRadius: '6px', fontSize: '0.78rem' }}
                          onClick={() => handleUnsell(horse.id)}
                        >
                          <i className="bi bi-x-circle me-1"></i>Quitar de venta
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          style={{ borderRadius: '6px', fontSize: '0.78rem' }}
                          onClick={() => setSellModal({ show: true, id: horse.id, precio: '' })}
                        >
                          <i className="bi bi-tag me-1"></i>Vender
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        style={{ borderRadius: '6px', fontSize: '0.78rem' }}
                        onClick={() => setDeleteModal({ show: true, id: horse.id, nombre: horse.nombre })}
                      >
                        <i className="bi bi-trash me-1"></i>Eliminar
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

      <Modal show={renameModal.show} onHide={() => setRenameModal({ show: false, id: null, nombre: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-heading fw-bold">Renombrar caballo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nuevo nombre</Form.Label>
            <Form.Control
              type="text"
              value={renameModal.nombre}
              onChange={(e) => setRenameModal({ ...renameModal, nombre: e.target.value })}
              maxLength={100}
              style={{ borderRadius: '8px' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRenameModal({ show: false, id: null, nombre: '' })}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleRename}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={sellModal.show} onHide={() => setSellModal({ show: false, id: null, precio: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-heading fw-bold">Poner a la venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Precio en $CC</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={sellModal.precio}
              onChange={(e) => setSellModal({ ...sellModal, precio: e.target.value })}
              placeholder="Ej: 5000"
              style={{ borderRadius: '8px' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSellModal({ show: false, id: null, precio: '' })}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSell}>Publicar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, id: null, nombre: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-heading fw-bold">Eliminar caballo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que quieres eliminar a <strong>{deleteModal.nombre}</strong>?</p>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal({ show: false, id: null, nombre: '' })}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={historyModal.show} onHide={() => setHistoryModal({ show: false, id: null, history: [] })} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="font-heading fw-bold">Historial de carreras</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyModal.history.length === 0 ? (
            <p className="text-muted text-center py-3">Este caballo aún no ha competido.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Carrera</th>
                    <th>Fecha</th>
                    <th>Posición</th>
                    <th>Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModal.history.map((h, idx) => (
                    <tr key={idx}>
                      <td className="fw-medium">{h.carrera_nombre || `Carrera #${h.carrera_id}`}</td>
                      <td>{new Date(h.fecha_programada).toLocaleDateString('es-CL')}</td>
                      <td>
                        <Badge bg={h.posicion_final === 1 ? 'success' : h.posicion_final <= 3 ? 'primary' : 'secondary'}>
                          {h.posicion_final ? `#${h.posicion_final}` : '---'}
                        </Badge>
                      </td>
                      <td className="font-mono">{h.tiempo_final ? `${h.tiempo_final}s` : '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Stable;
