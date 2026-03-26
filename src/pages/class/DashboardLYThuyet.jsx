import React, { useMemo, useRef, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Row,
  Col,
  Image,
  Spin,
  Card,
  Tag,
} from "antd";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardLyThuyet,
  optionLopLyThuyet,
} from "../../apis/apiLyThuyetLocal";
import StudentDetailModal from "./StudentDetailModal";

const formatDateTime = (value) => {
  if (!value) return "-";

  const raw = Number(value);
  const date =
    Number.isFinite(raw) && raw > 0
      ? new Date(raw > 1e12 ? raw : raw * 1000)
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const datePart = date.toLocaleDateString("vi-VN");
  const timePart = date.toLocaleTimeString("vi-VN");

  return `${datePart} ${timePart}`;
};

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
  }
  return Boolean(value);
};

const secondsToHourMinute = (seconds) => {
  const total = Number(seconds || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  return `${hours}h${minutes}p`;
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
  const date =
    Number.isFinite(numericValue) && String(rawValue).trim() !== ""
      ? new Date(numericValue > 1e12 ? numericValue : numericValue * 1000)
      : new Date(rawValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

const DashboardLyThuyet = () => {
  const [selectedKhoa, setSelectedKhoa] = useState("K26");
  const [selectedExactCourseIid, setSelectedExactCourseIid] = useState("");
  const [appliedKhoa, setAppliedKhoa] = useState("K26");
  const [appliedExactCourseIid, setAppliedExactCourseIid] = useState("");
  const [trangThaiLamBaiHetMon, setTrangThaiLamBaiHetMon] = useState(null);
  const [locBatThuong, setLocBatThuong] = useState(false);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const keywordInputRef = useRef(null);
  const [params, setParams] = useState({
    page: 1,
    limit: 50,
    text: "",
    loai_het_mon: null,
    loc_bat_thuong: false,
  });

  const location = useLocation();
  const { program_code } = location?.state || {};

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["optionLopLyThuyet"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const courseList = useMemo(
    () => normalizeApiList(dataKhoaHoc),
    [dataKhoaHoc],
  );

  const courseGroupMap = useMemo(() => {
    const groupMap = new Map();

    courseList.forEach((item) => {
      const prefix = extractKhoaPrefix(getCourseLabel(item));
      if (!prefix) return;

      const yearFromPrefix = getYearFromKhoa(prefix);
      const startDate = getCourseStartDate(item);

      if (
        !yearFromPrefix ||
        !startDate ||
        startDate.getFullYear() !== yearFromPrefix
      ) {
        return;
      }

      if (!groupMap.has(prefix)) {
        groupMap.set(prefix, []);
      }

      groupMap.get(prefix).push(item);
    });

    return groupMap;
  }, [courseList]);

  const khoaOptions = useMemo(() => {
    return ["K26", "K27"]
      .filter((prefix) => (courseGroupMap.get(prefix) || []).length > 0)
      .map((prefix) => ({
        label: prefix,
        value: prefix,
      }));
  }, [courseGroupMap]);

  const activeSelectedKhoa =
    selectedKhoa && khoaOptions.some((item) => item.value === selectedKhoa)
      ? selectedKhoa
      : khoaOptions[0]?.value || "";

  const activeAppliedKhoa =
    appliedKhoa && khoaOptions.some((item) => item.value === appliedKhoa)
      ? appliedKhoa
      : activeSelectedKhoa;

  const selectableCourses = useMemo(
    () => courseGroupMap.get(activeSelectedKhoa) || [],
    [activeSelectedKhoa, courseGroupMap],
  );

  const matchedCourses = useMemo(
    () => courseGroupMap.get(activeAppliedKhoa) || [],
    [activeAppliedKhoa, courseGroupMap],
  );

  const exactCourseOptions = useMemo(() => {
    return selectableCourses
      .filter((course) => {
        const startDate = getCourseStartDate(course);
        return startDate && startDate.getFullYear() >= 2026;
      })
      .map((course) => {
        const iid = getCourseIid(course);
        const maKhoa = course?.suffix_name || course?.name || "";

        if (!course?.code || !maKhoa) return null;

        return {
          value: String(iid),
          label: maKhoa,
        };
      })
      .filter(Boolean);
  }, [selectableCourses]);

  const activeAppliedExactCourseIid =
    appliedExactCourseIid &&
    matchedCourses.some(
      (course) => String(getCourseIid(course)) === appliedExactCourseIid,
    )
      ? appliedExactCourseIid
      : "";

  const filteredCourses = useMemo(() => {
    if (!activeAppliedExactCourseIid) {
      return matchedCourses;
    }

    return matchedCourses.filter(
      (course) => String(getCourseIid(course)) === activeAppliedExactCourseIid,
    );
  }, [activeAppliedExactCourseIid, matchedCourses]);

  const selectedKhoasPayload = useMemo(() => {
    return filteredCourses
      .map((course) => {
        const enrolmentPlanIid = getCourseIid(course);
        const maKhoa =
          course?.code || course?.suffix_name || course?.name || "";

        if (!enrolmentPlanIid || !maKhoa) return null;

        return {
          enrolmentPlanIid: String(enrolmentPlanIid),
          maKhoa,
          ma_khoa: maKhoa,
        };
      })
      .filter(Boolean);
  }, [filteredCourses]);

  const selectedClass = filteredCourses[0] || matchedCourses[0] || null;

  const getRecordCourseInfo = (record) => {
    const recordCourse = record?.khoaHoc || record?.course || {};

    return {
      iid:
        recordCourse?.iid ||
        recordCourse?.enrolment_plan_iid ||
        record?.enrolment_plan_iid ||
        record?.learning?.item_iid ||
        record?.learning?.iid ||
        selectedClass?.iid ||
        "",
      code:
        recordCourse?.code ||
        recordCourse?.ma_khoa ||
        record?.ma_khoa ||
        selectedClass?.code ||
        "",
      name:
        recordCourse?.name ||
        recordCourse?.suffix_name ||
        recordCourse?.ten_khoa ||
        record?.ten_khoa ||
        selectedClass?.name ||
        selectedClass?.suffix_name ||
        selectedClass?.code ||
        activeAppliedKhoa ||
        "",
    };
  };

  const { data: dashboardData = {}, isLoading: isLoadingHocVien } = useQuery({
    queryKey: [
      "dashboardLyThuyet",
      activeAppliedKhoa,
      activeAppliedExactCourseIid,
      selectedKhoasPayload.map((item) => item.enrolmentPlanIid).join(","),
      selectedKhoasPayload.map((item) => item.maKhoa).join(","),
      params.page,
      params.limit,
      params.text,
      params.loai_het_mon,
      params.loc_bat_thuong,
    ],
    queryFn: () =>
      getDashboardLyThuyet({
        khoas: selectedKhoasPayload,
        page: params.page,
        limit: params.limit,
        text: params.text,
        ...(params.loai_het_mon === null
          ? {}
          : { loai_het_mon: params.loai_het_mon }),
        ...(params.loc_bat_thuong ? { loc_bat_thuong: true } : {}),
      }),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: selectedKhoasPayload.length > 0,
  });

  const students = useMemo(
    () => normalizeApiList(dashboardData),
    [dashboardData],
  );

  const totalStudents = Number(
    dashboardData?.total ||
      dashboardData?.pagination?.total ||
      dashboardData?.meta?.total ||
      students.length ||
      0,
  );

  const getRowKey = (record) =>
    String(record?.user?.iid || record?.ma_dk || record?.id || "");

  const isPassAllLyThuyet = (record) => {
    const scoreByRubrik = record?.learning?.score_by_rubrik;
    if (!Array.isArray(scoreByRubrik) || scoreByRubrik.length === 0) {
      return Boolean(record?.learning?.passed);
    }
    return scoreByRubrik.every((item) => Number(item?.passed) !== 0);
  };

  const getCompletionStats = (record) => {
    const scoreByRubrik = record?.learning?.learning_progress || [];

    const monHoc = scoreByRubrik.filter((mon) => {
      const tenMon = String(mon?.name || "");
      return (
        !tenMon.includes("Bảng tổng hợp") &&
        !tenMon.includes("Điểm kiểm tra tổng hợp") &&
        !tenMon.includes("Tổng thời gian học")
      );
    });

    const tongSoMon = monHoc.length;
    const soMonDat = monHoc.filter((mon) => Number(mon?.passed) === 1).length;
    const phanTramHoanThanh =
      tongSoMon > 0 ? Math.round((soMonDat / tongSoMon) * 100) : 0;

    return {
      soMonDat,
      tongSoMon,
      phanTramHoanThanh,
    };
  };

  const buildStudentDetailData = (record) => ({
    ...record,
    learning_progress: {
      score_by_rubrik: record?.learning?.learning_progress || [],
      item_iid: record?.learning?.item_iid || record?.learning?.iid || "",
    },
    khoaHoc: {
      ...(record?.khoaHoc || {}),
      hangDaoTao: record?.khoaHoc?.hangDaoTao || program_code,
    },
  });

  const handleOpenStudentDetail = (record) => {
    setSelectedStudent(buildStudentDetailData(record));
    setIsStudentDetailOpen(true);
  };

  const handleCloseStudentDetail = () => {
    setIsStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  const resolveCheckState = (record) => {
    const autoLyThuyetPassed = isPassAllLyThuyet(record);
    const savedData = record?.trang_thai || {};

    const lyThuyetDat = autoLyThuyetPassed
      ? true
      : normalizeBoolean(savedData?.loai_ly_thuyet);

    const hetMonChecked =
      savedData?.loai_het_mon === undefined
        ? false
        : normalizeBoolean(savedData?.loai_het_mon, true);

    const statusUpdatedAt =
      savedData?.status_updated_at ||
      savedData?.updated_at ||
      savedData?.updatedAt ||
      savedData?.updated_ts ||
      null;

    const isDuDieuKien =
      savedData?.is_du_dieu_kien === undefined
        ? lyThuyetDat && hetMonChecked
        : normalizeBoolean(savedData?.is_du_dieu_kien);

    return {
      lyThuyetDat,
      hetMonChecked,
      statusUpdatedAt,
      isDuDieuKien,
    };
  };

  const handleFilter = () => {
    const text = keywordInputRef.current?.input?.value?.trim() || "";
    setAppliedKhoa(activeSelectedKhoa || "");
    setAppliedExactCourseIid(selectedExactCourseIid || "");
    setParams((prev) => ({
      ...prev,
      page: 1,
      text,
      loai_het_mon: trangThaiLamBaiHetMon,
      loc_bat_thuong: locBatThuong,
    }));
  };

  const handleReset = () => {
    if (keywordInputRef.current?.input) {
      keywordInputRef.current.input.value = "";
    }

    const defaultKhoa = khoaOptions[0]?.value || "K26";
    setSelectedKhoa(defaultKhoa);
    setSelectedExactCourseIid("");
    setAppliedKhoa(defaultKhoa);
    setAppliedExactCourseIid("");
    setTrangThaiLamBaiHetMon(null);
    setLocBatThuong(false);
    setParams((prev) => ({
      ...prev,
      page: 1,
      text: "",
      loai_het_mon: null,
      loc_bat_thuong: false,
    }));
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 35,
      align: "center",
      render: (_, __, index) => index + 1,
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
      title: "CCCD",
      dataIndex: "user",
      key: "cccd",
      width: 120,
      align: "center",
      render: (user) => <span>{user?.identification_card || "-"}</span>,
    },
    {
      title: "Năm sinh",
      dataIndex: "user",
      key: "birth_year",
      width: 90,
      align: "center",
      render: (user) => <span>{user?.birth_year || "-"}</span>,
    },
    {
      title: "Khóa",
      width: 80,
      key: "khoa",
      align: "center",
      render: (_, record) => getRecordCourseInfo(record).name || "-",
    },
    {
      title: "Giáo viên",
      width: 140,
      key: "giang_vien",
      align: "center",
      render: (value) => value?.giang_vien?.giao_vien || "-",
    },
    {
      title: "Điều kiện Cabin",
      key: "progress",
      width: 160,
      align: "center",
      render: (_, record) =>
        resolveCheckState(record).isDuDieuKien ? (
          <span className="text-green-600 font-medium">Đủ điều kiện</span>
        ) : (
          <span className="text-red-500 font-medium">Chưa đủ điều kiện</span>
        ),
    },
    {
      title: "Lý thuyết online",
      key: "passed_total",
      width: 160,
      align: "center",
      render: (_, record) => {
        const { lyThuyetDat } = resolveCheckState(record);

        return (
          <div
            role="button"
            tabIndex={0}
            className="w-full h-full cursor-pointer flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenStudentDetail(record);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleOpenStudentDetail(record);
              }
            }}
          >
            <Tag color={lyThuyetDat ? "green" : "error"} variant="solid">
              {lyThuyetDat ? "Đạt" : "Chưa đạt"}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Làm bài hết môn",
      key: "last_login",
      width: 140,
      align: "center",
      render: (_, record) => {
        const checked = resolveCheckState(record).hetMonChecked;

        return checked ? (
          <Tag color="green">Đã làm bài</Tag>
        ) : (
          <Tag color="default">Chưa làm bài</Tag>
        );
      },
    },
    {
      title: "Phút cabin",
      dataIndex: "cabin",
      key: "thoi_gian_cabin_text",
      width: 100,
      align: "center",
      render: (value) => secondsToHourMinute(value?.tong_thoi_gian || 0),
    },
    {
      title: "Bài cabin",
      dataIndex: "cabin",
      key: "so_bai_cabin",
      width: 90,
      align: "center",
      render: (value) => `${value?.so_bai_hoc || 0} bài`,
    },
    {
      title: "Thời gian thay đổi",
      key: "status_updated_at",
      width: 180,
      align: "center",
      render: (_, record) =>
        formatDateTime(resolveCheckState(record).statusUpdatedAt),
    },
  ];

  return (
    <Spin spinning={isLoadingHocVien || isLoadingKhoaHoc}>
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Dashboard lý thuyết
      </h1>

      <Card className="!mt-5 !mb-4">
        <Row gutter={[12, 12]} align="bottom">
          <Col span={5}>
            <label className="block text-xs text-gray-500 uppercase">
              Khóa
            </label>
            <Select
              className="w-full"
              placeholder="--Chọn khóa--"
              value={selectedKhoa || undefined}
              onChange={(value) => {
                setSelectedKhoa(value || "");
                setSelectedExactCourseIid("");
              }}
              options={khoaOptions}
              loading={isLoadingKhoaHoc}
              showSearch
              optionFilterProp="label"
              notFoundContent={
                isLoadingKhoaHoc ? "Đang tải khóa..." : "Không có khóa"
              }
            />
          </Col>

          <Col span={5}>
            <label className="block text-xs text-gray-500 uppercase">
              Khóa cụ thể
            </label>
            <Select
              className="w-full"
              placeholder="--Tất cả khóa học--"
              value={selectedExactCourseIid || undefined}
              onChange={(value) => {
                setSelectedExactCourseIid(value || "");
              }}
              options={exactCourseOptions}
              loading={isLoadingKhoaHoc}
              allowClear
              showSearch
              optionFilterProp="label"
              notFoundContent={
                isLoadingKhoaHoc
                  ? "Đang tải khóa cụ thể..."
                  : "Không có dữ liệu"
              }
            />
          </Col>

          <Col span={5}>
            <label className="block text-xs text-gray-500 uppercase">
              Từ khóa
            </label>
            <Input
              aria-label="Tên học viên"
              ref={keywordInputRef}
              placeholder="Tên học viên"
              onPressEnter={handleFilter}
            />
          </Col>

          <Col span={5}>
            <label className="block text-xs text-gray-500 uppercase">
              Trạng thái làm bài hết môn
            </label>
            <Select
              className="w-full"
              placeholder="--Chọn trạng thái--"
              value={
                trangThaiLamBaiHetMon === null
                  ? undefined
                  : trangThaiLamBaiHetMon
              }
              onChange={(value) => setTrangThaiLamBaiHetMon(value ?? null)}
              options={[
                {
                  label: "Chưa làm bài hết môn",
                  value: false,
                },
                {
                  label: "Đã làm bài hết môn",
                  value: true,
                },
              ]}
              allowClear
            />
          </Col>

          <Col>
            <Space>
              <Button
                type="primary"
                className="!bg-[#3366cc]"
                onClick={handleFilter}
              >
                Lọc
              </Button>
              <Button onClick={handleReset}>Bỏ lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={students}
        pagination={{
          current: params.page,
          pageSize: params.limit,
          total: totalStudents,
          onChange: (page, pageSize) => {
            setParams((prev) => ({
              ...prev,
              page,
              limit: pageSize,
            }));
          },
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} học viên`,
        }}
        rowKey={getRowKey}
        size="small"
        bordered
        scroll={{ x: 1200 }}
        className="overflow-hidden table-blue-header"
      />

      <StudentDetailModal
        studentData={selectedStudent}
        visible={isStudentDetailOpen}
        onClose={handleCloseStudentDetail}
        progress={getCompletionStats(selectedStudent).phanTramHoanThanh}
        passed={getCompletionStats(selectedStudent).soMonDat}
        total={getCompletionStats(selectedStudent).tongSoMon}
        program_code={program_code}
        program_name={
          selectedClass?.name ||
          selectedClass?.suffix_name ||
          activeAppliedKhoa ||
          ""
        }
        maKhoaHoc={
          selectedClass?.code || selectedClass?.name || activeAppliedKhoa || ""
        }
      />
    </Spin>
  );
};

export default DashboardLyThuyet;
