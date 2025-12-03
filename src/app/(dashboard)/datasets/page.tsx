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
  MoreHorizontal,
  ThumbsDown,
  ThumbsUp,
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

const datasets: Dataset[] = [
  {
    id: "ds-001",
    name: "EURUSD_H1_2023",
    status: "Labeled",
    itemCount: 17800,
    createdAt: "2023-10-01",
  },
  {
    id: "ds-002",
    name: "BTCUSD_M5_2024_Q1",
    status: "Processing",
    itemCount: 89500,
    createdAt: "2024-03-15",
  },
  {
    id: "ds-003",
    name: "SPX500_Tick_2024_05",
    status: "Raw",
    itemCount: 2450230,
    createdAt: "2024-05-20",
  },
  {
    id: "ds-004",
    name: "NASDAQ_Futures_H4",
    status: "Labeled",
    itemCount: 9800,
    createdAt: "2022-11-30",
  },
];

const statusDisplay: { [key: string]: string } = {
  Labeled: "Đã gán nhãn",
  Processing: "Đang xử lý",
  Raw: "Thô",
};

const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
];

const chartConfig = {
  visitors: {
    label: "Lượt truy cập",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Khác",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function DatasetsPage() {
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
                      <TableRow key={dataset.id}>
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
                              <DropdownMenuItem>Gán nhãn tự động</DropdownMenuItem>
                              <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
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
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Tải lên Dữ liệu</CardTitle>
                <CardDescription>
                  Tải lên tệp CSV mới để tạo một bộ dữ liệu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="data-file">Tệp CSV</Label>
                  <Input id="data-file" type="file" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  <FileUp className="mr-2 h-4 w-4" /> Tải lên
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Gán nhãn Thủ công</CardTitle>
                <CardDescription>
                  Gán nhãn các điểm dữ liệu cho EURUSD_H1_2023.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-[150px]"
                  >
                    <BarChart accessibilityLayer data={chartData.slice(0, 1)}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="browser"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="visitors" radius={8} />
                    </BarChart>
                  </ChartContainer>
                  <p className="text-sm text-muted-foreground mt-4">
                    Nến lúc 2023-10-01 14:00
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12 border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-600">
                  <ThumbsUp />
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600">
                  <ThumbsDown />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
