import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Typography,
  Space,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { trungXeGiaoVien } from "../../apis/apiTrungXeGiaoVien";
import { DanhSachKhoaHoc } from "../../apis/hocVien";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const KiemTraTrungXeGiaoVien = () => {
  const [form] = Form.useForm();
  
  // Pagination & query states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchFilters, setSearchFilters] = useState({
    start_date: undefined,
    end_date: undefined,
    type: undefined,
    ma_khoa: undefined,
  });

  // Query list of courses for filter dropdown
  const { data: courseResponse = {}, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["kiemTraTrung", "courses"],
    queryFn: () => DanhSachKhoaHoc(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Parse course options
  const courseOptions = useMemo(() => {
    const courses = Array.isArray(courseResponse?.data?.Data)
      ? courseResponse.data.Data
      : [];

    return courses.map((course) => ({
      value: course?.MaKhoaHoc || course?.Ten || "",
      label: `${course?.Ten || course?.MaKhoaHoc || `Khóa ${course?.ID || ""}`}`,
      searchText: `${course?.Ten || ""} ${course?.MaKhoaHoc || ""}`.trim(),
    }));
  }, [courseResponse]);

  // Query conflict data
  const queryParams = useMemo(() => ({
    page,
    limit,
    ...searchFilters,
  }), [page, limit, searchFilters]);

  const { data: conflictResponse, isLoading: isLoadingConflicts, isFetching } = useQuery({
    queryKey: ["trungXeGiaoVien", queryParams],
    queryFn: () => trungXeGiaoVien(queryParams),
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const conflictList = useMemo(() => {
    return conflictResponse?.data || [];
  }, [conflictResponse]);

  const totalConflicts = conflictResponse?.total || 0;

  // Search submit handler
  const handleSearchSubmit = (values) => {
    const { dates, type, ma_khoa } = values;
    
    let start_date = undefined;
    let end_date = undefined;
    if (dates && dates[0] && dates[1]) {
      start_date = dates[0].format("YYYY-MM-DD");
      end_date = dates[1].format("YYYY-MM-DD");
    }

    // Join course list if multiple selected
    const ma_khoa_str = Array.isArray(ma_khoa) && ma_khoa.length > 0 
      ? ma_khoa.join(",") 
      : undefined;

    setPage(1);
    setSearchFilters({
      start_date,
      end_date,
      type: type || undefined,
      ma_khoa: ma_khoa_str,
    });
  };

  // Reset form and filters
  const handleReset = () => {
    form.resetFields();
    setPage(1);
    setSearchFilters({
      start_date: undefined,
      end_date: undefined,
      type: undefined,
      ma_khoa: undefined,
    });
  };

  // Render detail session card
  const renderSessionColumn = (phien) => {
    if (!phien) return "-";
    return (
      <div className="!p-3 !border !rounded-xl !bg-white !shadow-sm !border-slate-100 !text-xs !space-y-1.5 !w-full">
        <div className="!flex !justify-between !items-start !gap-1.5">
          <div className="!font-bold !text-slate-800 !uppercase !text-[13px]">{phien.hoTen || phien.ho_ten || "Không rõ tên"}</div>
          <Tag color="blue" className="!m-0 !rounded-full !px-2 !scale-90">{phien.maKhoaHoc || phien.ma_khoa || "-"}</Tag>
        </div>
        <div className="!text-slate-500 !flex !flex-col !gap-0.5">
          <div><span className="!font-medium">Mã đăng ký:</span> {phien.maDk || phien.ma_dk || "-"}</div>
          <div><span className="!font-medium">Biển số xe:</span> <span className="!font-semibold !text-slate-700">{phien.bienSo || phien.bien_so || "-"}</span></div>
          <div><span className="!font-medium">Giáo viên:</span> <span className="!text-slate-700">{phien.hoTenGv || phien.ho_ten_gv || "-"} <span className="!text-slate-400">({phien.idGv || phien.id_gv || "-"})</span></span></div>
        </div>
        <div className="!pt-1 !border-t !border-dashed !border-slate-100 !text-slate-500">
          <span className="!font-medium">Thời gian:</span>{" "}
          <span className="!font-semibold !text-slate-700">
            {dayjs(phien.thoiDiemDangNhap).format("DD/MM/YYYY HH:mm")} - {dayjs(phien.thoiDiemDangXuat).format("HH:mm")}
          </span>
        </div>
      </div>
    );
  };

  // Calculate and render overlap time
  const renderOverlap = (phien1, phien2) => {
    const t1Start = dayjs(phien1?.thoiDiemDangNhap);
    const t1End = dayjs(phien1?.thoiDiemDangXuat);
    const t2Start = dayjs(phien2?.thoiDiemDangNhap);
    const t2End = dayjs(phien2?.thoiDiemDangXuat);

    if (!t1Start.isValid() || !t1End.isValid() || !t2Start.isValid() || !t2End.isValid()) {
      return "-";
    }

    const overlapStart = t1Start.isAfter(t2Start) ? t1Start : t2Start;
    const overlapEnd = t1End.isBefore(t2End) ? t1End : t2End;

    if (overlapStart.isAfter(overlapEnd)) {
      return <Tag color="default">Không giao nhau</Tag>;
    }

    const durationMs = overlapEnd.diff(overlapStart);
    const durationMin = Math.round(durationMs / 60000);

    return (
      <div className="!flex !flex-col !items-center !justify-center !text-center !h-full">
        <div className="!font-bold !text-[#e12d2d] !text-sm">
          {overlapStart.format("HH:mm")} - {overlapEnd.format("HH:mm")}
        </div>
        <div className="!text-[11px] !text-slate-400 !font-semibold !mt-0.5">
          ({durationMin} phút)
        </div>
        <div className="!text-[10px] !text-slate-400 !mt-1">
          {overlapStart.format("DD/MM/YYYY")}
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: "#",
      dataIndex: "stt",
      key: "stt",
      width: 50,
      align: "center",
      render: (_value, _record, index) => (page - 1) * limit + index + 1,
    },
    {
      title: "Loại trùng",
      dataIndex: "loaiTrung",
      key: "loaiTrung",
      width: 140,
      align: "center",
      render: (value) => {
        const isGv = value === "trung_gv" || value === "gv";
        return (
          <Tag color={isGv ? "error" : "warning"} className="!rounded-full !px-3 !py-0.5 !font-bold">
            {isGv ? "Trùng giáo viên" : "Trùng xe"}
          </Tag>
        );
      },
    },
    {
      title: "Đối tượng trùng",
      key: "doiTuongTrung",
      width: 220,
      render: (_, record) => {
        const isGv = record?.loaiTrung === "trung_gv" || record?.loaiTrung === "gv";
        const name = isGv 
          ? record?.phien1?.hoTenGv || record?.phien1?.ho_ten_gv || "-"
          : record?.phien1?.bienSo || record?.phien1?.bien_so || "-";
        const code = isGv ? record?.phien1?.idGv || record?.phien1?.id_gv : null;

        return (
          <div className="!flex !flex-col !justify-center">
            <span className="!font-extrabold !text-slate-800 !text-[13px]">{name}</span>
            {code && <span className="!text-[11px] !text-slate-400">Mã GV: {code}</span>}
          </div>
        );
      },
    },
    {
      title: "Phiên 1",
      dataIndex: "phien1",
      key: "phien1",
      render: renderSessionColumn,
    },
    {
      title: "Phiên 2",
      dataIndex: "phien2",
      key: "phien2",
      render: renderSessionColumn,
    },
    {
      title: "Thời gian giao nhau",
      key: "overlap",
      width: 180,
      align: "center",
      render: (_, record) => renderOverlap(record?.phien1, record?.phien2),
    },
  ];

  return (
    <div className="!space-y-4">
      <div className="mx-auto mb-4">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Kiểm tra trùng xe và giáo viên
        </h1>
        <Text type="secondary">
          Kiểm tra, phát hiện các phiên học DAT bị trùng xe hoặc trùng giáo viên trong cùng khoảng thời gian học.
        </Text>
      </div>

      {/* Form Filters */}
      <Card bodyStyle={{ padding: 16 }} className="!rounded-xl !shadow-sm !border-slate-200">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearchSubmit}
          initialValues={{ type: "" }}
        >
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="dates" label={<span className="!text-xs !font-bold !text-slate-500 !uppercase">Khoảng thời gian</span>} className="!mb-0">
                <RangePicker 
                  className="!w-full" 
                  format="DD/MM/YYYY" 
                  placeholder={["Từ ngày", "Đến ngày"]}
                  allowClear
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="type" label={<span className="!text-xs !font-bold !text-slate-500 !uppercase">Loại trùng lặp</span>} className="!mb-0">
                <Select className="!w-full">
                  <Select.Option value="">Tất cả loại trùng</Select.Option>
                  <Select.Option value="xe">Trùng xe</Select.Option>
                  <Select.Option value="gv">Trùng giáo viên</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="ma_khoa" label={<span className="!text-xs !font-bold !text-slate-500 !uppercase">Khóa học</span>} className="!mb-0">
                <Select
                  mode="multiple"
                  className="!w-full"
                  placeholder="Chọn khóa học"
                  maxTagCount="responsive"
                  options={courseOptions}
                  loading={isLoadingCourses}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    String(option?.searchText || option?.label || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Space className="!w-full !justify-end">
                <Button onClick={handleReset} className="!rounded-lg">
                  Làm mới
                </Button>
                <Button type="primary" htmlType="submit" className="!rounded-lg !bg-[#2f6ce0]">
                  Tìm kiếm
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Results Table */}
      <Card bodyStyle={{ padding: 20 }} className="!rounded-xl !shadow-sm !border-slate-200">
        <div className="!mb-4 !flex !items-center !justify-between">
          <div>
            <Title level={5} className="!mb-0.5">
              Danh sách trùng lặp
            </Title>
            <Text type="secondary">
              Tìm thấy <span className="!font-bold !text-slate-800">{totalConflicts}</span> cặp phiên trùng khớp điều kiện lọc.
            </Text>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={conflictList}
          loading={isLoadingConflicts || isFetching}
          rowKey={(record, index) => `${record?.phien1?.id || "p1"}-${record?.phien2?.id || "p2"}-${index}`}
          pagination={{
            current: page,
            pageSize: limit,
            total: totalConflicts,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Tổng số ${total} cặp phiên trùng`,
          }}
          locale={{
            emptyText: (
              <Empty description="Không tìm thấy phiên vi phạm nào" />
            ),
          }}
          size="middle"
          bordered
          scroll={{ x: 1200 }}
          className="table-blue-header"
        />
      </Card>
    </div>
  );
};

export default KiemTraTrungXeGiaoVien;
