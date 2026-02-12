import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Progress,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import { danhSachKhoaHoc } from "../../apis/khoaHoc";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

const ClassManagement = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    trangThai: "",
  });

  const navigate = useNavigate();

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["danhSachKhoaHoc", params],
    queryFn: () => danhSachKhoaHoc(params),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const dataSource = useMemo(() => {
    return dataKhoaHoc?.data || [];
  }, [dataKhoaHoc]);

  const paginationFromApi = useMemo(() => {
    return dataKhoaHoc?.data?.pagination || {};
  }, [dataKhoaHoc]);

  const handleFilter = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: searchText,
      trangThai: statusFilter,
    }));
  };

  const handleClearFilter = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setParams({
      page: 1,
      limit: 10,
      search: "",
      trangThai: "",
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#008000";
    if (progress >= 50) return "#faad14";
    return "#f5222d";
  };

  const columns = [
    {
      title: "Tên khóa học",
      dataIndex: "maKhoa",
      key: "maKhoa",
      width: 120,
      align: "center",
      render: (text) => <span className="font-bold">{text}</span>,
    },
    {
      title: "Dơn vị",
      dataIndex: "tenKhoa",
      key: "tenKhoa",
      width: 300,
    },
    {
      title: "Bắt đầu",
      dataIndex: "ngayBatDau",
      key: "ngayBatDau",
      width: 100,
      render: (date) => <span>{dayjs(date).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "Kết thúc",
      dataIndex: "ngayKetThuc",
      key: "ngayKetThuc",
      width: 100,
      render: (date) => <span>{dayjs(date).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "Lớp học",
      dataIndex: "lopHoc",
      key: "lopHoc",
      width: 70,
      align: "center",
    },

    {
      title: "Thành viên",
      dataIndex: "luotCuDiHoc",
      key: "luotCuDiHoc",
      width: 90,
      align: "center",
    },
    {
      title: "Đã học",
      dataIndex: "soLuotDat",
      key: "soLuotDat",
      width: 60,
      align: "center",
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 120,
      render: (_, record) => {
        const percent = Math.floor(
          (record.soLuotDat / (record.luotCuDiHoc || 1)) * 100,
        );

        return (
          <div className="flex flex-col items-start w-full gap-2">
            <span className="text-[9px] text-gray-600">
              {record.luotCuDiHoc - record.soLuotDat} chưa hoàn thành
            </span>

            <Progress
              percent={percent}
              strokeColor={getProgressColor(percent)}
              format={() => ""}
            />

            <span className="!text-[11px]">
              {record.soLuotDat}/{record.luotCuDiHoc} ({percent}%)
            </span>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
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
      render: () => (
        <Space size="small" className="flex justify-center flex-wrap">
          <Button
            type="text"
            size="small"
            onClick={() => navigate("/thanh-vien-lop-hoc")}
            className="!bg-gray-300 !text-[13px] !rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            👥
          </Button>
          <Button
            type="primary"
            size="small"
            className="!bg-[#0000CC] !text-[13px] !rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            🔄
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

      <Space size="small" className="my-4">
        <Button
          type="primary"
          className="!font-medium !bg-[#0000CC] !shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 !px-4 !py-2 !h-10 !rounded-xl"
        >
          🔄 Đồng bộ lớp
        </Button>

        <Button
          type="text"
          className="!font-medium !bg-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center !px-4 !py-2 !h-10 !rounded-xl"
        >
          👥 Đồng bộ toàn bộ thành viên
        </Button>
      </Space>

      <Row gutter={[12, 12]} align="bottom">
        <Col>
          <label className="block text-xs text-gray-500">TỪ KHÓA</label>
          <Input
            placeholder="Mã / Tên lớp"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col span={4}>
          <label className="block text-xs text-gray-500">TRẠNG THÁI</label>
          <Select
            placeholder="--Tất cả--"
            className="w-full"
            // defaultValue="all"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          >
            <Select.Option value="đã triển khai">Đã triển khai</Select.Option>
            <Select.Option value="chưa triển khai">
              Chưa triển khai
            </Select.Option>
          </Select>
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

      <Table
        columns={columns}
        dataSource={dataSource?.data || []}
        loading={isLoadingKhoaHoc}
        rowKey="id"
        pagination={{
          current: params.page,
          pageSize: params.limit,
          total: paginationFromApi.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} khóa học`,
        }}
        onChange={(pagination) => {
          setParams((prev) => ({
            ...prev,
            page: pagination.current,
            limit: pagination.pageSize,
          }));
        }}
        size="middle"
        scroll={{ x: 1200 }}
        className="rounded-lg overflow-hidden mt-10"
      />
    </div>
  );
};

export default ClassManagement;
