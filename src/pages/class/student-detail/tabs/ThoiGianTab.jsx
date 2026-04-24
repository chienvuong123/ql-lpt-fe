import React, { useState, useMemo } from "react";
import { Table, DatePicker, Row, Col, Typography, Space, Spin, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getLearningTimeTracking } from "../../../../apis/apiLyThuyetLocal";

const { Text, Title } = Typography;

const ThoiGianTab = ({ studentData, enrolmentPlanIid, visible, activeTab }) => {

  const [dateRange, setDateRange] = useState([null, null]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const userIid = studentData?.user?.iid;

  // 1. Fetch Learning Time Tracking Data
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["getLearningTimeTracking", userIid, enrolmentPlanIid, page, pageSize, dateRange],
    queryFn: () =>
      getLearningTimeTracking({
        user_iid: userIid,
        ep_iid: enrolmentPlanIid,
        page: page,
        items_per_page: pageSize,
        start_date: dateRange[0] ? dateRange[0].startOf("day").unix() : undefined,
        end_date: dateRange[1] ? dateRange[1].endOf("day").unix() : undefined,
        submit: 1,
      }),
    enabled: !!userIid && !!enrolmentPlanIid && !!visible && activeTab === "4",

  });

  const results = trackingData?.result || [];
  const totalRecords = trackingData?.total || 0;

  // 2. Helpers
  const formatDuration = (s) => {
    if (!s) return "00:00:00";
    const totalSeconds = Math.floor(s);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Calculate total KPI time from data (or if API provides a separate total, use that)
  // Based on the image, it shows a total time. If the API doesn't provide it, we could sum the current results
  // but usually it's a global total. For now, let's sum what we have if there's no overall total in the response.
  const totalKpiTime = useMemo(() => {
    // If the API returns a summary object like logData?.objects?.total_kpi_time, use it.
    // Otherwise, sum the gain_kpi_time from all records if possible.
    // Since we don't have all records (due to pagination), we'd usually expect the API to return the total.
    return trackingData?.objects?.total_kpi_time || results.reduce((acc, curr) => acc + (curr.gained_kpi_time || 0), 0);
  }, [trackingData, results]);

  const dateSpan = useMemo(() => {
    if (results.length === 0) return "";
    const dates = results.map(r => r.date).filter(Boolean).sort();
    if (dates.length === 0) return "";
    const start = dayjs.unix(dates[0]).format("DD/MM/YYYY");
    const end = dayjs.unix(dates[dates.length - 1]).format("DD/MM/YYYY");
    return `(từ ngày ${start} đến ngày ${end})`;
  }, [results]);

  const columns = [
    {
      title: "Ngày học",
      dataIndex: "date",
      key: "date",
      align: "center",
      render: (ts) => ts ? dayjs.unix(ts).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Thời gian thực tế",
      dataIndex: "real_time_spent",
      key: "real_time_spent",
      align: "center",
      render: (s) => <Text className="font-medium">{formatDuration(s)}</Text>,
    },
    {
      title: "Thời gian kpi được ghi nhận",
      dataIndex: "gained_kpi_time",
      key: "gained_kpi_time",
      align: "center",
      render: (s) => <Text className="font-medium">{formatDuration(s)}</Text>,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: () => (
        <Button type="link" className="!p-0 !text-blue-500">
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* 1. Summary Label */}
      <div>
        <Text className="text-[15px] text-gray-700">
          Tổng thời gian kpi đã đạt được: <Text strong className="text-black">{formatDuration(totalKpiTime)}</Text> {dateSpan}
        </Text>
      </div>

      {/* 2. Filters */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1">
          <Text className="text-gray-500 text-[13px]">Ngày bắt đầu</Text>
          <DatePicker
            className="w-64"
            placeholder="Chọn ngày"
            value={dateRange[0]}
            onChange={(val) => setDateRange([val, dateRange[1]])}
            format="DD/MM/YYYY"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Text className="text-gray-500 text-[13px]">Ngày kết thúc</Text>
          <DatePicker
            className="w-64"
            placeholder="Chọn ngày"
            value={dateRange[1]}
            onChange={(val) => setDateRange([dateRange[0], val])}
            format="DD/MM/YYYY"
          />
        </div>
      </div>

      {/* 3. Table */}
      <div className="mt-2">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}

          rowKey="id"
          pagination={{
            total: totalRecords,
            current: page,
            pageSize: pageSize,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            className: "!mt-4",
            showTotal: (total, range) => (
              <span className="text-orange-500">
                Hiển thị {range[0]}-{range[1]} tổng {total}
              </span>
            ),
          }}
          bordered
          size="small"
          className="theory-detail-table 
            [&_.ant-table-thead_th]:!bg-[#E6F7FF] 
            [&_.ant-table-thead_th]:!text-gray-800 
            [&_.ant-table-thead_th]:!font-semibold 
            [&_.ant-table-thead_th]:!text-[14px] 
            [&_.ant-table-cell]:text-[14px]"
        />
      </div>
    </div>
  );
};

export default React.memo(ThoiGianTab);

