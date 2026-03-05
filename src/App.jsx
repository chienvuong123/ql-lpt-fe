import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import SearchStudents from "./pages/SearchStudents";
import StudentDetail from "./pages/StudentDetail";
import Login from "./pages/auth/LoginAntd";
import LayoutApp from "./components/LayoutApp";
import LayoutDashboard from "./components/LayoutDashboard";
import Dashboard from "./pages/dashboard";
import DongBoGiaoVienVaoXe from "./pages/synchronous/DongBoGiaoVienVaoXe";
import DongBoHocVienVaoXe from "./pages/synchronous/DongBoHocVienVaoXe";
import TrackingPage from "./pages/map/TrackingPage";
import AccountManagement from "./pages/user/AccountManagement";
import ClassManagement from "./pages/class/ClassManagement";
import Member from "./pages/class/Member";
import KiemTraToanKhoa from "./pages/checks/KiemTraToanKhoa";
import KiemTraHangNam from "./pages/checks/KiemTraHangNam";
import LayoutTest from "./components/LayoutTest";
import DangNhapLopLyThuyet from "./pages/auth/DangNhapLopLyThuyet";
import DanhSachChiaCabin from "./pages/cabin/DanhSachChiaCabin";
import HocVienKyDAT from "./pages/dat/HocVienKyDAT";
import LichCabin from "./pages/cabin/LichCabin";
import BuCaBin from "./pages/cabin/BuCaBin";
import KiemTraPublic from "./pages/checks/KiemTraPublic";
import QuanLyHocVienLyThuyet from "./pages/class/QuanLyHocVienLyThuyet";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login-ly-thuyet" element={<DangNhapLopLyThuyet />} />
            <Route path="/tim-hoc-vien" element={<LayoutApp />}>
              <Route index element={<SearchStudents />} />
              <Route path="student/:id" element={<StudentDetail />} />
            </Route>
            {/* roter mới khuyên dùng */}
            <Route path="/" element={<LayoutTest />}>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Map */}
              <Route path="/map" element={<TrackingPage />} />

              {/* Lớp học lý thuyết */}
              <Route path="/thanh-vien-lop-hoc" element={<Member />} />
              <Route
                path="/quan-ly-hoc-vien-ly-thuyet"
                element={<QuanLyHocVienLyThuyet />}
              />
              <Route path="class-management" element={<ClassManagement />} />

              {/* CABIN */}
              <Route path="lich-cabin" element={<LichCabin />} />
              <Route path="hoc-bu-cabin" element={<BuCaBin />} />
              <Route path="danh-sach-cabin" element={<DanhSachChiaCabin />} />

              {/* DAT */}
              <Route path="student-report" element={<SearchStudents />} />
              <Route path="check-full-course" element={<KiemTraToanKhoa />} />
              <Route path="hoc-vien-ky-dat" element={<HocVienKyDAT />} />

              {/* Đồng bộ */}
              <Route
                path="sync-teacher-car"
                element={<DongBoGiaoVienVaoXe />}
              />
              <Route path="sync-student-car" element={<DongBoHocVienVaoXe />} />

              {/* Kiểm tra */}
              <Route path="annual-check" element={<KiemTraHangNam />} />
            </Route>
            <Route path="kiem-tra-hoc-vien" element={<KiemTraPublic />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
