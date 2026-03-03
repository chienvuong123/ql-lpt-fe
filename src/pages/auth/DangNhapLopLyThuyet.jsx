import { Card, Form, Input, Button, Typography, Row, Col, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { DangNhapLopLyThuyet } from "../../apis/auth";

import "./loginAntd.css";
import { useState } from "react";

const { Text } = Typography;

export default function LoginLopLyThuyet() {
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values) => {
    const { username, password } = values;
    setIsLoading(true);

    const res = await DangNhapLopLyThuyet();
    console.log(username, password);

    if (res?.success === true) {
      setIsLoading(false);
      window.location.href = "/class-management";
    } else {
      message.error({
        content: res?.data?.Name || "Lỗi đăng nhập, vui lòng thử lại!",
        className: "!text-red-500",
      });

      setIsLoading(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-50 flex items-start justify-center py-20">
      <div className="w-full max-w-md px-4">
        <Card className="rounded-lg shadow-lg p-8 bg-white/90">
          <Row gutter={24} className="mb-8">
            <Col span={24} justify="center" align="middle">
              <Text type="secondary" className="!text-lg font-semibold">
                Đăng nhập vào lớp học lý thuyết
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
