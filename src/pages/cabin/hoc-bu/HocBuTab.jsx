import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Card,
  Tag,
  Space,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBu } from "../../../apis/apiHocbu";
import CabinDetailModal from "../CabinDetailModal";
import dayjs from "dayjs";
import HocVienInfo from "../../../components/HocVienInfor";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const HocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
  const [ma_khoa, setMaKhoa] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ ma_khoa: null, text: "" });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { data: studentData, isFetching: isFetchingStudents } = useQuery({
    queryKey: [
      "hocVienHocBuCabin",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBu({
        loai_thuc_hanh: "cabin",
        ma_khoa: appliedFilters.ma_khoa,
        text: appliedFilters.text,
        page: pagination.page,
        limit: pagination.limit,
      }),
    keepPreviousData: true,
  });

  const students = useMemo(() => normalizeApiList(studentData), [studentData]);
  const totalItems = studentData?.total || studentData?.pagination?.total || 0;

  const handleApplyFilter = () => {
    setAppliedFilters({ ma_khoa, text: searchText });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilter = () => {
    setMaKhoa(null);
    setSearchText("");
    setAppliedFilters({ ma_khoa: null, text: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 50,
      align: "center",
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Học viên",
      key: "hoc_vien",
      width: 300,
      render: (_, record) => <HocVienInfo record={record} />,
    },
    {
      title: "CCCD",
      key: "cccd",
      width: 160,
      align: "center",
      render: (_, record) => record?.cccd || "-",
    },
    {
      title: "Năm sinh",
      key: "ngay_sinh",
      width: 110,
      align: "center",
      render: (_, record) => {
        const date = record?.ngay_sinh;
        return date ? dayjs(date).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "Khóa",
      key: "ten_khoa",
      width: 150,
      align: "center",
      render: (_, record) => record?.ten_khoa || "-",
    },
    {
      title: "Giáo viên DAT",
      key: "thay_giao",
      width: 150,
      render: (_, record) => record?.thay_giao || "-",
    },
    {
      title: "Phút cabin",
      key: "tong_thoi_gian",
      width: 100,
      align: "center",
      render: (_, record) => (
        <span className="font-medium text-blue-700">
          {Math.round(record.tong_thoi_gian || 0)} phút
        </span>
      ),
    },
    {
      title: "Bài cabin",
      key: "tong_bai",
      width: 90,
      align: "center",
      render: (_, record) => <Tag>{record.tong_bai || 0} bài</Tag>,
    },
    {
      title: "Ghi chú",
      key: "ghi_chu",
      align: "center",
      render: (_, record) => record?.student?.ghi_chu || "-",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          className="!bg-[#3366cc]"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleOpenDetail(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <Card className="!mb-5">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={10} md={8} lg={6}>
            <label className="block text-xs text-gray-500 uppercase">Khóa Học</label>
            <Select
              className="w-full"
              placeholder="Chọn khóa học"
              loading={isLoadingKhoaHoc}
              value={ma_khoa}
              onChange={setMaKhoa}
              allowClear
              showSearch
              optionFilterProp="label"
              options={courseOptions}
            />
          </Col>
          <Col xs={24} sm={10} md={8} lg={6}>
            <label className="block text-xs text-gray-500 uppercase">Học viên / Mã DK</label>
            <Input
              placeholder="Nhập tên hoặc mã học viên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={4} md={8} lg={6}>
            <Space>
              <Button type="primary" className="!bg-[#3366cc]" onClick={handleApplyFilter}>
                Tìm kiếm
              </Button>
              <Button onClick={handleResetFilter}>Làm mới</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={students}
        rowKey={(record) => record.student?.id || record.student?.ma_dk}
        loading={isFetchingStudents}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: totalItems,
          showSizeChanger: true,
          onChange: (page, limit) => setPagination({ page, limit }),
        }}
        size="small"
        scroll={{ x: 1200 }}
        bordered
        className="table-blue-header"
      />

      <CabinDetailModal
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedRecord}
      />
    </div>
  );
};

export default HocBuTab;
