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
import type { Dataset, CandlestickChartData, AnnotationType, LabelType, LineLabelType, CustomPriceLineOptions } from "@/lib/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useActionState } from 'react';
import { uploadFileAction, trainModelAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, type MouseEventParams, CrosshairMode, type SeriesMarker, type IPriceLine, type PriceLineOptions } from 'lightweight-charts';
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// --- Data Types ---
type ParsedData = { [key: string]: CandlestickChartData[] };
type LabelMarker = SeriesMarker<UTCTimestamp>;
type LabeledPoints = { [key: string]: LabelMarker[] };
type PriceLines = { [key: string]: IPriceLine[] };


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


// --- Candlestick Chart Component ---
function CandlestickChart({
  data,
  markers = [],
  onCrosshairMove,
  onChartClick,
  chartApiRef // Pass the ref to control the API
}: {
  data: CandlestickChartData[];
  markers?: LabelMarker[];
  onCrosshairMove: (param: MouseEventParams<'Candlestick'>) => void;
  onChartClick: (param: MouseEventParams<'Candlestick'>) => void;
  chartApiRef: React.MutableRefObject<{ chart: IChartApi | null; series: ISeriesApi<'Candlestick'> | null }>;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Effect to handle chart initialization and destruction
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
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
        crosshair: {
            mode: CrosshairMode.Normal,
        },
    };

    const chart = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: chartContainerRef.current.clientWidth,
        height: 500,
    });
    
    const series = chart.addCandlestickSeries({
        upColor: '#22c55e', // green-500
        downColor: '#ef4444', // red-500
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
    });

    chartApiRef.current = { chart, series };

    const handleResize = () => {
        chart?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartApiRef.current = { chart: null, series: null };
    };
  }, [theme, chartApiRef]);


  // Effect to update data
  useEffect(() => {
    const series = chartApiRef.current.series;
    if (series && data) {
        series.setData(data);
    }
  }, [data, chartApiRef]);
  
  // Effect for event subscriptions
  useEffect(() => {
      const chart = chartApiRef.current.chart;
      if (!chart) return;

      chart.subscribeCrosshairMove(onCrosshairMove);
      chart.subscribeClick(onChartClick);

      return () => {
          chart.unsubscribeCrosshairMove(onCrosshairMove);
          chart.unsubscribeClick(onChartClick);
      };
  }, [onCrosshairMove, onChartClick, chartApiRef]);


   // Effect to update markers when they change
   useEffect(() => {
    const series = chartApiRef.current.series;
    if (series) {
      series.setMarkers(markers);
    }
  }, [markers, chartApiRef]);

  return <div ref={chartContainerRef} className="w-full h-[500px]" />;
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
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData>({});
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<CandlestickChartData | null>(null);
  const [labeledPoints, setLabeledPoints] = useState<LabeledPoints>({});
  const [priceLines, setPriceLines] = useState<{ [key: string]: CustomPriceLineOptions[] }>({});
  const [activeLabelMode, setActiveLabelMode] = useState<AnnotationType | null>(null);
  const [fvgTempLine, setFvgTempLine] = useState<IPriceLine | null>(null);
  const [fvgFirstClick, setFvgFirstClick] = useState<{ price: number; time: UTCTimestamp } | null>(null);

  const chartApiRef = useRef<{ chart: IChartApi | null; series: ISeriesApi<'Candlestick'> | null }>({ chart: null, series: null });
  const priceLineRefs = useRef<{ [key: string]: IPriceLine[] }>({});


  const handleAddDataset = (newDataset: Dataset, newParsedData: CandlestickChartData[]) => {
    setDatasets(prev => {
        if (prev.find(d => d.id === newDataset.id)) return prev;
        return [...prev, newDataset];
    });
    setParsedData(prev => ({ ...prev, [newDataset.id]: newParsedData }));
    setLabeledPoints(prev => ({ ...prev, [newDataset.id]: [] }));
    setPriceLines(prev => ({...prev, [newDataset.id]: []}));
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
    // Clear refs
    const series = chartApiRef.current.series;
    if (priceLineRefs.current[datasetId] && series) {
        priceLineRefs.current[datasetId].forEach(line => series.removePriceLine(line));
    }
    delete priceLineRefs.current[datasetId];

    if (activeDataset?.id === datasetId) {
        setActiveDataset(null);
    }
  };

  const fullChartData = activeDataset ? parsedData[activeDataset.id] || [] : [];
  const currentMarkers = activeDataset ? labeledPoints[activeDataset.id] || [] : [];
  
  const handleCrosshairMove = useCallback((param: MouseEventParams<'Candlestick'>) => {
    if (!param.point || !param.seriesData.size) {
        setHoveredDataPoint(null);
        return;
    }
    const data = param.seriesData.values().next().value as CandlestickChartData;
    const price = param.panePrices?.[0];
    setHoveredDataPoint({...data, price});
  }, []);

  const handleChartClick = useCallback((param: MouseEventParams<'Candlestick'>) => {
      if (!activeDataset || !activeLabelMode || !param.point) return;

      const dataPoint = param.seriesData.values().next().value as CandlestickChartData;
      if (!param.panePrices || param.panePrices.length === 0 || !dataPoint) return;

      const price = param.panePrices[0];
      const time = dataPoint.time;
      
      if (!time) return;

      if (activeLabelMode === 'BUY' || activeLabelMode === 'SELL' || activeLabelMode === 'HOLD') {
        let newMarker: LabelMarker;
        switch (activeLabelMode) {
            case 'BUY':
                newMarker = { time, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: 'Buy' };
                break;
            case 'SELL':
                newMarker = { time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Sell' };
                break;
            case 'HOLD':
                newMarker = { time, position: 'belowBar', color: '#6b7280', shape: 'circle', size: 0.5 };
                break;
        }
        setLabeledPoints(prev => {
            const currentPoints = prev[activeDataset.id] || [];
            const otherPoints = currentPoints.filter(p => p.time !== time);
            const newPoints = [...otherPoints, newMarker];
            newPoints.sort((a, b) => (a.time as number) - (b.time as number));
            return { ...prev, [activeDataset.id]: newPoints };
        });
        setActiveLabelMode(null);

      } else if (activeLabelMode === 'BOS' || activeLabelMode === 'CHOCH') {
        const lineOptions: CustomPriceLineOptions = {
          price,
          color: activeLabelMode === 'BOS' ? '#3b82f6' : '#f97316',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: activeLabelMode,
          annotationType: activeLabelMode,
          time: time,
        };
        setPriceLines(prev => ({
            ...prev,
            [activeDataset.id]: [...(prev[activeDataset.id] || []), lineOptions]
        }));
        setActiveLabelMode(null);
      } else if (activeLabelMode === 'FVG') {
        if (!fvgFirstClick) {
            // First click: store position and draw a temporary line
            setFvgFirstClick({ price, time });
            const tempLine = chartApiRef.current.series?.createPriceLine({
                price,
                color: '#8b5cf6',
                lineWidth: 2,
                lineStyle: 3, // Dotted
                axisLabelVisible: true,
                title: 'FVG Start'
            });
            if (tempLine) setFvgTempLine(tempLine);
        } else {
            // Second click: create the FVG region
            const top = Math.max(fvgFirstClick.price, price);
            const bottom = Math.min(fvgFirstClick.price, price);

            const fvgLineOptions: CustomPriceLineOptions = {
                price: top,
                price2: bottom,
                color: 'rgba(139, 92, 246, 0.2)', // FVG area color
                lineWidth: 2,
                lineStyle: 0, // Solid
                axisLabelVisible: true,
                title: 'FVG',
                annotationType: 'FVG',
                time: fvgFirstClick.time,
            };
             setPriceLines(prev => ({
                ...prev,
                [activeDataset.id]: [...(prev[activeDataset.id] || []), fvgLineOptions]
            }));

            // Clean up
            if (fvgTempLine) chartApiRef.current.series?.removePriceLine(fvgTempLine);
            setFvgTempLine(null);
            setFvgFirstClick(null);
            setActiveLabelMode(null);
        }
      }
  }, [activeLabelMode, activeDataset, fvgFirstClick, fvgTempLine]);


  const handleSetDataset = (dataset: Dataset) => {
    if (dataset.status !== 'Processing') {
        setActiveDataset(dataset);
        setHoveredDataPoint(null);
        setActiveLabelMode(null);
        setFvgFirstClick(null);
        if (fvgTempLine && chartApiRef.current.series) {
            chartApiRef.current.series.removePriceLine(fvgTempLine);
            setFvgTempLine(null);
        }
    }
  }
  
  // Effect to draw and manage price lines/areas
  useEffect(() => {
    const series = chartApiRef.current.series;
    if (!series || !activeDataset) return;
    
    // Clear all existing price lines from the chart to prevent duplicates
    if (priceLineRefs.current[activeDataset.id]) {
      priceLineRefs.current[activeDataset.id].forEach(line => series.removePriceLine(line));
    }
    priceLineRefs.current[activeDataset.id] = [];

    // Redraw all lines/areas from state
    const currentLineOptions = priceLines[activeDataset.id] || [];
    const newLines: IPriceLine[] = [];

    currentLineOptions.forEach(options => {
        if (options.annotationType === 'FVG' && options.price2 !== undefined) {
             // Draw FVG as a region
            const topLine = series.createPriceLine({
                price: options.price,
                color: '#8b5cf6',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: false,
            });
             const bottomLine = series.createPriceLine({
                price: options.price2,
                color: '#8b5cf6',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: false,
            });
            // This is a simplified way to create an area, real implementation might need a custom plugin
            // For now, we'll draw two lines and store them.
            newLines.push(topLine, bottomLine);

        } else if (options.annotationType === 'BOS' || options.annotationType === 'CHOCH') {
            const line = series.createPriceLine(options);
            newLines.push(line);
        }
    });

    priceLineRefs.current[activeDataset.id] = newLines;

  }, [activeDataset, priceLines]);


  const toggleLabelMode = (mode: AnnotationType) => {
    // If we're already in a mode, and click it again, cancel it.
    if(activeLabelMode === mode) {
        setActiveLabelMode(null);
        if (fvgTempLine && chartApiRef.current.series) {
            chartApiRef.current.series.removePriceLine(fvgTempLine);
        }
        setFvgTempLine(null);
        setFvgFirstClick(null);
        return;
    }
    
    // If switching from FVG drawing mid-way, clean up.
    if(fvgFirstClick) {
        if (fvgTempLine && chartApiRef.current.series) {
            chartApiRef.current.series.removePriceLine(fvgTempLine);
        }
        setFvgTempLine(null);
        setFvgFirstClick(null);
    }
    
    setActiveLabelMode(mode);
  }

  const getHelperText = () => {
    if (!activeDataset) return 'Di chuyển chuột trên biểu đồ để xem chi tiết.';
    if (activeLabelMode) {
      if (activeLabelMode === 'FVG') {
        return fvgFirstClick ? 'Chế độ FVG: Nhấp để chọn cạnh dưới của vùng.' : 'Chế độ FVG: Nhấp để chọn cạnh trên của vùng.';
      }
      return `Chế độ ${activeLabelMode}: Nhấp vào biểu đồ để đặt nhãn.`;
    }
    return 'Di chuyển chuột trên biểu đồ để xem chi tiết.';
  }


  const AnnotationButton = ({ mode, children, tooltip }: { mode: AnnotationType, children: React.ReactNode, tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeLabelMode === mode ? 'default' : 'outline'}
            size="lg"
            className={cn(
              "h-12 w-20 flex-col",
               activeLabelMode === mode &&
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
                {activeDataset && fullChartData.length > 0 ? (
                    <div>
                        <CandlestickChart 
                            data={fullChartData} 
                            markers={currentMarkers}
                            onCrosshairMove={handleCrosshairMove} 
                            onChartClick={handleChartClick}
                            chartApiRef={chartApiRef}
                        />
                    </div>
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
