import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import { danhSachDashboardDAT } from "../../apis/evaluateApi";
import FailRecordDetailModal from "./FailRecordDetailModal";

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

const getCourseCode = (course) =>
  course?.code || course?.suffix_name || course?.name || "";

const getCourseLabel = (course) =>
  course?.suffix_name || course?.name || course?.code || "";

const getCourseIid = (course) =>
  course?.iid ?? course?.Iid ?? course?.IID ?? course?.ID ?? course?.id;

const getCourseStartDate = (course) => {
  const rawValue =
    course?.start_date ??
    course?.StartDate ??
    course?.NgayKhaiGiang ??
    course?.ngay_khai_giang ??
    course?.NgayBatDau ??
    course?.ngay_bat_dau;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const numericValue = Number(rawValue);
  if (Number.isFinite(numericValue) && String(rawValue).trim() !== "") {
    const unixDate = dayjs.unix(numericValue);
    if (unixDate.isValid()) return unixDate;
  }

  const parsedDate = dayjs(rawValue);
  return parsedDate.isValid() ? parsedDate : null;
};

const getRangeByMonth = () => {
  return {
    ngaybatdau: "2020-01-01",
    ngayketthuc: `${dayjs().format("YYYY-MM-DD")}T23:59:00`,
  };
};

const getFailNotes = (record) => {
  return (record?.errors || [])
    .map((item) => item?.message || item?.label || "")
    .filter(Boolean)
    .join(", ");
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
  const [selectedFailRecord, setSelectedFailRecord] = useState(null);

  const { data: lopLyThuyetData, isLoading: isLoadingLopLyThuyet } = useQuery({
    queryKey: ["optionLopLyThuyetDashboardDAT"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const courseList = useMemo(
    () => normalizeApiList(lopLyThuyetData),
    [lopLyThuyetData],
  );

  const courseGroupMap = useMemo(() => {
    const groupMap = new Map();

    courseList.forEach((item) => {
      const prefix = extractKhoaPrefix(getCourseLabel(item));
      if (!prefix) return;

      if (!groupMap.has(prefix)) {
        groupMap.set(prefix, []);
      }

      groupMap.get(prefix).push(item);
    });

    return groupMap;
  }, [courseList]);

  const khoaOptions = useMemo(() => {
    return Array.from(courseGroupMap.entries())
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([prefix, courses]) => ({
        label: `Khóa ${prefix.slice(1)}`,
        value: prefix,
        count: courses.length,
      }));
  }, [courseGroupMap]);

  const activeSelectedKhoa =
    selectedKhoa && khoaOptions.some((item) => item.value === selectedKhoa)
      ? selectedKhoa
      : (khoaOptions.find((item) => item.value === defaultKhoa)?.value ??
        khoaOptions[0]?.value);

  const monthOptions = useMemo(() => {
    const courses = courseGroupMap.get(activeSelectedKhoa) || [];
    const availableMonths = new Set(
      courses
        .map((course) => {
          const startDate = getCourseStartDate(course);
          return startDate ? startDate.month() + 1 : null;
        })
        .filter((month) => Number.isFinite(month)),
    );

    return Array.from({ length: 12 }, (_, index) => index + 1)
      .filter((month) => availableMonths.has(month))
      .map((month) => ({
        label: `Tháng ${month}`,
        value: month,
      }));
  }, [activeSelectedKhoa, courseGroupMap]);

  const activeSelectedMonth =
    selectedMonth && monthOptions.some((item) => item.value === selectedMonth)
      ? selectedMonth
      : (monthOptions.find((item) => item.value === defaultMonth)?.value ??
        monthOptions[0]?.value);

  const activeAppliedKhoa =
    appliedFilter.khoa &&
    khoaOptions.some((item) => item.value === appliedFilter.khoa)
      ? appliedFilter.khoa
      : activeSelectedKhoa;

  const appliedMonthOptions = useMemo(() => {
    const courses = courseGroupMap.get(activeAppliedKhoa) || [];

    return Array.from(
      new Set(
        courses
          .map((course) => {
            const startDate = getCourseStartDate(course);
            return startDate ? startDate.month() + 1 : null;
          })
          .filter((month) => Number.isFinite(month)),
      ),
    ).sort((left, right) => left - right);
  }, [activeAppliedKhoa, courseGroupMap]);

  const activeAppliedMonth =
    appliedFilter.month && appliedMonthOptions.includes(appliedFilter.month)
      ? appliedFilter.month
      : activeSelectedMonth;

  const matchedCourses = useMemo(() => {
    const yearFromKhoa = getYearFromKhoa(activeAppliedKhoa);
    const courses = courseGroupMap.get(activeAppliedKhoa) || [];

    return courses.filter((course) => {
      const startDate = getCourseStartDate(course);
      const iid = getCourseIid(course);
      const code = getCourseCode(course);

      if (!startDate || !iid || !code || !yearFromKhoa) {
        return false;
      }

      if (startDate.year() !== yearFromKhoa) {
        return false;
      }

      if (
        activeAppliedMonth &&
        startDate.month() + 1 !== Number(activeAppliedMonth)
      ) {
        return false;
      }

      return true;
    });
  }, [activeAppliedKhoa, activeAppliedMonth, courseGroupMap]);

  const selectedPlanIds = useMemo(() => {
    return matchedCourses
      .map((course) => getCourseIid(course))
      .filter((iid) => iid !== null && iid !== undefined && iid !== "");
  }, [matchedCourses]);

  const selectedMaKhoaHocList = useMemo(() => {
    return matchedCourses
      .map((course) => getCourseCode(course))
      .filter(Boolean);
  }, [matchedCourses]);

  const dateRange = useMemo(() => {
    return getRangeByMonth(activeAppliedKhoa, activeAppliedMonth);
  }, [activeAppliedKhoa, activeAppliedMonth]);

  const { data: listDashboardDAT, isLoading: isLoadingDashboard, refetch: refetchDashboardDAT } = useQuery({
    queryKey: [
      "danhSachDashboardDAT2",
      activeAppliedKhoa,
      activeAppliedMonth,
      selectedPlanIds.join(","),
      selectedMaKhoaHocList.join(","),
      dateRange.ngaybatdau,
      dateRange.ngayketthuc,
    ],
    queryFn: () =>
      danhSachDashboardDAT({
        enrolmentPlanIids: selectedPlanIds,
        ngaybatdau: dateRange.ngaybatdau,
        ngayketthuc: dateRange.ngayketthuc,
        maKhoaHoc: selectedMaKhoaHocList,
      }),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
    enabled:
      Boolean(activeAppliedKhoa) &&
      Boolean(activeAppliedMonth) &&
      selectedPlanIds.length > 0 &&
      selectedPlanIds.length === selectedMaKhoaHocList.length,
  });

  const dashboardList = useMemo(
    () => normalizeApiList(listDashboardDAT),
    [listDashboardDAT],
  );

  const failRecords = useMemo(() => {
    return dashboardList.filter(
      (item) => String(item?.status || "").toLowerCase() === "fail",
    );
  }, [dashboardList]);

  const failColumns = [
    {
      title: "#",
      key: "stt",
      width: 40,
      align: "center",
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "Mã ĐK",
      dataIndex: "maDK",
      key: "maDK",
      width: 190,
    },
    {
      title: "Họ tên",
      dataIndex: "hoTen",
      key: "hoTen",
      width: 220,
    },
    {
      title: "Tên khóa học",
      key: "khoaHoc",
      width: 120,
      render: (_, record) => record?.studentInfo?.khoaHoc || "-",
    },
    {
      title: "Hạng",
      dataIndex: "hangDaoTao",
      key: "hangDaoTao",
      width: 80,
      align: "center",
    },
    {
      title: "Giáo viên",
      key: "giaoVien",
      width: 180,
      render: (_, record) => record?.studentInfo?.giaoVien || "-",
    },
    {
      title: "Biển số xe",
      key: "bienSoXe",
      width: 220,
      render: (_, record) => {
        const xeB1 = record?.studentInfo?.xeB1;
        const xeB2 = record?.studentInfo?.xeB2;
        return [xeB1, xeB2].filter(Boolean).join(" / ") || "-";
      },
    },
    {
      title: "Ghi chú",
      key: "ghiChu",
      width: 420,
      render: (_, record) => getFailNotes(record) || "-",
    },
    {
      title: "Lỗi",
      key: "errorCount",
      width: 90,
      align: "center",
      render: (_, record) => record?.errors?.length || 0,
    },
    {
      title: "Cảnh báo",
      key: "warningCount",
      width: 120,
      align: "center",
      render: (_, record) => record?.warnings?.length || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center",
      render: (value) => (
        <Tag
          color={
            String(value || "").toLowerCase() === "fail" ? "red" : "default"
          }
        >
          {String(value || "-").toUpperCase()}
        </Tag>
      ),
    },
  ];

  const handleApplyFilter = () => {
    setAppliedFilter({
      khoa: activeSelectedKhoa,
      month: activeSelectedMonth || defaultMonth,
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
              loading={isLoadingLopLyThuyet}
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
              value={activeSelectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={monthOptions}
              disabled={monthOptions.length === 0}
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
          <div className="flex items-center">
            <Text strong>
              Bộ lọc đang áp dụng tháng {activeAppliedMonth}/
              {getYearFromKhoa(activeAppliedKhoa)}:{" "}
            </Text>
            {matchedCourses.length > 0 ? (
              <div className="pl-3">
                <div className="flex flex-wrap gap-2">
                  {matchedCourses.map((course) => (
                    <Tag
                      color="blue"
                      key={`${getCourseCode(course)}-${getCourseIid(course)}`}
                    >
                      {getCourseLabel(course)}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Space>
      </Card>

      <div className="!mt-4">
        <Table
          columns={failColumns}
          dataSource={failRecords}
          loading={isLoadingDashboard}
          rowKey={(record) => record?.maDK || record?.planIid}
          size="small"
          className="overflow-hidden table-blue-header"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1600 }}
          onRow={(record) => ({
            onClick: () => setSelectedFailRecord(record),
            className: "cursor-pointer",
          })}
        />
      </div>

      <FailRecordDetailModal
        open={Boolean(selectedFailRecord)}
        record={selectedFailRecord}
        onCancel={() => setSelectedFailRecord(null)}
        onUpdated={() => refetchDashboardDAT()}
      />
    </div>
  );
};

export default DashboardDAT;
