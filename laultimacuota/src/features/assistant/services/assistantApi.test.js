import api from '../../../shared/services/api';
import '@testing-library/jest-dom';
import { enviarMensaje } from './assistantApi';

jest.mock('../../../shared/services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

describe('assistantApi.enviarMensaje', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  test('publica mensaje e historial y devuelve la respuesta', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { respuesta: 'Hola, soy VIERNES' } } });
    const historial = [{ role: 'user', content: 'Que es la cuota?' }];
    const respuesta = await enviarMensaje('Que es la cuota?', historial);
    expect(api.post).toHaveBeenCalledWith('/api/assistant/chat', {
      mensaje: 'Que es la cuota?',
      historial,
    });
    expect(respuesta).toBe('Hola, soy VIERNES');
  });

  test('envia historial vacio por defecto y propaga el error original', async () => {
    const fallo = new Error('Fallo de red');
    fallo.response = { status: 500, data: { success: false, error: 'Error interno del servidor' } };
    api.post.mockRejectedValue(fallo);
    await expect(enviarMensaje('Hola')).rejects.toBe(fallo);
    expect(api.post).toHaveBeenCalledWith('/api/assistant/chat', { mensaje: 'Hola', historial: [] });
  });
});
