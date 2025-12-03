import type { UTCTimestamp, PriceLineOptions, SeriesMarker } from 'lightweight-charts';

export type TradeSignal = {
  symbol: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: string;
  status: 'Pending' | 'Executed' | 'Failed';
};

export type Model = {
  id: string;
  name: string;
  version: string;
  status: 'Training' | 'Deployed' | 'Archived';
  accuracy?: number;
  f1Score?: string;
};

export type Dataset = {
  id: string;
  name: string;
  status: 'Raw' | 'Processing' | 'Labeled';
  itemCount: number;
  createdAt: string;
};

export type CandlestickChartData = {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    raw: string;
    index: number;
};

export type LabeledPoint = SeriesMarker<UTCTimestamp> & {
    id: string;
    time: UTCTimestamp;
    text: string;
}

export type LabelType = 'BUY' | 'SELL' | 'HOLD';
export type LineLabelType = 'BOS' | 'CHOCH';
export type AnnotationType = LabelType | LineLabelType;


export interface CustomPriceLineOptions extends PriceLineOptions {
    annotationType: LineLabelType;
    time: UTCTimestamp;
}
