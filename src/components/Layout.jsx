import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Layout as AntLayout, Spin } from "antd";

const { Content } = AntLayout;

export default function Layout() {
  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-6 mx-auto">
        <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>}><Outlet /></Suspense>
      </Content>
    </AntLayout>
  );
}
