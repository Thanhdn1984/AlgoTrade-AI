import { config } from 'dotenv';
config();

import '@/ai/flows/label-training-data.ts';
import '@/ai/flows/generate-trade-signals.ts';