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
  Tabs,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  getDanhSachHocVienHocBuLyThuyet,
  getDanhSachHocVienHocBuChoDuyet,
  updateHocBuStatus,
} from "../../apis/apiHocbu";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import TheoryDetailModal from "./TheoryDetailModal";
import StudentMakeUpDetailDrawer from "../make-up-lessons/StudentMakeUpDetailDrawer";
import dayjs from "dayjs";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const HocBuTab = ({ dataKhoaHoc, isLoadingKhoaHoc, courseOptions }) => {
  const [ma_khoa, setMaKhoa] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ ma_khoa: null, text: "" });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMaDk, setSelectedMaDk] = useState(null);

  const { data: studentData, isFetching: isFetchingStudents } = useQuery({
    queryKey: [
      "hocVienHocBuLyThuyet",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBuLyThuyet({
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
    setSelectedMaDk(record?.student?.ma_dk);
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
      width: 250,
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
              <Typography.Text className="!text-[12px]" copyable={{ text: s.ma_dk }}>
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
      width: 140,
      align: "center",
      render: (_, record) => record?.student?.cccd || "-",
    },
    {
      title: "Ngày sinh",
      key: "ngay_sinh",
      width: 100,
      align: "center",
      render: (_, record) => {
        const date = record?.student?.ngay_sinh;
        return date ? dayjs(date).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "Khóa",
      key: "ten_khoa",
      width: 120,
      align: "center",
      render: (_, record) => record?.student?.ten_khoa || "-",
    },
    {
      title: "Giáo viên",
      key: "thay_giao",
      width: 150,
      render: (_, record) => record?.student?.thay_giao || "-",
    },
    {
      title: "Đạt lý thuyết",
      key: "loai_ly_thuyet",
      width: 120,
      align: "center",
      render: (_, record) => (
        record?.theoryInfo?.loai_ly_thuyet ? (
          <Tag color="green">Đạt</Tag>
        ) : (
          <Tag color="red">Chưa đạt</Tag>
        )
      ),
    },
    {
      title: "Bài hết môn",
      key: "loai_het_mon",
      width: 120,
      align: "center",
      render: (_, record) => (
        record?.theoryInfo?.loai_het_mon ? (
          <Tag color="green">Đã làm</Tag>
        ) : (
          <Tag color="red">Chưa làm</Tag>
        )
      ),
    },
    {
      title: "Ghi chú",
      key: "ghi_chu",
      render: (_, record) => record?.student?.ghi_chu || "-",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
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
        scroll={{ x: 1300 }}
        bordered
        className="table-blue-header"
      />

      <TheoryDetailModal
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        ma_dk={selectedMaDk}
      />
    </div>
  );
};

const ChoDuyetHocBuTab = ({ dataKhoaHoc, isLoadingKhoaHoc, courseOptions }) => {
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
      "hocVienHocBuChoDuyetLyThuyet",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      appliedFilters.trang_thai,
      appliedFilters.trang_thai_hoc_bu,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBuChoDuyet({
        loai: 1,
        ma_khoa: appliedFilters.ma_khoa,
        text: appliedFilters.text,
        trang_thai: appliedFilters.trang_thai,
        trang_thai_hoc_bu: appliedFilters.trang_thai_hoc_bu,
        page: pagination.page,
        limit: pagination.limit,
      }),
    keepPreviousData: true,
  });

  const students = useMemo(() => {
    const list = normalizeApiList(studentData);
    return list.filter((item) => {
      const st = item?.trang_thai ?? item?.student?.trang_thai;
      const stHocBu = item?.student?.trang_thai_hoc_bu ?? item?.trang_thai_hoc_bu;

      // Match appliedFilters.trang_thai
      const matchTrangThai = appliedFilters.trang_thai && appliedFilters.trang_thai.length > 0
        ? appliedFilters.trang_thai.some((val) => String(val) === String(st))
        : (String(st) === "2" || String(st) === "3");

      // Match appliedFilters.trang_thai_hoc_bu
      const matchTrangThaiHocBu = appliedFilters.trang_thai_hoc_bu && appliedFilters.trang_thai_hoc_bu.length > 0
        ? appliedFilters.trang_thai_hoc_bu.some((val) => String(val) === String(stHocBu))
        : true;

      return matchTrangThai && matchTrangThaiHocBu;
    });
  }, [studentData, appliedFilters]);

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

  const handleDuyet = async (recordId) => {
    try {
      const username = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
      await updateHocBuStatus({ id: recordId, trang_thai: 3, nguoi_update: username, updated_at: new Date().toISOString() });
      message.success("Duyệt học bù thành công!");
      refetchStudents();
    } catch (err) {
      message.error("Duyệt học bù thất bại!");
    }
  };

  const handleHuyDuyet = async (recordId) => {
    try {
      const username = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
      await updateHocBuStatus({ id: recordId, trang_thai: 2, nguoi_update: username, updated_at: new Date().toISOString() });
      message.success("Hủy duyệt học bù thành công!");
      refetchStudents();
    } catch (err) {
      message.error("Hủy duyệt học bù thất bại!");
    }
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
      render: (value) => {
        if (!value) return <span className="text-gray-400 italic">Thiếu dữ liệu HV</span>;

        return (
          <Space>
            <Image
              src={value.anh}
              width={40}
              height={40}
              className="rounded-md"
              fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{value.ho_ten}</span>
              <Typography.Text className="!text-[12px]" copyable={{ text: value.ma_dk }}>
                {value.ma_dk}
              </Typography.Text>
            </div>
          </Space>
        );
      },
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
      key: "ten_khoa",
      width: 100,
      align: "center",
      render: (_, record) => record.ten_khoa || "-",
    },
    {
      title: "Giáo viên",
      key: "thay_giao",
      width: 200,
      render: (_, record) => record.thay_giao || "-",
    },
    {
      title: "Lý thuyết",
      key: "theory_status",
      width: 70,
      align: "center",
      render: (_, record) => {
        const theory = record.detail?.theoryInfo;
        const isPass = theory?.loai_ly_thuyet && theory?.loai_het_mon;
        return (
          <Tag variant="solid" color={isPass ? "green" : "red"} className="!w-17 !text-center !rounded-full">
            {isPass ? "Đạt" : "Chưa đạt"}
          </Tag>
        );
      },
    },
    {
      title: "Cabin",
      key: "cabin_status",
      width: 100,
      align: "center",
      render: (_, record) => {
        const cabin = record.detail?.cabinInfo;
        const isPass = (cabin?.tong_bai || 0) >= 8 && (cabin?.tong_thoi_gian || 0) >= 150;
        return (
          <Tag variant="solid" color={isPass ? "green" : "red"} className="!w-17 !text-center !rounded-full">
            {isPass ? "Đạt" : "Chưa đạt"}
          </Tag>
        );
      },
    },
    {
      title: "Km đã học",
      key: "tong_quang_duong",
      width: 110,
      align: "center",
      render: (_, record) => (
        <span className="font-medium">
          {record.detail?.datInfo?.tong_quang_duong || 0} km
        </span>
      ),
    },
    {
      title: "Thời gian học",
      key: "tong_thoi_gian",
      width: 115,
      align: "center",
      render: (_, record) => (
        <span className="font-medium">
          {record.detail?.datInfo?.tong_thoi_gian}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "trang_thai",
      align: "center",
      width: 100,
      render: (_, record) => {
        const st = record?.trang_thai ?? record?.student?.trang_thai;
        if (String(st) === "2") return <Tag color="orange">Chờ duyệt</Tag>;
        if (String(st) === "3") return <Tag color="green">Đã duyệt</Tag>;
        return <Tag color="default">-</Tag>;
      },
    },
    {
      title: "Trạng thái học bù",
      key: "trang_thai_hoc_bu",
      align: "center",
      width: 140,
      render: (_, record) => {
        const st = record.student?.trang_thai_hoc_bu ?? record.trang_thai_hoc_bu;
        if (String(st) === "1") {
          return <Tag color="red">Chưa đăng ký</Tag>;
        }
        if (String(st) === "2") {
          return <Tag color="blue">Đã đăng ký</Tag>;
        }
        return <Tag color="default">Chưa đăng ký</Tag>;
      },
    },
    {
      title: "Thời gian đăng ký bù",
      key: "created_at",
      width: 180,
      align: "center",
      render: (_, record) => (
        <span>
          {dayjs(record.created_at).format("DD/MM/YYYY HH:mm:ss")}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => {
        const st = record?.trang_thai ?? record?.student?.trang_thai;
        const isChoDuyet = String(st) === "2";
        const isDaDuyet = String(st) === "3";
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
                onConfirm={() => handleDuyet(record.id)}
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
                onConfirm={() => handleHuyDuyet(record.id)}
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

const HocBuLyThuyet = () => {
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

  const tabItems = [
    {
      key: "hoc-bu",
      label: "Học bù",
      children: (
        <HocBuTab
          dataKhoaHoc={dataKhoaHoc}
          isLoadingKhoaHoc={isLoadingKhoaHoc}
          courseOptions={courseOptions}
        />
      ),
    },
    {
      key: "cho-duyet",
      label: "Chờ duyệt học bù",
      children: (
        <ChoDuyetHocBuTab
          dataKhoaHoc={dataKhoaHoc}
          isLoadingKhoaHoc={isLoadingKhoaHoc}
          courseOptions={courseOptions}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Học bù lý thuyết</h1>
      </div>

      <Tabs defaultActiveKey="hoc-bu" items={tabItems} className="theory-tabs" />
    </div>
  );
};

export default HocBuLyThuyet;
