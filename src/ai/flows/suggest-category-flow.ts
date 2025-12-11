'use server';
/**
 * @fileOverview Flujo de IA para sugerir una categoría de gasto.
 *
 * - suggestCategory: Una función que sugiere una categoría basada en la nota de un gasto.
 * - SuggestCategoryInput: El tipo de entrada para la función suggestCategory.
 * - SuggestCategoryOutput: El tipo de retorno para la función suggestCategory.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestCategoryInputSchema = z.object({
  note: z.string().describe('La nota o descripción del gasto.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z
    .enum(['Food', 'Transport', 'Clothing', 'Home', 'Other'])
    .describe('La categoría de gasto más probable.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(
  input: SuggestCategoryInput
): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: { schema: SuggestCategoryInputSchema },
  output: { schema: SuggestCategoryOutputSchema },
  prompt: `Eres un asistente de finanzas personales. Tu tarea es categorizar un gasto basándote en su descripción.

  Las categorías válidas son: 'Food', 'Transport', 'Clothing', 'Home', 'Other'.

  Analiza la siguiente nota de gasto y devuelve la categoría más apropiada. Si no estás seguro, usa 'Other'.

  Descripción del gasto: {{{note}}}`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    // Para evitar llamadas a la API para notas cortas o vacías
    if (!input.note || input.note.trim().length < 3) {
      return { category: 'Other' };
    }

    const { output } = await prompt(input);
    return output!;
  }
);
