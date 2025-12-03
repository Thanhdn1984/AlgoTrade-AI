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
  data: z.string().describe('The data to be labeled, likely in CSV or JSON format.'),
  modelDescription: z.string().describe('The description of the model used for labeling.'),
});
export type LabelTrainingDataInput = z.infer<typeof LabelTrainingDataInputSchema>;

// The output is simplified, as the main goal is to kick off a training process.
// The flow can be developed further to return complex training status.
const LabelTrainingDataOutputSchema = z.object({
  label: z.string().describe('A confirmation message or ID for the training job.'),
  confidence: z.number().describe('A confidence score, perhaps indicating the likelihood of training success.'),
});
export type LabelTrainingDataOutput = z.infer<typeof LabelTrainingDataOutputSchema>;

export async function labelTrainingData(input: LabelTrainingDataInput): Promise<LabelTrainingDataOutput> {
  return labelTrainingDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'labelTrainingDataPrompt',
  input: {schema: LabelTrainingDataInputSchema},
  output: {schema: LabelTrainingDataOutputSchema},
  prompt: `You are an AI model training coordinator. You have received a batch of labeled data to start a training process. 
  
Model Description: {{{modelDescription}}}
Data Provided: 
{{{data}}}

Acknowledge the receipt of the data and confirm that the training process will begin. Provide a job ID for tracking.`,
  config: {
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
    // In a real application, this is where you would trigger a complex,
    // asynchronous model training job on a service like Vertex AI.
    // For this demo, we'll just pass the data to the LLM to get a confirmation.
    console.log("Starting model training process with Genkit flow...");
    const {output} = await prompt(input);
    
    // We can augment the simple LLM output if needed.
    // For instance, let's ensure the confidence is high.
    if (!output) {
      throw new Error("The AI flow did not return a valid output.");
    }
    
    return {
        label: output.label || `Training job started: ${Date.now()}`,
        confidence: output.confidence || 0.99
    };
  }
);
