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
  Tag,
  Space,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyetThucHanh, updateHocBuStatus } from "../../../apis/apiHocbu";
import StudentMakeUpDetailDrawer from "../../make-up-lessons/StudentMakeUpDetailDrawer";
import dayjs from "dayjs";
import HocVienInfo from "../../../components/HocVienInfor";
import { renderTrangThaiHocBu, renderTrangThaiThucHanh } from "../../../constants/hocBuConstants";
import { useHocBuActions } from "../../../components/hooks/useHocBuActions";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const ChoDuyetHocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
  const [ma_khoa, setMaKhoa] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [trangThai, setTrangThai] = useState([]);
  const [trangThaiHocBu, setTrangThaiHocBu] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    ma_khoa: null,
    text: "",
    trang_thai: [2, 3],
    trang_thai_hoc_bu: [],
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data: studentData, isFetching: isFetchingStudents, refetch: refetchStudents } = useQuery({
    queryKey: [
      "hocVienHocBuChoDuyetCabin",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      appliedFilters.trang_thai,
      appliedFilters.trang_thai_hoc_bu,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBuChoDuyetThucHanh({
        loai_thuc_hanh: "cabin",
        ma_khoa: appliedFilters.ma_khoa,
        text: appliedFilters.text,
        page: pagination.page,
        limit: pagination.limit,
      }),
    keepPreviousData: true,
  });

  const { handleDuyet, handleHuyDuyet } = useHocBuActions(refetchStudents);

  const students = useMemo(() => {
    const list = normalizeApiList(studentData);
    return list;
  }, [studentData]);

  const totalItems = studentData?.total || studentData?.pagination?.total || 0;

  const handleApplyFilter = () => {
    setAppliedFilters({
      ma_khoa,
      text: searchText,
      trang_thai: trangThai,
      trang_thai_hoc_bu: trangThaiHocBu,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilter = () => {
    setMaKhoa(null);
    setSearchText("");
    setTrangThai([2, 3]);
    setTrangThaiHocBu([]);
    setAppliedFilters({ ma_khoa: null, text: "", trang_thai: [2, 3], trang_thai_hoc_bu: [] });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenDetail = (record) => {
    setSelectedStudent(record);
    setIsDetailOpen(true);
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 35,
      align: "center",
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Học viên",
      key: "hoc_vien",
      width: 310,
      render: (_, record) => <HocVienInfo record={record} />,
    },
    {
      title: "CCCD",
      key: "cccd",
      width: 100,
      align: "center",
      render: (_, record) => record.cccd || "-",
    },
    {
      title: "Ngày sinh",
      key: "ngay_sinh",
      width: 100,
      align: "center",
      render: (_, record) => {
        const date = record.ngay_sinh;
        return date ? dayjs(date).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "Khóa",
      key: "khoa",
      width: 100,
      align: "center",
      render: (_, record) => record.khoa || "-",
    },
    {
      title: "Giáo viên",
      key: "giao_vien",
      width: 180,
      render: (_, record) => record.giao_vien || "-",
    },
    {
      title: "Xe B1",
      key: "xe_b1",
      width: 110,
      render: (_, record) => record.xe_b1 || "-",
    },
    {
      title: "Xe B2",
      key: "xe_b2",
      width: 110,
      render: (_, record) => record.xe_b2 || "-",
    },
    {
      title: "Trạng thái",
      key: "trang_thai",
      align: "center",
      width: 120,
      render: (_, record) => renderTrangThaiHocBu(record.trang_thai),
    },
    {
      title: "Trạng thái học bù",
      key: "trang_thai_thuc_hanh",
      align: "center",
      width: 120,
      render: (_, record) => renderTrangThaiThucHanh(record.trang_thai_thuc_hanh, "cabin"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => {
        const st = record?.trang_thai ?? record?.student?.trang_thai;
        const isChoDuyet = String(st) === "4";
        const isDaDuyet = String(st) === "5";
        return (
          <Space>
            <Button
              type="primary"
              className="!bg-[#3366cc]"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleOpenDetail(record)}
            />
            {isChoDuyet && (
              <Popconfirm
                title="Duyệt học bù"
                description="Bạn có chắc chắn muốn duyệt không?"
                onConfirm={() => handleDuyet(record.id, record, "cabin")}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  type="primary"
                  className="!bg-green-600 hover:!bg-green-700 border-none"
                  icon={<CheckOutlined />}
                  size="small"
                />
              </Popconfirm>
            )}
            {isDaDuyet && (
              <Popconfirm
                title="Hủy duyệt học bù"
                description="Bạn có chắc chắn muốn hủy duyệt không?"
                onConfirm={() => handleHuyDuyet(record.id, record)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  type="primary"
                  className="!bg-red-500 hover:!bg-red-600 border-none"
                  icon={<CloseOutlined />}
                  size="small"
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card className="!mb-5">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={10} md={8} lg={5}>
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
          <Col xs={24} sm={10} md={8} lg={5}>
            <label className="block text-xs text-gray-500 uppercase">Học viên / Mã DK</label>
            <Input
              placeholder="Nhập tên hoặc mã học viên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={10} md={8} lg={5}>
            <label className="block text-xs text-gray-500 uppercase">Trạng thái</label>
            <Select
              className="w-full"
              mode="multiple"
              placeholder="Chọn trạng thái"
              value={trangThai}
              onChange={setTrangThai}
              allowClear
              maxTagCount="responsive"
              options={[
                { label: "Chờ duyệt", value: 2 },
                { label: "Đã duyệt", value: 3 },
              ]}
            />
          </Col>
          <Col xs={24} sm={10} md={8} lg={5}>
            <label className="block text-xs text-gray-500 uppercase">Trạng thái học bù</label>
            <Select
              className="w-full"
              mode="multiple"
              placeholder="Chọn trạng thái học bù"
              value={trangThaiHocBu}
              onChange={setTrangThaiHocBu}
              allowClear
              maxTagCount="responsive"
              options={[
                { label: "Chưa đăng ký", value: 1 },
                { label: "Đã đăng ký", value: 2 },
              ]}
            />
          </Col>
          <Col xs={24} sm={4} md={8} lg={4}>
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
        rowKey={(record) => record.id || record.ma_dk}
        loading={isFetchingStudents}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: totalItems,
          showSizeChanger: true,
          onChange: (page, limit) => setPagination({ page, limit }),
        }}
        size="small"
        scroll={{ x: 1300 }}
        bordered
        className="table-blue-header"
      />

      <StudentMakeUpDetailDrawer
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
};

export default ChoDuyetHocBuTab;
