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
            <Route path="/tim-hoc-vien" element={<LayoutApp />}>
              <Route index element={<SearchStudents />} />
              <Route path="student/:id" element={<StudentDetail />} />
            </Route>
            {/* <Route path="/" element={<LayoutDashboard />}>
              <Route index element={<Dashboard />} />
              <Route
                path="dong-bo-giao-vien-ve-xe"
                element={<DongBoGiaoVienVaoXe />}
              />
              <Route
                path="dong-bo-hoc-vien-ve-xe"
                element={<DongBoHocVienVaoXe />}
              />
              <Route path="/tai-khoan" element={<AccountManagement />} />
              <Route path="/lop-hoc-ly-thuyet" element={<ClassManagement />} />
              <Route path="/kiem-tra-toan-khoa" element={<KiemTraToanKhoa />} />
              <Route path="/kiem-tra-hang-nam" element={<KiemTraHangNam />} />
              </Route> */}
            <Route path="/" element={<LayoutTest />}>
              <Route path="/map" element={<TrackingPage />} />
              <Route path="/thanh-vien-lop-hoc" element={<Member />} />
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="class-management" element={<ClassManagement />} />
              <Route path="student-report" element={<SearchStudents />} />
              <Route path="check-full-course" element={<KiemTraToanKhoa />} />
              <Route
                path="sync-teacher-car"
                element={<DongBoGiaoVienVaoXe />}
              />
              <Route path="sync-student-car" element={<DongBoHocVienVaoXe />} />
              <Route path="annual-check" element={<KiemTraHangNam />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
