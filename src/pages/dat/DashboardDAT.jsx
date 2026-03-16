import { useMemo, useState } from "react";
import { Button, Card, Col, Row, Select, Space, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { courseOptions } from "../../apis/khoaHoc";
import { HanhTrinh } from "../../apis/hocVien";

const { Title, Text } = Typography;

const extractKhoaPrefix = (value) => {
  const text = String(value || "").toUpperCase();
  const match = text.match(/K(\d{2})(?!\d)/);

  if (!match) return "";
  return `K${match[1]}`;
};

const getYearFromKhoa = (khoa) => {
  const match = String(khoa || "").match(/^K(\d{2})$/i);
  if (!match) return undefined;
  return Number(`20${match[1]}`);
};

const DashboardDAT = () => {
  const currentDate = dayjs();
  const defaultKhoa = `K${String(currentDate.year()).slice(-2)}`;
  const defaultMonth = currentDate.month() + 1;
  const [selectedKhoa, setSelectedKhoa] = useState(defaultKhoa);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const { data: khoaHocData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courseOptionsDashboardDAT"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const rawCourses = useMemo(
    () => khoaHocData?.data?.Data || [],
    [khoaHocData],
  );

  const khoaOptions = useMemo(() => {
    const khoaMap = new Map();

    rawCourses.forEach((item) => {
      const maKhoaHoc = String(item?.MaKhoaHoc || item?.Ten || "").trim();
      const prefix = extractKhoaPrefix(maKhoaHoc);

      if (!prefix) return;

      if (!khoaMap.has(prefix)) {
        khoaMap.set(prefix, []);
      }

      khoaMap.get(prefix).push(maKhoaHoc);
    });

    return Array.from(khoaMap.entries())
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([prefix, courses]) => ({
        label: `Khóa ${prefix.slice(1)}`,
        value: prefix,
        courses,
      }));
  }, [rawCourses]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return { label: `Tháng ${month}`, value: month };
    });
  }, []);

  const filteredCourses = useMemo(() => {
    const selectedYear = getYearFromKhoa(selectedKhoa);

    return rawCourses.filter((item) => {
      const maKhoaHoc = String(item?.MaKhoaHoc || item?.Ten || "").trim();
      const khoaPrefix = extractKhoaPrefix(maKhoaHoc);
      const ngayTao = item?.NgayTao;

      if (selectedKhoa && khoaPrefix !== selectedKhoa) {
        return false;
      }

      if (selectedMonth) {
        if (!selectedYear || !ngayTao || !dayjs(ngayTao).isValid()) {
          return false;
        }

        const createdDate = dayjs(ngayTao);

        if (createdDate.year() !== selectedYear) {
          return false;
        }

        if (createdDate.month() + 1 !== selectedMonth) {
          return false;
        }
      }

      return true;
    });
  }, [rawCourses, selectedKhoa, selectedMonth]);

  const appliedFilters = useMemo(() => {
    const yearFromKhoa = getYearFromKhoa(selectedKhoa);
    const matchedCourses = filteredCourses.map(
      (item) => item?.MaKhoaHoc || item?.Ten || "",
    );

    return {
      khoa: selectedKhoa,
      month: selectedMonth,
      yearFromKhoa,
      matchedCourses,
    };
  }, [filteredCourses, selectedKhoa, selectedMonth]);

  const handleApplyFilter = () => {
    setSelectedKhoa((prev) => prev || defaultKhoa);
    setSelectedMonth((prev) => prev || defaultMonth);
  };

  const handleClearFilter = () => {
    setSelectedKhoa(defaultKhoa);
    setSelectedMonth(defaultMonth);
  };

  return (
    <div>
      <Title level={3} className="!mb-1">
        Dashboard DAT
      </Title>
      <Text type="secondary">
        Danh sách học viên lỗi DAT, tiến trình sẽ hơi lâu vì hệ thống phải kiểm
        tra thông tin của từng học viên
      </Text>

      <Card className="!mt-4" bordered={false}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={10}>
            <Text strong>Khóa</Text>
            <Select
              allowClear
              className="!mt-2 !w-full"
              placeholder="Chọn khóa"
              value={selectedKhoa}
              onChange={(value) => setSelectedKhoa(value)}
              options={khoaOptions}
              loading={isLoadingCourses}
              showSearch
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>

          <Col xs={24} md={8}>
            <Text strong>Tháng</Text>
            <Select
              allowClear
              className="!mt-2 !w-full"
              placeholder="Chọn tháng"
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={monthOptions}
              disabled={!selectedKhoa}
            />
          </Col>

          <Col xs={24} md={6}>
            <Space wrap className="!w-full">
              <Button type="primary" onClick={handleApplyFilter}>
                Lọc
              </Button>
              <Button onClick={handleClearFilter}>Bỏ lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="!mt-4">
        <Space size={[8, 8]} wrap>
          <Text strong>Bộ lọc đang áp dụng:</Text>
          <Tag color="blue">Khóa: {appliedFilters.khoa || "Tất cả"}</Tag>
          <Tag color="geekblue">
            Năm từ khóa: {appliedFilters.yearFromKhoa || "Chưa xác định"}
          </Tag>
          <Tag color="purple">Tháng: {appliedFilters.month || "Tất cả"}</Tag>
          <Tag color="cyan">
            Số khóa học khớp: {appliedFilters.matchedCourses.length}
          </Tag>
        </Space>

        {appliedFilters.matchedCourses.length > 0 ? (
          <div className="!mt-3">
            <Text type="secondary">
              {appliedFilters.month
                ? `Các khóa thuộc ${appliedFilters.khoa} được tạo trong tháng ${appliedFilters.month}/${appliedFilters.yearFromKhoa}:`
                : `Nhóm ${appliedFilters.khoa} đang bao gồm:`}
            </Text>
            <div className="!mt-2 flex flex-wrap gap-2">
              {appliedFilters.matchedCourses.map((course) => (
                <Tag key={course}>{course}</Tag>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default DashboardDAT;
