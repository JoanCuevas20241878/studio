'use client';
import { genkit, type GenkitErrorCode, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { nextjs } from '@genkit-ai/next';

// Define un manejador de errores personalizado para capturar y registrar errores de Genkit.
const handleError = (err: GenkitError) => {
  const anError = err as GenkitError<GenkitErrorCode>;
  console.error(
    `[Genkit Error] Código: ${anError.code}, Mensaje: ${anError.message}`,
    {
      stack: anError.stack,
      details: anError.details,
    }
  );
};

export const ai = genkit({
  plugins: [
    // Conecta Genkit con el proveedor de IA de Google (Gemini).
    googleAI(),
    // Integra Genkit con las rutas de API de Next.js para exponer los flujos de IA.
    nextjs(),
  ],
  // Habilita el registro en el entorno de desarrollo para facilitar la depuración.
  logLevel: 'debug',
  // Adjunta el manejador de errores global.
  errorHandler: handleError,
});
