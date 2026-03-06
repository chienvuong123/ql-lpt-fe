import React from "react";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Empty, Modal, Space, Table, Typography } from "antd";

const { Text } = Typography;

const LyThuyetScoreModal = ({
  open,
  onCancel,
  scoreRows = [],
  loadingStatus = false,
  loaiHetMon = "-",
}) => {
  const columns = [
    {
      title: "Tên bài",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Điểm",
      dataIndex: "score",
      key: "score",
      width: 90,
      align: "center",
    },
    {
      title: "Đạt",
      dataIndex: "passed",
      key: "passed",
      width: 80,
      align: "center",
      render: (passed) =>
        passed ? (
          <CheckCircleFilled className="!text-green-600" />
        ) : (
          <CloseCircleFilled className="!text-red-500" />
        ),
    },
  ];

  return (
    <Modal
      title="Kết quả học lý thuyết"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={430}
    >
      {scoreRows.length > 0 ? (
        <Table
          rowKey="key"
          columns={columns}
          dataSource={scoreRows}
          size="small"
          pagination={false}
        />
      ) : (
        <Empty description="Khong co du lieu diem" />
      )}
      <Space className="!bg-gray-100 !mt-8 w-full px-3 py-3">
        <Text className="!text-sm !text-gray-600">Làm bài hết môn: </Text>
        <strong
          style={{
            color: loaiHetMon === "Chưa làm bài hết môn" ? "red" : "green",
          }}
        >
          {loadingStatus ? "Dang tai..." : loaiHetMon}
        </strong>
      </Space>
    </Modal>
  );
};

export default LyThuyetScoreModal;
