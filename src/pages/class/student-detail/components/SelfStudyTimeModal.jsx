import React from "react";
import { Modal, Table, Typography, Button, Space, Spin, Empty } from "antd";
import { CloseOutlined, FieldTimeOutlined, FolderOpenOutlined, PlayCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDetailLearningTime } from "../../../../apis/apiLyThuyetLocal";

const { Text } = Typography;

const SelfStudyTimeModal = ({ visible, onClose, userIid, courseIid, itemNtype }) => {
  // 1. Fetch Detail Learning Time
  const { data, isLoading } = useQuery({
    queryKey: ["getDetailLearningTime", userIid, courseIid, itemNtype],
    queryFn: () =>
      getDetailLearningTime({
        user_iid: userIid,
        course_iid: courseIid,
        item_ntype: itemNtype,
        submit: 1,
      }),
    enabled: visible && !!userIid && !!courseIid,
  });

  const rawData = data?.result || {};

  // Skip the syllabus level and start from children (Chương I, II, ...)
  const tableData = rawData.children || [];

  const formatDuration = (s) => {
    if (s === undefined || s === null) return "00:00:00";

    let totalSeconds = 0;
    if (typeof s === 'string' && s.includes(':')) {
      const parts = s.split(':').map(Number);
      if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    } else {
      totalSeconds = Math.floor(Number(s));
    }

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const columns = [
    {
      title: "Nội dung học",
      dataIndex: "name",
      key: "name",
      width: "60%",
      render: (text, record) => {
        // Based on Image 2: 
        // Chapters and sub-folders use a black folder icon
        // Lessons use a circular play icon
        let icon = <FolderOpenOutlined className="text-gray-700" />;

        const isLesson = !record.children || record.children.length === 0;
        if (isLesson) {
          icon = <PlayCircleOutlined className="text-gray-700" />;
        }

        return (
          <Space>
            {icon}
            <span className="text-[#3b82f6] hover:text-[#ff9d00] cursor-pointer font-medium transition-colors duration-200">
              {text}
            </span>
          </Space>
        );
      },
    },
    {
      title: (
        <Space size={4}>
          Thời gian yêu cầu
          <FieldTimeOutlined className="text-gray-400" />
        </Space>
      ),
      key: "duration",
      align: "center",
      width: "25%",
      render: (_, record) => {
        const actual = formatDuration(record.actual_learning_time);
        const min = formatDuration(record.min_learning_time || record.weighted || record.duration);

        const isWarning = (record.actual_learning_time || 0) < (record.min_learning_time || 0);

        return (
          <span className={isWarning ? "text-red-500 font-medium" : "text-blue-500 font-medium"}>
            {actual} <span className="text-gray-400 font-normal">/ {min}</span>
          </span>
        );
      },
    },
    {
      title: "Chi tiết",
      key: "detail",
      align: "center",
      width: "15%",
      render: () => (
        <ClockCircleOutlined className="text-gray-500 text-lg cursor-pointer hover:text-blue-500" />
      ),
    },
  ];

  return (
    <Modal
      title={<span className="text-gray-700 font-medium">Thời gian tự học</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1100}
      centered
      destroyOnClose
      styles={{
        body: {
          maxHeight: 'calc(90vh - 100px)',
          overflowY: 'auto',
          padding: '12px 24px'
        }
      }}
      closeIcon={
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
          <CloseOutlined className="text-[12px] text-gray-600" />
        </div>
      }
    >
      <div className="py-2">
        <Text className="text-gray-500 block mb-6">
          Bảng dưới đây liệt kê chi tiết thời gian & mức độ hoàn thành cho mỗi mục.
          Click vào tên mục để học tiếp mục đó, click vào biểu tượng đồng hồ để xem lịch sử học tập
        </Text>

        {isLoading ? (
          <div className="py-20 text-center">
            <Spin tip="Đang tải dữ liệu..." />
          </div>
        ) : tableData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey={(record) => record.id || record.iid}
            pagination={false}
            size="small"
            bordered
            expandable={{
              defaultExpandAllRows: true,
              indentSize: 24,
            }}
            className="self-study-table [&_.ant-table-thead_th]:!bg-[#E6F7FF] [&_.ant-table-thead_th]:!font-medium [&_.ant-table-thead_th]:!text-gray-800"
          />
        ) : (
          <Empty description="Không có dữ liệu chi tiết" />
        )}
      </div>
    </Modal>
  );
};

export default SelfStudyTimeModal;
