import { Layout, Button, Space, Dropdown } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { Outlet, useNavigate } from "react-router-dom";
import "./layoutApp.css";
import { useEffect } from "react";

const { Header, Content } = Layout;

export default function LayoutDashboard() {
  const navigate = useNavigate();
  const name = sessionStorage.getItem("name");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  const handleLogout = async () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: () => handleLogout(),
    },
  ];

  return (
    <Layout className="!min-h-screen !flex !flex-col ">
      <Header className="layout-app-header ">
        <div className="layout-app-header-content mx-auto">
          <div
            className="layout-app-logo cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="logo-badge">L</div>
            <span className="text-lg font-semibold">Lập Phương Thành</span>
          </div>

          <div className="space-x-2">
            {/* <Button type="primary" className="!font-medium !mr-2">
              Báo cáo hàng loạt
            </Button> */}
            <span className="border border-sky-300 bg-gray-200 rounded-full px-4 py-1 text-md text-sky-700">
              {name} - admin
            </span>
            <Button
              type="default"
              className="!font-medium"
              onClick={() => navigate("/tim-hoc-vien")}
            >
              Tìm học viên
            </Button>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
            ></Dropdown>
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <Button type="default" className="!font-medium">
                Đăng xuất
              </Button>
            </Dropdown>
          </div>
        </div>
      </Header>

      <Content className="layout-app-content !bg-gray-200">
        <div className="mx-auto">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
