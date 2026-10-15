import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { useToast } from '../../../shared/context/ToastContext';
import { enviarMensaje } from '../services/assistantApi';

const SALUDO = 'Hola, soy VIERNES. Puedes preguntarme sobre cuotas, apuestas, gacha y las secciones del juego.';
const ERROR_SESION = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
const ERROR_OCUPADO = 'VIERNES tiene alto tráfico en este momento. Puedes reintentar en unos segundos.';
const ERROR_GENERICO = 'Ocurrió un error. Intenta nuevamente.';

function IconoCaballo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20c0-4 1.5-7 4-9l-1.5-2.5L9 7l1-3 3 2 4 3c1.5 2 2 5 2 8" />
      <path d="M4 20h7" />
      <circle cx="15.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9 12.5c1.5 1 4 1 5.5-0.5" />
    </svg>
  );
}

function ViernesWidget() {
  const showToast = useToast();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([{ role: 'assistant', content: SALUDO }]);
  const [entrada, setEntrada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [puedeReintentar, setPuedeReintentar] = useState(false);
  const [ultimoMensaje, setUltimoMensaje] = useState('');
  const listaRef = useRef(null);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, cargando, abierto]);

  async function publicar(texto) {
    const actualizados = [...mensajes, { role: 'user', content: texto }].slice(-10);
    setMensajes(actualizados);
    setCargando(true);
    setError(null);
    setPuedeReintentar(false);
    try {
      const respuesta = await enviarMensaje(texto, actualizados);
      setMensajes((prev) => [...prev, { role: 'assistant', content: respuesta }]);
    } catch (err) {
      const estado = err.response?.status;
      const detalle = err.response?.data?.error;
      if (estado === 401) {
        setError(ERROR_SESION);
        showToast(ERROR_SESION, 'error');
      } else if (estado === 503) {
        setError(ERROR_OCUPADO);
        setPuedeReintentar(true);
        setUltimoMensaje(texto);
        showToast(ERROR_OCUPADO, 'warning');
      } else {
        const mensaje = detalle || ERROR_GENERICO;
        setError(mensaje);
        showToast(mensaje, 'error');
      }
    } finally {
      setCargando(false);
    }
  }

  function handleEnviar() {
    const texto = entrada.trim();
    if (!texto || cargando) return;
    setEntrada('');
    publicar(texto);
  }

  function handleReintentar() {
    if (!ultimoMensaje || cargando) return;
    publicar(ultimoMensaje);
  }

  function handleTecla(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }

  if (!abierto) {
    return (
      <Button
        className="viernes-fab"
        onClick={() => setAbierto(true)}
        aria-label="Hablar con VIERNES"
        title="Hablar con VIERNES"
      >
        <IconoCaballo />
      </Button>
    );
  }

  return (
    <Card className="viernes-panel shadow-sm">
      <Card.Header className="viernes-panel-encabezado d-flex align-items-center justify-content-between">
        <div>
          <div className="fw-bold">VIERNES</div>
          <small className="viernes-panel-subtitulo">Asistente de La Última Cuota</small>
        </div>
        <Button
          variant="link"
          size="sm"
          className="text-white text-decoration-none"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar chat"
        >
          <i className="bi bi-x-lg"></i>
        </Button>
      </Card.Header>
      <Card.Body ref={listaRef} className="viernes-panel-lista">
        {mensajes.map((mensaje, i) => (
          <div
            key={i}
            className={`viernes-mensaje ${mensaje.role === 'user' ? 'viernes-mensaje-usuario' : 'viernes-mensaje-asistente'}`}
          >
            {mensaje.content}
          </div>
        ))}
        {cargando && (
          <div className="viernes-mensaje viernes-mensaje-asistente d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" role="status" />
            <span>VIERNES está escribiendo...</span>
          </div>
        )}
        {error && (
          <div className="viernes-error" role="alert" data-testid="viernes-error-linea">
            <div>{error}</div>
            {puedeReintentar && (
              <Button variant="outline-primary" size="sm" className="mt-2" onClick={handleReintentar} disabled={cargando}>
                Reintentar
              </Button>
            )}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="viernes-panel-pie">
        <Form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); handleEnviar(); }}>
          <Form.Control
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={handleTecla}
            placeholder="Escribe tu mensaje..."
            aria-label="Escribe tu mensaje"
            disabled={cargando}
          />
          <Button type="submit" disabled={cargando || !entrada.trim()} aria-label="Enviar mensaje">
            <i className="bi bi-send-fill"></i>
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
}

export default ViernesWidget;
