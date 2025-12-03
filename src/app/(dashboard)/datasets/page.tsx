'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownToLine,
  FileUp,
  ListFilter,
  Loader2,
  MoreHorizontal,
  Circle,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Dataset, CandlestickChartData } from "@/lib/types";
import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from 'react-dom';
import { uploadFileAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType } from 'lightweight-charts';
import { useTheme } from "next-themes";


// --- Data Types ---
type ParsedData = { [key: string]: CandlestickChartData[] };


// --- Components for Upload ---

type UploadState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  newDataset?: Dataset | null;
  parsedData?: CandlestickChartData[] | null;
}

const initialState: UploadState = { status: 'idle', message: '' };

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" variant="outline" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải lên...
        </>
      ) : (
        <>
          <FileUp className="mr-2 h-4 w-4" /> Tải lên
        </>
      )}
    </Button>
  );
}

function UploadCard({ onUploadSuccess }: { onUploadSuccess: (newDataset: Dataset, parsedData: CandlestickChartData[]) => void }) {
  const [state, formAction] = useActionState(uploadFileAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const lastProcessedId = useRef<string | null>(null);

  useEffect(() => {
    // Ensure we only process a successful upload once
    if (state.status === 'success' && state.newDataset && state.parsedData && state.newDataset.id !== lastProcessedId.current) {
        toast({
          title: 'Thành công!',
          description: state.message,
        });
        onUploadSuccess(state.newDataset, state.parsedData);
        formRef.current?.reset();
        lastProcessedId.current = state.newDataset.id; // Mark as processed
    } else if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: state.message,
      });
      lastProcessedId.current = null; // Reset on error
    }
  }, [state, toast, onUploadSuccess]);

  return (
    <Card>
      <form ref={formRef} action={formAction}>
        <CardHeader>
          <CardTitle className="font-headline">Tải lên Dữ liệu</CardTitle>
          <CardDescription>
            Tải lên tệp CSV mới để tạo một bộ dữ liệu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="data-file">Tệp CSV</Label>
            <Input id="data-file" name="data-file" type="file" required accept=".csv" />
          </div>
        </CardContent>
        <CardFooter>
          <UploadButton />
        </CardFooter>
      </form>
    </Card>
  );
}

// --- Candlestick Chart Component ---
function CandlestickChart({ data, currentIndex }: { data: CandlestickChartData[], currentIndex: number }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesApiRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const isDark = theme === 'dark';

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#D1D5DB' : '#1F2937',
      },
      grid: {
        vertLines: { color: isDark ? '#374151' : '#E5E7EB' },
        horzLines: { color: isDark ? '#374151' : '#E5E7EB' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    };

    if (!chartApiRef.current) {
        const chart = createChart(chartContainerRef.current, {
            ...chartOptions,
            width: chartContainerRef.current.clientWidth,
            height: 500,
        });
        chartApiRef.current = chart;
        seriesApiRef.current = chart.addCandlestickSeries({
            upColor: '#22c55e', // green-500
            downColor: '#ef4444', // red-500
            borderDownColor: '#ef4444',
            borderUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            wickUpColor: '#22c55e',
        });
    } else {
        chartApiRef.current.applyOptions(chartOptions);
    }
    

    seriesApiRef.current?.setData(data);

    const handleResize = () => {
      chartApiRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);
    
    if (data[currentIndex]) {
      chartApiRef.current?.timeScale().scrollToPosition(currentIndex - (data.length > 50 ? 25 : 0), false);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, [data, theme]);
  
  useEffect(() => {
    const currentPoint = data[currentIndex];
     if (seriesApiRef.current && currentPoint) {
        seriesApiRef.current.setMarkers([
            {
                time: currentPoint.time,
                position: 'aboveBar',
                color: theme === 'dark' ? '#A78BFA' : '#6D28D9', // primary colors
                shape: 'arrowDown',
                text: `Điểm ${currentIndex + 1}`
            }
        ]);
     }
  }, [currentIndex, data, theme]);


  return <div ref={chartContainerRef} className="w-full h-[500px]" />;
}


// --- Main Page Component ---

const statusDisplay: { [key: string]: string } = {
  Labeled: "Đã gán nhãn",
  Processing: "Đang xử lý",
  Raw: "Thô",
};


export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData>({});
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAddDataset = (newDataset: Dataset, newParsedData: CandlestickChartData[]) => {
    setDatasets(prev => {
        // Prevent adding duplicate datasets if the action state is triggered multiple times
        if (prev.find(d => d.id === newDataset.id)) {
            return prev;
        }
        return [...prev, newDataset];
    });
    setParsedData(prev => ({
        ...prev,
        [newDataset.id]: newParsedData,
    }));
  };

  const handleDeleteDataset = (datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
    setParsedData(prev => {
        const newParsedData = { ...prev };
        delete newParsedData[datasetId];
        return newParsedData;
    });
    if (activeDataset?.id === datasetId) {
        setActiveDataset(null);
    }
  };


  const fullChartData = activeDataset ? parsedData[activeDataset.id] || [] : [];
  const currentDataPoint = fullChartData[currentIndex];


  const handleSetDataset = (dataset: Dataset) => {
    if (dataset.status !== 'Processing') {
        setActiveDataset(dataset);
        setCurrentIndex(0);
    }
  }

  const handleNext = () => {
    if (activeDataset && currentIndex < (parsedData[activeDataset.id]?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };


  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="labeled">Đã gán nhãn</TabsTrigger>
          <TabsTrigger value="raw">Thô</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Lọc
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Lọc theo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Trạng thái</DropdownMenuItem>
              <DropdownMenuItem>Ngày</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-7 gap-1">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Xuất
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
           <div className="lg:col-span-2">
               <Card>
              <CardHeader>
                <CardTitle className="font-headline">Bộ dữ liệu</CardTitle>
                <CardDescription>
                  Quản lý các bộ dữ liệu của bạn để huấn luyện và phân tích.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Số mục</TableHead>
                      <TableHead className="text-right">Ngày tạo</TableHead>
                      <TableHead>
                        <span className="sr-only">Hành động</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Chưa có bộ dữ liệu nào. Tải lên một tệp để bắt đầu.
                            </TableCell>
                        </TableRow>
                    ) : (
                        datasets.map((dataset) => (
                          <TableRow 
                            key={dataset.id}
                            onClick={() => handleSetDataset(dataset)}
                            className={cn(
                                "cursor-pointer",
                                activeDataset?.id === dataset.id && "bg-muted/50",
                                dataset.status === "Processing" && "cursor-not-allowed opacity-50"
                            )}
                          >
                            <TableCell className="font-medium">
                              {dataset.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  dataset.status === "Labeled"
                                    ? "default"
                                    : dataset.status === "Processing"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {statusDisplay[dataset.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {dataset.itemCount.toLocaleString('vi-VN')}
                            </TableCell>
                            <TableCell className="text-right">
                              {dataset.createdAt}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Mở menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                  <DropdownMenuItem disabled={dataset.status === 'Processing'} onSelect={(e) => { e.preventDefault(); handleSetDataset(dataset); }}>Gán nhãn</DropdownMenuItem>
                                  <DropdownMenuItem>Gán nhãn tự động</DropdownMenuItem>
                                  <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onSelect={(e) => { e.preventDefault(); handleDeleteDataset(dataset.id); }}
                                  >
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
           </div>
           <div className="lg:col-span-1">
                <UploadCard onUploadSuccess={handleAddDataset} />
           </div>
        </div>
         <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Gán nhãn Thủ công</CardTitle>
                <CardDescription>
                    {activeDataset ? `Đang gán nhãn cho: ${activeDataset.name}` : "Chọn một bộ dữ liệu từ bảng trên để bắt đầu"}
                </CardDescription>
                </CardHeader>
                <CardContent>
                {activeDataset && fullChartData.length > 0 ? (
                    <div className="flex flex-col items-center">
                        <CandlestickChart data={fullChartData} currentIndex={currentIndex} />
                        <div className="text-sm text-muted-foreground mt-4 text-center">
                            <p>
                                Điểm {currentIndex + 1} / {fullChartData.length}
                            </p>
                             {currentDataPoint && <p className="font-mono text-xs truncate" title={currentDataPoint.raw}>
                                {currentDataPoint.raw}
                            </p>}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[500px] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>Vui lòng chọn một bộ dữ liệu <br/> có thể gán nhãn (Thô hoặc Đã gán nhãn).</p>
                    </div>
                )}
                </CardContent>
                <CardFooter className="flex justify-between items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0 || !activeDataset}>
                    <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex justify-center gap-2">
                    <Button variant="outline" size="lg" className="h-12 w-20 border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-600 flex-col" disabled={!activeDataset}>
                        <ArrowUp className="h-5 w-5" />
                        <span className="text-xs">Mua</span>
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 w-20 flex-col" disabled={!activeDataset}>
                        <Circle className="h-5 w-5" />
                        <span className="text-xs">Giữ</span>
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 w-20 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 flex-col" disabled={!activeDataset}>
                        <ArrowDown className="h-5 w-5" />
                        <span className="text-xs">Bán</span>
                    </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNext} disabled={!activeDataset || currentIndex >= fullChartData.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
