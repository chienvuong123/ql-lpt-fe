import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Progress,
  Row,
  Col,
  DatePicker,
} from "antd";
import { useNavigate } from "react-router-dom";
import { lopHocLyThuyet } from "../../apis/khoaHoc";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DangNhapLopLyThuyet } from "../../apis/auth";

const ClassManagement = () => {
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [params, setParams] = useState({
    text: "",
  });

  const navigate = useNavigate();

  const { data: loginData } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity, // không gọi lại
    select: (data) => data?.result,
  });

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["lopHocLyThuyet", params],
    queryFn: () => lopHocLyThuyet(loginData, params),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const dataSource = useMemo(() => {
    return dataKhoaHoc?.result || [];
  }, [dataKhoaHoc]);

  const handleFilter = () => {
    const newParams = {
      text: searchText || undefined,
      start_date: startDate ? dayjs(startDate).unix() : undefined,
      end_date: endDate ? dayjs(endDate).unix() : undefined,
    };

    Object.keys(newParams).forEach(
      (key) => newParams[key] === undefined && delete newParams[key],
    );

    setParams(newParams);
  };

  const handleClearFilter = () => {
    setSearchText("");
    setStartDate(null);
    setEndDate(null);
    setParams({ page: 1, text: "" });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#008000";
    if (progress >= 50) return "#faad14";
    return "#f5222d";
  };

  const handleNavigate = (record) => {
    navigate("/thanh-vien-lop-hoc", {
      state: {
        enrolment_plan_iid: record?.iid,
        program_name: record?.__expand?.program?.name,
        program_code: record?.__expand?.program?.code,
      },
    });
  };

  const columns = [
    {
      title: "Tên khóa học",
      dataIndex: "suffix_name",
      key: "suffix_name",
      width: 120,
      align: "left",
      render: (text, record) => (
        <span>
          <span className="font-bold">{text}</span>{" "}
          <p>{dayjs.unix(record?.ts).format("DD-MM-YYYY")}</p>
        </span>
      ),
    },
    {
      title: "Dơn vị",
      dataIndex: "__expand",
      key: "__expand",
      ellipsis: true,
      width: 300,
      render: (stats) => (
        <span>
          {stats?.organizations?.[0]?.short_name || "Không có đơn vị"}
        </span>
      ),
    },
    {
      title: "Bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
      width: 100,
      render: (date) => <span>{dayjs.unix(date).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "Kết thúc",
      dataIndex: "end_date",
      key: "end_date",
      width: 100,
      render: (date) => <span>{dayjs.unix(date).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "Lớp học",
      dataIndex: "number_of_courses",
      key: "number_of_courses",
      width: 70,
      align: "center",
    },

    {
      title: "Thành viên",
      dataIndex: "stats",
      key: "stats",
      width: 90,
      align: "center",
      render: (stats) => <span>{stats?.total_members || 0}</span>,
    },
    {
      title: "Đã học",
      dataIndex: "stats",
      key: "stats",
      width: 60,
      align: "center",
      render: (stats) => <span>{stats?.passed || 0}</span>,
    },
    {
      title: "Tiến độ",
      dataIndex: "stats",
      key: "stats",
      width: 120,
      render: (_, record) => {
        const percent = Math.floor(
          ((record.stats?.passed || 0) / (record.stats?.total_members || 1)) *
            100,
        );

        return (
          <div className="flex flex-col items-start w-full gap-2">
            <span className="text-[9px] text-gray-600">
              {record.stats?.total_members - record.stats?.passed || 0} chưa
              hoàn thành
            </span>

            <Progress
              percent={percent}
              strokeColor={getProgressColor(percent)}
              format={() => ""}
            />

            <span className="!text-[11px]">
              {record.stats?.passed || 0}/{record.stats?.total_members || 0} (
              {percent}%)
            </span>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 80,
      align: "center",
      render: (status) => (
        <Tag color="#008000" variant="filled" className="!rounded-full">
          {status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Space size="small" className="flex justify-center flex-wrap">
          <Button
            type="text"
            size="small"
            onClick={() => handleNavigate(record)}
            className="!bg-gray-300 !text-[13px] !rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            👥
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-7xl p-4 mx-auto bg-gray-50 min-h-screen rounded-lg shadow-md ">
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Quản lý lớp học lý thuyết
      </h1>
      <p className="text-[#64748b] text-sm">
        Đồng bộ và theo dõi tiến độ học viên theo lớp.
      </p>
      <Row gutter={[12, 12]} align="bottom" className="mt-8">
        <Col>
          <label className="block text-xs text-gray-500 uppercase">
            Tên Khóa Học
          </label>
          <Input
            placeholder="Mã / Tên lớp"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col>
          <label className="block text-xs text-gray-500 uppercase">
            Ngày bắt đầu
          </label>
          <DatePicker
            value={startDate}
            onChange={(date) => setStartDate(date)}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
          />
        </Col>
        <Col>
          <label className="block text-xs text-gray-500 uppercase">
            Ngày kết thúc
          </label>
          <DatePicker
            value={endDate}
            onChange={(date) => setEndDate(date)}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            disabledDate={(current) => startDate && current < startDate} // không chọn trước ngày bắt đầu
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              className="!bg-[#0000CC]"
              onClick={handleFilter}
            >
              Lọc
            </Button>
            <Button onClick={handleClearFilter}>Bỏ Lọc</Button>
          </Space>
        </Col>
      </Row>
      <Row className="mt-8 mb-2">
        <span>
          Tổng: <span className="font-bold">{dataSource?.length || 0}</span> lớp
        </span>
      </Row>
      <Table
        columns={columns}
        dataSource={dataSource || []}
        loading={isLoadingKhoaHoc}
        rowKey="id"
        pagination={false}
        size="middle"
        scroll={{ x: 1200 }}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default ClassManagement;
