import React, { useEffect, useState } from "react";
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
} from "@ant-design/icons";
import { BsCalendar3, BsCardChecklist } from "react-icons/bs";
import {
  Avatar,
  Button,
  Dropdown,
  Flex,
  Image,
  Layout,
  Menu,
  Space,
  theme,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const menuPathMap = {
  dashboard: "/dashboard",
  "class-management": "/class-management",
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
  "them-du-lieu": "/them-du-lieu",
  "kiem-tra-trung-xe-giao-vien": "/kiem-tra-trung-xe-giao-vien",
  "kiem-tra-hoc-vien-sau-tot-nghiep": "/kiem-tra-hoc-vien-sau-tot-nghiep",
};

const LayoutTest = () => {
  const [collapsed, setCollapsed] = useState(false);
  const name = sessionStorage.getItem("name");
  const token = sessionStorage.getItem("token");

  const isGiaoVien = name?.toLowerCase().includes("giao viên");

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
      key: "class",
      icon: <BookOutlined />,
      label: "Lý thuyết",
      children: [
        { key: "dashboard-ly-thuyet", label: "Dashboard lý thuyết" },
        { key: "class-management", label: "Lớp học lý thuyết" },
        { key: "quan-ly-hoc-vien-ly-thuyet", label: "Quản lý học viên" },
      ],
    },
    {
      key: "cabin",
      icon: <BsCalendar3 />,
      label: "Cabin",
      children: [
        { key: "danh-sach-cabin", label: "Danh sách học viên Cabin" },
        { key: "lich-cabin", label: "Chia lịch Cabin" },
        { key: "hoc-bu-cabin", label: "Thiếu/bù giờ Cabin" },
      ],
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "DAT",
      children: [
        { key: "dashboard-dat", label: "Dashboard DAT" },
        { key: "student-report", label: "Báo cáo học viên" },
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
      key: "annual-check",
      icon: <SafetyOutlined />,
      label: "Kiểm tra hàng năm",
    },
    {
      key: "kiem-tra-hoc-vien-sau-tot-nghiep",
      icon: <SafetyOutlined />,
      label: "Kiểm tra HV sau tốt nghiệp",
    },
    { key: "kiem-tra-hoc-vien", label: "Kiểm tra học viên public" },
    { key: "them-du-lieu", label: "Thêm dữ liệu vào hệ thống" },
  ];

  // Key giáo viên được phép thấy
  const GIAO_VIEN_ALLOWED_KEYS = [
    "class",
    "class-management",
    "quan-ly-hoc-vien-ly-thuyet",
    "dashboard-ly-thuyet",
  ];

  const menuItems = isGiaoVien
    ? allMenuItems
        .filter((item) => GIAO_VIEN_ALLOWED_KEYS.includes(item.key))
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) =>
            GIAO_VIEN_ALLOWED_KEYS.includes(child.key),
          ),
        }))
    : allMenuItems;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        collapsedWidth={90}
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: "#fff" }}
      >
        <Flex
          align="center"
          justify={"center"}
          className={`h-24 overflow-hidden transition-all duration-200 ${
            collapsed ? "px-0" : "px-4"
          }`}
        >
          <Image
            src="/logo.png"
            width={140}
            height={140}
            preview={false}
            shape="square"
            className="object-contain block"
          />
        </Flex>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          onClick={({ key }) => {
            if (key === "class-management") {
              const currentToken = sessionStorage.getItem("token");
              if (!currentToken) {
                navigate("/login-ly-thuyet");
                return;
              }
            }
            const nextPath = menuPathMap[key];
            if (nextPath) navigate(nextPath);
          }}
          items={menuItems}
        />
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutTest;
