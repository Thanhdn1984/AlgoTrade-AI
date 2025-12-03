// This file is empty in the original code.
"use server";

import { generateTradeSignals } from "@/ai/flows/generate-trade-signals";
import { z } from "zod";

const formSchema = z.object({
  dataset: z.string().min(1, "Please select a dataset."),
  model: z.string().min(1, "Please select a model."),
});

type State = {
  status: "success" | "error" | "idle";
  message?: string;
  data?: {
    tradeSignals: {
      symbol: string;
      signalType: "BUY" | "SELL" | "HOLD";
      confidence: number;
      timestamp: string;
    }[];
    modelStatistics: string;
  };
};

export async function generateSignalsAction(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const validatedFields = formSchema.safeParse({
      dataset: formData.get("dataset"),
      model: formData.get("model"),
    });

    if (!validatedFields.success) {
      return {
        status: "error",
        message: validatedFields.error.flatten().fieldErrors.dataset?.[0] || validatedFields.error.flatten().fieldErrors.model?.[0] || "Invalid input.",
      };
    }
    
    // Here you would typically fetch the dataset content from Cloud Storage
    // For this demo, we'll use a placeholder string.
    const labeledData = `Date,Open,High,Low,Close,Volume,Label\n2023-01-01,150,152,149,151,100000,BUY`;

    const result = await generateTradeSignals({
      labeledData: labeledData,
      modelName: validatedFields.data.model,
    });
    
    if (result && result.tradeSignals) {
      return {
        status: "success",
        message: "Signals generated successfully.",
        data: {
            tradeSignals: result.tradeSignals,
            modelStatistics: result.modelStatistics,
        }
      };
    } else {
       return { status: "error", message: "AI generation failed to produce valid signals." };
    }

  } catch (error) {
    console.error(error);
    return { status: "error", message: "An unexpected error occurred. Please try again." };
  }
}
