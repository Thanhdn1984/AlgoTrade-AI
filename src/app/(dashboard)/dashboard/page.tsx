'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Cpu, Database, Signal, TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

const chartData = [
  { month: "Tháng 1", profit: 186, loss: 80 },
  { month: "Tháng 2", profit: 305, loss: 200 },
  { month: "Tháng 3", profit: 237, loss: 120 },
  { month: "Tháng 4", profit: 73, loss: 190 },
  { month: "Tháng 5", profit: 209, loss: 130 },
  { month: "Tháng 6", profit: 214, loss: 140 },
];

const chartConfig = {
  profit: {
    label: "Lợi nhuận",
    color: "hsl(var(--chart-1))",
  },
  loss: {
    label: "Thua lỗ",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const recentSignals = [
  { symbol: "AAPL", type: "BUY", confidence: 0.92, status: "Executed" },
  { symbol: "GOOGL", type: "SELL", confidence: 0.88, status: "Executed" },
  { symbol: "TSLA", type: "HOLD", confidence: 0.95, status: "Pending" },
  { symbol: "AMZN", type: "BUY", confidence: 0.76, status: "Failed" },
  { symbol: "MSFT", type: "SELL", confidence: 0.99, status: "Executed" },
];

const signalTypeDisplay: { [key: string]: string } = {
  BUY: "MUA",
  SELL: "BÁN",
  HOLD: "GIỮ",
};

const statusDisplay: { [key: string]: string } = {
    Executed: "Đã thực thi",
    Pending: "Đang chờ",
    Failed: "Thất bại"
};


export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Tín hiệu
            </CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mô hình hoạt động
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              2 đang được huấn luyện
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bot thực thi
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Tất cả hệ thống đang hoạt động
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bộ dữ liệu</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              +5 so với tuần trước
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <TrendingUp className="mr-2" />
              Hiệu suất Tín hiệu
            </CardTitle>
            <CardDescription>
              Tổng quan lợi nhuận và thua lỗ hàng tháng.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                 <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value}`}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Line
                  dataKey="profit"
                  type="monotone"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={true}
                />
                <Line
                  dataKey="loss"
                  type="monotone"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Tín hiệu Gần đây</CardTitle>
            <CardDescription>
              5 tín hiệu được tạo gần đây nhất.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Độ tin cậy</TableHead>
                  <TableHead className="text-right">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSignals.map((signal) => (
                  <TableRow key={signal.symbol}>
                    <TableCell className="font-medium">{signal.symbol}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          signal.type === "BUY"
                            ? "default"
                            : signal.type === "SELL"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {signalTypeDisplay[signal.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{`${(
                      signal.confidence * 100
                    ).toFixed(0)}%`}</TableCell>
                     <TableCell className="text-right">
                        <Badge variant={
                            signal.status === "Executed" ? "default" : signal.status === "Failed" ? "destructive" : "outline"
                        }
                        className="bg-opacity-20"
                        >
                            {statusDisplay[signal.status]}
                        </Badge>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
