import React, { useState, useEffect } from "react";
import { Modal, Table, Button, Typography } from "antd";
import { ArrowRightOutlined, DownCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

export default function KiemTraDongBoModal({
  visible,
  onClose,
  data = [],
  loading = false,
  syncLoading = false,
  onConfirmSync,
}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Initialize selectedRowKeys with all student ma_dk when modal opens or data changes
  useEffect(() => {
    if (visible && Array.isArray(data)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRowKeys(data.map((item) => item.ma_dk).filter(Boolean));
    }
  }, [visible, data]);

  const columns = [
    {
      title: "Họ và tên",
      dataIndex: "ho_ten",
      key: "ho_ten",
      render: (text) => <Text className="text-gray-800">{text}</Text>,
    },
    {
      title: "Mã học viên",
      dataIndex: "ma_dk",
      key: "ma_dk",
      align: "left",
      render: (text) => <Text copyable>{text}</Text>,
    },
    {
      title: "Số bài Cabin",
      dataIndex: "so_bai_hoc",
      key: "so_bai_hoc",
      align: "center",
      render: (val) => (
        <span className="px-2 py-0.5">
          {val || 0} bài
        </span>
      ),
    },
    {
      title: "Thời gian Cabin",
      dataIndex: "tong_phut",
      key: "tong_phut",
      align: "center",
      render: (minutes) => {
        const mins = Number(minutes) || 0;
        if (mins >= 60) {
          const hours = Math.floor(mins / 60);
          const rem = mins % 60;
          return (
            <Text className="text-indigo-600">
              {hours}h {rem}m
            </Text>
          );
        }
        return <Text className="text-indigo-500">{mins} phút</Text>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      key: "trang_thai",
      align: "center",
      render: (status) => {
        const isPassed = status === "dat";
        return isPassed
          ? <DownCircleOutlined style={{ color: "green", fontSize: 20 }} />
          : <CloseCircleOutlined style={{ color: "red", fontSize: 20 }} />;
      },
    },
  ];

  const handleSyncClick = () => {
    if (selectedRowKeys.length === 0) {
      Modal.warning({
        title: "Chưa chọn học viên",
        content: "Vui lòng tích chọn ít nhất 1 học viên để tiến hành đồng bộ!",
        centered: true,
      });
      return;
    }
    onConfirmSync(selectedRowKeys);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 ">
          <Title level={5} className="!m-0 text-gray-900 font-bold">
            Kiểm Tra Điều Kiện Đồng Bộ DAT
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" size="middle" onClick={onClose} disabled={syncLoading}>
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          size="middle"
          icon={<ArrowRightOutlined />}
          onClick={handleSyncClick}
          loading={syncLoading}
          disabled={loading || data.length === 0}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md font-semibold"
        >
          Xác nhận Đồng bộ ({selectedRowKeys.length})
        </Button>,
      ]}
      width={950}
      centered
      destroyOnClose
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="ma_dk"
        pagination={false}
        size="small"
        bordered
        className="my-6"
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        locale={{
          emptyText: loading ? "Đang truy vấn dữ liệu..." : "Không có học viên nào cần kiểm tra",
        }}
      />
    </Modal>
  );
}
