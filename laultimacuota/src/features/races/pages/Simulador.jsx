import React, { useState, useRef, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Form } from 'react-bootstrap';

const TRACK_WIDTH = 800;
const LANE_HEIGHT = 44;
const HORSE_WIDTH = 36;

const MOCK_HORSES = [
  'Huaso del Sur', 'Poncho Rojo', 'Chacarero Veloz', 'Diablo del Ranco',
  'Puma Andino', 'Condor de la Frontera', 'Machaqmara', 'Trauco Legendario',
  'Boroniol del Bosque', 'Chiflon del Norte', 'Trentrenlevu', 'Pinen el Indomable',
];

const LANE_COLORS = [
  '#15BD0F', '#0d6efd', '#fd7e14', '#dc3545', '#6f42c1', '#20c997',
  '#e83e8c', '#ffc107', '#17a2b8', '#343a40', '#007bff', '#28a745',
];

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function Simulador() {
  const [horseCount, setHorseCount] = useState(8);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [positions, setPositions] = useState({});
  const [results, setResults] = useState([]);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const selectedHorses = MOCK_HORSES.slice(0, horseCount);
  const trackHeight = selectedHorses.length * LANE_HEIGHT + 16;

  const initPositions = () => {
    const init = {};
    selectedHorses.forEach((_, idx) => {
      init[idx] = 0;
    });
    return init;
  };

  const startRace = () => {
    setRunning(true);
    setFinished(false);
    setResults([]);
    setPositions(initPositions());

    intervalRef.current = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const progress = next[key];
          if (progress >= TRACK_WIDTH - HORSE_WIDTH - 20) return;
          const speed = Math.random() * 10 + 3;
          next[key] = Math.min(progress + speed * 2, TRACK_WIDTH - HORSE_WIDTH - 20);
        });
        return next;
      });
    }, 800);

    countdownRef.current = setInterval(() => {
      setPositions((prevPos) => {
        const allDone = Object.values(prevPos).every((p) => p >= TRACK_WIDTH - HORSE_WIDTH - 20);
        if (allDone) {
          clearInterval(countdownRef.current);
          clearInterval(intervalRef.current);
          setRunning(false);
          setFinished(true);
          const sorted = Object.entries(prevPos)
            .map(([id, pos]) => ({ id: Number(id), pos }))
            .sort((a, b) => b.pos - a.pos);
          setResults(sorted);
        }
        return prevPos;
      });
    }, 500);
  };

  const resetRace = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRunning(false);
    setFinished(false);
    setResults([]);
    setPositions({});
  };

  const getColor = (idx) => LANE_COLORS[idx % LANE_COLORS.length];

  return (
    <Container className="py-4">
      <h2 className="font-heading fw-bold mb-1" style={{ color: 'var(--color-text-dark)' }}>
        <i className="bi bi-play-circle me-2" style={{ color: 'var(--color-primary)' }}></i>Simulador de Carreras
      </h2>
      <p className="text-muted mb-4">
        Visualiza una carrera de prueba con datos ficticios. No afecta la base de datos.
      </p>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <h6 className="font-heading fw-bold mb-3">
                <i className="bi bi-gear me-1" style={{ color: 'var(--color-primary)' }}></i>Configuración
              </h6>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium" style={{ fontSize: '0.85rem' }}>Cantidad de caballos</Form.Label>
                <Form.Select
                  value={horseCount}
                  onChange={(e) => { setHorseCount(Number(e.target.value)); resetRace(); }}
                  disabled={running}
                  style={{ borderRadius: '8px' }}
                >
                  {[4, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>{n} caballos</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <div className="d-flex gap-2">
                <Button variant="success" className="flex-grow-1 fw-semibold" disabled={running} onClick={startRace} style={{ borderRadius: '8px' }}>
                  <i className="bi bi-play-fill me-1"></i>Play
                </Button>
                <Button variant="outline-secondary" onClick={resetRace} style={{ borderRadius: '8px' }}>
                  <i className="bi bi-arrow-counterclockwise"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center">
              <div>
                {running && (
                  <>
                    <p className="text-muted mb-2 fw-medium" style={{ fontSize: '0.85rem' }}>Carrera en curso...</p>
                    <div className="spinner-border text-success" role="status" style={{ width: '2rem', height: '2rem' }}>
                      <span className="visually-hidden">Carrera...</span>
                    </div>
                  </>
                )}
                {finished && (
                  <>
                    <i className="bi bi-flag-fill" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}></i>
                    <p className="fw-bold mt-1 mb-0" style={{ color: 'var(--color-text-dark)' }}>¡Carrera finalizada!</p>
                  </>
                )}
                {!running && !finished && (
                  <>
                    <i className="bi bi-flag" style={{ fontSize: '2rem', color: '#adb5bd' }}></i>
                    <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.85rem' }}>Presiona Play para iniciar</p>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <h6 className="font-heading fw-bold mb-2" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-list-ol me-1" style={{ color: 'var(--color-primary)' }}></i>Participantes
              </h6>
              <div className="d-flex flex-column gap-1" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {selectedHorses.map((name, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2" style={{ fontSize: '0.78rem' }}>
                    <span
                      className="font-mono fw-bold d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        backgroundColor: getColor(idx), color: '#fff', fontSize: '0.65rem',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-truncate">{name}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4" style={{ borderTop: '4px solid var(--color-primary)' }}>
        <Card.Body className="p-3">
          <div
            style={{
              width: '100%',
              maxWidth: `${TRACK_WIDTH}px`,
              height: `${trackHeight}px`,
              backgroundColor: '#f5f0e8',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid #d4c9b8',
              margin: '0 auto',
            }}
          >
            {selectedHorses.map((_, i) => (
              <div
                key={`lane-${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${i * LANE_HEIGHT + 8}px`,
                  height: `${LANE_HEIGHT}px`,
                  borderBottom: i < selectedHorses.length - 1 ? '1px dashed #c9bfb0' : 'none',
                }}
              />
            ))}

            {[0.25, 0.5, 0.75].map((pct) => (
              <div
                key={`mark-${pct}`}
                style={{
                  position: 'absolute',
                  left: `${pct * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: 'repeating-linear-gradient(to bottom, #bbb 0, #bbb 6px, transparent 6px, transparent 12px)',
                }}
              />
            ))}

            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                background: 'repeating-conic-gradient(#222 0% 25%, #fff 0% 50%) 0 0 / 6px 12px',
              }}
            />

            {selectedHorses.map((name, idx) => {
              const pos = positions[idx] || 0;
              const laneTop = idx * LANE_HEIGHT + 8 + (LANE_HEIGHT - 28) / 2;
              const color = getColor(idx);
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${pos}px`,
                    top: `${laneTop}px`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'left 0.8s ease-out',
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="fw-bold"
                    style={{
                      fontSize: '0.72rem',
                      color: '#333',
                      textShadow: '0 0 4px rgba(255,255,255,0.8)',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(255,255,255,0.85)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {finished && results.length > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderTop: '4px solid var(--color-secondary)' }}>
          <Card.Body className="p-4">
            <h4 className="font-heading fw-bold mb-3 text-center" style={{ color: 'var(--color-text-dark)' }}>
              <i className="bi bi-trophy-fill me-2" style={{ color: '#FFD700' }}></i>Resultados
            </h4>
            <div className="d-flex flex-column gap-2" style={{ maxWidth: '500px', margin: '0 auto' }}>
              {results.map((r, idx) => (
                <div
                  key={r.id}
                  className="d-flex align-items-center gap-3 p-2 rounded"
                  style={{
                    backgroundColor: idx < 3 ? `${MEDAL_COLORS[idx]}15` : 'transparent',
                    border: idx < 3 ? `1px solid ${MEDAL_COLORS[idx]}40` : '1px solid transparent',
                  }}
                >
                  <span
                    className="font-mono fw-bold d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: MEDAL_COLORS[idx] || '#6c757d',
                      color: idx < 3 ? '#000' : '#fff',
                      fontSize: '0.85rem',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="fw-semibold" style={{ color: 'var(--color-text-dark)' }}>
                    {selectedHorses[r.id]}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <Button variant="success" onClick={resetRace} style={{ borderRadius: '8px' }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Correr de nuevo
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default Simulador;
