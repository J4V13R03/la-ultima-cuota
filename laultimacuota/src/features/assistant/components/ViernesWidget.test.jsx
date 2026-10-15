import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '../../../shared/context/ToastContext';
import { enviarMensaje } from '../services/assistantApi';
import ViernesWidget from './ViernesWidget';

jest.mock('../services/assistantApi', () => ({
  __esModule: true,
  enviarMensaje: jest.fn(),
}));

function renderWidget() {
  return render(
    <ToastProvider>
      <ViernesWidget />
    </ToastProvider>
  );
}

function abrirPanel() {
  fireEvent.click(screen.getByRole('button', { name: /hablar con viernes/i }));
}

function escribirYEnviar(texto) {
  const campo = screen.getByPlaceholderText(/escribe tu mensaje/i);
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' });
}

describe('ViernesWidget', () => {
  beforeEach(() => {
    enviarMensaje.mockReset();
  });

  test('muestra solo el boton cuando el panel esta cerrado', () => {
    renderWidget();
    expect(screen.getByRole('button', { name: /hablar con viernes/i })).toBeInTheDocument();
    expect(screen.queryByText('VIERNES')).not.toBeInTheDocument();
  });

  test('abre el panel con encabezado y saludo al pulsar el boton', () => {
    renderWidget();
    abrirPanel();
    expect(screen.getByText('VIERNES')).toBeInTheDocument();
    expect(screen.getByText(/hola, soy viernes/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/escribe tu mensaje/i)).toBeInTheDocument();
  });

  test('envia con Enter y muestra la respuesta del asistente', async () => {
    enviarMensaje.mockResolvedValue('La cuota se reparte segun el pozo');
    renderWidget();
    abrirPanel();
    escribirYEnviar('Como se calcula la cuota?');
    expect(await screen.findByText('Como se calcula la cuota?')).toBeInTheDocument();
    expect(await screen.findByText('La cuota se reparte segun el pozo')).toBeInTheDocument();
    expect(enviarMensaje).toHaveBeenCalledWith('Como se calcula la cuota?', [
      { role: 'assistant', content: expect.stringContaining('Hola, soy VIERNES') },
      { role: 'user', content: 'Como se calcula la cuota?' },
    ]);
  });

  test('no envia mensajes vacios', () => {
    renderWidget();
    abrirPanel();
    escribirYEnviar('   ');
    expect(enviarMensaje).not.toHaveBeenCalled();
  });

  test('ante 401 muestra error en linea sin cerrar el panel ni borrar la conversacion', async () => {
    const fallo = new Error('No autorizado');
    fallo.response = { status: 401, data: { success: false, error: 'Token invalido' } };
    enviarMensaje.mockRejectedValue(fallo);
    renderWidget();
    abrirPanel();
    escribirYEnviar('Hola');
    const alerta = await screen.findByTestId('viernes-error-linea');
    expect(alerta).toHaveTextContent(/sesi.n expir/i);
    expect(screen.getByText('VIERNES')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  test('ante 503 muestra mensaje amable con opcion de reintento', async () => {
    const fallo = new Error('Cuota agotada');
    fallo.response = { status: 503, data: { success: false, error: 'Servicio ocupado' } };
    enviarMensaje.mockRejectedValueOnce(fallo);
    enviarMensaje.mockResolvedValueOnce('Respuesta reintentada');
    renderWidget();
    abrirPanel();
    escribirYEnviar('Hola');
    const alerta = await screen.findByTestId('viernes-error-linea');
    expect(alerta).toHaveTextContent(/alto tr.fico/i);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText('Respuesta reintentada')).toBeInTheDocument();
    expect(enviarMensaje).toHaveBeenCalledTimes(2);
  });
});
