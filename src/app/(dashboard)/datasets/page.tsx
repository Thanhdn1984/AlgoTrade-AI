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
import type { Dataset, CandlestickChartData, LabelType } from "@/lib/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useActionState } from 'react';
import { uploadFileAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, type MouseEventParams, CrosshairMode, type SeriesMarker } from 'lightweight-charts';
import { useTheme } from "next-themes";

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
  
  // Custom hook to get useFormStatus outside of a <form>
  import { useFormStatus } from 'react-dom';
  
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
function CandlestickChart({
  data,
  markers = [],
  onCrosshairMove,
  onChartClick
}: {
  data: CandlestickChartData[];
  markers?: LabelMarker[];
  onCrosshairMove: (param: MouseEventParams<'Candlestick'>) => void;
  onChartClick: (param: MouseEventParams<'Candlestick'>) => void;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{ chart: IChartApi | null; series: ISeriesApi<'Candlestick'> | null }>({ chart: null, series: null });
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

    chartRef.current = { chart, series };

    const handleResize = () => {
        chart?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = { chart: null, series: null };
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to apply theme changes
  useEffect(() => {
    if (!chartRef.current.chart) return;

    const isDark = theme === 'dark';
    chartRef.current.chart.applyOptions({
        layout: {
            background: { type: ColorType.Solid, color: isDark ? '#19191f' : '#ffffff' },
            textColor: isDark ? '#D1D5DB' : '#1F2937',
        },
        grid: {
            vertLines: { color: isDark ? '#374151' : '#E5E7EB' },
            horzLines: { color: isDark ? '#374151' : '#E5E7EB' },
        },
    });
  }, [theme]);


  // Effect to update data and fit content
  useEffect(() => {
    if (chartRef.current.series && data) {
        chartRef.current.series.setData(data);
        chartRef.current.chart?.timeScale().fitContent();
    }
  }, [data]);
  
  // Effect for event subscriptions
  useEffect(() => {
      const chart = chartRef.current.chart;
      if (!chart) return;

      chart.subscribeCrosshairMove(onCrosshairMove);
      chart.subscribeClick(onChartClick);

      return () => {
          chart.unsubscribeCrosshairMove(onCrosshairMove);
          chart.unsubscribeClick(onChartClick);
      };
  }, [onCrosshairMove, onChartClick]);

   // Effect to update markers when they change
   useEffect(() => {
    if (chartRef.current.series) {
      chartRef.current.series.setMarkers(markers);
    }
  }, [markers]);

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
  const [hoveredDataPoint, setHoveredDataPoint] = useState<CandlestickChartData | null>(null);
  const [labeledPoints, setLabeledPoints] = useState<LabeledPoints>({});
  const [activeLabelMode, setActiveLabelMode] = useState<LabelType | null>(null);


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
    setLabeledPoints(prev => ({
        ...prev,
        [newDataset.id]: []
    }));
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
    // The seriesData is a map, we get the first (and only) series' data
    const data = param.seriesData.values().next().value as CandlestickChartData;
    setHoveredDataPoint(data);
  }, []);

  const handleChartClick = useCallback((param: MouseEventParams<'Candlestick'>) => {
      if (!activeDataset || !activeLabelMode || !param.seriesData.size) return;

      const dataPoint = param.seriesData.values().next().value as CandlestickChartData;
      if (!dataPoint) return;

      let newMarker: LabelMarker;

      switch (activeLabelMode) {
          case 'BUY':
              newMarker = { time: dataPoint.time, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: 'Buy' };
              break;
          case 'SELL':
              newMarker = { time: dataPoint.time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Sell' };
              break;
          case 'HOLD':
              newMarker = { time: dataPoint.time, position: 'belowBar', color: '#6b7280', shape: 'circle', size: 0.5 };
              break;
          default:
            return;
      }

      setLabeledPoints(prev => {
          const currentPoints = prev[activeDataset.id] || [];
          const otherPoints = currentPoints.filter(p => p.time !== dataPoint.time);
          const newPoints = [...otherPoints, newMarker];
          newPoints.sort((a, b) => (a.time as number) - (b.time as number));
          return {
              ...prev,
              [activeDataset.id]: newPoints
          };
      });

      // Exit labeling mode after placing a marker
      setActiveLabelMode(null);
  }, [activeLabelMode, activeDataset]);


  const handleSetDataset = (dataset: Dataset) => {
    if (dataset.status !== 'Processing') {
        setActiveDataset(dataset);
        setHoveredDataPoint(null);
        setActiveLabelMode(null);
    }
  }


  const toggleLabelMode = (mode: LabelType) => {
    if (activeLabelMode === mode) {
      setActiveLabelMode(null); // Toggle off if already active
    } else {
      setActiveLabelMode(mode);
    }
  }


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
                    {activeDataset ? `Chọn một chế độ (Mua/Bán/Giữ) sau đó nhấp vào biểu đồ để đặt nhãn.` : "Chọn một bộ dữ liệu từ bảng trên để bắt đầu"}
                </CardDescription>
                </CardHeader>
                <CardContent>
                {activeDataset && fullChartData.length > 0 ? (
                    <div className="flex flex-col items-center">
                        <CandlestickChart 
                            data={fullChartData} 
                            markers={currentMarkers}
                            onCrosshairMove={handleCrosshairMove} 
                            onChartClick={handleChartClick}
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
                            <div className="font-mono text-xs text-muted-foreground flex gap-4">
                                <span>Time: {new Date((hoveredDataPoint.time as number) * 1000).toLocaleString('vi-VN')}</span>
                                <span>O: {hoveredDataPoint.open.toFixed(2)}</span>
                                <span>H: {hoveredDataPoint.high.toFixed(2)}</span>
                                <span>L: {hoveredDataPoint.low.toFixed(2)}</span>
                                <span>C: {hoveredDataPoint.close.toFixed(2)}</span>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">{activeLabelMode ? `Chế độ ${activeLabelMode}: Nhấp vào biểu đồ để đặt nhãn.` : 'Di chuyển chuột trên biểu đồ để xem chi tiết.'}</p>
                        )}
                    </div>

                    <div className="flex justify-center gap-2">
                        <Button 
                          variant={activeLabelMode === 'BUY' ? 'default' : 'outline'} 
                          size="lg" 
                          className={cn("h-12 w-20 flex-col", activeLabelMode === 'BUY' && 'border-green-500 ring-2 ring-green-500')} 
                          disabled={!activeDataset} 
                          onClick={() => toggleLabelMode('BUY')}
                        >
                            <ArrowUp className="h-5 w-5" />
                            <span className="text-xs">Mua</span>
                        </Button>
                        <Button 
                          variant={activeLabelMode === 'HOLD' ? 'default' : 'outline'} 
                          size="lg" 
                          className={cn("h-12 w-20 flex-col", activeLabelMode === 'HOLD' && 'border-gray-500 ring-2 ring-gray-500')} 
                          disabled={!activeDataset} 
                          onClick={() => toggleLabelMode('HOLD')}
                        >
                            <Circle className="h-5 w-5" />
                            <span className="text-xs">Giữ</span>
                        </Button>
                        <Button 
                          variant={activeLabelMode === 'SELL' ? 'destructive' : 'outline'} 
                          size="lg" className={cn("h-12 w-20 flex-col", activeLabelMode === 'SELL' && 'border-red-500 ring-2 ring-red-500')} 
                          disabled={!activeDataset} 
                          onClick={() => toggleLabelMode('SELL')}
                        >
                            <ArrowDown className="h-5 w-5" />
                            <span className="text-xs">Bán</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
