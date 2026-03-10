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

const formatDuration = (totalSeconds) => {
  const total = Number(totalSeconds || 0);
  if (total <= 0) return "-";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")} giờ ${String(minutes).padStart(2, "0")} phút`;
  }

  return `${String(minutes).padStart(2, "0")} phút`;
};

const DanhSachChiaCabin = () => {
  const [selectedTenKhoa, setSelectedTenKhoa] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
  });

  const {
    data: loginData,
    isLoading: loadingLogin,
    isFetched: isLoginFetched,
  } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity,
    select: (data) => data?.result,
  });

  const {
    data: dataKhoaHoc,
    isLoading: loadingKhoaHoc,
    isFetched: isKhoaHocFetched,
  } = useQuery({
    queryKey: ["lopHocLyThuyetPublic"],
    queryFn: () => lopHocLyThuyet(loginData),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const sortedCourses = useMemo(() => {
    const options = Array.isArray(dataKhoaHoc?.result)
      ? dataKhoaHoc.result
      : [];

    return [...options].sort((a, b) => {
      const tsA = Number(a?.ts || 0);
      const tsB = Number(b?.ts || 0);
      return tsB - tsA;
    });
  }, [dataKhoaHoc]);

  const courseOptions = useMemo(() => {
    return sortedCourses.map((item) => ({
      label: item?.suffix_name || item?.name || `#${item?.iid}`,
      value: String(item?.iid || ""),
    }));
  }, [sortedCourses]);

  const activeCourseIid =
    selectedTenKhoa || courseOptions?.[0]?.value || undefined;

  const selectedCourse = useMemo(() => {
    return sortedCourses.find(
      (item) => String(item?.iid) === String(activeCourseIid),
    );
  }, [activeCourseIid, sortedCourses]);

  const selectedCourseLabel = useMemo(() => {
    return selectedCourse?.name || "";
  }, [selectedCourse]);

  const selectedCourseCode = useMemo(() => {
    return selectedCourse?.code || "";
  }, [selectedCourse]);

  const hocVienParams = useMemo(
    () => ({
      page: searchParams.page,
      limit: searchParams.limit,
      hoTen: searchParams.hoTen || undefined,
      maKhoa: selectedCourseLabel || undefined,
    }),
    [searchParams, selectedCourseLabel],
  );

  const { data: danhSachHocVien = {}, isFetched: isHocVienFetched } = useQuery({
    queryKey: ["danhSachHocVienCabin", hocVienParams],
    queryFn: () => getDanhSachHocVienCabin(hocVienParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!activeCourseIid,
  });

  const { data: ketQuaHocCabin = {}, isFetched: isKetQuaHocCabinFetched } =
    useQuery({
      queryKey: ["ketQuaHocCabin", selectedCourseCode],
      queryFn: () =>
        getDanhSachKetQuaHocCabin({
          khoa: selectedCourseCode,
          hoTen: "",
        }),
      staleTime: 1000 * 60 * 5,
      retry: false,
      enabled: !!selectedCourseCode,
    });

  const ketQuaMap = useMemo(() => {
    const raw = Array.isArray(ketQuaHocCabin?.data) ? ketQuaHocCabin.data : [];
    const map = {};

    for (const item of raw) {
      const maDK = item?.MaDK;
      if (!maDK) continue;

      if (!map[maDK]) {
        map[maDK] = {
          tongThoiGian: 0,
          baiHoc: new Set(),
        };
      }

      map[maDK].tongThoiGian += Number(item?.TongThoiGian || 0);
      map[maDK].baiHoc.add(item?.ID_BaiTap);
    }

    const result = {};
    for (const [maDK, val] of Object.entries(map)) {
      result[maDK] = {
        tongThoiGian: val.tongThoiGian,
        tongThoiGianText: formatDuration(val.tongThoiGian),
        soBaiHoc: val.baiHoc.size,
      };
    }

    return result;
  }, [ketQuaHocCabin]);

  const dataSource = useMemo(() => {
    const raw = Array.isArray(danhSachHocVien?.data)
      ? danhSachHocVien.data
      : [];

    return raw.map((item) => {
      const cabinInfo = ketQuaMap[item?.ma_dk] || {};

      return {
        ...item,
        thoi_gian_cabin_text: cabinInfo.tongThoiGianText || "-",
        so_bai_cabin: cabinInfo.soBaiHoc || 0,
      };
    });
  }, [danhSachHocVien, ketQuaMap]);

  const totalItems = useMemo(() => {
    return danhSachHocVien?.pagination?.total || dataSource.length || 0;
  }, [danhSachHocVien, dataSource.length]);

  const isLoadingHocVien = [
    !isLoginFetched,
    !isKhoaHocFetched,
    activeCourseIid && !isHocVienFetched,
    selectedCourseCode && !isKetQuaHocCabinFetched,
  ].some(Boolean);

  const handleSearch = useCallback(() => {
    setSearchParams((prev) => ({
      ...prev,
      page: 1,
      hoTen: searchText.trim() || undefined,
    }));
  }, [searchText]);

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
        width: 50,
        align: "center",
        render: (_text, _record, index) =>
          (searchParams.page - 1) * searchParams.limit + index + 1,
      },
      {
        title: "Mã đăng ký",
        dataIndex: "ma_dk",
        key: "ma_dk",
        width: 180,
      },
      {
        title: "Mã khóa",
        dataIndex: "ma_khoa",
        key: "ma_khoa",
        width: 80,
      },
      {
        title: "Họ tên",
        dataIndex: "ho_ten",
        key: "ho_ten",
        width: 180,
        render: (text) => toTitleCase(text || ""),
      },
      {
        title: "CCCD",
        dataIndex: "cccd",
        key: "cccd",
        width: 90,
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
        width: 100,
        align: "center",
        render: (value) => renderBooleanTag(value, "Trượt", "Đạt"),
      },
      {
        title: "Làm bài hết môn",
        dataIndex: "loai_het_mon",
        key: "loai_het_mon",
        width: 120,
        align: "center",
        render: (value) =>
          !value ? (
            <Tag color="blue" variant="solid">
              Đã làm bài
            </Tag>
          ) : (
            <Tag color="volcano" variant="solid">
              Chưa làm bài
            </Tag>
          ),
      },
      {
        title: "Trạng thái cabin",
        key: "trang_thai_cabin",
        width: 120,
        align: "center",
        render: (_text, record) => {
          const cabinInfo = ketQuaMap[record.ma_dk];
          if (!cabinInfo) return <Tag color="default">Chưa học</Tag>;

          const datBai = cabinInfo.soBaiHoc >= 8;
          const datThoiGian = cabinInfo.tongThoiGian >= 8400;

          return datBai && datThoiGian ? (
            <Tag color="cyan" variant="solid">
              Đạt
            </Tag>
          ) : (
            <Tag color="orange" variant="solid">
              Chưa đạt
            </Tag>
          );
        },
      },
      {
        title: "Phút cabin",
        dataIndex: "thoi_gian_cabin_text",
        key: "thoi_gian_cabin_text",
        width: 110,
        align: "center",
      },
      {
        title: "Bài cabin",
        dataIndex: "so_bai_cabin",
        key: "so_bai_cabin",
        width: 80,
        align: "center",
        render: (value) => `${value || 0} bài`,
      },
      {
        title: "Ghi chú",
        dataIndex: "ghi_chu",
        key: "ghi_chu_text",
        width: 160,
        render: (value) => value || "-",
      },
    ],
    [renderBooleanTag, searchParams.limit, searchParams.page, ketQuaMap],
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
              Tên khóa
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn khóa học --"
              loading={loadingKhoaHoc || loadingLogin}
              value={activeCourseIid}
              onChange={(value) => setSelectedTenKhoa(value)}
              options={courseOptions}
              allowClear={false}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>

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

          <Col xs={24} sm={12} md={2} className="pl-4 flex items-center">
            <Button
              type="primary"
              size="middle"
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
