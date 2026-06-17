import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import SearchStudents from "./pages/SearchStudents";
import StudentDetail from "./pages/StudentDetail";
import Login from "./pages/auth/LoginAntd";
import LayoutApp from "./components/LayoutApp";
import Dashboard from "./pages/dashboard";
import DongBoGiaoVienVaoXe from "./pages/synchronous/DongBoGiaoVienVaoXe";
import DongBoHocVienVaoXe from "./pages/synchronous/DongBoHocVienVaoXe";
import TrackingPage from "./pages/map/TrackingPage";
import AccountManagement from "./pages/user/AccountManagement";
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
import KiemTraTrungXeGiaoVien from "./pages/dat/KiemTraTrungXeGiaoVien";
import KiemTraDuLieuTotNghiep from "./pages/checks/KiemTraDuLieuTotNghiep";
import TienDoDaoTao from "./pages/add-data/TienDoDaoTao";
import DashboardCabin from "./pages/cabin/DashboardCabin";
import HocBuLyThuyet from "./pages/class/HocBuLyThuyet";
// import HocBuDAT from "./pages/dat/HocBuDat";
import DanhSachLyThuyet from "./pages/make-up-lessons/ly-thuyet/DanhSachLyThuyet";
import TienDoHocBuLyThuyet from "./pages/make-up-lessons/ly-thuyet/TienDoHocBuLyThuyet";

import DanhSachThucHanh from "./pages/make-up-lessons/thuc-hanh/DanhSachThucHanh";
import TienDoHocBuThucHanh from "./pages/make-up-lessons/thuc-hanh/TienDoHocBuThucHanh";
import HocBu from "./pages/make-up-lessons/HocBu";
import DanhSachHocVienBuThucHanh from "./pages/make-up-lessons/thuc-hanh/DanhSachHocVienBuThucHanh";
import HocBuDAT from "./pages/dat/hoc-bu/HocBuDAT";
import DanhSachChoXepLopThucHanh from "./pages/make-up-lessons/thuc-hanh/DanhSachChoXepLopThucHanh";
import DanhSachDangHocBuThucHanh from "./pages/make-up-lessons/thuc-hanh/DanhSachDangHocBuThucHanh";
import DanhSachChoXepLopLyThuyet from "./pages/make-up-lessons/ly-thuyet/DanhSachChoXepLopLyThuyet";
import DanhSachDangHocBuLyThuyet from "./pages/make-up-lessons/ly-thuyet/DanhSachDangHocBuLyThuyet";
import CaiDatHeThong from "./pages/setting/CaiDatHeThong";
import ForbiddenZonePage from "./pages/map/ForbiddenZonePage";
import Xe from "./pages/add-data/Xe";
import DangKyXeGiaoVien from "./pages/add-data/DangKyXeGiaoVien";
import UyQuyen from "./pages/add-data/UyQuyen";
import DSKyNhanHoSoVaGPLX from "./pages/orther/DSKyNhanHoSoVaGPLX";

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
              <Route index element={<GuardedRoute path="/student-report" element={<SearchStudents />} />} />
              <Route path="student/:id" element={<GuardedRoute path="/student-report" element={<StudentDetail />} />} />
            </Route>
            {/* roter mới khuyên dùng */}
            <Route path="/" element={<LayoutTest />}>
              <Route
                index
                element={<GuardedRoute path="/" element={<Dashboard />} />}
              />
              <Route
                path="tai-khoan"
                element={<GuardedRoute path="/tai-khoan" element={<AccountManagement />} />}
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
              <Route
                path="/thanh-vien-lop-hoc"
                element={<GuardedRoute path="/thanh-vien-lop-hoc" element={<Member />} />}
              />
              <Route
                path="/quan-ly-hoc-vien-ly-thuyet"
                element={<GuardedRoute path="/quan-ly-hoc-vien-ly-thuyet" element={<QuanLyHocVienLyThuyet />} />}
              />

              {/* Các route còn lại cần guard */}
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
                path="kiem-tra-trung-xe-giao-vien"
                element={
                  <GuardedRoute
                    path="/kiem-tra-trung-xe-giao-vien"
                    element={<KiemTraTrungXeGiaoVien />}
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
              <Route
                path="hoc-bu-ly-thuyet"
                element={
                  <GuardedRoute
                    path="/hoc-bu-ly-thuyet"
                    element={<HocBuLyThuyet />}
                  />
                }
              />
              <Route
                path="hoc-bu-dat"
                element={
                  <GuardedRoute
                    path="/hoc-bu-dat"
                    element={<HocBuDAT />}
                  />
                }
              />
              <Route
                path="danh-sach-hoc-bu"
                element={
                  <GuardedRoute
                    path="/danh-sach-hoc-bu"
                    element={<HocBu />}
                  />
                }
              />
              <Route
                path="danh-sach-ly-thuyet"
                element={
                  <GuardedRoute
                    path="/danh-sach-ly-thuyet"
                    element={<DanhSachLyThuyet />}
                  />
                }
              />
              <Route
                path="danh-sach-cho-xep-lop-ly-thuyet"
                element={
                  <GuardedRoute
                    path="/danh-sach-cho-xep-lop-ly-thuyet"
                    element={<DanhSachChoXepLopLyThuyet />}
                  />
                }
              />
              <Route
                path="danh-sach-dang-hoc-bu-ly-thuyet"
                element={
                  <GuardedRoute
                    path="/danh-sach-dang-hoc-bu-ly-thuyet"
                    element={<DanhSachDangHocBuLyThuyet />}
                  />
                }
              />
              <Route
                path="tien-do-hoc-bu-ly-thuyet"
                element={
                  <GuardedRoute
                    path="/tien-do-hoc-bu-ly-thuyet"
                    element={<TienDoHocBuLyThuyet />}
                  />
                }
              />

              <Route
                path="danh-sach-thuc-hanh"
                element={
                  <GuardedRoute
                    path="/danh-sach-thuc-hanh"
                    element={<DanhSachThucHanh />}
                  />
                }
              />
              <Route
                path="danh-sach-cho-xep-lop-thuc-hanh"
                element={
                  <GuardedRoute
                    path="/danh-sach-cho-xep-lop-thuc-hanh"
                    element={<DanhSachChoXepLopThucHanh />}
                  />
                }
              />
              <Route
                path="danh-sach-dang-hoc-bu-thuc-hanh"
                element={
                  <GuardedRoute
                    path="/danh-sach-dang-hoc-bu-thuc-hanh"
                    element={<DanhSachDangHocBuThucHanh />}
                  />
                }
              />
              <Route
                path="tien-do-hoc-bu-thuc-hanh"
                element={
                  <GuardedRoute
                    path="/tien-do-hoc-bu-thuc-hanh"
                    element={<TienDoHocBuThucHanh />}
                  />
                }
              />
              <Route
                path="danh-sach-hoc-vien-bu-thuc-hanh"
                element={
                  <GuardedRoute
                    path="/danh-sach-hoc-vien-bu-thuc-hanh"
                    element={<DanhSachHocVienBuThucHanh />}
                  />
                }
              />
              <Route
                path="dong-bo-du-lieu-he-thong"
                element={<GuardedRoute path="/dong-bo-du-lieu-he-thong" element={<ThemDuLieuVaoHeThong />} />}
              />
              <Route
                path="tien-do-dao-tao"
                element={<GuardedRoute path="/tien-do-dao-tao" element={<TienDoDaoTao />} />}
              />
              <Route
                path="danh-sach-xe"
                element={<GuardedRoute path="/danh-sach-xe" element={<Xe />} />}
              />
              <Route
                path="dang-ky-xe-giao-vien"
                element={<GuardedRoute path="/dang-ky-xe-giao-vien" element={<DangKyXeGiaoVien />} />}
              />
              <Route
                path="quan-ly-uy-quyen"
                element={<GuardedRoute path="/quan-ly-uy-quyen" element={<UyQuyen />} />}
              />
              <Route
                path="kiem-tra-hoc-vien-sau-tot-nghiep"
                element={<GuardedRoute path="/kiem-tra-hoc-vien-sau-tot-nghiep" element={<KiemTraDuLieuTotNghiep />} />}
              />
              <Route
                path="dashboard-cabin"
                element={<GuardedRoute path="/dashboard-cabin" element={<DashboardCabin />} />}
              />
              <Route
                path="cai-dat-he-thong"
                element={<GuardedRoute path="/cai-dat-he-thong" element={<CaiDatHeThong />} />}
              />
              <Route
                path="danh-sach-ky-nhan-ho-so-gplx"
                element={<GuardedRoute path="/danh-sach-ky-nhan-ho-so-gplx" element={<DSKyNhanHoSoVaGPLX />} />}
              />
            </Route>
            <Route path="kiem-tra-hoc-vien" element={<KiemTraPublic />} />
            <Route
              path="lich-cabin"
              element={
                <GuardedRoute path="/lich-cabin" element={<LichCabin />} />
              }
            />
            <Route
              path="quan-ly-vung-cam"
              element={
                <GuardedRoute path="/quan-ly-vung-cam" element={<ForbiddenZonePage />} />
              }
            />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
