import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Row,
  Col,
  Card,
  Select,
  message,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import { courseOptions } from "../../apis/khoaHoc";
import {
  danhSachHocVienKyDAT,
  exportDanhSachHocVienKyDAT,
} from "../../apis/hocVien";
import { formatLocalTime } from "../../util/helper";
import dayjs from "dayjs";

const renderEmpty = (value) => {
  if (value === null || value === undefined || value === "") {
    return <div className="flex justify-center text-slate-500">-</div>;
  }

  return value;
};

const HocVienKyDAT = () => {
  const [searchName, setSearchName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    maKhoa: undefined,
    page: 1,
    limit: 10,
  });

  const { data: khoaHocData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courseOptionsHocVienKyDAT"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const { data: hocVienKyDatData, isLoading: isLoadingTable } = useQuery({
    queryKey: ["danhSachHocVienKyDAT", filters],
    queryFn: () => danhSachHocVienKyDAT(filters),
    staleTime: 1000 * 60,
    keepPreviousData: true,
  });

  const khoaHocOptions = useMemo(() => {
    const list = khoaHocData?.data?.Data || [];

    return list.map((item) => ({
      label: item?.Ten || item?.MaKhoaHoc || "",
      value: item?.MaKhoaHoc || item?.Ten || "",
    }));
  }, [khoaHocData]);

  const dataSource = useMemo(() => {
    const list =
      hocVienKyDatData?.data ||
      hocVienKyDatData?.Data ||
      hocVienKyDatData?.result ||
      [];

    return Array.isArray(list) ? list : [];
  }, [hocVienKyDatData]);

  const totalItems = useMemo(() => {
    return (
      hocVienKyDatData?.total ||
      hocVienKyDatData?.pagination?.total ||
      hocVienKyDatData?.meta?.total ||
      dataSource.length ||
      0
    );
  }, [hocVienKyDatData, dataSource.length]);

  const handleFilter = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: searchName.trim(),
      maKhoa: selectedCourse || undefined,
    }));
  };

  const handleClearFilter = () => {
    setSearchName("");
    setSelectedCourse(undefined);
    setFilters({
      keyword: "",
      maKhoa: undefined,
      page: 1,
      limit: 10,
    });
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const exportCourse = selectedCourse || filters.maKhoa || "";
      const exportStudentName = searchName.trim() || filters.keyword || "";

      const blob = await exportDanhSachHocVienKyDAT({
        ma_khoa: exportCourse,
        ten_hoc_vien: exportStudentName,
      });

      const fileName = `hoc-vien-ky-dat-${exportCourse || "tat-ca"}.xlsx`;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Xuất Excel thất bại",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 30,
      align: "center",
      render: (_text, _record, index) =>
        (filters.page - 1) * filters.limit + index + 1,
    },
    {
      title: "Mã học viên",
      dataIndex: "ma_dk",
      key: "ma_dk",
      width: 210,
    },
    {
      title: "Họ tên",
      dataIndex: "ten_hoc_vien",
      key: "ten_hoc_vien",
      width: 200,
      render: (value) => <span className="font-medium">{value || ""}</span>,
    },
    {
      title: "Căn cước công dân",
      dataIndex: "can_cuoc",
      key: "can_cuoc",
      width: 150,
      render: renderEmpty,
    },
    {
      title: "Ngày sinh",
      dataIndex: "ngay_sinh",
      key: "ngay_sinh",
      width: 120,
      align: "center",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Khóa học",
      dataIndex: "khoa_hoc",
      key: "khoa_hoc",
      width: 140,
      align: "center",
      render: (_text, record) => record?.khoa_hoc || record?.ma_khoa || "",
    },
    {
      title: "Hạng đào tạo",
      dataIndex: "hang_dao_tao",
      key: "hang_dao_tao",
      width: 120,
      align: "center",
      render: renderEmpty,
    },
    {
      title: "GV DAT",
      dataIndex: "gv_dat",
      key: "gv_dat",
      width: 180,
      align: "center",
      render: renderEmpty,
    },
    {
      title: "Ký DAT",
      dataIndex: "trang_thai",
      key: "trang_thai",
      width: 100,
      align: "center",
      render: (value) => {
        const isSigned =
          String(value || "")
            .trim()
            .toLowerCase() === "da_ky";

        return (
          <Tag
            className="!rounded-md !px-2 !py-0 !text-[12px] !font-semibold"
            color={isSigned ? "success" : "default"}
          >
            {isSigned ? "Đã ký" : String(value || "Chưa ký").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Thời gian kí DAT",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 170,
      render: (value) => formatLocalTime(value, "YYYY-MM-DD HH:mm:ss"),
    },
  ];

  return (
    <div className="mx-auto min-h-screen">
      <h1 className="!mb-1 text-2xl !font-bold text-gray-900">
        Danh sách học viên đã ký DAT
      </h1>

      <Card className="!mt-4">
        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} md={8}>
            <label className="block text-xs uppercase text-gray-500">
              Khóa học
            </label>
            <Select
              className="w-full"
              placeholder="Chọn khóa học"
              loading={isLoadingCourses}
              value={selectedCourse}
              onChange={(value) => setSelectedCourse(value)}
              options={khoaHocOptions}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>

          <Col xs={24} md={8}>
            <label className="block text-xs uppercase text-gray-500">
              Tên học viên
            </label>
            <Input
              placeholder="Nhập tên học viên"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleFilter}
            />
          </Col>

          <Col>
            <Space>
              <Button
                type="primary"
                className="!bg-[#3366CC]"
                onClick={handleFilter}
              >
                Lọc
              </Button>
              <Button loading={isExporting} onClick={handleExportExcel}>
                Xuất Excel
              </Button>
              <Button onClick={handleClearFilter}>Bỏ lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div className="!mt-2 py-5">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoadingTable}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: totalItems,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} học viên`,
            onChange: (page, pageSize) => {
              setFilters((prev) => ({
                ...prev,
                page,
                limit: pageSize,
              }));
            },
          }}
          rowKey={(record) => record?.id || record?.ma_dk}
          size="small"
          bordered
          scroll={{ x: 1200 }}
          className="overflow-hidden table-blue-header"
        />
      </div>
    </div>
  );
};

export default HocVienKyDAT;
