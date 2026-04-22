import React, { useRef, useState } from "react";
import { Table, Typography, Space, Spin, Tag, Button, Empty } from "antd";
import { LeftOutlined, RightOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getCameraSnapshot, getTimeTrackingLog } from "../../../../apis/apiLyThuyetLocal";

const { Text, Title } = Typography;

const MinhChungTab = ({ studentData, enrolmentPlanIid, visible }) => {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Fetch Camera Snapshots
  const { data: photoData, isLoading: isPhotosLoading } = useQuery({
    queryKey: ["getCameraSnapshot", studentData?.user?.iid, enrolmentPlanIid],
    queryFn: () =>
      getCameraSnapshot({
        user_iid: studentData?.user?.iid,
        ep_iid: enrolmentPlanIid,
        submit: 1,
      }),
    enabled: !!studentData?.user?.iid && !!enrolmentPlanIid && !!visible,
  });

  const snapshots = photoData?.result?.snapshots || [];

  // 2. Fetch Study KPI Logs
  const { data: logData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["getTimeTrackingLog", studentData?.user?.iid, enrolmentPlanIid, page, pageSize],
    queryFn: () =>
      getTimeTrackingLog({
        user_iid: studentData?.user?.iid,
        enrolment_plan_iid: enrolmentPlanIid,
        page: page,
        items_per_page: pageSize,
        submit: 1,
      }),
    enabled: !!studentData?.user?.iid && !!enrolmentPlanIid && !!visible,
  });

  const logs = logData?.result || [];
  const totalLogs = logData?.total || 0;
  const totalKpiTime = logData?.objects?.total_kpi_time || 0;

  // Helper to scroll the gallery
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      // Scroll by one full page (clientWidth) to move roughly 6 images
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Helper to format timestamp: 12:16, 21 Tháng Ba, 2026
  const formatTs = (ts) => {
    if (!ts) return "";
    const date = new Date(ts * 1000);
    const months = [
      "Một", "Hai", "Ba", "Tư", "Năm", "Sáu",
      "Bảy", "Tám", "Chín", "Mười", "Mười Một", "Mười Hai"
    ];

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${hh}:${mm}, ${day} Tháng ${month}, ${year}`;
  };

  // Helper to format duration: HH:mm:ss
  const formatDuration = (s) => {
    if (!s) return "00:00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Helper to format KPI total time: 4 ngày - 10:31:17
  const formatKpiDuration = (s) => {
    if (!s) return "0 ngày - 00:00:00";
    const d = Math.floor(s / 86400);
    const remainingS = s % 86400;
    const h = Math.floor(remainingS / 3600);
    const m = Math.floor((remainingS % 3600) / 60);
    const sec = remainingS % 60;
    return `${d} ngày - ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "hour_ts",
      key: "time",
      width: "25%",
      render: (ts) => <span className="text-gray-600">{formatTs(ts)}</span>,
    },
    {
      title: "Thời gian thực tế",
      dataIndex: "time_spent",
      key: "actualTime",
      width: "20%",
      align: "center",
      render: (s) => <span className="font-medium text-gray-700">{formatDuration(s)}</span>,
    },
    {
      title: "Tên nội dung học",
      dataIndex: "item_name",
      key: "content",
      render: (name, record) => (
        <span className="text-gray-600 italic">
          {record.item_ntype === 'video' ? '(Video) ' : ''}{name}
        </span>
      ),
    },
  ];

  if (isPhotosLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" tip="Đang tải minh chứng học tập..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4 pr-1">
      {/* 1. Camera Snapshots Section */}
      <section className="camera-section">
        <Title level={5} className="!text-[16px] !font-medium !mb-4 !text-gray-800">
          Ghi hình camera
        </Title>

        <div className="relative group">
          {/* Navigation Arrows */}
          <Button
            shape="circle"
            icon={<LeftOutlined />}
            className="!absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 shadow-md !flex items-center justify-center bg-white hover:!bg-gray-50 border-gray-200"
            onClick={() => scroll("left")}
          />
          <Button
            shape="circle"
            icon={<RightOutlined />}
            className="!absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 shadow-md !flex items-center justify-center bg-white hover:!bg-gray-50 border-gray-200"
            onClick={() => scroll("right")}
          />

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {snapshots.length > 0 ? (
              snapshots.map((item, idx) => (
                <div key={item.file?.id || idx} className="flex-shrink-0 w-[215px] snap-start">
                  <div className="aspect-[3/4] rounded-sm overflow-hidden mb-2 bg-gray-100 border border-gray-200">
                    <img
                      src={item.file?.link}
                      alt={`Snapshot ${idx}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center">
                    <Text className="text-[12px] text-gray-500">
                      {formatTs(item.ts)}
                    </Text>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full py-10 flex justify-center border border-dashed border-gray-300 rounded-md">
                <Empty description="Không có ảnh chụp camera" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </div>
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* 2. Study KPI Logs Section */}
      <section className="kpi-section">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Title level={5} className="!text-[16px] !font-medium !m-0 !text-gray-800">
              Thời gian kpi tự học
            </Title>
            <Tag color="success" className="!bg-[#F6FFED] !border-[#B7EB8F] !text-[#52C41A] !px-2 !py-0.5 rounded-sm !text-[13px] font-medium">
              {formatKpiDuration(totalKpiTime)}
            </Tag>
          </div>
        </div>

        <div className="min-h-[440px]">
          <Table
            columns={columns}
            dataSource={logs}
            loading={isLogsLoading}
            rowKey="id"
            pagination={{
              size: "small",
              showSizeChanger: false, // Bỏ phần hiển thị 10/trang
              showTotal: (total) => `Tổng số ${total} bản ghi`, // Thêm tổng số bản ghi
              total: totalLogs,
              current: page,
              pageSize: pageSize,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              className: "!mt-4",
            }}
            bordered
            size="small"
            className="theory-detail-table [&_.ant-table-thead_th]:!bg-[#E6F7FF] [&_.ant-table-thead_th]:!text-gray-800 [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-thead_th]:!text-[14px] [&_.ant-table-cell]:text-[14px]"
          />
        </div>
      </section>
    </div>
  );
};

export default MinhChungTab;
