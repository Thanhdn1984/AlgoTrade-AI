import { SignalGenerationForm } from './_components/signal-generation-form';

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Tạo Tín hiệu Giao dịch</h1>
        <p className="text-muted-foreground">
            Sử dụng các mô hình AI để tạo tín hiệu giao dịch từ các bộ dữ liệu của bạn.
        </p>
      </div>
      <SignalGenerationForm />
    </div>
  );
}
