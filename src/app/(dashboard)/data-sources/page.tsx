import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Upload } from "lucide-react";

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Nguồn Dữ Liệu</h1>
        <p className="text-muted-foreground">
          Cách nhập dữ liệu từ các nguồn bên ngoài như MetaTrader 5 (MT5).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M13 13L18 18L13 23"/><path d="M18 18L23 13L18 8"/><path d="M18 18L8 18"/><path d="M11 11L6 6L11 1"/><path d="M6 6L1 11L6 16"/><path d="M6 6L16 6"/></svg>
            <CardTitle className="font-headline">Kết nối với MetaTrader 5 (MT5)</CardTitle>
          </div>
          <CardDescription>
            Tích hợp trực tiếp không được hỗ trợ vì lý do bảo mật. Hãy làm theo các bước sau để nhập dữ liệu của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Bước 1: Xuất dữ liệu từ MT5</h3>
              <p className="text-sm text-muted-foreground">
                Trong MT5 Terminal của bạn, vào menu "Tools" và chọn "History Center". Chọn mã giao dịch và khung thời gian mong muốn, sau đó nhấp vào "Export". Lưu tệp ở định dạng CSV. Đảm bảo các cột bao gồm ít nhất Ngày, Mở, Cao, Thấp, Đóng và Khối lượng.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Bước 2: Tải lên CSV vào AlgoTrade AI</h3>
              <p className="text-sm text-muted-foreground">
                Điều hướng đến trang "Bộ dữ liệu" trong ứng dụng này. Sử dụng thẻ "Tải lên Dữ liệu" để chọn và tải lên tệp CSV bạn vừa xuất từ MT5.
              </p>
            </div>
          </div>

           <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Tại sao lại dùng phương pháp này?</h3>
              <p className="text-sm text-muted-foreground">
                Quy trình xuất-nhập thủ công này đảm bảo an toàn cho thông tin đăng nhập tài khoản giao dịch của bạn. Nó giữ cho môi trường giao dịch trực tiếp của bạn hoàn toàn tách biệt khỏi công cụ phân tích dựa trên web này, đây là tiêu chuẩn thực hành tốt nhất trong ngành.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
