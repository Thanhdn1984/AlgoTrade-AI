import type { UTCTimestamp } from 'lightweight-charts';

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
