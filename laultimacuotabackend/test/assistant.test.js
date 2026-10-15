process.env.JWT_SECRET = 'test-secret-key';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}), { virtual: true });

const { GoogleGenAI } = require('@google/genai');
const assistantController = require('../src/controllers/assistantController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const mockGenerateContent = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  GoogleGenAI.mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  }));
  mockGenerateContent.mockResolvedValue({ text: 'Respuesta de prueba' });
});

describe('Assistant Controller', () => {
  describe('chatWithAssistant', () => {
    it('responde 400 cuando el mensaje esta vacio', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      const req = { body: { mensaje: '   ', historial: [] } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.any(String) })
      );
    });

    it('responde 400 cuando no hay mensaje', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      const req = { body: {} };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('responde 200 con la respuesta del modelo en caso de exito', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      const req = { body: { mensaje: 'Como apuesto?', historial: [] } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ respuesta: 'Respuesta de prueba' }),
        })
      );
    });

    it('recorta el historial a los ultimos 10 mensajes validos', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      const historial = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `mensaje ${i}`,
      }));
      historial.push({ role: 'sistema', content: 'ignorar' });
      const req = { body: { mensaje: 'Hola', historial } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents.length).toBeLessThanOrEqual(11);
      const roles = callArgs.contents.map((c) => c.role);
      expect(roles).not.toContain('assistant');
      expect(roles).not.toContain('sistema');
    });

    it('mapea el rol assistant a model para Gemini', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      const req = {
        body: {
          mensaje: 'Otra pregunta',
          historial: [
            { role: 'user', content: 'Hola' },
            { role: 'assistant', content: 'Hola, como ayudo?' },
          ],
        },
      };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const roles = callArgs.contents.map((c) => c.role);
      expect(roles).toContain('model');
      expect(roles).not.toContain('assistant');
      expect(callArgs.config.systemInstruction).toMatch(/Ultima Cuota/i);
    });

    it('usa el modelo de GEMINI_MODEL o gemini-3.8-flash por defecto', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      delete process.env.GEMINI_MODEL;
      const req = { body: { mensaje: 'Hola', historial: [] } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3.8-flash');

      jest.clearAllMocks();
      process.env.GEMINI_MODEL = 'gemini-3.8-flash';
      const req2 = { body: { mensaje: 'Hola', historial: [] } };
      const res2 = mockRes();

      await assistantController.chatWithAssistant(req2, res2);

      expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3.8-flash');
    });

    it('responde 503 cuando Gemini devuelve 429', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      const error429 = new Error('Cuota agotada');
      error429.status = 429;
      mockGenerateContent.mockRejectedValueOnce(error429);
      const req = { body: { mensaje: 'Hola', historial: [] } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.any(String) })
      );
    });

    it('responde 500 generico cuando falta GEMINI_API_KEY', async () => {
      delete process.env.GEMINI_API_KEY;
      const req = { body: { mensaje: 'Hola', historial: [] } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.any(String) })
      );
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('responde 500 generico ante error inesperado', async () => {
      process.env.GEMINI_API_KEY = 'clave-prueba';
      mockGenerateContent.mockRejectedValueOnce(new Error('Fallo interno'));
      const req = { body: { mensaje: 'Hola', historial: [] } };
      const res = mockRes();

      await assistantController.chatWithAssistant(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
});
