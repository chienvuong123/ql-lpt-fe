import React from "react";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Empty, Modal, Table } from "antd";

const LyThuyetScoreModal = ({ open, onCancel, scoreRows = [] }) => {
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
      title="Kết quả các bài lý thuyết"
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
        <Empty description="Không có dữ liệu điểm" />
      )}
    </Modal>
  );
};

export default LyThuyetScoreModal;
