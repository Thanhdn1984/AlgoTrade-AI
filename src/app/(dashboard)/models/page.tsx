'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, CheckCircle, Clock, Archive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Model } from "@/lib/types";
import { useEffect, useState } from "react";

const models: Model[] = [
  {
    id: "m-001",
    name: "LSTM_v1.2",
    version: "1.2",
    status: "Deployed",
    accuracy: 92.5,
    f1Score: "0.91",
  },
  {
    id: "m-002",
    name: "CNN_GRU_v2.1",
    version: "2.1",
    status: "Training",
    accuracy: 88.0,
  },
  {
    id: "m-003",
    name: "Transformer_v0.9",
    version: "0.9",
    status: "Deployed",
    accuracy: 94.2,
    f1Score: "0.93",
  },
  {
    id: "m-004",
    name: "LSTM_v1.1",
    version: "1.1",
    status: "Archived",
    accuracy: 90.1,
    f1Score: "0.89",
  },
];

const statusDisplay: { [key: string]: string } = {
  Deployed: "Đã triển khai",
  Training: "Đang huấn luyện",
  Archived: "Lưu trữ",
};

const statusIcons = {
  Deployed: <CheckCircle className="h-4 w-4 text-green-500" />,
  Training: <Clock className="h-4 w-4 text-blue-500" />,
  Archived: <Archive className="h-4 w-4 text-muted-foreground" />,
};

function TrainingProgress({ model }: { model: Model }) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (model.status === 'Training') {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95;
          }
          return prev + 5;
        });
      }, 800);
      return () => clearInterval(timer);
    }
  }, [model.status]);

  if (model.status !== 'Training') return null;

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Tiến độ Huấn luyện</span>
        <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} aria-label="Tiến độ huấn luyện" />
      <div className="text-xs text-muted-foreground pt-2">
        Epoch {Math.floor(progress / 5)}/20...
      </div>
    </div>
  );
}

function DeployedModelInfo({ model }: { model: Model }) {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    // This now runs only on the client, preventing hydration mismatch.
    setLastUpdated(new Date().toLocaleDateString('vi-VN'));
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Độ chính xác</p>
          <p className="font-semibold text-lg">{model.accuracy}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Điểm F1</p>
          <p className="font-semibold text-lg">{model.f1Score || "K/C"}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground pt-2">
        Cập nhật lần cuối: {lastUpdated || '...'}
      </div>
    </>
  );
}


export default function ModelsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Mô hình</h1>
        <p className="text-muted-foreground">
            Theo dõi và quản lý các mô hình học máy của bạn.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card key={model.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline flex items-center">
                  <Cpu className="mr-2" />
                  {model.name}
                </CardTitle>
                <Badge variant={model.status === 'Deployed' ? 'default' : model.status === 'Training' ? 'secondary' : 'outline'}>
                  {statusIcons[model.status as keyof typeof statusIcons]}
                  <span className="ml-1.5">{statusDisplay[model.status]}</span>
                </Badge>
              </div>
              <CardDescription>Phiên bản {model.version}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {model.status === 'Training' ? (
                <TrainingProgress model={model} />
              ) : model.status === 'Archived' ? (
                 <div className="text-sm text-muted-foreground">Mô hình này đã được lưu trữ.</div>
              ) : (
                <DeployedModelInfo model={model} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
