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

const statusIcons = {
  Deployed: <CheckCircle className="h-4 w-4 text-green-500" />,
  Training: <Clock className="h-4 w-4 text-blue-500" />,
  Archived: <Archive className="h-4 w-4 text-muted-foreground" />,
};

export default function ModelsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Models</h1>
        <p className="text-muted-foreground">
            Monitor and manage your machine learning models.
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
                  {statusIcons[model.status]}
                  <span className="ml-1.5">{model.status}</span>
                </Badge>
              </div>
              <CardDescription>Version {model.version}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {model.status === 'Training' ? (
                <div>
                  <div className="flex justify-between mb-1">
                     <span className="text-sm font-medium">Training Progress</span>
                     <span className="text-sm font-medium text-muted-foreground">75%</span>
                  </div>
                  <Progress value={75} aria-label="Training progress" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Accuracy</p>
                    <p className="font-semibold text-lg">{model.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">F1 Score</p>
                    <p className="font-semibold text-lg">{model.f1Score || "N/A"}</p>
                  </div>
                </div>
              )}
               <div className="text-xs text-muted-foreground pt-2">
                 {model.status === 'Training' ? 'Epoch 15/20...' : `Last updated: ${new Date().toLocaleDateString()}`}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
