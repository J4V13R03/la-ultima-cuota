import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, ProgressBar } from 'react-bootstrap';
import { useToast } from '../../../shared/context/ToastContext';
import { useAuth } from '../../../shared/context/AuthContext';
import api from '../../../shared/services/api';

function RaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, updateUserSaldo } = useAuth();

  const [race, setRace] = useState(null);
  const [myHorses, setMyHorses] = useState([]);
  const [odds, setOdds] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHorse, setSelectedHorse] = useState('');
  const [selectedBetHorse, setSelectedBetHorse] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [inscribing, setInscribing] = useState(false);
  const [betting, setBetting] = useState(false);

  const fetchRace = useCallback(async () => {
    try {
      const response = await api.get(`/api/races/${id}`);
      if (response.data.success) setRace(response.data.data.race);
    } catch {
      showToast('Error al cargar la carrera', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  const fetchOdds = useCallback(async () => {
    try {
      const response = await api.get(`/api/races/${id}/odds`);
      if (response.data.success) setOdds(response.data.data.odds);
    } catch {
      // silent
    }
  }, [id]);

  const fetchMyHorses = useCallback(async () => {
    try {
      const response = await api.get('/api/stable');
      if (response.data.success) {
        const eligible = response.data.data.horses.filter(
          (h) => h.fatiga < 80 && !h.en_venta
        );
        setMyHorses(eligible);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const response = await api.get(`/api/races/${id}/results`);
      if (response.data.success) setResults(response.data.data.results);
    } catch {
      // silent
    }
  }, [id]);

  useEffect(() => {
    fetchRace();
    fetchOdds();
    fetchMyHorses();
  }, [fetchRace, fetchOdds, fetchMyHorses]);

  useEffect(() => {
    if (race?.estado === 'finalizada') {
      fetchResults();
    }
  }, [race?.estado, fetchResults]);

  useEffect(() => {
    if (race?.estado === 'programada') {
      const interval = setInterval(fetchOdds, 5000);
      return () => clearInterval(interval);
    }
    if (race?.estado === 'en_curso') {
      const interval = setInterval(fetchRace, 3000);
      return () => clearInterval(interval);
    }
  }, [race?.estado, fetchOdds, fetchRace]);

  const handleInscribe = async () => {
    if (!selectedHorse) {
      showToast('Selecciona un caballo', 'warning');
      return;
    }
    setInscribing(true);
    try {
      await api.post(`/api/races/${id}/inscribe`, { caballo_id: Number(selectedHorse) });
      showToast('Inscripción exitosa', 'success');
      setSelectedHorse('');
      fetchRace();
      fetchOdds();
      fetchMyHorses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al inscribir', 'error');
    } finally {
      setInscribing(false);
    }
  };

  const handleBet = async () => {
    if (!selectedBetHorse || !betAmount || Number(betAmount) <= 0) {
      showToast('Selecciona un caballo y un monto válido', 'warning');
      return;
    }
    setBetting(true);
    try {
      const response = await api.post(`/api/races/${id}/bet`, {
        caballo_id: Number(selectedBetHorse),
        monto: Number(betAmount),
      });
      if (response.data.success) {
        showToast(`Apuesta realizada. Cuota: ${response.data.data.cuota}x`, 'success');
        if (response.data.data.saldo !== undefined) {
          updateUserSaldo(response.data.data.saldo);
        }
        setBetAmount('');
        fetchOdds();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al apostar', 'error');
    } finally {
      setBetting(false);
    }
  };

  const totalPool = odds.reduce((sum, o) => sum + o.total_apuestas, 0);

  const getOddsPercentage = (horseOdds) => {
    if (totalPool === 0) return 0;
    const maxBet = Math.max(...odds.map((o) => Number(o.total_apuestas) || 0));
    if (maxBet === 0) return 0;
    return (Number(horseOdds.total_apuestas) / maxBet) * 100;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
      </Container>
    );
  }

  if (!race) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Carrera no encontrada.</p>
        <Button variant="primary" onClick={() => navigate('/calendario')}>Volver al calendario</Button>
      </Container>
    );
  }

  const isFull = race.participantes_actuales >= race.cupo_maximo;
  const isProgramada = race.estado === 'programada';
  const isInscritInThisRace = race.inscripciones?.some((i) => i.usuario_id === user?.id);
  const raceName = race.nombre || `Carrera #${race.id}`;

  return (
    <Container className="py-4">
      <Button
        variant="outline-secondary"
        size="sm"
        className="mb-3"
        onClick={() => navigate('/calendario')}
        style={{ borderRadius: '8px' }}
      >
        <i className="bi bi-arrow-left me-1"></i>Volver al calendario
      </Button>

      <Row className="mb-4">
        <Col>
          <h2 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
            {raceName}
          </h2>
          <div className="d-flex align-items-center gap-3">
            <Badge
              className="px-3 py-2"
              style={{
                backgroundColor: race.estado === 'programada' ? '#0d6efd'
                  : race.estado === 'en_curso' ? '#fd7e14'
                  : race.estado === 'finalizada' ? '#6c757d'
                  : '#dc3545',
                color: '#fff',
                borderRadius: '20px',
                animation: race.estado === 'en_curso' ? 'pulse-badge 1.5s infinite' : 'none',
              }}
            >
              {race.estado === 'programada' ? 'Programada' :
               race.estado === 'en_curso' ? 'En Curso' :
               race.estado === 'finalizada' ? 'Finalizada' : race.estado}
            </Badge>
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-calendar3 me-1"></i>
              {new Date(race.fecha_programada).toLocaleDateString('es-CL', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h5 className="font-heading fw-bold mb-3">
                <i className="bi bi-flag me-2" style={{ color: 'var(--color-primary)' }}></i>Participantes ({race.participantes_actuales}/{race.cupo_maximo})
              </h5>
              {race.inscripciones?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        {race.estado === 'finalizada' && results.length > 0 && <th>Pos.</th>}
                        <th>Carril</th>
                        <th>Caballo</th>
                        <th>Dueño</th>
                        <th>Winrate</th>
                        <th>Fatiga</th>
                        {race.estado === 'finalizada' && results.length > 0 && <th>Tiempo</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {race.inscripciones.map((insc) => {
                        const wr = insc.carreras_totales > 0
                          ? ((insc.victorias / insc.carreras_totales) * 100).toFixed(0)
                          : '0';
                        const result = results.find((r) => r.caballo_id === insc.caballo_id);
                        return (
                          <tr key={insc.id}>
                            {race.estado === 'finalizada' && results.length > 0 && (
                              <td>
                                {result ? (
                                  <Badge
                                    style={{
                                      backgroundColor: result.posicion_final === 1 ? '#FFD700'
                                        : result.posicion_final === 2 ? '#C0C0C0'
                                        : result.posicion_final === 3 ? '#CD7F32'
                                        : '#6c757d',
                                      color: result.posicion_final <= 3 ? '#000' : '#fff',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    #{result.posicion_final}
                                  </Badge>
                                ) : '---'}
                              </td>
                            )}
                            <td className="font-mono fw-bold">#{insc.numero_carril}</td>
                            <td className="fw-medium">{insc.caballo_nombre}</td>
                            <td className="text-muted">{insc.dueno_username || 'Bot'}</td>
                            <td className="font-mono">{wr}%</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <ProgressBar
                                  now={insc.fatiga}
                                  style={{ width: '50px', height: '6px' }}
                                  variant={insc.fatiga >= 80 ? 'danger' : insc.fatiga >= 50 ? 'warning' : 'success'}
                                />
                                <span className="font-mono" style={{ fontSize: '0.8rem' }}>{insc.fatiga}%</span>
                              </div>
                            </td>
                            {race.estado === 'finalizada' && results.length > 0 && (
                              <td className="font-mono">{result?.tiempo_final ? `${result.tiempo_final}s` : '---'}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">Aún no hay participantes inscritos.</p>
              )}
            </Card.Body>
          </Card>

          {isProgramada && odds.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="font-heading fw-bold mb-3">
                  <i className="bi bi-bar-chart me-2" style={{ color: 'var(--color-primary)' }}></i>Cuotas actuales
                </h5>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                  Pool total: <span className="font-mono fw-bold">${totalPool.toLocaleString('es-CL')} CC</span>
                </p>
                <div className="d-flex flex-column gap-2">
                  {odds.map((o) => (
                    <div key={o.caballo_id} className="d-flex align-items-center gap-3">
                      <span className="fw-medium" style={{ width: '140px', fontSize: '0.9rem' }}>{o.nombre}</span>
                      <div className="flex-grow-1" style={{ height: '22px', backgroundColor: '#e9ecef', borderRadius: '6px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${getOddsPercentage(o)}%`,
                            height: '100%',
                            backgroundColor: 'var(--color-primary)',
                            borderRadius: '6px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <div className="d-flex align-items-baseline gap-2" style={{ minWidth: '110px', justifyContent: 'flex-end' }}>
                        <span className="font-mono" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          ${Number(o.total_apuestas).toLocaleString('es-CL')}
                        </span>
                        <span className="font-mono fw-bold" style={{ fontSize: '1.05rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                          {Number(o.cuota).toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {race.estado === 'finalizada' && results.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="font-heading fw-bold mb-3">
                  <i className="bi bi-trophy me-2" style={{ color: 'var(--color-primary)' }}></i>Podio
                </h5>
                <div className="d-flex justify-content-center gap-4 flex-wrap">
                  {results.slice(0, 3).map((r, idx) => {
                    const medalIcons = ['bi-trophy-fill', 'bi-trophy', 'bi-award-fill'];
                    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                    return (
                      <div key={r.caballo_id} className="text-center">
                        <div
                          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: `${colors[idx]}20`,
                            border: `3px solid ${colors[idx]}`,
                          }}
                        >
                          <i className={`bi ${medalIcons[idx]}`} style={{ fontSize: '1.8rem', color: colors[idx] }}></i>
                        </div>
                        <h6 className="font-heading fw-bold mb-0" style={{ color: 'var(--color-text-dark)' }}>
                          {r.caballo_nombre}
                        </h6>
                        <small className="text-muted">
                          {r.tiempo_final ? `${r.tiempo_final}s` : '---'}
                        </small>
                        <div>
                          <small className="text-muted">{r.dueno_username || 'Bot'}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          {isProgramada && (
            <Card className="border-0 shadow-sm mb-4" style={{ borderTop: '4px solid var(--color-primary)' }}>
              <Card.Body className="p-4">
                <h5 className="font-heading fw-bold mb-3">Acción</h5>

                {!isInscritInThisRace && !isFull && (
                  <div className="mb-3">
                    <Form.Label className="fw-medium">Inscribir caballo</Form.Label>
                    <Form.Select
                      value={selectedHorse}
                      onChange={(e) => setSelectedHorse(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">Seleccionar caballo...</option>
                      {myHorses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.nombre} (F: {h.fatiga}%)
                        </option>
                      ))}
                    </Form.Select>
                    <Button
                      variant="primary"
                      className="w-100 mt-2"
                      disabled={!selectedHorse || inscribing}
                      onClick={handleInscribe}
                      style={{ borderRadius: '8px' }}
                    >
                      {inscribing ? 'Inscribiendo...' : 'Inscribir'}
                    </Button>
                  </div>
                )}

                {isInscritInThisRace && (
                  <Alert variant="success" className="mb-3" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-check-circle me-1"></i>Tu caballo está inscrito en esta carrera.
                  </Alert>
                )}

                <hr />

                <Form.Group className="mb-2">
                  <Form.Label className="fw-medium">Apostar a</Form.Label>
                  <Form.Select
                    value={selectedBetHorse}
                    onChange={(e) => setSelectedBetHorse(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  >
                    <option value="">Seleccionar caballo...</option>
                    {race.inscripciones?.map((insc) => {
                      const odd = odds.find((o) => o.caballo_id === insc.caballo_id);
                      return (
                        <option key={insc.caballo_id} value={insc.caballo_id}>
                          {insc.caballo_nombre} ({odd ? `${odd.cuota}x` : '---'})
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Monto en $CC</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Ej: 100"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Group>

                <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                  Tu saldo: <span className="font-mono fw-bold">${(user?.saldo ?? 0).toLocaleString('es-CL')} CC</span>
                </p>

                <Button
                  variant="primary"
                  className="w-100"
                  disabled={!selectedBetHorse || !betAmount || Number(betAmount) <= 0 || betting}
                  onClick={handleBet}
                  style={{ borderRadius: '8px' }}
                >
                  {betting ? 'Procesando...' : 'Apostar'}
                </Button>
              </Card.Body>
            </Card>
          )}

          {race.estado === 'en_curso' && (
            <Card className="border-0 shadow-sm" style={{ borderTop: '4px solid #fd7e14' }}>
              <Card.Body className="text-center p-4">
                <i className="bi bi-play-circle" style={{ fontSize: '2.5rem', color: '#fd7e14' }}></i>
                <h5 className="font-heading fw-bold mt-2">Carrera en curso</h5>
                <p className="text-muted mb-3">La carrera está en desarrollo.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/carrera/${id}/simulacion`)}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-eye me-1"></i>Ver simulación
                </Button>
              </Card.Body>
            </Card>
          )}

          {race.estado === 'finalizada' && (
            <Card className="border-0 shadow-sm" style={{ borderTop: '4px solid #6c757d' }}>
              <Card.Body className="text-center p-4">
                <i className="bi bi-flag-fill" style={{ fontSize: '2.5rem', color: '#6c757d' }}></i>
                <h5 className="font-heading fw-bold mt-2">Carrera finalizada</h5>
                <p className="text-muted mb-0">Esta carrera ya finalizó.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default RaceDetail;
