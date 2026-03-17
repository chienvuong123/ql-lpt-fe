import { useMemo, useState } from "react";
import { Button, Card, Col, Row, Select, Space, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import { courseOptions } from "../../apis/khoaHoc";
import { danhSachDashboardDAT } from "../../apis/evaluateApi";

const { Title, Text } = Typography;

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.Data)) return payload.data.Data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
};

const extractKhoaPrefix = (source) => {
  const text = String(source || "").toUpperCase();
  const match = text.match(/K(\d{2})(?!\d)/);

  if (!match) return "";
  return `K${match[1]}`;
};

const getYearFromKhoa = (khoa) => {
  const match = String(khoa || "").match(/^K(\d{2})$/i);
  if (!match) return undefined;
  return Number(`20${match[1]}`);
};

const getRangeByMonth = (khoa, month) => {
  const year = getYearFromKhoa(khoa);
  if (!year || !month) {
    return {
      ngaybatdau: "",
      ngayketthuc: "",
    };
  }

  const end = dayjs(`${year}-${String(month).padStart(2, "0")}-01`)
    .endOf("month")
    .format("YYYY-MM-DDTHH:mm:ss");

  return {
    ngaybatdau: "2022-01-01",
    ngayketthuc: end,
  };
};

const DashboardDAT = () => {
  const currentDate = dayjs();
  const defaultMonth = currentDate.month() + 1;
  const defaultKhoa = `K${String(currentDate.year()).slice(-2)}`;
  const [selectedKhoa, setSelectedKhoa] = useState(defaultKhoa);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [appliedFilter, setAppliedFilter] = useState({
    khoa: defaultKhoa,
    month: defaultMonth,
  });

  const { data: khoaHocSourceData, isLoading: isLoadingKhoaSource } = useQuery({
    queryKey: ["courseOptionsDashboardDAT"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const { data: lopLyThuyetData, isLoading: isLoadingLopLyThuyet } = useQuery({
    queryKey: ["optionLopLyThuyetDashboardDAT"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const courseSourceList = useMemo(
    () => normalizeApiList(khoaHocSourceData),
    [khoaHocSourceData],
  );

  const lopLyThuyetList = useMemo(
    () => normalizeApiList(lopLyThuyetData),
    [lopLyThuyetData],
  );

  const sourceKhoaSet = useMemo(() => {
    const prefixes = courseSourceList
      .map((item) => extractKhoaPrefix(item?.MaKhoaHoc || item?.Ten || ""))
      .filter(Boolean);

    return new Set(prefixes);
  }, [courseSourceList]);

  const lopLyThuyetGroupMap = useMemo(() => {
    const groupMap = new Map();

    lopLyThuyetList.forEach((item) => {
      const prefix = extractKhoaPrefix(
        item?.suffix_name || item?.name || item?.code || "",
      );

      if (!prefix) return;

      if (!groupMap.has(prefix)) {
        groupMap.set(prefix, []);
      }

      groupMap.get(prefix).push(item);
    });

    return groupMap;
  }, [lopLyThuyetList]);

  const khoaOptions = useMemo(() => {
    return Array.from(lopLyThuyetGroupMap.entries())
      .filter(([prefix]) => sourceKhoaSet.has(prefix))
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([prefix, courses]) => ({
        label: `Khóa ${prefix.slice(1)}`,
        value: prefix,
        count: courses.length,
      }));
  }, [lopLyThuyetGroupMap, sourceKhoaSet]);

  const activeSelectedKhoa =
    selectedKhoa && khoaOptions.some((item) => item.value === selectedKhoa)
      ? selectedKhoa
      : (khoaOptions.find((item) => item.value === defaultKhoa)?.value ??
        khoaOptions[0]?.value);

  const activeAppliedKhoa =
    appliedFilter.khoa &&
    khoaOptions.some((item) => item.value === appliedFilter.khoa)
      ? appliedFilter.khoa
      : activeSelectedKhoa;

  const matchedCourses = useMemo(() => {
    const yearFromKhoa = getYearFromKhoa(activeAppliedKhoa);
    const matchedGroup = lopLyThuyetGroupMap.get(activeAppliedKhoa) || [];

    return matchedGroup.filter((course) => {
      if (!course?.start_date || !yearFromKhoa) {
        return false;
      }

      const startDate = dayjs.unix(Number(course.start_date));
      if (!startDate.isValid()) {
        return false;
      }

      if (startDate.year() !== yearFromKhoa) {
        return false;
      }

      if (
        appliedFilter.month &&
        startDate.month() + 1 !== Number(appliedFilter.month)
      ) {
        return false;
      }

      return true;
    });
  }, [activeAppliedKhoa, appliedFilter.month, lopLyThuyetGroupMap]);

  const selectedPlanIds = useMemo(() => {
    return matchedCourses
      .map((course) => course?.iid)
      .filter((iid) => iid !== null && iid !== undefined);
  }, [matchedCourses]);

  const dateRange = useMemo(() => {
    return getRangeByMonth(activeAppliedKhoa, appliedFilter.month);
  }, [activeAppliedKhoa, appliedFilter.month]);

  const { data: listDashboardDAT, isLoading: isLoadingDashboard } = useQuery({
    queryKey: [
      "danhSachDashboardDAT",
      activeAppliedKhoa,
      appliedFilter.month,
      selectedPlanIds.join(","),
      dateRange.ngaybatdau,
      dateRange.ngayketthuc,
    ],
    queryFn: () =>
      danhSachDashboardDAT({
        enrolmentPlanIids: ["25906493"],
        ngaybatdau: dateRange.ngaybatdau,
        ngayketthuc: dateRange.ngayketthuc,
      }),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
    enabled:
      Boolean(activeAppliedKhoa) &&
      Boolean(appliedFilter.month) &&
      selectedPlanIds.length > 0,
  });

  const dashboardList = useMemo(
    () => normalizeApiList(listDashboardDAT),
    [listDashboardDAT],
  );

  const handleApplyFilter = () => {
    setAppliedFilter({
      khoa: activeSelectedKhoa,
      month: selectedMonth || defaultMonth,
    });
  };

  const handleClearFilter = () => {
    setSelectedKhoa(defaultKhoa);
    setSelectedMonth(defaultMonth);
    setAppliedFilter({
      khoa: defaultKhoa,
      month: defaultMonth,
    });
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
              className="!mt-2 !w-full"
              placeholder="Chọn khóa"
              value={activeSelectedKhoa}
              onChange={(value) => setSelectedKhoa(value)}
              options={khoaOptions}
              loading={isLoadingKhoaSource || isLoadingLopLyThuyet}
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
              className="!mt-2 !w-full"
              placeholder="Chọn tháng"
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={Array.from({ length: 12 }, (_, index) => ({
                label: `Tháng ${index + 1}`,
                value: index + 1,
              }))}
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
          <Tag color="blue">Khóa: {activeAppliedKhoa || "-"}</Tag>
          <Tag color="purple">Tháng: {appliedFilter.month || "-"}</Tag>
          <Tag color="cyan">
            Năm theo khóa: {getYearFromKhoa(activeAppliedKhoa) || "-"}
          </Tag>
          <Tag color="green">Số lớp khớp: {matchedCourses.length}</Tag>
          <Tag color="gold">Số IID gửi lên: {selectedPlanIds.length}</Tag>
        </Space>

        {matchedCourses.length > 0 ? (
          <div className="!mt-3">
            <Text type="secondary">
              Các lớp của {activeAppliedKhoa} có `start_date` trong tháng{" "}
              {appliedFilter.month}/{getYearFromKhoa(activeAppliedKhoa)}:
            </Text>
            <div className="!mt-2 flex flex-wrap gap-2">
              {matchedCourses.map((course) => (
                <Tag key={course?.iid}>
                  {(course?.name || course?.suffix_name || course?.code || "") +
                    ` (#${course?.iid})`}
                </Tag>
              ))}
            </div>
          </div>
        ) : null}

        <div className="!mt-4">
          <Text strong>Payload gửi API:</Text>
          <div className="!mt-2 flex flex-wrap gap-2">
            <Tag color="geekblue">
              ngaybatdau: {dateRange.ngaybatdau || "-"}
            </Tag>
            <Tag color="geekblue">
              ngayketthuc: {dateRange.ngayketthuc || "-"}
            </Tag>
          </div>
        </div>

        <div className="!mt-4">
          <Text strong>
            Kết quả `danhSachDashboardDAT`:{" "}
            {isLoadingDashboard ? "Đang tải..." : dashboardList.length}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default DashboardDAT;
