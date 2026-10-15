const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-3.8-flash';

const SYSTEM_INSTRUCTION = [
  'Eres VIERNES, el asistente de La Ultima Cuota, un simulador de apuestas hipicas.',
  'Explicas en espanol neutro como funcionan la inscripcion a carreras, las apuestas,',
  'la cuota pari-mutuel (cuota = pool_total / pool_caballo), la gacha de caballos por 300 CC',
  'y la recompensa diaria de 500 CC.',
  'Guias al usuario hacia las secciones Establo, Mercado, Calendario e Historial cuando corresponde.',
  'Nunca revelas estadisticas internas ocultas de caballos, datos de otros usuarios ni credenciales.',
  'Si te piden datos prohibidos, niegalos de forma amable sin exponer informacion.',
].join(' ');

const chatWithAssistant = async (req, res) => {
  try {
    const { mensaje, historial } = req.body || {};

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacio' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Assistant] Falta GEMINI_API_KEY');
      return res.status(500).json({ success: false, error: 'Falta GEMINI_API_KEY en backend (.env). Agrega GEMINI_API_KEY=tu_clave y GEMINI_MODEL=gemini-3.8-flash y reinicia el backend.' });
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    const lista = Array.isArray(historial) ? historial : [];
    const validos = lista.filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0
    );
    const recientes = validos.slice(-10);

    const contents = recientes.map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    }));
    contents.push({ role: 'user', parts: [{ text: mensaje.trim() }] });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const respuesta =
      typeof response.text === 'function' ? await response.text() : response.text;

    return res.json({ success: true, data: { respuesta: respuesta || '' } });
  } catch (err) {
    const modeloSeguro = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const status = err && (err.status || err.statusCode);
    const detalle = err && (err.message || err.error?.message || JSON.stringify(err).slice(0, 500));
    if (status === 429) {
      return res.status(503).json({
        success: false,
        error: 'El servicio esta ocupado (429 de Gemini). Intenta de nuevo en unos momentos. Detalle: ' + detalle,
      });
    }
    console.error('[Assistant] Error:', err && err.message ? err.message : err);
    return res.status(500).json({ success: false, error: 'Error Gemini modelo ' + modeloSeguro + ': ' + detalle });
  }
};

module.exports = { chatWithAssistant, SYSTEM_INSTRUCTION };
