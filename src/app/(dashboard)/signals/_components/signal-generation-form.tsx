'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { generateSignalsAction } from '@/lib/actions';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bot, FileText, Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialState = {
  status: 'idle' as const,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Signals
        </>
      )}
    </Button>
  );
}

export function SignalGenerationForm() {
  const [state, formAction] = useFormState(generateSignalsAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Success!',
        description: state.message,
      });
    } else if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <form ref={formRef} action={formAction}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Configuration</CardTitle>
              <CardDescription>Select a dataset and a model to generate signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataset">Dataset</Label>
                <Select name="dataset" required>
                  <SelectTrigger id="dataset">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EURUSD_H1_2023">EURUSD_H1_2023</SelectItem>
                    <SelectItem value="BTCUSD_M5_2024_Q1">BTCUSD_M5_2024_Q1</SelectItem>
                    <SelectItem value="NASDAQ_Futures_H4">NASDAQ_Futures_H4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select name="model" required>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LSTM_v1.2">LSTM_v1.2</SelectItem>
                    <SelectItem value="CNN_GRU_v2.1">CNN_GRU_v2.1</SelectItem>
                    <SelectItem value="Transformer_v0.9">Transformer_v0.9</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </Card>
        </form>
      </div>

      <div className="lg:col-span-2">
        <Card className="min-h-[380px]">
          <CardHeader>
            <CardTitle className="font-headline">Generated Signals</CardTitle>
            <CardDescription>The output from the AI model will be displayed here.</CardDescription>
          </CardHeader>
          <CardContent>
            {state.status === 'idle' && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-full">
                    <Wand2 className="h-12 w-12 mb-4" />
                    <p className="font-semibold">Signals will appear here</p>
                    <p className="text-sm">Configure your generation settings and click "Generate Signals".</p>
                </div>
            )}
            
            {state.status === 'success' && state.data && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-headline flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Model Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-mono whitespace-pre-wrap">{state.data.modelStatistics}</p>
                        </CardContent>
                    </Card>

                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Signal</TableHead>
                            <TableHead className="text-right">Confidence</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {state.data.tradeSignals.map((signal, index) => (
                            <TableRow key={index}>
                            <TableCell className="font-medium">{signal.symbol}</TableCell>
                            <TableCell>
                                <Badge
                                variant={
                                    signal.signalType === 'BUY'
                                    ? 'default'
                                    : signal.signalType === 'SELL'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                >
                                {signal.signalType}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {(signal.confidence * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell>{new Date(signal.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {state.status === 'error' && state.message && (
                <Alert variant="destructive" className="h-full">
                    <Bot className="h-4 w-4" />
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>
                        {state.message}
                    </AlertDescription>
                </Alert>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
