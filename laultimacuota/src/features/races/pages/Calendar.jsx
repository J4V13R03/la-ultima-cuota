import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, ButtonGroup, Form, InputGroup, Table, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/services/api';

const STATUS_LABELS = {
  programada: 'Programada',
  en_curso: 'En Curso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

const STATUS_COLORS = {
  programada: '#0d6efd',
  en_curso: '#fd7e14',
  finalizada: '#6c757d',
  cancelada: '#dc3545',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PAGE_SIZE = 10;

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDate(dateStr) {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function Calendar() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [listFilter, setListFilter] = useState('todas');
  const [listSort, setListSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [listPage, setListPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const response = await api.get('/api/races');
        if (response.data.success) setRaces(response.data.data.races);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchRaces();
    const interval = setInterval(fetchRaces, 10000);
    return () => clearInterval(interval);
  }, []);

  const racesByDate = useMemo(() => {
    const map = {};
    races.forEach((race) => {
      const d = new Date(race.fecha_programada);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(race);
    });
    return map;
  }, [races]);

  const filteredList = useMemo(() => {
    let result = [...races];
    if (listFilter !== 'todas') {
      result = result.filter((r) => r.estado === listFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => String(r.id).includes(q));
    }
    if (listSort === 'newest') {
      result.sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));
    } else {
      result.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));
    }
    return result;
  }, [races, listFilter, listSort, search]);

  const listTotalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginatedList = filteredList.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const goToToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

  const handleRaceClick = (race) => {
    if (race.estado === 'en_curso') navigate(`/carrera/${race.id}/simulacion`);
    else navigate(`/carrera/${race.id}`);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando...</span></div>
        <p className="mt-3 text-muted">Cargando carreras...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
        <h2 className="font-heading fw-bold mb-0" style={{ color: 'var(--color-text-dark)' }}>
          <i className="bi bi-calendar2-event me-2" style={{ color: 'var(--color-primary)' }}></i>Carreras
        </h2>
        <ButtonGroup>
          <Button
            variant={viewMode === 'calendar' ? 'success' : 'outline-secondary'}
            onClick={() => setViewMode('calendar')}
            style={{ fontWeight: 600, padding: '0.5rem 1.2rem' }}
          >
            <i className="bi bi-calendar3 me-1"></i>Calendario
          </Button>
          <Button
            variant={viewMode === 'list' ? 'success' : 'outline-secondary'}
            onClick={() => setViewMode('list')}
            style={{ fontWeight: 600, padding: '0.5rem 1.2rem' }}
          >
            <i className="bi bi-list-ul me-1"></i>Listado
          </Button>
        </ButtonGroup>
      </div>

      {viewMode === 'calendar' && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button variant="outline-secondary" size="sm" onClick={prevMonth} style={{ borderRadius: '8px' }}>
                <i className="bi bi-chevron-left"></i>
              </Button>
              <div className="d-flex align-items-center gap-3">
                <h4 className="font-heading fw-bold mb-0 text-capitalize" style={{ color: 'var(--color-text-dark)' }}>
                  {MONTHS_ES[currentMonth]} {currentYear}
                </h4>
                <Button variant="outline-success" size="sm" onClick={goToToday} style={{ borderRadius: '8px', fontSize: '0.8rem' }}>
                  Hoy
                </Button>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={nextMonth} style={{ borderRadius: '8px' }}>
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center fw-bold text-muted py-2" style={{ fontSize: '0.8rem', borderBottom: '2px solid #dee2e6' }}>
                  {day}
                </div>
              ))}

              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} style={{ minHeight: '90px', backgroundColor: '#fafafa', borderRadius: '4px' }}></div>;
                const key = `${currentYear}-${currentMonth}-${day}`;
                const dayRaces = racesByDate[key] || [];
                const isToday = isCurrentMonth && day === today.getDate();

                return (
                  <div
                    key={day}
                    onClick={() => dayRaces.length > 0 && setSelectedDay({ day, month: currentMonth, year: currentYear, races: dayRaces })}
                    style={{
                      minHeight: '90px',
                      padding: '4px',
                      border: isToday ? '2px solid var(--color-primary)' : '1px solid #e9ecef',
                      borderRadius: '4px',
                      backgroundColor: isToday ? 'rgba(21, 189, 15, 0.04)' : '#fff',
                      cursor: dayRaces.length > 0 ? 'pointer' : 'default',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span
                        className="fw-bold"
                        style={{ fontSize: '0.8rem', color: isToday ? 'var(--color-primary)' : '#495057' }}
                      >
                        {isToday ? (
                          <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '22px', height: '22px', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '0.7rem' }}>
                            {day}
                          </span>
                        ) : day}
                      </span>
                      {dayRaces.length > 0 && (
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>{dayRaces.length}</span>
                      )}
                    </div>
                    <div className="d-flex flex-column" style={{ gap: '2px' }}>
                      {dayRaces.slice(0, 3).map((race) => (
                        <div
                          key={race.id}
                          onClick={() => handleRaceClick(race)}
                          style={{
                            padding: '2px 5px',
                            borderRadius: '3px',
                            backgroundColor: STATUS_COLORS[race.estado],
                            color: '#fff',
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.4',
                          }}
                          title={`Carrera #${race.id}`}
                        >
                          #{race.id}
                        </div>
                      ))}
                      {dayRaces.length > 3 && (
                        <span className="text-muted text-center" style={{ fontSize: '0.6rem' }}>+{dayRaces.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      )}

      {viewMode === 'list' && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <Row className="mb-3 g-2 align-items-end">
              <Col xs="auto">
                <div className="d-flex gap-1 flex-wrap">
                  {['todas', 'programada', 'en_curso', 'finalizada'].map((f) => (
                    <Button
                      key={f}
                      variant={listFilter === f ? 'success' : 'outline-secondary'}
                      size="sm"
                      onClick={() => { setListFilter(f); setListPage(1); }}
                      style={{ borderRadius: '20px', fontWeight: 600, padding: '0.3rem 1rem', fontSize: '0.8rem' }}
                    >
                      {f === 'todas' ? 'Todas' : STATUS_LABELS[f]}
                    </Button>
                  ))}
                </div>
              </Col>
              <Col xs="auto">
                <Form.Select
                  size="sm"
                  value={listSort}
                  onChange={(e) => setListSort(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguas</option>
                </Form.Select>
              </Col>
              <Col md={3} sm={4} xs={5}>
                <InputGroup size="sm">
                  <InputGroup.Text style={{ borderRadius: '8px 0 0 8px' }}>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por ID..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setListPage(1); }}
                    style={{ borderRadius: '0 8px 8px 0' }}
                  />
                </InputGroup>
              </Col>
            </Row>

            {filteredList.length === 0 ? (
              <div className="text-center py-4 text-muted">No hay carreras con este filtro.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="fw-bold">ID</th>
                        <th className="fw-bold">Estado</th>
                        <th className="fw-bold">Fecha</th>
                        <th className="fw-bold">Hora</th>
                        <th className="fw-bold text-end">Cupo</th>
                        <th className="fw-bold text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedList.map((race) => (
                        <tr key={race.id} style={{ cursor: 'pointer' }} onClick={() => handleRaceClick(race)}>
                          <td className="font-mono fw-bold">#{race.id}</td>
                          <td>
                            <Badge
                              style={{
                                backgroundColor: STATUS_COLORS[race.estado],
                                color: '#fff',
                                fontSize: '0.7rem',
                                borderRadius: '10px',
                                padding: '3px 8px',
                              }}
                            >
                              {STATUS_LABELS[race.estado] || race.estado}
                            </Badge>
                          </td>
                          <td>{formatDate(race.fecha_programada)}</td>
                          <td className="font-mono">{formatTime(race.fecha_programada)}</td>
                          <td className="text-end font-mono fw-bold">{race.participantes_actuales ?? 0} / {race.cupo_maximo}</td>
                          <td className="text-center">
                            {race.estado === 'programada' && (
                              <Button variant="outline-primary" size="sm" style={{ borderRadius: '6px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); navigate(`/carrera/${race.id}`); }}>
                                Inscribir
                              </Button>
                            )}
                            {race.estado === 'en_curso' && (
                              <Button variant="outline-warning" size="sm" style={{ borderRadius: '6px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); navigate(`/carrera/${race.id}/simulacion`); }}>
                                Ver en vivo
                              </Button>
                            )}
                            {race.estado === 'finalizada' && (
                              <Button variant="outline-secondary" size="sm" style={{ borderRadius: '6px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); navigate(`/carrera/${race.id}`); }}>
                                Resultados
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {listTotalPages > 1 && (
                  <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                    <Button variant="outline-secondary" size="sm" disabled={listPage <= 1} onClick={() => setListPage(listPage - 1)} style={{ borderRadius: '8px' }}>
                      <i className="bi bi-chevron-left"></i>
                    </Button>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Página {listPage} de {listTotalPages}</span>
                    <Button variant="outline-secondary" size="sm" disabled={listPage >= listTotalPages} onClick={() => setListPage(listPage + 1)} style={{ borderRadius: '8px' }}>
                      <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={!!selectedDay} onHide={() => setSelectedDay(null)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <Modal.Title className="font-heading fw-bold">
            <i className="bi bi-calendar3 me-2" style={{ color: 'var(--color-primary)' }}></i>
            {selectedDay && `${selectedDay.day} de ${MONTHS_ES[selectedDay.month]} ${selectedDay.year}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {selectedDay?.races.length === 0 ? (
            <p className="text-muted text-center py-3">No hay carreras este día.</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {selectedDay?.races.map((race) => (
                <div
                  key={race.id}
                  className="d-flex align-items-center justify-content-between p-3 rounded"
                  style={{
                    border: `2px solid ${STATUS_COLORS[race.estado]}`,
                    backgroundColor: `${STATUS_COLORS[race.estado]}08`,
                    cursor: 'pointer',
                  }}
                  onClick={() => { setSelectedDay(null); handleRaceClick(race); }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className="font-mono fw-bold" style={{ fontSize: '1rem', color: 'var(--color-text-dark)' }}>
                      Carrera #{race.id}
                    </span>
                    <Badge style={{ backgroundColor: STATUS_COLORS[race.estado], color: '#fff', fontSize: '0.7rem', borderRadius: '10px', padding: '3px 10px' }}>
                      {STATUS_LABELS[race.estado]}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="font-mono text-muted" style={{ fontSize: '0.85rem' }}>
                      {formatTime(race.fecha_programada)}
                    </span>
                    <span className="font-mono fw-bold" style={{ fontSize: '0.85rem', color: 'var(--color-contrast-dark)' }}>
                      {race.participantes_actuales ?? 0}/{race.cupo_maximo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Calendar;
