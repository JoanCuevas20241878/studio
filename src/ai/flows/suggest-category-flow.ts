'use server';

/**
 * @fileOverview A flow to suggest an expense category based on its description.
 *
 * - suggestCategory - A function that suggests a category for an expense.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  note: z.string().describe('The note or description of the expense.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestedCategorySchema = z.enum(['Food', 'Transport', 'Clothing', 'Home', 'Other']);

const SuggestCategoryOutputSchema = z.object({
  category: SuggestedCategorySchema.optional().describe(
    'The suggested category for the expense.'
  ),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;


export async function suggestCategory(
  input: SuggestCategoryInput
): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are an expert at categorizing expenses. Based on the expense note, suggest the most relevant category.
The available categories are: Food, Transport, Clothing, Home, Other.

Expense Note: {{{note}}}

Output the suggested category as a JSON object that conforms to the specified output schema. If no category seems relevant, you can omit it.`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    // If the note is too short, don't bother calling the AI.
    if (input.note.length < 3) {
      return { category: undefined };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
