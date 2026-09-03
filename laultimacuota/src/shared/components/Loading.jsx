import React from 'react';
import { Spinner } from 'react-bootstrap';

function Loading() {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '60vh' }}
    >
      <Spinner
        animation="border"
        variant="success"
        style={{ width: '3rem', height: '3rem', borderWidth: '0.3rem' }}
      />
      <p
        className="mt-3 fw-medium"
        style={{ color: 'var(--color-contrast-medium)' }}
      >
        Cargando...
      </p>
    </div>
  );
}

export default Loading;
