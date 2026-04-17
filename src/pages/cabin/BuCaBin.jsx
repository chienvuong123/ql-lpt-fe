import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Card,
  Image,
  Spin,
  Tag,
  Space,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuCabin } from "../../apis/apiHocbu";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import CabinDetailModal from "./CabinDetailModal";
import dayjs from "dayjs";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

import { Typography } from 'antd'

const BuCaBin = () => {
  const [ma_khoa, setMaKhoa] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    ma_khoa: null,
    text: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 1. Lấy danh sách khóa học
  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["optionLopLyThuyet"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 10,
  });

  const courseOptions = useMemo(() => {
    const list = normalizeApiList(dataKhoaHoc);
    return list.map((item) => ({
      label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
      value: item?.code,
    }));
  }, [dataKhoaHoc]);

  // 2. Lấy danh sách học viên cần bù Cabin (loai: 2)
  const { data: studentData, isFetching: isFetchingStudents } = useQuery({
    queryKey: [
      "hocVienHocBuCabin",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBuCabin({
        loai: 2,
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
      render: (_, __, index) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Học viên",
      key: "hoc_vien",
      width: 300,
      render: (_, record) => {
        const s = record?.student;
        if (!s) return <span className="text-gray-400 italic">Thiếu dữ liệu HV</span>;

        return (
          <Space>
            <Image
              src={s.anh}
              width={40}
              height={40}
              className="rounded-lg object-cover"
              fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{s.ho_ten}</span>
              <Typography.Text
                className="!text-[13px]"
                copyable={{ text: s.ma_dk }}
              >
                {s.ma_dk}
              </Typography.Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "CCCD",
      key: "cccd",
      width: 160,
      align: "center",
      render: (_, record) => record?.student?.cccd || "-",
    },
    {
      title: "Năm sinh",
      key: "ngay_sinh",
      width: 110,
      align: "center",
      render: (_, record) => {
        const date = record?.student?.ngay_sinh;
        return (
          date ? dayjs(date).format("DD/MM/YYYY") : "-"
        );
      },
    },
    {
      title: "Khóa",
      key: "ten_khoa",
      width: 150,
      align: "center",
      render: (_, record) => record?.student?.ten_khoa || "-",
    },
    {
      title: "Giáo viên DAT",
      key: "thay_giao",
      width: 150,
      render: (_, record) =>
        record?.student?.thay_giao || "-"
      ,
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
      render: (_, record) => {
        const note = record?.student?.ghi_chu;
        return (
          note || "-"
        );
      },
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Học bù Cabin
        </h1>
      </div>

      <Card className="!mb-5">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={10} md={8} lg={6}>
            <label className="block text-xs text-gray-500 uppercase">
              Khóa Học
            </label>
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
            <label className="block text-xs text-gray-500 uppercase">
              Học viên / Mã DK
            </label>
            <Input
              placeholder="Nhập tên hoặc mã học viên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={4} md={8} lg={6}>
            <Space>
              <Button
                type="primary"
                className="!bg-[#3366cc]"
                onClick={handleApplyFilter}
              >
                Tìm kiếm
              </Button>
              <Button onClick={handleResetFilter}>
                Làm mới
              </Button>
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

export default BuCaBin;
