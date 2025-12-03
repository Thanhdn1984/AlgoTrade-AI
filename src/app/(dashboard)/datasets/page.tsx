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
import type { Dataset, CandlestickChartData, AnnotationType, CustomPriceLineOptions } from "@/lib/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useActionState } from 'react';
import { uploadFileAction, trainModelAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, type MouseEventParams, CrosshairMode, type SeriesMarker, type IPriceLine } from 'lightweight-charts';
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// --- Data Types ---
type ParsedData = { [key: string]: CandlestickChartData[] };
type LabelMarker = SeriesMarker<UTCTimestamp>;
type LabeledPoints = { [key: string]: LabelMarker[] };


// --- Components for Upload ---

type UploadState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  newDataset?: Dataset | null;
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
  
  function UploadCard({ onUploadSuccess }: { onUploadSuccess: (newDataset: Dataset, parsedData: CandlestickChartData[]) => void }) {
    const [state, formAction] = useActionState(uploadFileAction, initialUploadState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const lastProcessedId = useRef<string | null>(null);
  
    useEffect(() => {
      if (state.status === 'success' && state.newDataset && state.parsedData && state.newDataset.id !== lastProcessedId.current) {
          toast({
            title: 'Thành công!',
            description: state.message,
          });
          onUploadSuccess(state.newDataset, state.parsedData);
          formRef.current?.reset();
          lastProcessedId.current = state.newDataset.id; 
      } else if (state.status === 'error') {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: state.message,
        });
        lastProcessedId.current = null;
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

function TrainModelCard({ activeDataset, labeledPoints, priceLines }: { 
    activeDataset: Dataset | null;
    labeledPoints: LabeledPoints;
    priceLines: { [key: string]: CustomPriceLineOptions[] };
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

        const points = labeledPoints[activeDataset.id] || [];
        const lines = priceLines[activeDataset.id] || [];

        // Correctly handle different annotation types for CSV generation
        const labeledData = [
            'type,time,price,text,price2', // header
            ...points.map(p => `POINT,${p.time},${p.position === 'aboveBar' ? 'high' : 'low'},${p.text},`),
            ...lines.map(l => {
                if (l.annotationType === 'FVG') {
                    // For FVG, price is top, price2 is bottom
                    return `FVG,${l.time},${l.price},${l.title},${l.price2}`;
                }
                return `${l.annotationType},${l.time},${l.price},${l.title},`;
            }),
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
                            <p>Điểm dữ liệu: {(labeledPoints[activeDataset.id] || []).length}</p>
                            <p>Đường/Vùng: {(priceLines[activeDataset.id] || []).length}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={pending || !activeDataset || ((labeledPoints[activeDataset.id] || []).length === 0 && (priceLines[activeDataset.id] || []).length === 0)}
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

// --- Main Page Component ---
const statusDisplay: { [key: string]: string } = {
  Labeled: "Đã gán nhãn",
  Processing: "Đang xử lý",
  Raw: "Thô",
};


export default function DatasetsPage() {
  // Global state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData>({});
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  
  // Annotation state
  const [labeledPoints, setLabeledPoints] = useState<LabeledPoints>({});
  const [priceLines, setPriceLines] = useState<{ [key: string]: CustomPriceLineOptions[] }>({});
  
  // UI State
  const [hoveredDataPoint, setHoveredDataPoint] = useState<CandlestickChartData | null>(null);
  const [activeButton, setActiveButton] = useState<AnnotationType | null>(null);

  // Interaction State (managed with refs to prevent re-renders)
  const activeLabelModeRef = useRef<AnnotationType | null>(null);
  const fvgFirstClickRef = useRef<{ price: number; time: UTCTimestamp } | null>(null);

  // Chart instance refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesApiRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLineRefs = useRef<Map<string, IPriceLine>>(new Map());
  const fvgTempLineRef = useRef<IPriceLine | null>(null);
  
  const { theme } = useTheme();

  const handleAddDataset = (newDataset: Dataset, newParsedData: CandlestickChartData[]) => {
    setDatasets(prev => {
        if (prev.find(d => d.id === newDataset.id)) return prev;
        return [...prev, newDataset];
    });
    setParsedData(prev => ({ ...prev, [newDataset.id]: newParsedData }));
    if (!labeledPoints[newDataset.id]) {
      setLabeledPoints(prev => ({ ...prev, [newDataset.id]: [] }));
    }
    if (!priceLines[newDataset.id]) {
      setPriceLines(prev => ({...prev, [newDataset.id]: []}));
    }
  };

  const handleDeleteDataset = (datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
    setParsedData(prev => {
        const newParsedData = { ...prev };
        delete newParsedData[datasetId];
        return newParsedData;
    });
     setLabeledPoints(prev => {
        const newLabeledPoints = { ...prev };
        delete newLabeledPoints[datasetId];
        return newLabeledPoints;
    });
    setPriceLines(prev => {
        const newPriceLines = { ...prev };
        delete newPriceLines[datasetId];
        return newPriceLines;
    });

    if (activeDataset?.id === datasetId) {
        setActiveDataset(null);
    }
  };

  const handleSetDataset = (dataset: Dataset) => {
    if (dataset.status === 'Processing' || dataset.id === activeDataset?.id) return;
    
    // Reset interaction state when switching datasets
    if (fvgTempLineRef.current && seriesApiRef.current) {
        seriesApiRef.current.removePriceLine(fvgTempLineRef.current);
    }
    fvgTempLineRef.current = null;
    fvgFirstClickRef.current = null;
    activeLabelModeRef.current = null;
    setActiveButton(null);

    setActiveDataset(dataset);
    setHoveredDataPoint(null);
  }

  const handleCrosshairMove = useCallback((param: MouseEventParams<'Candlestick'>) => {
    if (!param.point || !param.seriesData || !param.seriesData.size) {
        setHoveredDataPoint(null);
        return;
    }
    // Accessing the map correctly
    const data = param.seriesData.values().next().value as CandlestickChartData;
    const price = param.panePrices?.[0];
    if (data) {
        setHoveredDataPoint({...data, price});
    }
  }, []);

  const handleChartClick = useCallback((param: MouseEventParams<'Candlestick'>) => {
    const currentMode = activeLabelModeRef.current;
    if (!currentMode || !param.point || !param.seriesData || !param.seriesData.size) {
        return;
    }
    
    const dataPoint = param.seriesData.values().next().value as CandlestickChartData;
    if (!dataPoint || !param.panePrices || param.panePrices.length === 0) {
        return;
    }
    const price = param.panePrices[0];
    const time = dataPoint.time;

    // --- Handle Point Markers ---
    if (currentMode === 'BUY' || currentMode === 'SELL' || currentMode === 'HOLD') {
        const newMarker: LabelMarker = currentMode === 'BUY'
            ? { time, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: 'Buy' }
            : currentMode === 'SELL'
            ? { time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Sell' }
            : { time, position: 'belowBar', color: '#6b7280', shape: 'circle', size: 0.5, text: 'Hold' };

        setLabeledPoints(prev => {
            const currentDatasetId = activeDataset?.id;
            if (!currentDatasetId) return prev;
            const currentPoints = prev[currentDatasetId] || [];
            // Remove any existing marker at the same timestamp before adding the new one
            const otherPoints = currentPoints.filter(p => p.time !== time);
            const newPoints = [...otherPoints, newMarker];
            newPoints.sort((a, b) => (a.time as number) - (b.time as number));
            return { ...prev, [currentDatasetId]: newPoints };
        });
        
        activeLabelModeRef.current = null;
        setActiveButton(null);
    }
    // --- Handle Line Markers ---
    else if (currentMode === 'BOS' || currentMode === 'CHOCH') {
        const lineOptions: CustomPriceLineOptions = {
            price,
            color: currentMode === 'BOS' ? '#3b82f6' : '#f97316',
            lineWidth: 2,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: `${currentMode}-${(Math.random() * 1000).toFixed(0)}`,
            annotationType: currentMode,
            time: time, // Although not used for drawing, good to store context
        };

        setPriceLines(prev => {
            const currentDatasetId = activeDataset?.id;
            if (!currentDatasetId) return prev;
            return {
                ...prev,
                [currentDatasetId]: [...(prev[currentDatasetId] || []), lineOptions]
            };
        });

        activeLabelModeRef.current = null;
        setActiveButton(null);
    }
    // --- Handle FVG Area ---
    else if (currentMode === 'FVG') {
        const series = seriesApiRef.current;
        if (!series) return;

        if (!fvgFirstClickRef.current) {
            // First click: set start point and draw a temporary line
            fvgFirstClickRef.current = { price, time };
            if (fvgTempLineRef.current) {
                series.removePriceLine(fvgTempLineRef.current);
            }
            const tempLine = series.createPriceLine({ price, color: '#8b5cf6', lineWidth: 2, lineStyle: 3, axisLabelVisible: true, title: 'FVG Start' });
            fvgTempLineRef.current = tempLine;
        } else {
            // Second click: complete the FVG
            const top = Math.max(fvgFirstClickRef.current.price, price);
            const bottom = Math.min(fvgFirstClickRef.current.price, price);
            const fvgLineOptions: CustomPriceLineOptions = {
                price: top,
                price2: bottom,
                color: 'rgba(139, 92, 246, 0.2)',
                lineWidth: 1,
                lineStyle: 0,
                axisLabelVisible: false,
                title: `FVG-${(Math.random() * 1000).toFixed(0)}`,
                annotationType: 'FVG',
                time: fvgFirstClickRef.current.time,
            };
            
            setPriceLines(prev => {
                const currentDatasetId = activeDataset?.id;
                if (!currentDatasetId) return prev;
                return { ...prev, [currentDatasetId]: [...(prev[currentDatasetId] || []), fvgLineOptions] };
            });

            // Cleanup
            if (fvgTempLineRef.current) {
                series.removePriceLine(fvgTempLineRef.current);
            }
            fvgTempLineRef.current = null;
            fvgFirstClickRef.current = null;
            activeLabelModeRef.current = null;
            setActiveButton(null);
        }
    }
  }, [activeDataset]);

  const toggleLabelMode = (mode: AnnotationType) => {
    if (activeLabelModeRef.current === mode) {
        // If clicking the same button, toggle off
        activeLabelModeRef.current = null;
        setActiveButton(null);
        if (fvgTempLineRef.current && seriesApiRef.current) {
            seriesApiRef.current.removePriceLine(fvgTempLineRef.current);
        }
        fvgFirstClickRef.current = null;
    } else {
        // Switching to a new mode
        activeLabelModeRef.current = mode;
        setActiveButton(mode);
        // Clean up previous mode's temp state if any
        if (fvgTempLineRef.current && seriesApiRef.current) {
            seriesApiRef.current.removePriceLine(fvgTempLineRef.current);
        }
        fvgFirstClickRef.current = null;
    }
  }

  // Effect for chart lifecycle management
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const chartOptions = {
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
    };

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });
    
    const series = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444',
        borderDownColor: '#ef4444', borderUpColor: '#22c55e',
        wickDownColor: '#ef4444', wickUpColor: '#22c55e',
    });

    chartApiRef.current = chart;
    seriesApiRef.current = series;

    chart.subscribeCrosshairMove(handleCrosshairMove);
    chart.subscribeClick(handleChartClick);

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.unsubscribeClick(handleChartClick);
      chart.remove();
      chartApiRef.current = null;
      seriesApiRef.current = null;
    };
  }, [theme, handleChartClick, handleCrosshairMove]);

  // Effect to update chart DATA when active dataset changes
  useEffect(() => {
    const series = seriesApiRef.current;
    if (series && activeDataset) {
        const data = parsedData[activeDataset.id] || [];
        series.setData(data);
        if (data.length > 0) {
            chartApiRef.current?.timeScale().fitContent();
        }
    } else if (series) {
        series.setData([]); // Clear data if no active dataset
    }
  }, [activeDataset, parsedData]);

  // Effect to update chart MARKERS (Points) when they change for the active dataset
  useEffect(() => {
    const series = seriesApiRef.current;
    if (series && activeDataset) {
        const markers = labeledPoints[activeDataset.id] || [];
        series.setMarkers(markers);
    } else if (series) {
        series.setMarkers([]);
    }
  }, [activeDataset, labeledPoints]);

  // Effect to draw and manage chart LINES/AREAS when they change for the active dataset
  useEffect(() => {
    const series = seriesApiRef.current;
    if (!series) return;

    // Clear all existing price lines from the chart
    priceLineRefs.current.forEach(line => series.removePriceLine(line));
    priceLineRefs.current.clear();
    
    if (activeDataset) {
        const currentLineOptions = priceLines[activeDataset.id] || [];
        
        currentLineOptions.forEach(options => {
            if (options.annotationType === 'FVG' && options.price2 !== undefined) {
                // This is a special case for FVG which requires two lines and a fill
                const topLine = series.createPriceLine({
                    price: options.price, color: '#8b5cf6', lineWidth: 1,
                    lineStyle: 2, axisLabelVisible: true, title: "FVG High",
                });
                const bottomLine = series.createPriceLine({
                    price: options.price2, color: '#8b5cf6', lineWidth: 1,
                    lineStyle: 2, axisLabelVisible: true, title: "FVG Low",
                });
                // Note: Lightweight Charts doesn't directly support filled areas between two price lines.
                // This visualization uses two lines as boundaries. A more complex visualization would require plugins or overlays.
                priceLineRefs.current.set(`${options.title}-top`, topLine);
                priceLineRefs.current.set(`${options.title}-bottom`, bottomLine);

            } else if (options.annotationType === 'BOS' || options.annotationType === 'CHOCH') {
                const line = series.createPriceLine(options);
                priceLineRefs.current.set(options.title, line);
            }
        });
    }
  }, [activeDataset, priceLines]);

  const getHelperText = () => {
    if (!activeDataset) return 'Di chuyển chuột trên biểu đồ để xem chi tiết.';
    const currentMode = activeButton;
    if (currentMode) {
      if (currentMode === 'FVG') {
        return fvgFirstClickRef.current ? 'Chế độ FVG: Nhấp để chọn cạnh dưới của vùng.' : 'Chế độ FVG: Nhấp để chọn cạnh trên của vùng.';
      }
      return `Chế độ ${currentMode}: Nhấp vào biểu đồ để đặt nhãn.`;
    }
    return 'Di chuyển chuột trên biểu đồ để xem chi tiết.';
  }

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
                <TrainModelCard activeDataset={activeDataset} labeledPoints={labeledPoints} priceLines={priceLines} />
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
                {activeDataset && (parsedData[activeDataset.id] || []).length > 0 ? (
                    <div ref={chartContainerRef} className="w-full h-[500px]" />
                ) : (
                    <div className="flex items-center justify-center h-[500px] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>Vui lòng chọn một bộ dữ liệu <br/> có thể gán nhãn (Thô hoặc Đã gán nhãn).</p>
                    </div>
                )}
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
                        </AnnotationButton>
                         <AnnotationButton mode="FVG" tooltip="Khoảng trống giá trị hợp lý (Fair Value Gap)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 17V7h10v10H7z"/></svg>
                            <span className="text-xs">FVG</span>
                        </AnnotationButton>
                    </div>
                </CardFooter>
            </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

    