import { Card, Form, Input, Button, Typography, Row, Col, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { DangNhap } from "../../apis/auth";
import { loginUser } from "../../apis/apiUser";

import "./loginAntd.css";
import { useState, useRef } from "react";

const { Text } = Typography;

export default function LoginAntd() {
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const onSubmit = async (values) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const { username, password } = values;
    setIsLoading(true);

    try {
      // 1. Đăng nhập hệ thống chính (loginUser)
      const resNew = await loginUser({
        username: username,
        password: password,
      });

      if (resNew?.data?.token) {
        // 2. Đăng nhập ngầm hệ thống cũ (DangNhap) bằng tài khoản từ .env (Thử lại tối đa 5 lần)
        let resOld = null;
        for (let i = 0; i < 5; i++) {
          try {
            resOld = await DangNhap({
              Username: import.meta.env.VITE_PUBLIC_CHECK_USERNAME,
              Password: import.meta.env.VITE_PUBLIC_CHECK_PASSWORD,
            });
            if (resOld?.data?.ID !== 0 && resOld?.data?.Token) {
              break;
            }
          } catch (err) {
            console.error(`Attempt ${i + 1} to login old system failed:`, err);
          }
          if (i < 4) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        const userToken = resNew.data.token;
        const name = resNew.data.user?.ho_ten;
        const role_id = resNew.data.user?.role_id;
        const username = resNew.data.user?.username;

        sessionStorage.setItem("userToken", userToken);
        if (name) sessionStorage.setItem("name", name);
        if (username) sessionStorage.setItem("username", username);
        if (role_id !== undefined && role_id !== null) {
          sessionStorage.setItem("role_id", String(role_id));
        }
        const permissions = resNew?.data?.user?.permissions;
        sessionStorage.setItem("permissions", JSON.stringify(permissions || []));

        if (resOld?.data?.ID !== 0 && resOld?.data?.Token) {
          sessionStorage.setItem("token", resOld?.data?.Token);
          setIsLoading(false);
          message.success("Đăng nhập thành công");
          window.location.href = "/";
        } else {
          message.error({
            content: `Đăng nhập hệ thống DAT thất bại`,
            className: "!text-red-500",
          });
          setIsLoading(false);
        }
      } else {
        message.error({
          content: resNew?.message || "Hệ thống mới từ chối đăng nhập",
          className: "!text-red-500",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Có lỗi xảy ra khi kết nối đến máy chủ");
      setIsLoading(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-50 flex items-start justify-center py-20">
      <div className="w-full max-w-md px-4">
        <Card className="rounded-lg shadow-lg p-8 bg-white/90">
          <Row gutter={24} className="mb-8">
            <Col span={24} justify="center" align="middle">
              <Text type="secondary" className="!text-lg font-semibold">
                Đăng nhập vào tài khoản của bạn
              </Text>
            </Col>
          </Row>

          <Form
            name="login"
            layout="vertical"
            className="mt-6"
            onFinish={onSubmit}
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập" },
              ]}
            >
              <Input
                aria-label="Tên đăng nhập"
                size="large"
                placeholder="Nhập..."
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                size="large"
                placeholder="Nhập..."
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600"
                loading={isLoading}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-4">
            <a href="#" className="text-blue-600">
              Quên mật khẩu?
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
