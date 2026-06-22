import { useLocation } from "react-router-dom";

export const PERMISSION_TREE_TEMPLATE = [
  {
    key: "dashboard",
    name: "Dashboard",
    route: "/dashboard",
  },
  {
    key: "tien-do-dao-tao",
    name: "Tiến độ đào tạo",
    route: "/tien-do-dao-tao",
  },
  {
    key: "dao-tao",
    name: "Đào tạo",
    children: [
      { key: "danh-sach-xe", name: "Danh sách xe", route: "/danh-sach-xe" },
      { key: "quan-ly-uy-quyen", name: "Ủy quyền xe", route: "/quan-ly-uy-quyen" },
      { key: "dang-ky-xe-giao-vien", name: "Đăng ký xe, giáo viên", route: "/dang-ky-xe-giao-vien" },
    ]
  },
  {
    key: "class",
    name: "Lý thuyết",
    children: [
      { key: "dashboard-ly-thuyet", name: "Dashboard lý thuyết", route: "/dashboard-ly-thuyet" },
      { key: "quan-ly-hoc-vien-ly-thuyet", name: "Quản lý học viên", route: "/quan-ly-hoc-vien-ly-thuyet" },
      { key: "hoc-bu-ly-thuyet", name: "Học bù lý thuyết", route: "/hoc-bu-ly-thuyet" },
    ]
  },
  {
    key: "cabin",
    name: "Cabin",
    children: [
      { key: "dashboard-cabin", name: "Dashboard Cabin", route: "/dashboard-cabin" },
      { key: "danh-sach-cabin", name: "Danh sách học viên Cabin", route: "/danh-sach-cabin" },
      { key: "lich-cabin", name: "Chia lịch Cabin", route: "/lich-cabin" },
      { key: "hoc-bu-cabin", name: "Học bù Cabin", route: "/hoc-bu-cabin" },
    ]
  },
  {
    key: "reports",
    name: "DAT",
    children: [
      { key: "dashboard-dat", name: "Dashboard DAT", route: "/dashboard-dat" },
      { key: "student-report", name: "Báo cáo học viên", route: "/student-report" },
      { key: "hoc-bu-dat", name: "Học bù DAT", route: "/hoc-bu-dat" },
      { key: "hoc-vien-theo-giao-vien", name: "DS học viên theo GV", route: "/hoc-vien-theo-giao-vien" },
      { key: "kiem-tra-trung-xe-giao-vien", name: "Kiểm tra trùng xe, giáo viên", route: "/kiem-tra-trung-xe-giao-vien" },
      { key: "check-full-course", name: "Báo cáo học viên hàng loạt", route: "/check-full-course" },
      { key: "hoc-vien-ky-dat", name: "Danh sách học viên kí DAT", route: "/hoc-vien-ky-dat" },
      { key: "truy-vet-loi", name: "Truy vết lỗi", route: "/truy-vet-loi" },
      { key: "quan-ly-vung-cam", name: "Quản lý vùng cấm", route: "/quan-ly-vung-cam" },
    ]
  },
  {
    key: "sync",
    name: "Đồng bộ",
    children: [
      { key: "sync-teacher-car", name: "Đồng bộ giáo viên", route: "/sync-teacher-car" },
      { key: "sync-student-car", name: "Đồng bộ học viên", route: "/sync-student-car" },
    ]
  },
  {
    key: "them-du-lieu",
    name: "Thêm dữ liệu",
    children: [
      { key: "dong-bo-du-lieu-he-thong", name: "Đồng bộ dữ liệu hệ thống", route: "/dong-bo-du-lieu-he-thong" },
    ]
  },
  {
    key: "kiem-tra",
    name: "Kiểm tra",
    children: [
      { key: "kiem-tra-hoc-vien-sau-tot-nghiep", name: "Kiểm tra HV sau tốt nghiệp", route: "/kiem-tra-hoc-vien-sau-tot-nghiep" },
      { key: "annual-check", name: "Kiểm tra hàng năm", route: "/annual-check" },
      { key: "kiem-tra-hoc-vien", name: "Kiểm tra học viên public", route: "/kiem-tra-hoc-vien" },
    ]
  },
  {
    key: "hoc-bu",
    name: "Học bù",
    children: [
      { key: "danh-sach-hoc-bu", name: "Danh sách học bù", route: "/danh-sach-hoc-bu" },
      {
        key: "danh-sach-ly-thuyet",
        name: "Danh sách lý thuyết",
        children: [
          { key: "danh-sach-cho-xep-lop-ly-thuyet", name: "Danh sách chờ xếp lớp", route: "/danh-sach-cho-xep-lop-ly-thuyet" },
          { key: "danh-sach-dang-hoc-bu-ly-thuyet", name: "Danh sách đang học bù", route: "/danh-sach-dang-hoc-bu-ly-thuyet" },
          { key: "tien-do-hoc-bu-ly-thuyet", name: "Tiến độ học bù", route: "/tien-do-hoc-bu-ly-thuyet" },
        ]
      },
      {
        key: "danh-sach-thuc-hanh",
        name: "Danh sách thực hành",
        children: [
          { key: "danh-sach-hoc-vien-bu-thuc-hanh", name: "Danh sách bù thực hành", route: "/danh-sach-hoc-vien-bu-thuc-hanh" },
          { key: "danh-sach-cho-xep-lop-thuc-hanh", name: "Danh sách chờ xếp lớp", route: "/danh-sach-cho-xep-lop-thuc-hanh" },
          { key: "danh-sach-dang-hoc-bu-thuc-hanh", name: "Danh sách đang học bù", route: "/danh-sach-dang-hoc-bu-thuc-hanh" },
          { key: "tien-do-hoc-bu-thuc-hanh", name: "Tiến độ học bù", route: "/tien-do-hoc-bu-thuc-hanh" },
        ]
      }
    ]
  },
  {
    key: "danh-sach-ky-nhan-ho-so-gplx",
    name: "DS ký nhận hồ sơ GPLX",
    route: "/danh-sach-ky-nhan-ho-so-gplx",
  },
  {
    key: "ke-toan",
    name: "Quản lý kế toán",
    route: "/ke-toan",
  },
  {
    key: "tai-khoan",
    name: "Quản lý tài khoản",
    route: "/tai-khoan",
  },
  {
    key: "cai-dat-he-thong",
    name: "Cài đặt hệ thống",
    route: "/cai-dat-he-thong",
  }
];

export const flattenTreeTemplate = (nodes) => {
  let result = [];
  nodes.forEach((node) => {
    if (node.route) {
      result.push({ path: node.route, name: node.name });
    }
    if (node.children) {
      result = result.concat(flattenTreeTemplate(node.children));
    }
  });
  return result;
};

export const ALL_PERMISSION_ROUTES = flattenTreeTemplate(PERMISSION_TREE_TEMPLATE);

const getDefaultPermission = (roleId, path, action) => {
  const rId = Number(roleId);
  const fullAccessRoles = [1, 2, 5, 6]; // Quản trị hệ thống, Trưởng phòng đào tạo, Tổ thực hành, Tổ công nghệ
  if (fullAccessRoles.includes(rId)) {
    return true;
  }

  // Routes for Tổ lý thuyết and Tổ nghiệp vụ đào tạo
  const theoryRoutes = [
    "/tien-do-dao-tao",
    "/danh-sach-xe",
    "/quan-ly-uy-quyen",
    "/dang-ky-xe-giao-vien",
    "/dashboard-ly-thuyet",
    "/quan-ly-hoc-vien-ly-thuyet",
    "/hoc-bu-ly-thuyet",
  ];

  const isTheoryRoute = theoryRoutes.includes(path);

  if (rId === 4) { // Tổ lý thuyết
    return isTheoryRoute; // both view and edit are true
  }

  if (rId === 3) { // Tổ nghiệp vụ đào tạo
    if (action === "view") {
      return isTheoryRoute;
    }
    return false; // edit is false
  }

  return false;
};

export const checkPermission = (path, action) => {
  const permissionsStr = sessionStorage.getItem("permissions");
  const roleId = sessionStorage.getItem("role_id");

  // Nếu chưa cấu hình permissions trong sessionStorage (tài khoản cũ / chưa re-login / rỗng)
  // thì mặc định tự động lấy theo vai trò mặc định
  if (!permissionsStr) {
    return getDefaultPermission(roleId, path, action);
  }

  try {
    const permissions = JSON.parse(permissionsStr);
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return getDefaultPermission(roleId, path, action);
    }

    const perm = permissions.find((p) => p.route === path);
    // Nếu route này chưa từng được phân quyền trong mảng (các route mới thêm sau này):
    // Tự động fallback lấy theo vai trò mặc định
    if (!perm) {
      return getDefaultPermission(roleId, path, action);
    }

    if (action === "view") return !!perm.view;
    if (action === "edit") return !!perm.edit;
    return false;
  } catch {
    return getDefaultPermission(roleId, path, action);
  }
};

/**
 * Custom Hook check view/edit permission cho component
 * Tự động detect path hiện tại nếu không truyền vào
 */
export function usePermission(customPath) {
  const location = useLocation();
  const path = customPath || location.pathname;

  const canView = checkPermission(path, "view");
  const canEdit = checkPermission(path, "edit");

  return { canView, canEdit };
}

/**
 * Wrapper Component dùng để ẩn hiện nội dung dựa vào quyền Xem/Sửa
 */
export function AccessControl({ action = "edit", children, fallback = null }) {
  const { canView, canEdit } = usePermission();
  const hasAccess = action === "edit" ? canEdit : canView;

  if (!hasAccess) return fallback;
  return children;
}
