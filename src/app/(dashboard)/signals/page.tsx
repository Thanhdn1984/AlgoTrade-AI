import { SignalGenerationForm } from './_components/signal-generation-form';

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Generate Trade Signals</h1>
        <p className="text-muted-foreground">
            Use AI models to generate trade signals from your datasets.
        </p>
      </div>
      <SignalGenerationForm />
    </div>
  );
}
