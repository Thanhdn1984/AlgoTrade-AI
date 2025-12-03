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
  Loader2,
  MoreHorizontal,
  Circle,
  ArrowUp,
  ArrowDown,
  LineChart as LineChartIcon,
  Ruler,
  Cpu,
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
import type { Dataset, CandlestickChartData, AnnotationType, LabeledPoint, FirebaseDataset } from "@/lib/types";
import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import { useActionState } from 'react';
import { uploadFileAction, trainModelAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, type MouseEventParams, CrosshairMode, type SeriesMarker } from 'lightweight-charts';
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

// --- Data Types ---
type ParsedData = { [key: string]: CandlestickChartData[] };

// --- Components for Upload ---

type UploadState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  newDataset?: Omit<Dataset, 'id'> | null;
  parsedData?: CandlestickChartData[] | null;
}

const initialUploadState: UploadState = { status: 'idle', message: '' };

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
  
  import { useFormStatus } from 'react-dom';
  
  function UploadCard({ onUploadSuccess }: { onUploadSuccess: (newDataset: Omit<Dataset, 'id'>, parsedData: CandlestickChartData[]) => void }) {
    const [state, formAction] = useActionState(uploadFileAction, initialUploadState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const lastProcessedId = useRef<string | null>(null);
  
    useEffect(() => {
      // Use message as a pseudo-ID to prevent re-triggering on re-renders
      const processingId = state.message;

      if (state.status === 'success' && state.newDataset && state.parsedData && processingId !== lastProcessedId.current) {
          toast({
            title: 'Thành công!',
            description: state.message,
          });
          onUploadSuccess(state.newDataset, state.parsedData);
          formRef.current?.reset();
          lastProcessedId.current = processingId; 
      } else if (state.status === 'error' && processingId !== lastProcessedId.current) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: state.message,
        });
        lastProcessedId.current = processingId;
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


// --- Training Component ---
const initialTrainState: TrainModelState = { status: 'idle', message: '' };

type TrainModelState = {
    status: 'idle' | 'success' | 'error';
    message: string;
};

function TrainModelCard({ activeDataset, labeledPoints }: { 
    activeDataset: Dataset | null;
    labeledPoints: LabeledPoint[];
}) {
    const [state, formAction] = useActionState(trainModelAction, initialTrainState);
    const { pending } = useFormStatus();
    const { toast } = useToast();

    useEffect(() => {
        if (state.status === 'success') {
            toast({ title: 'Thành công', description: state.message });
        } else if (state.status === 'error') {
            toast({ variant: 'destructive', title: 'Lỗi', description: state.message });
        }
    }, [state, toast]);


    const handleTrain = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeDataset) return;

        const points = labeledPoints || [];
        const labeledData = [
            'type,time,price,text', // header
            ...points.map(p => `POINT,${p.time},${p.position === 'aboveBar' ? 'high' : 'low'},${p.text}`),
        ].join('\n');
        
        const formData = new FormData();
        formData.append('datasetId', activeDataset.id);
        formData.append('labeledDataCSV', labeledData);
        
        formAction(formData);
    };

    return (
        <Card>
            <form onSubmit={handleTrain}>
                <CardHeader>
                    <CardTitle className="font-headline">Huấn luyện Mô hình</CardTitle>
                    <CardDescription>Sử dụng dữ liệu đã gán nhãn để dạy cho AI.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {activeDataset ? `Sẵn sàng huấn luyện với bộ dữ liệu "${activeDataset.name}".` : "Vui lòng chọn một bộ dữ liệu."}
                    </p>
                     {activeDataset && (
                        <div className="text-xs mt-2 text-muted-foreground">
                            <p>Điểm dữ liệu: {labeledPoints.length}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={pending || !activeDataset || labeledPoints.length === 0}
                    >
                         {pending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang huấn luyện...
                          </>
                        ) : (
                          <>
                            <Cpu className="mr-2 h-4 w-4" /> Huấn luyện Mô hình
                          </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

// --- Chart Component ---
interface CandlestickChartProps {
  data: CandlestickChartData[];
  markers: SeriesMarker<UTCTimestamp>[];
  onChartClick: (params: MouseEventParams) => void;
  onCrosshairMove: (params: MouseEventParams) => void;
}

const CandlestickChart = memo(({ data, markers, onChartClick, onCrosshairMove }: CandlestickChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartApiRef = useRef<{ chart: IChartApi, series: ISeriesApi<'Candlestick'> } | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        const isDark = theme === 'dark';
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: isDark ? '#19191f' : '#ffffff' },
                textColor: isDark ? '#D1D5DB' : '#1F2937',
            },
            grid: {
                vertLines: { color: isDark ? '#374151' : '#E5E7EB' },
                horzLines: { color: isDark ? '#374151' : '#E5E7EB' },
            },
            timeScale: { timeVisible: true, secondsVisible: false },
            crosshair: { mode: CrosshairMode.Normal },
            width: chartContainerRef.current.clientWidth,
            height: 500,
        });

        const series = chart.addCandlestickSeries({
            upColor: '#22c55e', downColor: '#ef4444',
            borderDownColor: '#ef4444', borderUpColor: '#22c55e',
            wickDownColor: '#ef4444', wickUpColor: '#22c55e',
        });
        
        chartApiRef.current = { chart, series };

        chart.subscribeClick(onChartClick);
        chart.subscribeCrosshairMove(onCrosshairMove);
        
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.unsubscribeClick(onChartClick);
            chart.unsubscribeCrosshairMove(onCrosshairMove);
            chart.remove();
            chartApiRef.current = null;
        };
    }, [theme, onChartClick, onCrosshairMove]); 

    useEffect(() => {
        if (chartApiRef.current?.series) {
            chartApiRef.current.series.setData(data);
            if(data.length > 0) {
                 chartApiRef.current.chart.timeScale().fitContent();
            }
        }
    }, [data]);

    useEffect(() => {
        if (chartApiRef.current?.series) {
            chartApiRef.current.series.setMarkers(markers);
        }
    }, [markers]);

    return <div ref={chartContainerRef} className="w-full h-[500px]" />;
});
CandlestickChart.displayName = 'CandlestickChart';


// --- Main Page Component ---
const statusDisplay: { [key: string]: string } = {
  Labeled: "Đã gán nhãn",
  Processing: "Đang xử lý",
  Raw: "Thô",
};


export default function DatasetsPage() {
  // Global state
  const firestore = useFirestore();
  const datasetsCollection = firestore ? collection(firestore, 'datasets') : null;
  const { data: datasets = [], loading: loadingDatasets } = useCollection<Dataset>(datasetsCollection);
  
  const [parsedData, setParsedData] = useState<ParsedData>({});
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);

  const activeDatasetPointsCollection = (firestore && activeDataset) ? collection(firestore, 'datasets', activeDataset.id, 'labeledPoints') : null;
  const { data: labeledPoints = [], loading: loadingPoints } = useCollection<LabeledPoint>(activeDatasetPointsCollection);
  
  // UI State
  const [hoveredDataPoint, setHoveredDataPoint] = useState<CandlestickChartData & { price?: number } | null>(null);
  const activeLabelModeRef = useRef<AnnotationType | null>(null);
  const [activeButton, setActiveButton] = useState<AnnotationType | null>(null);
  
  const handleAddDataset = useCallback(async (newDatasetData: Omit<Dataset, 'id'>, newParsedData: CandlestickChartData[]) => {
    if (!datasetsCollection) return;
    try {
      const docRef = await addDoc(datasetsCollection, newDatasetData);
      setParsedData(prev => ({ ...prev, [docRef.id]: newParsedData }));
    } catch (error) {
      console.error("Error adding dataset to Firestore:", error);
    }
  }, [datasetsCollection]);

  const handleDeleteDataset = (datasetId: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, "datasets", datasetId));
    
    setParsedData(prev => {
        const newParsedData = { ...prev };
        delete newParsedData[datasetId];
        return newParsedData;
    });

    if (activeDataset?.id === datasetId) {
        setActiveDataset(null);
    }
  };

  const handleSetDataset = (dataset: Dataset) => {
    if (dataset.status === 'Processing' || dataset.id === activeDataset?.id) return;
    
    activeLabelModeRef.current = null;
    setActiveButton(null);

    setActiveDataset(dataset);
    setHoveredDataPoint(null);
  }

  const toggleLabelMode = (mode: AnnotationType) => {
    const newMode = activeLabelModeRef.current === mode ? null : mode;
    activeLabelModeRef.current = newMode;
    setActiveButton(newMode);
  };
  
  const handleCrosshairMove = useCallback((param: MouseEventParams) => {
      if (!param.point || !param.seriesData || !param.seriesData.size) {
          setHoveredDataPoint(null);
          return;
      }
      const data = param.seriesData.values().next().value as CandlestickChartData;
      const price = param.panePrices?.[0];
      if (data && price) {
          setHoveredDataPoint({...data, price});
      }
  }, []);

  const handleChartClick = useCallback((param: MouseEventParams) => {
      const currentMode = activeLabelModeRef.current;
      if (!firestore || !currentMode || !activeDataset || !param.point || !param.seriesData || !param.seriesData.size) {
          return;
      }
      
      const dataPoint = param.seriesData.values().next().value as CandlestickChartData;
      if (!dataPoint) return;

      const time = dataPoint.time;
      let newMarker: Omit<LabeledPoint, 'id'> | null = null;
      
      const commonProps = { time, text: currentMode };

      switch (currentMode) {
        case 'BUY':
            newMarker = { ...commonProps, position: 'belowBar', color: '#22c55e', shape: 'arrowUp' };
            break;
        case 'SELL':
            newMarker = { ...commonProps, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown' };
            break;
        case 'HOLD':
            newMarker = { ...commonProps, position: 'belowBar', color: '#6b7280', shape: 'circle' };
            break;
        case 'BOS':
            newMarker = { ...commonProps, position: 'aboveBar', color: '#3b82f6', shape: 'circle' };
            break;
        case 'CHOCH':
            newMarker = { ...commonProps, position: 'aboveBar', color: '#f97316', shape: 'circle' };
            break;
      }

      if (newMarker && activeDatasetPointsCollection) {
         addDoc(activeDatasetPointsCollection, newMarker);
      }
      
      activeLabelModeRef.current = null;
      setActiveButton(null);
  }, [activeDataset, firestore, activeDatasetPointsCollection]);

  const getHelperText = () => {
    if (!activeDataset) return 'Di chuyển chuột trên biểu đồ để xem chi tiết.';
    const currentMode = activeButton;
    if (currentMode) {
      return `Chế độ ${currentMode}: Nhấp vào biểu đồ để đặt nhãn.`;
    }
    return 'Di chuyển chuột trên biểu đồ để xem chi tiết.';
  }
  
  const markers = useMemo(() => {
    return labeledPoints.map(p => ({
        time: p.time,
        position: p.position,
        color: p.color,
        shape: p.shape,
        text: p.text
    }));
  }, [labeledPoints]);

  const AnnotationButton = ({ mode, children, tooltip }: { mode: AnnotationType, children: React.ReactNode, tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeButton === mode ? 'default' : 'outline'}
            size="lg"
            className={cn(
              "h-12 w-20 flex-col",
               activeButton === mode &&
                (mode === 'BUY' ? 'border-green-500 ring-2 ring-green-500' :
                 mode === 'SELL' ? 'border-red-500 ring-2 ring-red-500' :
                 mode === 'HOLD' ? 'border-gray-500 ring-2 ring-gray-500' :
                 'border-primary ring-2 ring-primary')
            )}
            disabled={!activeDataset}
            onClick={() => toggleLabelMode(mode)}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );


  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="labeled">Đã gán nhãn</TabsTrigger>
          <TabsTrigger value="raw">Thô</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
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
           <div className="lg:col-span-2 space-y-6">
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
                    {loadingDatasets ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : datasets.length === 0 ? (
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
                                {statusDisplay[dataset.status] || dataset.status}
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
           <div className="lg:col-span-1 space-y-6">
                <UploadCard onUploadSuccess={handleAddDataset} />
                <TrainModelCard activeDataset={activeDataset} labeledPoints={labeledPoints} />
           </div>
        </div>
         <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Gán nhãn Thủ công</CardTitle>
                <CardDescription>
                    {activeDataset ? `Chọn một chế độ (Mua, Bán, BOS, v.v.) sau đó nhấp vào biểu đồ để đặt nhãn.` : "Chọn một bộ dữ liệu từ bảng trên để bắt đầu"}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={cn(!activeDataset && "flex items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg h-[500px]")}>
                        {activeDataset ? (
                             <CandlestickChart
                                data={parsedData[activeDataset.id] || []}
                                markers={markers}
                                onChartClick={handleChartClick}
                                onCrosshairMove={handleCrosshairMove}
                            />
                        ) : (
                             <p>Vui lòng chọn một bộ dữ liệu <br/> có thể gán nhãn (Thô hoặc Đã gán nhãn).</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                     <div className="flex items-center justify-center gap-4 h-6">
                        {hoveredDataPoint ? (
                            <div className="font-mono text-xs text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1">
                                <span>Time: {new Date((hoveredDataPoint.time as number) * 1000).toLocaleString('vi-VN')}</span>
                                {hoveredDataPoint.price && <span>Price: {hoveredDataPoint.price.toFixed(5)}</span>}
                                <span>O: {hoveredDataPoint.open.toFixed(5)}</span>
                                <span>H: {hoveredDataPoint.high.toFixed(5)}</span>
                                <span>L: {hoveredDataPoint.low.toFixed(5)}</span>
                                <span>C: {hoveredDataPoint.close.toFixed(5)}</span>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">{getHelperText()}</p>
                        )}
                    </div>

                    <div className="flex justify-center gap-2">
                        <AnnotationButton mode="BUY" tooltip="Đánh dấu điểm Mua">
                            <ArrowUp className="h-5 w-5" />
                            <span className="text-xs">Mua</span>
                        </AnnotationButton>
                        <AnnotationButton mode="HOLD" tooltip="Đánh dấu điểm Giữ">
                            <Circle className="h-5 w-5" />
                            <span className="text-xs">Giữ</span>
                        </AnnotationButton>
                        <AnnotationButton mode="SELL" tooltip="Đánh dấu điểm Bán">
                            <ArrowDown className="h-5 w-5" />
                            <span className="text-xs">Bán</span>
                        </AnnotationButton>
                         <AnnotationButton mode="BOS" tooltip="Phá vỡ cấu trúc (Break of Structure)">
                            <LineChartIcon className="h-5 w-5" />
                            <span className="text-xs">BOS</span>
                        </AnnotationButton>
                         <AnnotationButton mode="CHOCH" tooltip="Thay đổi tính chất (Change of Character)">
                           <Ruler className="h-5 w-5" />
                            <span className="text-xs">CHOCH</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
