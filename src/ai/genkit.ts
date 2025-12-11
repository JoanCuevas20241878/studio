import { genkit, type GenkitErrorCode, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { next } from '@genkit-ai/next';

// Define un manejador de errores personalizado para capturar y registrar errores de Genkit.
const handleError = (err: GenkitError) => {
  const anError = err as GenkitError<GenkitErrorCode>;
  console.error(
    `[Genkit Error] CÃ³digo: ${anError.code}, Mensaje: ${anError.message}`,
    {
      stack: anError.stack,
      details: anError.details,
    }
  );
};

export const ai = genkit({
  plugins: [
    // Conecta Genkit con el proveedor de IA de Google (Gemini).
    googleAI({
      // Usar 'gemini-pro' es una opciÃ³n segura y estÃ¡ndar.
      // Genkit lo resolverÃ¡ al modelo especÃ­fico mÃ¡s reciente.
      model: 'gemini-pro',
    }),
    // Integra Genkit con las rutas de API de Next.js para exponer los flujos de IA.
    next({
      // La opciÃ³n 'force-edge-runtime' ya no es necesaria y se elimina.
    }),
  ],
  // Habilita el registro en el entorno de desarrollo para facilitar la depuraciÃ³n.
  logLevel: 'debug',
  // Adjunta el manejador de errores global.
  errorHandler: handleError,
});
