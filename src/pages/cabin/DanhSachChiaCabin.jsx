import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Table,
  Typography,
} from "antd";
import React, { useMemo, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { courseOptions } from "../../apis/khoaHoc";

const { Title } = Typography;

const trangThaiCabinOptions = [
  { value: "CHUA_HOC_CABIN", label: "Chưa học Cabin" },
  { value: "CHUA_DAT_CABIN", label: "Chưa đạt Cabin" },
];

const DanhSachChiaCabin = () => {
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");
  const [selectedTrangThaiCabin, setSelectedTrangThaiCabin] = useState("");
  const [searchText, setSearchText] = useState("");

  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["khoahocOptions"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const khoaHocOptions = useMemo(() => {
    const options = dataKhoaHoc?.data?.Data || [];
    return [
      ...options.map((kh) => ({
        label: kh.Ten || kh.MaKhoaHoc || "Không có tên",
        value: kh.ID || "",
      })),
    ];
  }, [dataKhoaHoc]);

  const handleSearch = () => {
    const params = {};

    if (searchText.trim().length >= 2) {
      params.soCmt = searchText.trim();
    }

    if (selectedKhoaHoc) {
      params.idkhoahoc = selectedKhoaHoc;
    }

    if (selectedTrangThaiCabin) {
      params.trangThaiCabin = selectedTrangThaiCabin;
    }

    if (Object.keys(params).length === 0) {
      message.warning(
        "Vui lòng nhập từ khóa hoặc chọn khóa học/trạng thái cabin để tìm kiếm",
      );
      return;
    }

    // setSearchParams({ ...params, page: 1, limit: 20 });
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 50,
      align: "center",
      fixed: "left",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "Mã học viên",
      dataIndex: "suffix_name",
      key: "suffix_name",
      width: 100,
      align: "center",
    },
    {
      title: "Tên học viên",
      dataIndex: "__expand",
      key: "__expand",
      ellipsis: true,
      width: 100,
    },
    {
      title: "CCCD",
      dataIndex: "start_date",
      key: "start_date",
      width: 100,
      align: "center",
    },
    {
      title: "Giáo viên DAT",
      dataIndex: "end_date",
      key: "end_date",
      width: 100,
      align: "center",
    },
    {
      title: "Khóa học",
      dataIndex: "number_of_courses",
      key: "number_of_courses",
      width: 70,
      align: "center",
    },

    {
      title: "Tên khóa học",
      dataIndex: "stats",
      key: "stats",
      width: 90,
      align: "center",
    },
    {
      title: "Tiến độ lý thuyết",
      dataIndex: "stats",
      key: "stats",
      width: 140,
      align: "center",
    },
    {
      title: "Trạng thái CABIN",
      dataIndex: "stats",
      key: "stats",
      width: 120,
    },
    {
      title: "Phút CABIN",
      dataIndex: "status",
      key: "status",
      width: 80,
      align: "center",
    },
    {
      title: "Bài CABIN",
      dataIndex: "stats",
      key: "stats",
      width: 120,
    },
  ];

  return (
    <div>
      <Title level={3} className="!mb-1">
        Danh sách học viên học Cabin
      </Title>
      <Card className="!mt-5 !mb-5">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={7}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Từ khóa
            </label>
            <Input
              placeholder="Tên/Mã học viên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              className="!text-sm"
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Khóa học
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn khóa học --"
              loading={loadingKhoaHoc}
              value={selectedKhoaHoc}
              onChange={(value) => setSelectedKhoaHoc(value)}
              options={khoaHocOptions}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Trạng thái Cabin
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn trạng thái Cabin --"
              value={selectedTrangThaiCabin}
              onChange={(value) => setSelectedTrangThaiCabin(value)}
              options={trangThaiCabinOptions}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={3} className="pl-4 flex items-center">
            <Button
              type="primary"
              className="w-full !font-medium !py-4.5 !rounded-md !bg-[#3366CC] "
              onClick={handleSearch}
              icon={<SearchOutlined />}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </Card>
      <Table
        columns={columns}
        dataSource={[]}
        // loading={isLoadingKhoaHoc}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 1200 }}
        bordered
        className="overflow-hidden table-blue-header"
      />
    </div>
  );
};

export default DanhSachChiaCabin;
