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
import {
  Avatar,
  Button,
  Dropdown,
  Flex,
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
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
          <Avatar
            src="https://img.freepik.com/vector-mien-phi/logo-vector-gradient-day-mau-sac-cua-chim_343694-1365.jpg?semt=ais_user_personalization&w=740&q=80"
            size={120}
            shape="square"
            className=""
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
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            {
              key: "class-management",
              icon: <BookOutlined />,
              label: "Lớp lý thuyết",
            },
            {
              key: "reports",
              icon: <BarChartOutlined />,
              label: "Báo cáo",
              children: [
                {
                  key: "student-report",
                  label: "Báo cáo học viên",
                },
                {
                  key: "check-full-course",
                  label: "Báo cáo hàng loạt",
                },
              ],
            },
            {
              key: "sync",
              icon: <SyncOutlined />,
              label: "Đồng bộ",
              children: [
                {
                  key: "sync-teacher-car",
                  label: "Đồng bộ giáo viên",
                },
                {
                  key: "sync-student-car",
                  label: "Đồng bộ học viên",
                },
              ],
            },
            {
              key: "annual-check",
              icon: <SafetyOutlined />,
              label: "Kiểm tra hàng năm",
            },
          ]}
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
