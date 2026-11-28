import React, { useEffect, useState, Suspense } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  BarChartOutlined,
  SyncOutlined,
  SafetyOutlined,
  AppstoreAddOutlined,
  RetweetOutlined,
  FileOutlined,
  DollarOutlined,
  MailOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { BsCalendar3 } from "react-icons/bs";
import {
  Avatar,
  Button,
  ConfigProvider,
  Dropdown,
  Flex,
  Image,
  Layout,
  Menu,
  Space,
  theme,
  Spin,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaCarRear, FaBook } from "react-icons/fa6";
import { checkPermission } from "../util/permission";
import anhSanTap from "../assets/sidebar-san-tap.webp";

// Sidebar nền xanh (cùng bảng màu các màn Kế toán / Đào tạo)
const SB_NEN = "linear-gradient(180deg, #0646A8 0%, #0A53C4 45%, #0646A8 100%)";
const SB_MENU = {
  components: {
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "rgba(0,0,0,0.10)",
      darkPopupBg: "#0646A8",
      darkItemColor: "rgba(255,255,255,0.92)",
      darkItemHoverColor: "#fff",
      darkItemHoverBg: "rgba(255,255,255,0.12)",
      darkItemSelectedBg: "#2D7CF6",
      darkItemSelectedColor: "#fff",
      itemBorderRadius: 12,
      itemHeight: 46,
      itemMarginInline: 10,
      iconSize: 18,
      collapsedIconSize: 20,
      fontSize: 15,
    },
  },
};

const { Header, Sider, Content } = Layout;
const menuPathMap = {
  dashboard: "/dashboard",
  "student-report": "/student-report",
  "check-full-course": "/check-full-course",
  "sync-teacher-car": "/sync-teacher-car",
  "sync-student-car": "/sync-student-car",
  "annual-check": "/annual-check",
  "cabin-schedule": "/cabin-schedule",
  "hoc-vien-ky-dat": "/hoc-vien-ky-dat",
  "danh-sach-cabin": "/danh-sach-cabin",
  "lich-cabin": "/lich-cabin",
  "hoc-bu-cabin": "/hoc-bu-cabin",
  "kiem-tra-hoc-vien": "/kiem-tra-hoc-vien",
  "quan-ly-hoc-vien-ly-thuyet": "/quan-ly-hoc-vien-ly-thuyet",
  "truy-vet-loi": "/truy-vet-loi",
  "dashboard-dat": "/dashboard-dat",
  "dashboard-ly-thuyet": "/dashboard-ly-thuyet",
  "hoc-vien-theo-giao-vien": "/hoc-vien-theo-giao-vien",
  "dong-bo-du-lieu-he-thong": "/dong-bo-du-lieu-he-thong",
  "kiem-tra-trung-xe-giao-vien": "/kiem-tra-trung-xe-giao-vien",
  "kiem-tra-hoc-vien-sau-tot-nghiep": "/kiem-tra-hoc-vien-sau-tot-nghiep",
  "dashboard-cabin": "/dashboard-cabin",
  "hoc-bu-ly-thuyet": "/hoc-bu-ly-thuyet",
  "hoc-bu-dat": "/hoc-bu-dat",
  "tai-khoan": "/tai-khoan",
  "danh-sach-hoc-bu": "/danh-sach-hoc-bu",
  "kiem-tra": "/kiem-tra",
  "danh-sach-ly-thuyet": "/danh-sach-ly-thuyet",
  "danh-sach-cho-xep-lop-ly-thuyet": "/danh-sach-cho-xep-lop-ly-thuyet",
  "danh-sach-dang-hoc-bu-ly-thuyet": "/danh-sach-dang-hoc-bu-ly-thuyet",
  "tien-do-hoc-bu-ly-thuyet": "/tien-do-hoc-bu-ly-thuyet",
  "danh-sach-thuc-hanh": "/danh-sach-thuc-hanh",
  "danh-sach-cho-xep-lop-thuc-hanh": "/danh-sach-cho-xep-lop-thuc-hanh",
  "danh-sach-dang-hoc-bu-thuc-hanh": "/danh-sach-dang-hoc-bu-thuc-hanh",
  "tien-do-hoc-bu-thuc-hanh": "/tien-do-hoc-bu-thuc-hanh",
  "danh-sach-hoc-vien-bu-thuc-hanh": "/danh-sach-hoc-vien-bu-thuc-hanh",
  "cai-dat-he-thong": "/cai-dat-he-thong",
  "quan-ly-vung-cam": "/quan-ly-vung-cam",
  "tien-do-dao-tao": "/tien-do-dao-tao",
  "danh-sach-xe": "/danh-sach-xe",
  "dang-ky-xe-giao-vien": "/dang-ky-xe-giao-vien",
  "quan-ly-uy-quyen": "/quan-ly-uy-quyen",
  "danh-sach-ky-nhan-ho-so-gplx": "/danh-sach-ky-nhan-ho-so-gplx",
  "gplx-hoan": "/gplx-hoan",
  "ke-toan": "/ke-toan",
  "xep-lop-hoc-vien": "/xep-lop-hoc-vien",
  "danh-sach-lop": "/danh-sach-lop",
  "khai-giang": "/khai-giang",
  "ket-qua-sat-hach": "/ket-qua-sat-hach",
  "tiep-sinh": "/tiep-sinh",
  "tiep-nhan-ho-so": "/tiep-nhan-ho-so",
};

const LayoutTest = () => {
  const [collapsed, setCollapsed] = useState(false);
  const name = sessionStorage.getItem("name");
  const token = sessionStorage.getItem("token");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const userMenuItems = [
    {
      key: "account",
      icon: <SettingOutlined />,
      label: "Thông tin tài khoản",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === "account") {
      navigate("/tai-khoan");
    }
    if (key === "logout") {
      sessionStorage.clear();
      navigate("/login");
    }
  };
  const selectedMenuKey =
    Object.keys(menuPathMap).find(
      (key) => menuPathMap[key] === location.pathname,
    ) || "dashboard";

  const allMenuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "to-tiep-sinh",
      icon: <TeamOutlined />,
      label: "Tổ tiếp sinh",
      children: [
        { key: "tiep-sinh", label: "Tổng quan tiếp sinh" },
        { key: "tiep-nhan-ho-so", label: "Tiếp nhận hồ sơ" },
      ],
    },
    {
      key: "tien-do-dao-tao",
      icon: <BarChartOutlined />,
      label: "Tiến độ đào tạo",
    },
    {
      key: "dao-tao",
      icon: <AppstoreAddOutlined />,
      label: "Đào tạo", children: [
        { key: "danh-sach-xe", label: "Danh sách xe" },
        { key: "quan-ly-uy-quyen", label: "Ủy quyền xe" },
        { key: "dang-ky-xe-giao-vien", label: "Đăng ký xe, giáo viên" },
        { key: "xep-lop-hoc-vien", label: "Xếp lớp học viên" },
        { key: "khai-giang", label: "Khai giảng" },
        { key: "danh-sach-lop", label: "Danh sách lớp" },
      ]
    },
    {
      key: "class",
      icon: <FaBook />,
      label: "Lý thuyết",
      children: [
        { key: "dashboard-ly-thuyet", label: "Dashboard lý thuyết" },
        { key: "quan-ly-hoc-vien-ly-thuyet", label: "Quản lý học viên" },
        { key: "hoc-bu-ly-thuyet", label: "Học bù lý thuyết" },
      ],
    },
    {
      key: "cabin",
      icon: <BsCalendar3 />,
      label: "Cabin",
      children: [
        { key: "dashboard-cabin", label: "Dashboard Cabin" },
        { key: "danh-sach-cabin", label: "Danh sách học viên Cabin" },
        { key: "lich-cabin", label: "Chia lịch Cabin" },
        { key: "hoc-bu-cabin", label: "Học bù Cabin" },
      ],
    },
    {
      key: "reports",
      icon: <FaCarRear />,
      label: "DAT",
      children: [
        { key: "dashboard-dat", label: "Dashboard DAT" },
        { key: "student-report", label: "Báo cáo học viên" },
        { key: "hoc-bu-dat", label: "Học bù DAT" },
        {
          key: "hoc-vien-theo-giao-vien",
          label: "DS học viên theo GV",
        },
        {
          key: "kiem-tra-trung-xe-giao-vien",
          label: "Kiểm tra trùng xe, giáo viên",
        },
        { key: "check-full-course", label: "Báo cáo học viên hàng loạt" },
        { key: "hoc-vien-ky-dat", label: "Danh sách học viên kí DAT" },
        { key: "truy-vet-loi", label: "Truy vết lỗi" },
        { key: "quan-ly-vung-cam", label: "Quản lý vùng cấm" },
      ],
    },
    {
      key: "sync",
      icon: <SyncOutlined />,
      label: "Đồng bộ",
      children: [
        { key: "sync-teacher-car", label: "Đồng bộ giáo viên" },
        { key: "sync-student-car", label: "Đồng bộ học viên" },
      ],
    },
    {
      key: "them-du-lieu",
      icon: <AppstoreAddOutlined />,
      label: "Thêm dữ liệu", children: [
        { key: "dong-bo-du-lieu-he-thong", label: "Đồng bộ dữ liệu hệ thống" },
      ]
    },
    {
      key: "kiem-tra",
      icon: <SafetyOutlined />,
      label: "Kiểm tra", children: [
        {
          key: "kiem-tra-hoc-vien-sau-tot-nghiep",
          label: "Kiểm tra HV sau tốt nghiệp",
        },
        {
          key: "annual-check",
          label: "Kiểm tra hàng năm",
        },
        { key: "kiem-tra-hoc-vien", label: "Kiểm tra học viên public" },
      ]
    },
    {
      key: "hoc-bu",
      icon: <RetweetOutlined />,
      label: "Học bù",
      children: [
        { key: "danh-sach-hoc-bu", label: "Danh sách học bù" },
        {
          key: "danh-sach-ly-thuyet", label: "Danh sách lý thuyết", children: [
            { key: "danh-sach-cho-xep-lop-ly-thuyet", label: "Danh sách chờ xếp lớp" },
            { key: "danh-sach-dang-hoc-bu-ly-thuyet", label: "Danh sách đang học bù" },
            { key: "tien-do-hoc-bu-ly-thuyet", label: "Tiến độ học bù" },
          ]
        },
        {
          key: "danh-sach-thuc-hanh", label: "Danh sách thực hành", children: [
            { key: "danh-sach-hoc-vien-bu-thuc-hanh", label: "Danh sách bù thực hành" },
            { key: "danh-sach-cho-xep-lop-thuc-hanh", label: "Danh sách chờ xếp lớp" },
            { key: "danh-sach-dang-hoc-bu-thuc-hanh", label: "Danh sách đang học bù" },
            { key: "tien-do-hoc-bu-thuc-hanh", label: "Tiến độ học bù" },
          ]
        },
      ]
    },
    {
      key: "gplx",
      icon: <FileOutlined />,
      label: "GPLX",
      children: [
        { key: "danh-sach-ky-nhan-ho-so-gplx", label: "DS ký nhận hồ sơ GPLX" },
        { key: "gplx-hoan", icon: <MailOutlined />, label: "GPLX hoàn trả bưu điện" },
      ],
    },
    {
      key: "sat-hach",
      icon: <TrophyOutlined />,
      label: "Sát hạch",
      children: [
        { key: "ket-qua-sat-hach", label: "Kết quả sát hạch" },
      ],
    },
    {
      key: "ke-toan",
      icon: <DollarOutlined />,
      label: "Quản lý kế toán",
    },
    {
      key: "tai-khoan",
      icon: <UserOutlined />,
      label: "Quản lý tài khoản",
    },
    {
      key: "cai-dat-he-thong",
      icon: <SettingOutlined />,
      label: "Cài đặt hệ thống",
    },
  ];

  const filterMenuItemsByPermissions = (items) => {
    return items
      .map((item) => {
        // If it has children, recursively filter them
        if (item.children) {
          const filteredChildren = filterMenuItemsByPermissions(item.children);
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }

        const path = menuPathMap[item.key];
        if (path) {
          if (!checkPermission(path, "view")) {
            return null;
          }
        }

        return item;
      })
      .filter(Boolean);
  };

  const menuItems = filterMenuItemsByPermissions(allMenuItems);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        collapsedWidth={90}
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: SB_NEN,
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
        }}
      >
        <div className="relative" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Ảnh sân tập mờ dần vào nền xanh ở cuối sidebar */}
          {!collapsed && (
            <img src={anhSanTap} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none object-cover"
              style={{ height: 230, opacity: 0.55, WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 55%)", maskImage: "linear-gradient(180deg, transparent 0%, #000 55%)" }} />
          )}
          <Flex
            vertical
            align="center"
            justify="center"
            className={`relative overflow-hidden border-b border-white/10 transition-all duration-200 ${collapsed ? "h-20 px-2" : "h-[112px] px-4"}`}
            style={{ flexShrink: 0 }}
          >
            <Image src="/logo.png" width={collapsed ? 64 : 150} preview={false} className="object-contain block drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]" />
            {!collapsed && (
              <div className="mt-1.5 text-[13px] font-medium tracking-wide text-white/85">Trung tâm GDNN&amp;SHLX</div>
            )}
          </Flex>
          <div className="no-scrollbar relative" style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: collapsed ? 8 : 120 }}>
            <ConfigProvider theme={SB_MENU}>
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedMenuKey]}
                onClick={({ key }) => {
                  const nextPath = menuPathMap[key];
                  if (nextPath) navigate(nextPath);
                }}
                items={menuItems}
                style={{ background: "transparent", borderInlineEnd: 0 }}
                className="[&_.ant-menu-item-selected]:!shadow-[0_6px_14px_rgba(0,0,0,0.22)] [&_.ant-menu-item-selected]:!font-semibold"
              />
            </ConfigProvider>
          </div>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 16px 0 0",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Space
              style={{ cursor: "pointer" }}
              onClick={(e) => e.preventDefault()}
            >
              <Avatar size="small" icon={<UserOutlined />} />
              <span className="font-medium">{name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            padding: 16,
            minHeight: "calc(100vh - 112px)",
          }}
        >
          <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>}><Outlet /></Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutTest;
