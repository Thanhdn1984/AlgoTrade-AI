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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import type { Dataset } from "@/lib/types";
import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from 'react-dom';
import { uploadFileAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Data Types ---
type ChartDataPoint = { time: string; value: number; raw: string; };
type ParsedData = { [key: string]: ChartDataPoint[] };


// --- Components for Upload ---

type UploadState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  newDataset?: Dataset | null;
  fileContent?: string | null;
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

function UploadCard({ onUploadSuccess }: { onUploadSuccess: (newDataset: Dataset, parsedData: ChartDataPoint[]) => void }) {
  const [state, formAction] = useActionState(uploadFileAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const lastProcessedId = useRef<string | null>(null);

  const parseCSV = (content: string): ChartDataPoint[] => {
    const rows = content.split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return [];

    const headers = rows.shift()!.split(/\s+|,/).map(h => h.trim().toLowerCase().replace(/[<>]/g, ''));
    
    const findIndexFlexible = (possibleNames: string[]) => {
      return headers.findIndex(header =>
        possibleNames.some(name => header.includes(name))
      );
    };
  
    const closeIndex = findIndexFlexible(['close', 'last']);
    const dateIndex = findIndexFlexible(['date']);
    const timeIndex = findIndexFlexible(['time']);
  
    if (closeIndex === -1 || (dateIndex === -1 && timeIndex === -1)) {
      toast({
        variant: 'destructive',
        title: 'Lỗi Phân tích CSV',
        description: `Không tìm thấy các cột cần thiết. Cần cột 'Close'/'Last' và 'Time'/'Date'. Tìm thấy: ${headers.join(', ')}`,
      });
      return [];
    }
  
    return rows.map((row) => {
        const values = row.trim().split(/\s+/).filter(Boolean);
        const value = parseFloat(values[closeIndex]);
        
        let time = `Điểm`;
        if (dateIndex !== -1 && timeIndex !== -1) {
            time = `${values[dateIndex]} ${values[timeIndex]}`;
        } else if (timeIndex !== -1) {
            time = values[timeIndex];
        } else if (dateIndex !== -1) {
            time = values[dateIndex];
        }

        return { time, value, raw: row };
    }).filter(point => !isNaN(point.value));
  };


  useEffect(() => {
    if (state.status === 'success' && state.newDataset && state.fileContent) {
      // Use an ID ref to prevent processing the same success state multiple times
      if (state.newDataset.id !== lastProcessedId.current) {
        toast({
          title: 'Thành công!',
          description: state.message,
        });
        const parsedData = parseCSV(state.fileContent);
        if (parsedData.length > 0) {
            onUploadSuccess(state.newDataset, parsedData);
        }
        formRef.current?.reset();
        // Mark this success state as processed
        lastProcessedId.current = state.newDataset.id;
      }
    } else if (state.status === 'error' && state.message) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: state.message,
      });
      // Reset processed ID on error to allow retries
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


// --- Main Page Component ---

const initialDatasets: Dataset[] = [];
const initialChartData: ParsedData = {};

const statusDisplay: { [key: string]: string } = {
  Labeled: "Đã gán nhãn",
  Processing: "Đang xử lý",
  Raw: "Thô",
};

const chartConfig = {
  value: {
    label: "Giá trị",
  },
} satisfies ChartConfig;

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>(initialDatasets);
  const [parsedData, setParsedData] = useState<ParsedData>(initialChartData);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAddDataset = (newDataset: Dataset, newParsedData: ChartDataPoint[]) => {
    // Prevent adding duplicates
    setDatasets(prev => {
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


  const currentChartData = activeDataset ? parsedData[activeDataset.id] || [] : [];
  const currentDataPoint = currentChartData[currentIndex];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
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
                    {datasets.map((dataset) => (
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
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSetDataset(dataset); }}>Gán nhãn thủ công</DropdownMenuItem>
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <UploadCard onUploadSuccess={handleAddDataset} />
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Gán nhãn Thủ công</CardTitle>
                <CardDescription>
                  {activeDataset ? `Đang gán nhãn cho: ${activeDataset.name}` : "Chọn một bộ dữ liệu để bắt đầu"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeDataset && currentDataPoint ? (
                    <div className="flex flex-col items-center">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square h-[150px] w-full"
                    >
                        <BarChart accessibilityLayer data={[currentDataPoint]}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="time"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={8} />
                        </BarChart>
                    </ChartContainer>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                        Dữ liệu tại: {currentDataPoint.time} ({currentIndex + 1} / {currentChartData.length})
                        <br/>
                        <span className="font-mono text-xs">{currentDataPoint.raw}</span>
                    </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed rounded-lg">
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
                 <Button variant="outline" size="icon" onClick={handleNext} disabled={!activeDataset || currentIndex >= currentChartData.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                 </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
