import api from '../../../shared/services/api';

export async function enviarMensaje(mensaje, historial = []) {
  const response = await api.post('/api/assistant/chat', { mensaje, historial });
  return response.data.data.respuesta;
}

const assistantApi = { enviarMensaje };

export default assistantApi;
