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
import TruyXuatLoi from "./pages/dat/TruyXuatLoi";
import { GiaoVienGuard } from "./components/RoleGuard";
import DashboardDAT from "./pages/dat/DashboardDAT";
import HocVienTheoGiaoVien from "./pages/dat/HocVienTheoGiaoVien";
import ThemDuLieuVaoHeThong from "./pages/add-data/ThemDuLieuVaoHeThong";
import DashboardLyThuyet from "./pages/class/DashboardLYThuyet";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

const GuardedRoute = ({ element, path }) => (
  <GiaoVienGuard path={path}>{element}</GiaoVienGuard>
);

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
              <Route
                index
                element={<GuardedRoute path="/" element={<Dashboard />} />}
              />
              <Route
                path="dashboard"
                element={
                  <GuardedRoute path="/dashboard" element={<Dashboard />} />
                }
              />
              <Route
                path="/map"
                element={
                  <GuardedRoute path="/map" element={<TrackingPage />} />
                }
              />

              {/* Lý thuyết - giáo viên được phép */}
              <Route path="/thanh-vien-lop-hoc" element={<Member />} />
              <Route
                path="/quan-ly-hoc-vien-ly-thuyet"
                element={<QuanLyHocVienLyThuyet />}
              />

              {/* Các route còn lại cần guard */}
              <Route
                path="class-management"
                element={
                  <GuardedRoute
                    path="/class-management"
                    element={<ClassManagement />}
                  />
                }
              />
              <Route
                path="lich-cabin"
                element={
                  <GuardedRoute path="/lich-cabin" element={<LichCabin />} />
                }
              />
              <Route
                path="hoc-bu-cabin"
                element={
                  <GuardedRoute path="/hoc-bu-cabin" element={<BuCaBin />} />
                }
              />
              <Route
                path="danh-sach-cabin"
                element={
                  <GuardedRoute
                    path="/danh-sach-cabin"
                    element={<DanhSachChiaCabin />}
                  />
                }
              />
              <Route
                path="student-report"
                element={
                  <GuardedRoute
                    path="/student-report"
                    element={<SearchStudents />}
                  />
                }
              />
              <Route
                path="check-full-course"
                element={
                  <GuardedRoute
                    path="/check-full-course"
                    element={<KiemTraToanKhoa />}
                  />
                }
              />
              <Route
                path="hoc-vien-ky-dat"
                element={
                  <GuardedRoute
                    path="/hoc-vien-ky-dat"
                    element={<HocVienKyDAT />}
                  />
                }
              />
              <Route
                path="sync-teacher-car"
                element={
                  <GuardedRoute
                    path="/sync-teacher-car"
                    element={<DongBoGiaoVienVaoXe />}
                  />
                }
              />
              <Route
                path="sync-student-car"
                element={
                  <GuardedRoute
                    path="/sync-student-car"
                    element={<DongBoHocVienVaoXe />}
                  />
                }
              />
              <Route
                path="annual-check"
                element={
                  <GuardedRoute
                    path="/annual-check"
                    element={<KiemTraHangNam />}
                  />
                }
              />
              <Route
                path="truy-vet-loi"
                element={
                  <GuardedRoute
                    path="/truy-vet-loi"
                    element={<TruyXuatLoi />}
                  />
                }
              />
              <Route
                path="dashboard-dat"
                element={
                  <GuardedRoute
                    path="/dashboard-dat"
                    element={<DashboardDAT />}
                  />
                }
              />
              <Route
                path="hoc-vien-theo-giao-vien"
                element={
                  <GuardedRoute
                    path="/hoc-vien-theo-giao-vien"
                    element={<HocVienTheoGiaoVien />}
                  />
                }
              />
              <Route
                path="dashboard-ly-thuyet"
                element={
                  <GuardedRoute
                    path="/dashboard-ly-thuyet"
                    element={<DashboardLyThuyet />}
                  />
                }
              />
              <Route path="them-du-lieu" element={<ThemDuLieuVaoHeThong />} />
            </Route>
            <Route path="kiem-tra-hoc-vien" element={<KiemTraPublic />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
