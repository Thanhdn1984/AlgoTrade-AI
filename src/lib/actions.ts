'use server';

import {generateTradeSignals} from '@/ai/flows/generate-trade-signals';
import {z} from 'zod';
import { revalidatePath } from 'next/cache';
import type { Dataset, CandlestickChartData } from './types';
import type { UTCTimestamp } from 'lightweight-charts';


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
    .refine((file) => file.type === "text/csv", "Chỉ chấp nhận tệp CSV.")
});

type UploadState = {
    status: 'idle' | 'success' | 'error';
    message: string;
    newDataset?: Dataset | null;
    parsedData?: CandlestickChartData[] | null;
}

const parseCSV = (content: string): CandlestickChartData[] => {
    const rows = content.split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return [];

    const headers = rows.shift()!.split(/\s+|,/).map(h => h.trim().toLowerCase().replace(/[<>]/g, ''));

    const findIndexFlexible = (possibleNames: string[]) => {
      return headers.findIndex(header =>
        possibleNames.some(name => header.includes(name))
      );
    };

    const ohlcIndexes = {
        open: findIndexFlexible(['open']),
        high: findIndexFlexible(['high']),
        low: findIndexFlexible(['low']),
        close: findIndexFlexible(['close', 'last']),
        date: findIndexFlexible(['date']),
        time: findIndexFlexible(['time']),
    };
    
    if (ohlcIndexes.open === -1 || ohlcIndexes.high === -1 || ohlcIndexes.low === -1 || ohlcIndexes.close === -1 || (ohlcIndexes.date === -1 && ohlcIndexes.time === -1) ) {
        throw new Error(`Không tìm thấy các cột OHLC + Thời gian cần thiết. Cần: Open, High, Low, Close, Date/Time. Tìm thấy: ${headers.join(', ')}`);
    }
    
    return rows.map((row, index) => {
        const values = row.trim().split(/\s+/).filter(Boolean);
        
        try {
            const dateStr = ohlcIndexes.date !== -1 ? values[ohlcIndexes.date] : '';
            const timeStr = ohlcIndexes.time !== -1 ? values[ohlcIndexes.time] : '';
            
            const dateTimeString = `${dateStr.replace(/\./g, '-')} ${timeStr}`.trim();
            const date = new Date(dateTimeString);
            
            const timestamp = (date.getTime() / 1000) as UTCTimestamp;
            
            if (isNaN(timestamp)) {
                return null;
            }

            return {
                time: timestamp,
                open: parseFloat(values[ohlcIndexes.open]),
                high: parseFloat(values[ohlcIndexes.high]),
                low: parseFloat(values[ohlcIndexes.low]),
                close: parseFloat(values[ohlcIndexes.close]),
                raw: row,
                index,
            };
        } catch (e) {
            return null;
        }
    }).filter((point): point is CandlestickChartData => 
        point !== null && 
        !isNaN(point.open) && 
        !isNaN(point.high) && 
        !isNaN(point.low) && 
        !isNaN(point.close)
    ).sort((a, b) => a.time - b.time);
  };


export async function uploadFileAction(prevState: UploadState, formData: FormData): Promise<UploadState> {
    try {
        const file = formData.get('data-file') as File;
        const validatedFields = uploadFileSchema.safeParse({ file });

        if (!validatedFields.success) {
            return {
                status: 'error',
                message: validatedFields.error.flatten().fieldErrors.file?.[0] || "Dữ liệu không hợp lệ."
            }
        }
        
        const fileContent = await file.text();
        const parsedData = parseCSV(fileContent);

        if (parsedData.length === 0) {
            return {
                status: 'error',
                message: 'Phân tích tệp CSV thất bại. Vui lòng kiểm tra định dạng tệp.'
            }
        }
        
        console.log(`Đang "tải lên" tệp: ${file.name}, kích thước: ${file.size} bytes`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newDataset: Dataset = {
            id: `ds-${Date.now()}`,
            name: file.name.replace('.csv', ''),
            status: 'Raw',
            itemCount: parsedData.length,
            createdAt: new Date().toISOString().split('T')[0],
        };

        revalidatePath('/datasets');

        return {
            status: 'success',
            message: `Tệp "${file.name}" đã được tải lên và phân tích thành công.`,
            newDataset: newDataset,
            parsedData: parsedData,
        }

    } catch (error: any) {
        console.error(error);
        return {
            status: 'error',
            message: error.message || 'Không thể tải tệp lên. Đã xảy ra lỗi không mong muốn.'
        }
    }
}
