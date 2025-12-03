'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating trade signals using a pre-trained model.
 *
 * - generateTradeSignals - A function that generates trade signals from labeled data using a pre-trained model.
 * - GenerateTradeSignalsInput - The input type for the generateTradeSignals function.
 * - GenerateTradeSignalsOutput - The return type for the generateTradeSignals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTradeSignalsInputSchema = z.object({
  labeledData: z
    .string()
    .describe("The labeled data used to generate the trade signals.  Should be in a standard data format such as CSV."),
  modelName: z.string().describe('The name of the pre-trained model to use.'),
});
export type GenerateTradeSignalsInput = z.infer<typeof GenerateTradeSignalsInputSchema>;

const TradeSignalSchema = z.object({
  symbol: z.string().describe('The trading symbol (e.g., AAPL, GOOG).'),
  signalType: z.enum(['BUY', 'SELL', 'HOLD']).describe('The type of trade signal.'),
  confidence: z.number().describe('The confidence level of the signal (0-1).'),
  timestamp: z.string().describe('The timestamp of when the signal was generated (ISO format).'),
});

const GenerateTradeSignalsOutputSchema = z.object({
  tradeSignals: z.array(TradeSignalSchema).describe('An array of generated trade signals.'),
  modelStatistics: z.string().describe('Statistics about the model like accuracy, F1 score etc.'),
});
export type GenerateTradeSignalsOutput = z.infer<typeof GenerateTradeSignalsOutputSchema>;

export async function generateTradeSignals(input: GenerateTradeSignalsInput): Promise<GenerateTradeSignalsOutput> {
  return generateTradeSignalsFlow(input);
}

const generateTradeSignalsPrompt = ai.definePrompt({
  name: 'generateTradeSignalsPrompt',
  input: {schema: GenerateTradeSignalsInputSchema},
  output: {schema: GenerateTradeSignalsOutputSchema},
  prompt: `You are a financial expert tasked with generating trade signals based on labeled data and a pre-trained model.

You will receive labeled data and the name of a pre-trained model. Use this information to generate trade signals (BUY, SELL, or HOLD) with a confidence level for each signal.  Also return some statistics about the model, such as accuracy and F1 score.

Labeled Data: {{{labeledData}}}
Model Name: {{{modelName}}}`,
});

const generateTradeSignalsFlow = ai.defineFlow(
  {
    name: 'generateTradeSignalsFlow',
    inputSchema: GenerateTradeSignalsInputSchema,
    outputSchema: GenerateTradeSignalsOutputSchema,
  },
  async input => {
    const {output} = await generateTradeSignalsPrompt(input);
    return output!;
  }
);
