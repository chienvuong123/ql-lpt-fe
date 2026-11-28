import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import viVN from "antd/locale/vi_VN";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
const SearchStudents = lazy(() => import("./pages/SearchStudents"));
const StudentDetail = lazy(() => import("./pages/StudentDetail"));
const Login = lazy(() => import("./pages/auth/LoginAntd"));
import LayoutApp from "./components/LayoutApp";
const Dashboard = lazy(() => import("./pages/dashboard"));
const DongBoGiaoVienVaoXe = lazy(() => import("./pages/synchronous/DongBoGiaoVienVaoXe"));
const DongBoHocVienVaoXe = lazy(() => import("./pages/synchronous/DongBoHocVienVaoXe"));
const TrackingPage = lazy(() => import("./pages/map/TrackingPage"));
const AccountManagement = lazy(() => import("./pages/user/AccountManagement"));
const Member = lazy(() => import("./pages/class/Member"));
const KiemTraToanKhoa = lazy(() => import("./pages/checks/KiemTraToanKhoa"));
const KiemTraHangNam = lazy(() => import("./pages/checks/KiemTraHangNam"));
import LayoutTest from "./components/LayoutTest";
const DangNhapLopLyThuyet = lazy(() => import("./pages/auth/DangNhapLopLyThuyet"));
const DanhSachChiaCabin = lazy(() => import("./pages/cabin/DanhSachChiaCabin"));
const HocVienKyDAT = lazy(() => import("./pages/dat/HocVienKyDAT"));
const LichCabin = lazy(() => import("./pages/cabin/LichCabin"));
const BuCaBin = lazy(() => import("./pages/cabin/BuCaBin"));
const KiemTraPublic = lazy(() => import("./pages/checks/KiemTraPublic"));
const QuanLyHocVienLyThuyet = lazy(() => import("./pages/class/QuanLyHocVienLyThuyet"));
const TruyXuatLoi = lazy(() => import("./pages/dat/TruyXuatLoi"));
import { GiaoVienGuard } from "./components/RoleGuard";
const DashboardDAT = lazy(() => import("./pages/dat/DashboardDAT"));
const HocVienTheoGiaoVien = lazy(() => import("./pages/dat/HocVienTheoGiaoVien"));
const ThemDuLieuVaoHeThong = lazy(() => import("./pages/add-data/ThemDuLieuVaoHeThong"));
const DashboardLyThuyet = lazy(() => import("./pages/class/DashboardLYThuyet"));
const KiemTraTrungXeGiaoVien = lazy(() => import("./pages/dat/KiemTraTrungXeGiaoVien"));
const KiemTraDuLieuTotNghiep = lazy(() => import("./pages/checks/KiemTraDuLieuTotNghiep"));
const TienDoDaoTao = lazy(() => import("./pages/add-data/TienDoDaoTao"));
const DashboardCabin = lazy(() => import("./pages/cabin/DashboardCabin"));
const HocBuLyThuyet = lazy(() => import("./pages/class/HocBuLyThuyet"));
// import HocBuDAT from "./pages/dat/HocBuDat";
const DanhSachLyThuyet = lazy(() => import("./pages/make-up-lessons/ly-thuyet/DanhSachLyThuyet"));
const TienDoHocBuLyThuyet = lazy(() => import("./pages/make-up-lessons/ly-thuyet/TienDoHocBuLyThuyet"));

const DanhSachThucHanh = lazy(() => import("./pages/make-up-lessons/thuc-hanh/DanhSachThucHanh"));
const TienDoHocBuThucHanh = lazy(() => import("./pages/make-up-lessons/thuc-hanh/TienDoHocBuThucHanh"));
const HocBu = lazy(() => import("./pages/make-up-lessons/HocBu"));
const DanhSachHocVienBuThucHanh = lazy(() => import("./pages/make-up-lessons/thuc-hanh/DanhSachHocVienBuThucHanh"));
const HocBuDAT = lazy(() => import("./pages/dat/hoc-bu/HocBuDAT"));
const DanhSachChoXepLopThucHanh = lazy(() => import("./pages/make-up-lessons/thuc-hanh/DanhSachChoXepLopThucHanh"));
const DanhSachDangHocBuThucHanh = lazy(() => import("./pages/make-up-lessons/thuc-hanh/DanhSachDangHocBuThucHanh"));
const DanhSachChoXepLopLyThuyet = lazy(() => import("./pages/make-up-lessons/ly-thuyet/DanhSachChoXepLopLyThuyet"));
const DanhSachDangHocBuLyThuyet = lazy(() => import("./pages/make-up-lessons/ly-thuyet/DanhSachDangHocBuLyThuyet"));
const CaiDatHeThong = lazy(() => import("./pages/setting/CaiDatHeThong"));
const ForbiddenZonePage = lazy(() => import("./pages/map/ForbiddenZonePage"));
const Xe = lazy(() => import("./pages/add-data/Xe"));
const DangKyXeGiaoVien = lazy(() => import("./pages/add-data/DangKyXeGiaoVien"));
const UyQuyen = lazy(() => import("./pages/add-data/UyQuyen"));
const DSKyNhanHoSoVaGPLX = lazy(() => import("./pages/orther/DSKyNhanHoSoVaGPLX"));
const GplxHoan = lazy(() => import("./pages/orther/GplxHoan"));
const KeToan = lazy(() => import("./pages/ke-toan/PhongKeToan"));
const KetQuaSatHach = lazy(() => import("./pages/sat-hach/KetQuaSatHach"));
const TongQuanTiepSinh = lazy(() => import("./pages/tiep-sinh/TongQuanTiepSinh"));
const TiepNhanHoSo = lazy(() => import("./pages/tiep-sinh/TiepNhanHoSo"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

// Vòng tải khi mở trang lần đầu (code từng trang được tải riêng khi cần)
export const PageLoading = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
    <Spin size="large" />
  </div>
);

const GuardedRoute = ({ element, path }) => (
  <GiaoVienGuard path={path}>{element}</GiaoVienGuard>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <Suspense fallback={<PageLoading />}>
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
              <Route
                path="gplx-hoan"
                element={<GuardedRoute path="/gplx-hoan" element={<GplxHoan />} />}
              />
              <Route
                path="ke-toan"
                element={<GuardedRoute path="/ke-toan" element={<KeToan />} />}
              />
              <Route
                path="ket-qua-sat-hach"
                element={<GuardedRoute path="/ket-qua-sat-hach" element={<KetQuaSatHach />} />}
              />
              <Route
                path="tiep-sinh"
                element={<GuardedRoute path="/tiep-sinh" element={<TongQuanTiepSinh />} />}
              />
              <Route
                path="tiep-nhan-ho-so"
                element={<GuardedRoute path="/tiep-nhan-ho-so" element={<TiepNhanHoSo />} />}
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
          </Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
