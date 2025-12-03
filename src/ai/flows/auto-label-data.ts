'use server';

/**
 * @fileOverview An AI agent for automatically labeling financial time-series data.
 *
 * - autoLabelData - A function that handles the auto-labeling process.
 * - AutoLabelDataInput - The input type for the autoLabelData function.
 * - AutoLabelDataOutput - The return type for the autoLabelData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { LabeledPoint } from '@/lib/types';
import { UTCTimestamp } from 'lightweight-charts';

const LabeledPointSchema = z.object({
    id: z.string(),
    time: z.custom<UTCTimestamp>(),
    position: z.enum(['aboveBar', 'belowBar', 'inBar']),
    color: z.string(),
    shape: z.enum(['circle', 'square', 'arrowUp', 'arrowDown']),
    text: z.string(),
});

const AutoLabelDataInputSchema = z.object({
  csvData: z.string().describe('The raw financial time-series data in CSV format. Must contain columns: time,open,high,low,close'),
});
export type AutoLabelDataInput = z.infer<typeof AutoLabelDataInputSchema>;

const AutoLabelDataOutputSchema = z.array(LabeledPointSchema);
export type AutoLabelDataOutput = z.infer<typeof AutoLabelDataOutputSchema>;


export async function autoLabelData(input: AutoLabelDataInput): Promise<AutoLabelDataOutput> {
  return autoLabelDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoLabelDataPrompt',
  input: { schema: AutoLabelDataInputSchema },
  output: { schema: AutoLabelDataOutputSchema },
  prompt: `You are an expert financial technical analyst specializing in price action and smart money concepts.
Your task is to analyze the provided OHLCV data and identify key structural points.

Analyze the data and identify points for the following categories:
- 'BOS': Break of Structure. Identify significant swing highs or lows that are broken.
- 'CHOCH': Change of Character. Identify the first sign of a potential trend reversal, where a minor structure is broken against the trend.
- 'BUY': A potential buy entry point, often after a CHOCH or near a key support level.
- 'SELL': A potential sell entry point, often after a CHOCH or near a key resistance level.

For each point you identify, you must provide the following information in the output format:
- 'id': A unique ID string, like "point-1719543200". Use the timestamp in the ID.
- 'time': The exact UNIX timestamp (UTC) of the candle where the event occurs. This MUST match a timestamp from the input data.
- 'position': Place 'BOS', 'CHOCH', and 'SELL' markers 'aboveBar'. Place 'BUY' markers 'belowBar'.
- 'color': Use '#3b82f6' for 'BOS', '#f97316' for 'CHOCH', '#22c55e' for 'BUY', and '#ef4444' for 'SELL'.
- 'shape': Use 'circle' for 'BOS' and 'CHOCH'. Use 'arrowUp' for 'BUY' and 'arrowDown' for 'SELL'.
- 'text': The label of the point ('BOS', 'CHOCH', 'BUY', 'SELL').

Return an array of these labeled points. Ensure the 'time' for each point corresponds exactly to a time in the provided CSV data.

CSV Data:
{{{csvData}}}
`,
});

const autoLabelDataFlow = ai.defineFlow(
  {
    name: 'autoLabelDataFlow',
    inputSchema: AutoLabelDataInputSchema,
    outputSchema: AutoLabelDataOutputSchema,
  },
  async (input) => {
    console.log("Starting auto-labeling process...");
    const { output } = await prompt(input);
    if (!output) {
      console.error("Auto-labeling flow did not return a valid output.");
      return [];
    }
    console.log(`Auto-labeling complete. Found ${output.length} points.`);
    return output;
  }
);
