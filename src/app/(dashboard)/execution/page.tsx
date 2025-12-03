import { Bot, ShieldCheck, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ExecutionPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Bot className="h-10 w-10 text-primary" />
                </div>
            </div>
          <CardTitle className="text-2xl font-headline">Execution Service</CardTitle>
          <CardDescription>
            This service reads generated signals and executes trades via broker APIs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center">
              <ShieldCheck className="h-6 w-6 mr-3 text-green-500" />
              <div>
                <p className="font-semibold">Service Status</p>
                <p className="text-sm text-muted-foreground">All systems are operational.</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-500/20 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                Online
            </Badge>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
             <div className="flex items-center mb-2">
                <Terminal className="h-4 w-4 mr-2" />
                <h3 className="font-semibold text-sm">Service Details</h3>
             </div>
             <p className="text-sm text-muted-foreground">
                The execution service is a separate, secure backend application. It is responsible for risk checks, idempotency, and communicating with broker APIs like MT5/Exness. It operates independently from this user interface for maximum security and reliability.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
