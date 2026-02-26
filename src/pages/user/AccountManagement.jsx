import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Row,
  Col,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { DanhSachTaiKhoan } from "../../apis/taiKhoan";
import { useQuery } from "@tanstack/react-query";

const AccountManagement = () => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [users, setUsers] = useState([
    {
      id: 5,
      fullName: "Phạm Đức Trường",
      email: "truongpd@apphuongthanh.vn",
      role: "admin",
    },
    {
      id: 4,
      fullName: "Phạm Anh Tuấn",
      email: "tuanpa@apphuongthanh.vn",
      role: "admin",
    },
    {
      id: 3,
      fullName: "Xuân Hạ Thu Đông",
      email: "gnurthnahtuv@gmail.com",
      role: "user",
    },
    {
      id: 2,
      fullName: "Nguyễn Minh Hiếu",
      email: "minhhieuoc123@gmail.com",
      role: "admin",
    },
    {
      id: 1,
      fullName: "Trung",
      email: "dulieuquocgia@gmail.com",
      role: "admin",
    },
  ]);

  const { data: dataAccount = {}, isLoading: isLoadingAccount } = useQuery({
    queryKey: ["danhSachTaiKhoan"],
    queryFn: () => DanhSachTaiKhoan(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const dataSource = useMemo(() => {
    const accounts = Array.isArray(dataAccount?.data?.Data)
      ? dataAccount.data.Data
      : [];

    return accounts;
  }, [dataAccount]);

  const handleAddAccount = () => {
    form.resetFields();
    setEditingId(null);
    setDrawerVisible(true);
  };

  const handleEditAccount = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      fullName: record.fullName,
      email: record.email,
      role: record.role,
    });
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        setUsers(
          users.map((user) =>
            user.id === editingId ? { ...user, ...values } : user,
          ),
        );
        message.success("Cập nhật tài khoản thành công");
      } else {
        const newUser = {
          id: Math.max(...users.map((u) => u.id), 0) + 1,
          ...values,
        };
        setUsers([newUser, ...users]);
        message.success("Tạo tài khoản thành công");
      }
      handleDrawerClose();
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra");
    }
  };

  const handleDeleteAccount = (id) => {
    setUsers(users.filter((user) => user.id !== id));
    message.success("Xóa tài khoản thành công");
  };

  //   const handleChangePassword = (id) => {
  //     message.info("Chức năng đổi mật khẩu sẽ được triển khai");
  //   };

  //   const handleForceLogout = (id) => {
  //     message.info("Ép đăng xuất thành công");
  //   };

  const columns = [
    {
      title: "STT",
      dataIndex: "id",
      key: "id",
      width: 60,
      align: "center",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Mã",
      dataIndex: "ID",
      key: "ID",
    },
    {
      title: "Họ tên",
      dataIndex: "Name",
      key: "Name",
    },
    {
      title: "Tài Khoản",
      dataIndex: "Username",
      key: "Username",
    },
    {
      title: "Email",
      dataIndex: "Email",
      key: "Email",
    },
    {
      title: "Phân hệ",
      dataIndex: "AppModuleType",
      key: "AppModuleType",
      width: 120,
      align: "center",
      render: (value) => {
        let label = value;
        let color = "default";

        if (value === 3) {
          label = "Cả 2";
        } else if (value === 2) {
          label = "Học thực hành";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space.Compact className="flex flex-wrap gap-2 justify-center">
          <Button
            type="primary"
            size="small"
            onClick={() => handleEditAccount(record)}
            className="w-16 !rounded-md"
            icon={<EditOutlined />}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa tài khoản này?"
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className="w-16 !rounded-md "
            />
          </Popconfirm>
        </Space.Compact>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto min-h-screen">
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Quản lý tài khoản
      </h1>
      <p className="text-[#64748b] text-sm">
        Tạo mới, phân quyền, đổi mật khẩu, xóa hoặc ép đăng xuất người dùng
      </p>

      <Row gutter={[12, 12]} className="mt-8">
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAccount}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Thêm tài khoản
          </Button>
        </Col>
        <Col>
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={isLoadingAccount}
            rowKey="id"
            pagination={false}
            bordered
            size="middle"
            className="rounded-lg overflow-hidden"
          />
        </Col>
      </Row>

      <Drawer
        title={editingId ? "Sửa tài khoản" : "Thêm tài khoản"}
        placement="right"
        onClose={handleDrawerClose}
        open={drawerVisible}
        size={500}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleDrawerClose}>Hủy</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingId ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6"
        >
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[
              { required: true, message: "Vui lòng nhập họ tên" },
              { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập họ tên" aria-label="họ tên" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              placeholder="Nhập email"
              type="email"
              disabled={!!editingId}
            />
          </Form.Item>

          <Form.Item
            label="Quyền"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn quyền" }]}
          >
            <Select placeholder="Chọn quyền">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="user">User</Select.Option>
            </Select>
          </Form.Item>

          {!editingId && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default AccountManagement;
