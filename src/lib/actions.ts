"use server";

import { generateTradeSignals } from "@/ai/flows/generate-trade-signals";
import { z } from "zod";

const formSchema = z.object({
  dataset: z.string().min(1, "Vui lòng chọn một bộ dữ liệu."),
  model: z.string().min(1, "Vui lòng chọn một mô hình."),
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
        message: validatedFields.error.flatten().fieldErrors.dataset?.[0] || validatedFields.error.flatten().fieldErrors.model?.[0] || "Dữ liệu không hợp lệ.",
      };
    }
    
    // Ở đây, bạn thường sẽ tìm nạp nội dung bộ dữ liệu từ Cloud Storage
    // Đối với bản demo này, chúng tôi sẽ sử dụng một chuỗi giữ chỗ.
    const labeledData = `Date,Open,High,Low,Close,Volume,Label\n2023-01-01,150,152,149,151,100000,BUY`;

    const result = await generateTradeSignals({
      labeledData: labeledData,
      modelName: validatedFields.data.model,
    });
    
    if (result && result.tradeSignals) {
      return {
        status: "success",
        message: "Tạo tín hiệu thành công.",
        data: {
            tradeSignals: result.tradeSignals,
            modelStatistics: result.modelStatistics,
        }
      };
    } else {
       return { status: "error", message: "Tạo tín hiệu AI thất bại, không có kết quả hợp lệ." };
    }

  } catch (error) {
    console.error(error);
    return { status: "error", message: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại." };
  }
}
