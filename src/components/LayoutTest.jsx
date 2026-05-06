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
  AppstoreAddOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import { BsCalendar3 } from "react-icons/bs";
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
  "them-tien-do-dao-tao": "/them-tien-do-dao-tao",
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
  "danh-sach-cho-duyet-ly-thuyet": "/danh-sach-cho-duyet-ly-thuyet",
  "danh-sach-da-duyet-ly-thuyet": "/danh-sach-da-duyet-ly-thuyet",
  "tien-do-hoc-bu-ly-thuyet": "/tien-do-hoc-bu-ly-thuyet",
  "danh-sach-thuc-hanh": "/danh-sach-thuc-hanh",
  "danh-sach-cho-duyet-thuc-hanh": "/danh-sach-cho-duyet-thuc-hanh",
  "danh-sach-da-duyet-thuc-hanh": "/danh-sach-da-duyet-thuc-hanh",
  "tien-do-hoc-bu-thuc-hanh": "/tien-do-hoc-bu-thuc-hanh",
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
      icon: <BarChartOutlined />,
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
        { key: "them-tien-do-dao-tao", label: "Thêm tiến độ đào tạo" },
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
            { key: "danh-sach-cho-duyet-ly-thuyet", label: "Danh sách chờ duyệt" },
            { key: "danh-sach-da-duyet-ly-thuyet", label: "Danh sách đã duyệt" },
            { key: "tien-do-hoc-bu-ly-thuyet", label: "Tiến độ học bù" },
          ]
        },
        {
          key: "danh-sach-thuc-hanh", label: "Danh sách thực hành", children: [
            { key: "danh-sach-cho-duyet-thuc-hanh", label: "Danh sách chờ duyệt" },
            { key: "danh-sach-da-duyet-thuc-hanh", label: "Danh sách đã duyệt" },
            { key: "tien-do-hoc-bu-thuc-hanh", label: "Tiến độ học bù" },
          ]
        },
      ]
    },
    {
      key: "tai-khoan",
      icon: <UserOutlined />,
      label: "Quản lý tài khoản",
    },
  ];

  const storedRoleId = sessionStorage.getItem("role_id");
  const role_id = storedRoleId ? parseInt(storedRoleId) : null;

  // Map role_id to allowed keys
  const roleAccessMap = {
    1: ["dashboard", "class", "cabin", "reports", "sync", "them-du-lieu", "kiem-tra", "hoc-bu", "tai-khoan"], // Admin
    2: ["dashboard", "class", "cabin", "reports", "sync", "them-du-lieu", "kiem-tra", "hoc-bu", "tai-khoan", "hoc-vien-hoc-bu"], // Trưởng phòng
    3: ["dashboard", "class", "cabin", "reports", "sync", "them-du-lieu", "kiem-tra", "hoc-bu", "tai-khoan", "hoc-vien-hoc-bu"], // Tổ nghiệp vụ
    4: ["dashboard", "class"], // Tổ lý thuyết
    5: ["dashboard", "cabin", "reports"], // Tổ thực hành
    6: ["dashboard", "class", "cabin", "reports", "sync", "them-du-lieu", "kiem-tra", "hoc-bu", "tai-khoan", "hoc-vien-hoc-bu"], // Tổ công nghệ
  };

  // Nếu không có role_id nhưng có token (có thể là tài khoản cũ), mặc định cho xem dashboard
  // Hoặc nếu là role 1, 2, 3, 6 thì xem tất cả
  let allowedKeys = ["dashboard"];
  if (role_id && roleAccessMap[role_id]) {
    allowedKeys = roleAccessMap[role_id];
  } else if (token && !role_id) {
    // Fallback cho tài khoản cũ hoặc khi chưa có role_id: cho xem tất cả để tránh bị chặn
    allowedKeys = roleAccessMap[1];
  }

  const menuItems = allMenuItems.filter((item) => allowedKeys.includes(item.key));

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
          className={`h-24 overflow-hidden transition-all duration-200 ${collapsed ? "px-0" : "px-4"
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
