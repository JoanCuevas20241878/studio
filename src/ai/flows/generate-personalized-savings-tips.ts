'use server';
/**
 * @fileOverview Flujo de IA para generar consejos de ahorro personalizados.
 *
 * - generatePersonalizedSavingsTips: Genera alertas y recomendaciones basadas en el presupuesto y los gastos del usuario.
 * - SavingsTipsInput: El tipo de entrada para la funciÃ³n.
 * - SavingsTipsOutput: El tipo de retorno para la funciÃ³n.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// RÃ©plica del esquema de Zod para Expense, pero sin los objetos de Firebase como Timestamp
const ExpenseSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  amount: z.number(),
  category: z.enum(['Food', 'Transport', 'Clothing', 'Home', 'Other']),
  note: z.string(),
  date: z.string(), // Se espera un string ISO, no un objeto Timestamp.
});

const BudgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  month: z.string(),
  limit: z.number(),
});

const SavingsTipsInputSchema = z.object({
  budget: BudgetSchema,
  expenses: z.array(ExpenseSchema),
  locale: z.enum(['en', 'es']).default('en'),
});
export type SavingsTipsInput = z.infer<typeof SavingsTipsInputSchema>;

const SavingsTipsOutputSchema = z.object({
  alerts: z
    .array(z.string())
    .describe('Alertas sobre gastos excesivos o Ã¡reas problemÃ¡ticas.'),
  recommendations: z
    .array(z.string())
    .describe('Recomendaciones prÃ¡cticas para ahorrar dinero.'),
});
export type SavingsTipsOutput = z.infer<typeof SavingsTipsOutputSchema>;

// La envoltura ya no necesita transformar los datos, ya que se hace en el cliente.
export async function generatePersonalizedSavingsTips(
  input: SavingsTipsInput
): Promise<SavingsTipsOutput> {
  return personalizedSavingsTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedSavingsTipsPrompt',
  input: { schema: SavingsTipsInputSchema },
  output: { schema: SavingsTipsOutputSchema },
  prompt: `Eres 'SmartExpense AI', un asesor financiero experto. Tu tarea es analizar los datos de gastos de un usuario para el mes actual y proporcionar consejos de ahorro personalizados en el idioma solicitado ({{{locale}}}).

  **Contexto:**
  - Presupuesto del mes: {{{budget.limit}}}
  - Gastos registrados: {{{JSON anidado expenses}}}

  **Instrucciones:**
  1.  **Analiza los Gastos:** Compara el gasto total con el lÃ­mite del presupuesto. Identifica las categorÃ­as con mayores gastos. Busca gastos inusuales o elevados.
  2.  **Genera Alertas (Campo 'alerts'):**
      - Si el gasto total supera el 85% del presupuesto, crea una alerta.
      - Si el gasto en una sola categorÃ­a (p. ej., 'Comida') representa mÃ¡s del 50% del gasto total, crea una alerta sobre la concentraciÃ³n de gastos.
      - Si no hay problemas significativos, devuelve un array vacÃ­o.
  3.  **Genera Recomendaciones (Campo 'recommendations'):**
      - Ofrece 2-3 consejos prÃ¡cticos y accionables basados en los hÃ¡bitos de gasto.
      - Si gastan mucho en 'Comida', sugiere planificar comidas o buscar descuentos.
      - Si gastan mucho en 'Transporte', sugiere alternativas como el transporte pÃºblico o compartir coche.
      - Si los gastos son bajos y estÃ¡n dentro del presupuesto, felicita al usuario y ofrÃ©cele un consejo general de ahorro, como "considera invertir una pequeÃ±a parte de lo que has ahorrado".
      - Las recomendaciones deben ser positivas y alentadoras.

  **Formato de Salida:**
  - Responde estrictamente con el objeto JSON definido en el esquema de salida.
  - El lenguaje de las alertas y recomendaciones debe ser: {{{locale}}}.
  - Los consejos deben ser breves y fÃ¡ciles de entender.`,
});

const personalizedSavingsTipsFlow = ai.defineFlow(
  {
    name: 'personalizedSavingsTipsFlow',
    inputSchema: SavingsTipsInputSchema,
    outputSchema: SavingsTipsOutputSchema,
  },
  async input => {
    // ValidaciÃ³n: no generar si no hay datos suficientes
    if (!input.budget || !input.expenses || input.expenses.length === 0) {
      return {
        alerts: [],
        recommendations: [
          input.locale === 'es'
            ? 'AÃ±ade mÃ¡s gastos para obtener un anÃ¡lisis detallado.'
            : 'Add more expenses to get a detailed analysis.',
        ],
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
