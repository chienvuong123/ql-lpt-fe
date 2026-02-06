import { Outlet } from "react-router-dom";
import { Layout as AntLayout } from "antd";

const { Content } = AntLayout;

export default function Layout() {
  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-6 mx-auto">
        <Outlet />
      </Content>
    </AntLayout>
  );
}
