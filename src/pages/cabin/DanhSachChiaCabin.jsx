import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { lopHocLyThuyet } from "../../apis/khoaHoc";
import {
  getDanhSachHocVienCabin,
  getDanhSachKetQuaHocCabin,
} from "../../apis/cabinApi";
import { toTitleCase } from "../../util/helper";
import { DangNhapLopLyThuyet } from "../../apis/auth";

const { Title } = Typography;

const DanhSachChiaCabin = () => {
  const [selectedTenKhoa, setSelectedTenKhoa] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
  });

  const { data: loginData, isLoading: loadingLogin } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity,
    select: (data) => data?.result,
  });

  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["lopHocLyThuyetPublic"],
    queryFn: () => lopHocLyThuyet(loginData),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const { data: danhSachHocVien = [], isLoading: isLoadingHocVien } = useQuery({
    queryKey: ["danhSachHocVienCabin", searchParams],
    queryFn: () => getDanhSachHocVienCabin(searchParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: ketQuaHocCabin = [] } = useQuery({
    queryKey: ["ketQuaHocCabin", searchParams],
    queryFn: () =>
      getDanhSachKetQuaHocCabin({
        khoa: "30004K26B003",
        hoTen: "",
      }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  console.log(ketQuaHocCabin);

  const sortedCourses = useMemo(() => {
    const options = dataKhoaHoc?.result || [];

    return [...options].sort((a, b) => {
      const tsA = a?.ts || 0;
      const tsB = b?.ts || 0;
      return tsB - tsA;
    });
  }, [dataKhoaHoc]);

  const selectedCourse = useMemo(() => {
    return sortedCourses.find(
      (item) => String(item?.iid) === String(selectedTenKhoa),
    );
  }, [sortedCourses, selectedTenKhoa]);

  const dataSource = useMemo(() => {
    return danhSachHocVien?.data || [];
  }, [danhSachHocVien]);

  const totalItems = useMemo(() => {
    return danhSachHocVien?.pagination?.total || 0;
  }, [danhSachHocVien]);

  const handleSearch = useCallback(() => {
    const nextParams = {
      page: 1,
      limit: searchParams.limit || 20,
    };

    if (searchText.trim()) {
      nextParams.hoTen = searchText.trim();
    }

    if (selectedTenKhoa) {
      nextParams.maKhoa = selectedTenKhoa;
    }

    setSearchParams(nextParams);
  }, [searchText, selectedTenKhoa, searchParams.limit]);

  const handleTableChange = useCallback((pagination) => {
    setSearchParams((prev) => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 20,
    }));
  }, []);

  const renderBooleanTag = useCallback((value, trueText, falseText) => {
    return value ? (
      <Tag color="error" variant="solid">
        {trueText}
      </Tag>
    ) : (
      <Tag color="green" variant="solid">
        {falseText}
      </Tag>
    );
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "#",
        key: "stt",
        width: 40,
        align: "center",
        fixed: "left",
        render: (_text, _record, index) => index + 1,
      },
      {
        title: "Mã đăng ký",
        dataIndex: "ma_dk",
        key: "ma_dk",
        width: 180,
        fixed: "left",
      },
      {
        title: "Tên  khóa",
        dataIndex: "ma_khoa",
        key: "ma_khoa",
        width: 80,
      },
      {
        title: "Họ tên",
        dataIndex: "ho_ten",
        key: "ho_ten",
        width: 180,
        render: (text) => toTitleCase(text),
      },
      {
        title: "CCCD",
        dataIndex: "cccd",
        key: "cccd",
        width: 110,
      },
      {
        title: "Năm sinh",
        dataIndex: "nam_sinh",
        key: "nam_sinh",
        width: 80,
        align: "center",
      },
      {
        title: "Lý thuyết",
        dataIndex: "loai_ly_thuyet",
        key: "loai_ly_thuyet",
        width: 90,
        align: "center",
        render: (value) => renderBooleanTag(value, "Trượt", "Đạt"),
      },
      {
        title: "Làm bài hết môn",
        dataIndex: "loai_het_mon",
        key: "loai_het_mon",
        width: 110,
        align: "center",
        render: (value) =>
          renderBooleanTag(value, "Chưa làm bài", "Đã làm bài"),
      },
      {
        title: "Trạng thái cabin",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 120,
        render: (value) => value || "-",
      },
      {
        title: "Phút cabin",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 100,
        render: (value) => value || "-",
      },
      {
        title: "Bài cabin",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 80,
        render: (value) => value || "-",
      },
      {
        title: "Ghi chú",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 180,
        render: (value) => value || "-",
      },
    ],
    [renderBooleanTag],
  );

  return (
    <div>
      <Title level={3} className="!mb-1">
        Danh sách học viên học Cabin
      </Title>

      <Card className="!mt-5 !mb-5">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={9}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Họ tên
            </label>
            <Input
              placeholder="Nhập họ tên học viên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              className="!text-sm"
              onPressEnter={handleSearch}
            />
          </Col>

          <Col xs={24} sm={12} md={9}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Tên khóa
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn khóa học --"
              loading={loadingKhoaHoc || loadingLogin}
              value={selectedTenKhoa}
              onChange={(value) => setSelectedTenKhoa(value)}
              options={selectedCourse}
              allowClear
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>

          <Col xs={24} sm={12} md={2} className="pl-4 flex items-center">
            <Button
              type="primary"
              className="w-full !font-medium !py-4.5 !rounded-md !bg-[#3366CC]"
              onClick={handleSearch}
              icon={<SearchOutlined />}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={isLoadingHocVien}
        rowKey="ma_dk"
        pagination={{
          current: searchParams.page,
          pageSize: searchParams.limit,
          total: totalItems,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} học viên`,
        }}
        onChange={handleTableChange}
        size="small"
        scroll={{ x: 1200 }}
        bordered
        className="overflow-hidden table-blue-header"
      />
    </div>
  );
};

export default DanhSachChiaCabin;
