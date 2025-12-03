'use server';

/**
 * @fileOverview An AI agent for labeling training data using a model.
 *
 * - labelTrainingData - A function that handles the data labeling process.
 * - LabelTrainingDataInput - The input type for the labelTrainingData function.
 * - LabelTrainingDataOutput - The return type for the labelTrainingData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LabelTrainingDataInputSchema = z.object({
  data: z.string().describe('The data to be labeled.'),
  modelDescription: z.string().describe('The description of the model used for labeling.'),
});
export type LabelTrainingDataInput = z.infer<typeof LabelTrainingDataInputSchema>;

const LabelTrainingDataOutputSchema = z.object({
  label: z.string().describe('The predicted label for the data.'),
  confidence: z.number().describe('The confidence score of the predicted label.'),
});
export type LabelTrainingDataOutput = z.infer<typeof LabelTrainingDataOutputSchema>;

export async function labelTrainingData(input: LabelTrainingDataInput): Promise<LabelTrainingDataOutput> {
  return labelTrainingDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'labelTrainingDataPrompt',
  input: {schema: LabelTrainingDataInputSchema},
  output: {schema: LabelTrainingDataOutputSchema},
  prompt: `You are an expert data labeler. You are using the following model to help label the data:

Model Description: {{{modelDescription}}}

Based on the data provided, predict the appropriate label and a confidence score for your prediction.

Data: {{{data}}}`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  }
});

const labelTrainingDataFlow = ai.defineFlow(
  {
    name: 'labelTrainingDataFlow',
    inputSchema: LabelTrainingDataInputSchema,
    outputSchema: LabelTrainingDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
