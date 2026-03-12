import { Navigate } from "react-router-dom";

const isGiaoVien = () => {
  const name = sessionStorage.getItem("name") || "";

  return (
    name.toLowerCase().includes("giao viên") ||
    name.toLowerCase().includes("giáo viên")
  );
};

// Các path giáo viên được phép vào
const GIAO_VIEN_ALLOWED = [
  "/quan-ly-hoc-vien-ly-thuyet",
  "/thanh-vien-lop-hoc",
];

export function GiaoVienGuard({ children, path }) {
  if (!isGiaoVien()) return children;

  const allowed = GIAO_VIEN_ALLOWED.some((p) => path?.startsWith(p));
  if (!allowed) return <Navigate to="/quan-ly-hoc-vien-ly-thuyet" replace />;

  return children;
}
