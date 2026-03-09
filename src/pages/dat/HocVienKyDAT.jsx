import React, { useMemo, useState } from "react";
import { Table, Button, Input, Space, Tag, Row, Col, Card, Select } from "antd";
import { useQuery } from "@tanstack/react-query";
import { courseOptions } from "../../apis/khoaHoc";
import { danhSachHocVienKyDAT } from "../../apis/hocVien";
import { formatLocalTime } from "../../util/helper";
import dayjs from "dayjs";
// import { getImageUrl } from "../../util/helperImage";

// const renderAvatar = (url, alt) => {
//   if (!url) {
//     return (
//       <div className="flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-[11px] text-gray-400">
//         N/A
//       </div>
//     );
//   }

//   return (
//     <img
//       src={getImageUrl(url)}
//       alt={alt}
//       className="h-[44px] w-[44px] rounded-lg border border-gray-200 object-cover"
//     />
//   );
// };

const renderEmpty = (value) => {
  if (value === null || value === undefined || value === "") {
    return <div className="flex justify-center text-slate-500">-</div>;
  }

  return value;
};

const HocVienKyDAT = () => {
  const [searchName, setSearchName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(undefined);
  const [filters, setFilters] = useState({
    keyword: "",
    maKhoa: undefined,
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

  const handleFilter = () => {
    setFilters({
      keyword: searchName.trim(),
      maKhoa: selectedCourse || undefined,
    });
  };

  const handleClearFilter = () => {
    setSearchName("");
    setSelectedCourse(undefined);
    setFilters({
      keyword: "",
      maKhoa: undefined,
    });
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 30,
      align: "center",
      render: (_text, _record, index) => index + 1,
    },
    // {
    //   title: "Anh",
    //   dataIndex: "anh",
    //   key: "anh",
    //   width: 80,
    //   align: "center",
    //   render: (_text, record) =>
    //     renderAvatar(record?.anh, record?.ten_hoc_vien),
    // },
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
      align: "center",
    },
    {
      title: "Căn cước công dân",
      dataIndex: "can_cuoc",
      key: "can_cuoc",
      width: 150,
      render: renderEmpty,
      align: "center",
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
    // {
    //   title: "Ghi chú nội bộ",
    //   dataIndex: "ghi_chu_1",
    //   key: "ghi_chu_1",
    //   width: 160,
    //   render: renderEmpty,
    // },
    // {
    //   title: "Ghi chú công khai",
    //   dataIndex: "ghi_chu_2",
    //   key: "ghi_chu_2",
    //   width: 160,
    //   render: renderEmpty,
    // },
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
              <Button onClick={handleClearFilter}>Bỏ lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div className="!mt-2 py-5">
        <Row className="mb-3">
          <span>
            Tổng: <span className="font-bold">{dataSource.length || 0}</span>{" "}
            học viên
          </span>
        </Row>

        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoadingTable}
          pagination={false}
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
