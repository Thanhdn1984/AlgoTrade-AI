import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Upload } from "lucide-react";

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground">
          How to import data from external sources like MetaTrader 5 (MT5).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M13 13L18 18L13 23"/><path d="M18 18L23 13L18 8"/><path d="M18 18L8 18"/><path d="M11 11L6 6L11 1"/><path d="M6 6L1 11L6 16"/><path d="M6 6L16 6"/></svg>
            <CardTitle className="font-headline">Connecting to MetaTrader 5 (MT5)</CardTitle>
          </div>
          <CardDescription>
            Direct integration is not supported for security reasons. Follow these steps to import your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Step 1: Export Data from MT5</h3>
              <p className="text-sm text-muted-foreground">
                In your MT5 Terminal, go to the "Tools" menu and select "History Center". Choose the desired symbol and timeframe, then click "Export". Save the file in CSV format. Ensure the columns include at least Date, Open, High, Low, Close, and Volume.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Step 2: Upload CSV to AlgoTrade AI</h3>
              <p className="text-sm text-muted-foreground">
                Navigate to the "Datasets" page in this application. Use the "Upload Data" card to select and upload the CSV file you just exported from MT5.
              </p>
            </div>
          </div>

           <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Why this method?</h3>
              <p className="text-sm text-muted-foreground">
                This manual export-import process ensures the security of your trading account credentials. It keeps your live trading environment completely separate from this web-based analysis tool, which is the industry-standard best practice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
