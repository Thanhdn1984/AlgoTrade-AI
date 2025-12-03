// This file is empty in the original code.
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
