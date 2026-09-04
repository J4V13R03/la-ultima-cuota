import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { io } from 'socket.io-client';
import { useToast } from '../../../shared/context/ToastContext';
import RaceTrack from '../../../shared/components/RaceTrack';
import api from '../../../shared/services/api';

function RaceSimulation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [race, setRace] = useState(null);
  const [positions, setPositions] = useState({});
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState([]);
  const socketRef = useRef(null);

  const fetchRace = useCallback(async () => {
    try {
      const response = await api.get(`/api/races/${id}`);
      if (response.data.success) {
        const r = response.data.data.race;
        setRace(r);
        if (r.estado === 'finalizada') {
          setFinished(true);
          const resResponse = await api.get(`/api/races/${id}/results`);
          if (resResponse.data.success) setResults(resResponse.data.data.results);
        }
      }
    } catch {
      showToast('Error al cargar la carrera', 'error');
    }
  }, [id, showToast]);

  useEffect(() => { fetchRace(); }, [fetchRace]);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join_race', Number(id));
    socket.on('race_positions', (data) => {
      if (data.carrera_id === Number(id)) { setPositions(data.positions); }
    });
    socket.on('race_started', (data) => {
      if (data.carrera_id === Number(id)) { setFinished(false); fetchRace(); }
    });
    return () => {
      socket.emit('leave_race', Number(id));
      socket.off('race_positions');
      socket.off('race_started');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (race?.estado !== 'en_curso' || finished) return;
    const check = setInterval(async () => {
      try {
        const response = await api.get(`/api/races/${id}`);
        if (response.data.success && response.data.data.race.estado === 'finalizada') {
          setFinished(true);
          clearInterval(check);
          const resResponse = await api.get(`/api/races/${id}/results`);
          if (resResponse.data.success) setResults(resResponse.data.data.results);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race, id, finished]);

  const getHorseName = (caballoId) => {
    const insc = race?.inscripciones?.find((i) => i.caballo_id === caballoId);
    return insc?.caballo_nombre || `Caballo ${caballoId}`;
  };

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate(`/carrera/${id}`)} style={{ borderRadius: '8px' }}>
        <i className="bi bi-arrow-left me-1"></i>Volver
      </Button>

      <Card className="border-0 shadow-sm mb-4" style={{ borderTop: '4px solid var(--color-primary)' }}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="font-heading fw-bold mb-0" style={{ color: 'var(--color-text-dark)' }}>
              <i className="bi bi-broadcast me-2" style={{ color: 'var(--color-primary)' }}></i>
              Carrera #{id} — En Vivo
            </h4>
            <Badge
              bg={finished ? 'secondary' : 'warning'}
              style={{ fontSize: '1rem', padding: '0.5rem 1rem', borderRadius: '20px' }}
            >
              {finished ? 'Finalizada' : race?.estado === 'en_curso' ? 'En curso...' : 'Esperando...'}
            </Badge>
          </div>

          <RaceTrack inscriptions={race?.inscripciones || []} positions={positions} />
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
                  key={r.caballo_id || idx}
                  className="d-flex align-items-center gap-3 p-2 rounded"
                  style={{
                    backgroundColor: idx < 3 ? `rgba(${idx === 0 ? '255,215,0' : idx === 1 ? '192,192,192' : '205,127,50'},0.1)` : 'transparent',
                    border: idx < 3 ? `1px solid rgba(${idx === 0 ? '255,215,0' : idx === 1 ? '192,192,192' : '205,127,50'},0.3)` : '1px solid transparent',
                  }}
                >
                  <span
                    className="font-mono fw-bold d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#6c757d',
                      color: idx < 3 ? '#000' : '#fff', fontSize: '0.85rem', flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="fw-semibold" style={{ color: 'var(--color-text-dark)' }}>
                    {getHorseName(r.caballo_id)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <Button variant="primary" onClick={() => navigate(`/carrera/${id}`)} style={{ borderRadius: '8px' }}>
                Volver a la carrera
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default RaceSimulation;
