'use server';

import {generateTradeSignals} from '@/ai/flows/generate-trade-signals';
import {z} from 'zod';
import { revalidatePath } from 'next/cache';

const generateSignalsSchema = z.object({
  dataset: z.string().min(1, 'Vui lòng chọn một bộ dữ liệu.'),
  model: z.string().min(1, 'Vui lòng chọn một mô hình.'),
});

type GenerateSignalsState = {
  status: 'success' | 'error' | 'idle';
  message?: string;
  data?: {
    tradeSignals: {
      symbol: string;
      signalType: 'BUY' | 'SELL' | 'HOLD';
      confidence: number;
      timestamp: string;
    }[];
    modelStatistics: string;
  };
};

export async function generateSignalsAction(
  prevState: GenerateSignalsState,
  formData: FormData
): Promise<GenerateSignalsState> {
  try {
    const validatedFields = generateSignalsSchema.safeParse({
      dataset: formData.get('dataset'),
      model: formData.get('model'),
    });

    if (!validatedFields.success) {
      return {
        status: 'error',
        message:
          validatedFields.error.flatten().fieldErrors.dataset?.[0] ||
          validatedFields.error.flatten().fieldErrors.model?.[0] ||
          'Dữ liệu không hợp lệ.',
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
        status: 'success',
        message: 'Tạo tín hiệu thành công.',
        data: {
          tradeSignals: result.tradeSignals,
          modelStatistics: result.modelStatistics,
        },
      };
    } else {
      return {
        status: 'error',
        message: 'Tạo tín hiệu AI thất bại, không có kết quả hợp lệ.',
      };
    }
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      message: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
    };
  }
}


// --- Action for File Upload ---
const uploadFileSchema = z.object({
  file: z
    .any()
    .refine((file) => file && file.size > 0, 'Vui lòng chọn một tệp.')
});

type UploadState = {
    status: 'idle' | 'success' | 'error';
    message: string;
}

export async function uploadFileAction(prevState: UploadState, formData: FormData): Promise<UploadState> {
    try {
        const validatedFields = uploadFileSchema.safeParse({
            file: formData.get('data-file'),
        });

        if (!validatedFields.success) {
            return {
                status: 'error',
                message: validatedFields.error.flatten().fieldErrors.file?.[0] || "Dữ liệu không hợp lệ."
            }
        }
        
        const file = formData.get('data-file') as File;

        // Trong một ứng dụng thực tế, bạn sẽ xử lý việc lưu tệp vào Cloud Storage ở đây.
        // Đối với mục đích demo, chúng tôi chỉ mô phỏng sự thành công.
        console.log(`Đang "tải lên" tệp: ${file.name}, kích thước: ${file.size} bytes`);
        
        // Giả lập độ trễ mạng
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        revalidatePath('/datasets');

        return {
            status: 'success',
            message: `Tệp "${file.name}" đã được tải lên thành công.`
        }

    } catch (error) {
        console.error(error);
        return {
            status: 'error',
            message: 'Không thể tải tệp lên. Đã xảy ra lỗi không mong muốn.'
        }
    }
}
