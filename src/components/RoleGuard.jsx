import { Navigate } from "react-router-dom";
import { checkPermission } from "../util/permission";

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
  if (isGiaoVien()) {
    const allowed = GIAO_VIEN_ALLOWED.some((p) => path?.startsWith(p));
    if (!allowed) return <Navigate to="/quan-ly-hoc-vien-ly-thuyet" replace />;
    return children;
  }

  if (path) {
    const hasViewPermission = checkPermission(path, "view");
    if (!hasViewPermission) {
      // Tìm route đầu tiên mà user có quyền xem để redirect tới đó
      const permissionsStr = sessionStorage.getItem("permissions");
      let redirectRoute = null;
      if (permissionsStr) {
        try {
          const permissions = JSON.parse(permissionsStr);
          if (Array.isArray(permissions)) {
            const firstAllowed = permissions.find((p) => p.view);
            if (firstAllowed) {
              redirectRoute = firstAllowed.route;
            }
          }
        } catch {
          // Bỏ qua
        }
      }
      if (redirectRoute) {
        return <Navigate to={redirectRoute} replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
