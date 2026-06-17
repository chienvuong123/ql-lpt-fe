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
  Checkbox,
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
import { PERMISSION_TREE_TEMPLATE, usePermission } from "../../util/permission";

const AccountManagement = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  const buildPermissionTree = (userPerms = []) => {
    const mapNode = (node) => {
      if (node.children) {
        const mappedChildren = node.children.map(mapNode);
        const hasView = mappedChildren.some((c) => c.view);
        const hasEdit = mappedChildren.some((c) => c.edit);
        return {
          ...node,
          view: hasView,
          edit: hasEdit,
          children: mappedChildren,
        };
      }
      const matched = userPerms.find((p) => p.route === node.route);
      return {
        ...node,
        view: matched ? !!matched.view : false,
        edit: matched ? !!matched.edit : false,
      };
    };
    return PERMISSION_TREE_TEMPLATE.map(mapNode);
  };

  const [permissions, setPermissions] = useState(() => buildPermissionTree([]));

  const { data: dataAccount = {}, isLoading: isLoadingAccount } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const dataSource = useMemo(() => {
    return Array.isArray(dataAccount?.data) ? dataAccount.data : [];
  }, [dataAccount]);

  const { canEdit } = usePermission();

  const handleAddAccount = () => {
    if (!canEdit) return;
    form.resetFields();
    setEditingId(null);
    setPermissions(buildPermissionTree([]));
    setIsModalOpen(true);
  };

  const handleEditAccount = async (record) => {
    if (!canEdit) return;
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

        const userPerms = res.data.permissions || [];
        setPermissions(buildPermissionTree(userPerms));
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

  const flattenPermissions = (nodes) => {
    let result = [];
    nodes.forEach((node) => {
      if (node.route) {
        result.push({
          route: node.route,
          view: !!node.view,
          edit: !!node.edit,
        });
      }
      if (node.children) {
        result = result.concat(flattenPermissions(node.children));
      }
    });
    return result;
  };

  const handleSubmit = async (values) => {
    if (!canEdit) return;
    try {
      const payload = {
        ...values,
        permissions: flattenPermissions(permissions),
      };

      if (editingId) {
        await updateUser(editingId, payload);
        message.success("Cập nhật tài khoản thành công");
      } else {
        await createUser(payload);
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
    if (!canEdit) return;
    try {
      await deleteUser(id);
      message.success("Xóa tài khoản thành công");
      queryClient.invalidateQueries(["users"]);
    } catch (error) {
      console.error(error);
      message.error("Xóa tài khoản thất bại");
    }
  };

  const handlePermissionChange = (routeKey, field, checked) => {
    if (!canEdit) return;
    const propagatePermission = (nodes, val) => {
      return nodes.map((node) => {
        const updated = { ...node, [field]: val };
        if (field === "edit" && val) {
          updated.view = true;
        }
        if (field === "view" && !val) {
          updated.edit = false;
        }
        if (node.children) {
          updated.children = propagatePermission(node.children, val);
        }
        return updated;
      });
    };

    const updateNode = (nodes) => {
      return nodes.map((node) => {
        if (node.key === routeKey) {
          const updated = { ...node, [field]: checked };
          if (field === "edit" && checked) {
            updated.view = true;
          }
          if (field === "view" && !checked) {
            updated.edit = false;
          }
          if (updated.children) {
            updated.children = propagatePermission(updated.children, checked);
          }
          return updated;
        }
        if (node.children) {
          const updatedChildren = updateNode(node.children);
          const hasView = updatedChildren.some((c) => c.view);
          const hasEdit = updatedChildren.some((c) => c.edit);
          return {
            ...node,
            view: hasView,
            edit: hasEdit,
            children: updatedChildren,
          };
        }
        return node;
      });
    };

    setPermissions((prev) => updateNode(prev));
  };

  const permissionColumns = [
    {
      title: "Màn hình / Chức năng",
      dataIndex: "name",
      key: "name",
      width: 250,
    },
    {
      title: "Xem",
      dataIndex: "view",
      key: "view",
      align: "center",
      width: 80,
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => handlePermissionChange(record.key, "view", e.target.checked)}
        />
      ),
    },
    {
      title: "Sửa",
      dataIndex: "edit",
      key: "edit",
      align: "center",
      width: 80,
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => handlePermissionChange(record.key, "edit", e.target.checked)}
        />
      ),
    },
  ];

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
            disabled={!canEdit}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa tài khoản này?"
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            disabled={!canEdit}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className="w-16 !rounded-md "
              disabled={!canEdit}
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
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAccount}
            className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-md shadow-sm"
          >
            Thêm tài khoản
          </Button>
        )}
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
        width={850}
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
          <Row gutter={24}>
            <Col span={10}>
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
                  {ROLE_OPTIONS.filter((opt) => opt.value <= 6).map((option) => (
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
            </Col>

            <Col span={14}>
              <div className="mb-2 font-semibold text-gray-700">Phân quyền truy cập:</div>
              <Table
                dataSource={permissions}
                columns={permissionColumns}
                rowKey="key"
                pagination={false}
                size="small"
                bordered
                scroll={{ y: 320 }}
                className="border border-gray-200 rounded-md overflow-hidden"
              />
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagement;
