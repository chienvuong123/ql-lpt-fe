import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
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
import {
  getAllUsers,
  getDetailUser,
  createUser,
  updateUser,
  deleteUser,
} from "../../apis/apiUser";
import { ROLE_OPTIONS } from "../../constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const AccountManagement = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();
  const { data: dataAccount = {}, isLoading: isLoadingAccount } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const dataSource = useMemo(() => {
    return Array.isArray(dataAccount?.data) ? dataAccount.data : [];
  }, [dataAccount]);

  const handleAddAccount = () => {
    form.resetFields();
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEditAccount = async (record) => {
    try {
      setEditingId(record.id);
      const res = await getDetailUser(record.id);
      if (res?.data) {
        form.setFieldsValue({
          ho_ten: res.data.ho_ten,
          email: res.data.email,
          role_id: res.data.role_id,
          username: res.data.username,
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể lấy thông tin chi tiết người dùng");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await updateUser(editingId, values);
        message.success("Cập nhật tài khoản thành công");
      } else {
        await createUser(values);
        message.success("Tạo tài khoản thành công");
      }
      queryClient.invalidateQueries(["users"]);
      handleModalClose();
    } catch (error) {
      console.log(error);
      message.error(error?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await deleteUser(id);
      message.success("Xóa tài khoản thành công");
      queryClient.invalidateQueries(["users"]);
    } catch (error) {
      console.error(error);
      message.error("Xóa tài khoản thất bại");
    }
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
      title: "Họ tên",
      dataIndex: "ho_ten",
      key: "ho_ten",
    },
    {
      title: "Tài Khoản",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role_name",
      key: "role_name",
      width: 150,
      align: "center",
      render: (_, record) => {
        let label = "Nhân viên";
        let color = "blue";

        if (record.role_id === 1) {
          label = "Admin";
          color = "red";
        } else if (record.role_id === 2) {
          label = "Quản lý";
          color = "orange";
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
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Quản lý tài khoản
        </h1>
        <p className="text-[#64748b] text-sm">
          Tạo mới, phân quyền, đổi mật khẩu, xóa hoặc ép đăng xuất người dùng
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddAccount}
          className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-md shadow-sm"
        >
          Thêm tài khoản
        </Button>
      </div>

      <div className="w-full">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoadingAccount}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-4",
          }}
          bordered
          size="small"
          scroll={{ x: 1200 }}
          className="table-blue-header shadow-sm border border-gray-100 rounded-lg overflow-hidden"
        />
      </div>

      <Modal
        title={editingId ? "Sửa tài khoản" : "Thêm tài khoản"}
        onCancel={handleModalClose}
        open={isModalOpen}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => form.submit()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingId ? "Cập nhật" : "Thêm"}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6"
        >
          <Form.Item
            label="Họ tên"
            name="ho_ten"
            rules={[
              { required: true, message: "Vui lòng nhập họ tên" },
              { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập họ tên" aria-label="họ tên" />
          </Form.Item>

          <Form.Item
            label="Tài khoản"
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên tài khoản" },
              { min: 3, message: "Tên tài khoản phải có ít nhất 3 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tài khoản" disabled={!!editingId} />
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
            />
          </Form.Item>

          <Form.Item
            label="Quyền"
            name="role_id"
            rules={[{ required: true, message: "Vui lòng chọn quyền" }]}
          >
            <Select placeholder="Chọn quyền">
              {ROLE_OPTIONS.filter(opt => opt.value <= 6).map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
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
      </Modal>
    </div>
  );
};

export default AccountManagement;
