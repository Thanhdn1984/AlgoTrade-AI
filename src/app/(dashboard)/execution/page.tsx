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
          <CardTitle className="text-2xl font-headline">Dịch vụ Thực thi</CardTitle>
          <CardDescription>
            Dịch vụ này đọc các tín hiệu được tạo và thực hiện giao dịch qua API của nhà môi giới.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center">
              <ShieldCheck className="h-6 w-6 mr-3 text-green-500" />
              <div>
                <p className="font-semibold">Trạng thái Dịch vụ</p>
                <p className="text-sm text-muted-foreground">Tất cả các hệ thống đang hoạt động.</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-500/20 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                Trực tuyến
            </Badge>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
             <div className="flex items-center mb-2">
                <Terminal className="h-4 w-4 mr-2" />
                <h3 className="font-semibold text-sm">Chi tiết Dịch vụ</h3>
             </div>
             <p className="text-sm text-muted-foreground">
                Dịch vụ thực thi là một ứng dụng backend riêng biệt và an toàn. Nó chịu trách nhiệm kiểm tra rủi ro, tính bất biến (idempotency), và giao tiếp với API của nhà môi giới như MT5/Exness. Nó hoạt động độc lập với giao diện người dùng này để đảm bảo an toàn và độ tin cậy tối đa.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
