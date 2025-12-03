'use server';

/**
 * @fileOverview An AI agent for automatically labeling financial time-series data.
 *
 * - autoLabelData - A function that handles the automatic data labeling process.
 * - AutoLabelDataInput - The input type for the autoLabelData function.
 * - AutoLabelDataOutput - The return type for the autoLabelData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { LabeledPoint } from '@/lib/types';


const AutoLabelDataInputSchema = z.object({
  rawData: z.string().describe('The raw time-series data in CSV format (Time,Open,High,Low,Close).'),
});
export type AutoLabelDataInput = z.infer<typeof AutoLabelDataInputSchema>;

const LabeledPointSchema = z.object({
    id: z.string(),
    time: z.number().describe("The UNIX timestamp (seconds) for the point."),
    position: z.enum(['aboveBar', 'belowBar', 'inBar']),
    color: z.string().describe("The color of the marker (e.g., '#22c55e')."),
    shape: z.enum(['circle', 'square', 'arrowUp', 'arrowDown']),
    text: z.string().describe("The label text (e.g., 'BOS', 'CHOCH', 'BUY').")
});

const AutoLabelDataOutputSchema = z.object({
  labeledPoints: z.array(LabeledPointSchema).describe('An array of automatically generated labels.'),
});
export type AutoLabelDataOutput = z.infer<typeof AutoLabelDataOutputSchema>;


export async function autoLabelData(input: AutoLabelDataInput): Promise<AutoLabelDataOutput> {
  return autoLabelDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoLabelDataPrompt',
  input: { schema: AutoLabelDataInputSchema },
  output: { schema: AutoLabelDataOutputSchema },
  prompt: `You are an expert technical analyst specializing in Smart Money Concepts (SMC) for financial markets. Your task is to analyze raw candlestick data (OHLC) and identify key structural points.

You will receive raw CSV data. Analyze it and identify points for 'BOS' (Break of Structure) and 'CHOCH' (Change of Character).

For each identified point, create a labeled point object with the following properties:
- id: A unique ID string, like 'point-autolabel-[timestamp]'.
- time: The exact UNIX timestamp (in seconds) of the candle where the event occurs.
- text: The label ('BOS' or 'CHOCH').
- position: Use 'aboveBar' for highs and 'belowBar' for lows.
- color: Use '#3b82f6' for 'BOS' and '#f97316' for 'CHOCH'.
- shape: Use 'circle' for both.

Analyze the entire dataset and return an array of all identified labeled points.

Raw Data:
{{{rawData}}}
`,
});

const autoLabelDataFlow = ai.defineFlow(
  {
    name: 'autoLabelDataFlow',
    inputSchema: AutoLabelDataInputSchema,
    outputSchema: AutoLabelDataOutputSchema,
  },
  async input => {
    console.log("Starting automatic data labeling with Genkit flow...");
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI flow for auto-labeling did not return a valid output.");
    }
    // Ensure IDs are unique as AI might not guarantee it.
    output.labeledPoints.forEach(p => {
        p.id = `point-autolabel-${p.time}-${Math.random()}`
    });
    return output;
  }
);
