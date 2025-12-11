import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Specify API version.
      apiVersion: 'v1beta',
    }),
  ],
});
