import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Image,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { danhSachHocVienCaBin } from "../../apis/apiCabinLocal";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";

const { Title } = Typography;

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const getCabinStatus = (value) => {
  if (value === "chua hoc") {
    return { text: "Chưa học", color: "default" };
  }

  if (value === "dat") {
    return { text: "Đạt", color: "green" };
  }

  return { text: "Chưa đạt", color: "orange" };
};

const secondsToHourMinute = (seconds) => {
  const total = Number(seconds || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  return `${hours}h${minutes}p`;
};

const DanhSachChiaCabin = () => {
  const [selectedCourseIid, setSelectedCourseIid] = useState();
  const [selectedCabinStatus, setSelectedCabinStatus] = useState();
  const searchInputRef = useRef(null);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    hoTen: "",
    trang_thai_cabin: undefined,
  });

  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["optionLopLyThuyet"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const courseList = useMemo(
    () => normalizeApiList(dataKhoaHoc),
    [dataKhoaHoc],
  );

  const courseOptions = useMemo(() => {
    return courseList.map((item) => ({
      label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
      value: String(item?.iid || ""),
    }));
  }, [courseList]);

  const activeCourseIid =
    selectedCourseIid || courseOptions?.[0]?.value || undefined;

  const selectedCourse = useMemo(() => {
    return courseList.find(
      (item) => String(item?.iid) === String(activeCourseIid),
    );
  }, [activeCourseIid, courseList]);

  const selectedCourseCode = selectedCourse?.code || "";
  const selectedCourseName = selectedCourse?.name || "";

  const localParams = useMemo(() => {
    return {
      page: searchParams.page,
      limit: searchParams.limit,
      text: searchParams.hoTen || undefined,
      khoa: selectedCourseCode,
      trang_thai_cabin: searchParams.trang_thai_cabin || undefined,
    };
  }, [searchParams, selectedCourseCode]);

  const { data: danhSachHocVien = {}, isLoading: isLoadingHocVien } = useQuery({
    queryKey: ["danhSachHocVienCaBin", activeCourseIid, localParams],
    queryFn: () => danhSachHocVienCaBin(activeCourseIid, localParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!activeCourseIid,
  });

  const dataSource = useMemo(() => {
    return Array.isArray(danhSachHocVien?.data) ? danhSachHocVien.data : [];
  }, [danhSachHocVien]);

  const totalItems = useMemo(() => {
    return (
      danhSachHocVien?.total ||
      danhSachHocVien?.pagination?.total ||
      danhSachHocVien?.meta?.total ||
      dataSource.length ||
      0
    );
  }, [danhSachHocVien, dataSource.length]);

  const handleSearch = useCallback(() => {
    const nextSearchText = searchInputRef.current?.input?.value?.trim() || "";
    setSearchParams((prev) => ({
      ...prev,
      page: 1,
      hoTen: nextSearchText,
      trang_thai_cabin: selectedCabinStatus || undefined,
    }));
  }, [selectedCabinStatus]);

  const handleTableChange = useCallback((pagination) => {
    setSearchParams((prev) => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 20,
    }));
  }, []);

  const renderBooleanTag = useCallback((value, trueText, falseText) => {
    return value ? (
      <Tag color="green" variant="solid">
        {trueText}
      </Tag>
    ) : (
      <Tag color="error" variant="solid">
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
        title: "Học viên",
        dataIndex: "user",
        key: "user",
        width: 260,
        render: (user) => (
          <div className="flex items-center gap-2">
            <Image
              src={user?.avatar || user?.default_avatar}
              className="!h-10 !w-10 rounded-lg"
              alt="av"
            />
            <div className="flex flex-col">
              <span className="font-bold text-gray-600 text-sm">
                {user?.name || "-"}
              </span>
              <span className="text-xs text-gray-500">{user?.code || "-"}</span>
            </div>
          </div>
        ),
      },
      {
        title: "Mã khóa",
        dataIndex: "user",
        key: "ma_khoa",
        width: 120,
        render: () => selectedCourseName || "-",
      },
      {
        title: "CCCD",
        dataIndex: "user",
        key: "cccd",
        width: 110,
        render: (user) => user?.identification_card,
      },
      {
        title: "Năm sinh",
        dataIndex: "user",
        key: "nam_sinh",
        width: 90,
        align: "center",
        render: (user) => user?.birth_year,
      },
      {
        title: "Lý thuyết online",
        dataIndex: "trang_thai",
        key: "loai_ly_thuyet",
        width: 130,
        align: "center",
        render: (value) =>
          renderBooleanTag(value?.loai_ly_thuyet, "Đạt", "Chưa đạt"),
      },
      {
        title: "Làm bài hết môn",
        dataIndex: "trang_thai",
        key: "loai_het_mon",
        width: 140,
        align: "center",
        render: (value) =>
          value?.loai_het_mon ? (
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
        key: "cabin",
        width: 130,
        align: "center",
        render: (_, record) => {
          const status = getCabinStatus(record?.cabin?.trang_thai);
          return <Tag color={status.color}>{status.text}</Tag>;
        },
      },
      {
        title: "Phút cabin",
        dataIndex: "cabin",
        key: "thoi_gian_cabin_text",
        width: 120,
        align: "center",
        render: (value) => secondsToHourMinute(value?.tong_thoi_gian || 0),
      },
      {
        title: "Bài cabin",
        dataIndex: "cabin",
        key: "so_bai_cabin",
        width: 100,
        align: "center",
        render: (value) => `${value?.so_bai_hoc || 0} bài`,
      },
      {
        title: "Ghi chú",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 130,
        align: "center",
        render: (value) => value || "-",
      },
    ],
    [
      renderBooleanTag,
      searchParams.limit,
      searchParams.page,
      selectedCourseName,
    ],
  );

  return (
    <div>
      <Title level={3} className="!mb-1">
        Danh sách học viên học Cabin
      </Title>

      <Card className="!mt-5 !mb-5">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={7}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Tên khóa
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn khóa học --"
              loading={loadingKhoaHoc}
              value={activeCourseIid}
              onChange={(value) => {
                setSelectedCourseIid(value);
                setSearchParams((prev) => ({ ...prev, page: 1 }));
              }}
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

          <Col xs={24} sm={12} md={7}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Họ tên
            </label>
            <Input
              placeholder="Nhập họ tên học viên"
              ref={searchInputRef}
              defaultValue={searchParams.hoTen}
              size="large"
              className="!text-sm"
              onPressEnter={handleSearch}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Trạng thái cabin
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn trạng thái --"
              value={selectedCabinStatus}
              onChange={(value) => {
                setSelectedCabinStatus(value);
                setSearchParams((prev) => ({ ...prev, page: 1 }));
              }}
              allowClear
              options={[
                { label: "Đạt", value: "dat" },
                { label: "Chưa đạt", value: "chua dat" },
                { label: "Chưa học", value: "chua hoc" },
              ]}
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
        loading={loadingKhoaHoc || isLoadingHocVien}
        rowKey={(record) =>
          record?.ma_dk || record?.user?.code || record?.user?.iid
        }
        pagination={{
          current: searchParams.page,
          pageSize: searchParams.limit,
          total: totalItems,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} học viên`,
        }}
        onChange={handleTableChange}
        size="small"
        scroll={{ x: 1400 }}
        bordered
        className="overflow-hidden table-blue-header"
      />
    </div>
  );
};

export default DanhSachChiaCabin;
