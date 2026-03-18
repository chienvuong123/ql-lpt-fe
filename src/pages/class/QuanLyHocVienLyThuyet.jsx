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
  Checkbox,
  message,
  Tag,
} from "antd";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { capNhatTrangThaiHocVienLyThuyet } from "../../apis/apiHocVienLopLyThuyet";
import { ketQuaKiemTra, optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import { toTitleCase } from "../../util/helper";
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

const QuanLyHocVienLyThuyet = () => {
  const [selectedClassIid, setSelectedClassIid] = useState("");
  const [savingStudentCode, setSavingStudentCode] = useState("");
  const [studentStatusOverrides, setStudentStatusOverrides] = useState({});
  const [trangThaiLamBaiHetMon, setTrangThaiLamBaiHetMon] = useState(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const keywordInputRef = useRef(null);
  const [params, setParams] = useState({
    page: 1,
    limit: 50,
    text: "",
    loai_het_mon: null,
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

  const classOptions = useMemo(() => {
    return courseList.map((item) => ({
      label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
      value: item?.iid,
    }));
  }, [courseList]);

  const activeClassIid = selectedClassIid || classOptions[0]?.value || "";

  const selectedClass = useMemo(() => {
    return courseList.find(
      (item) => String(item?.iid) === String(activeClassIid),
    );
  }, [courseList, activeClassIid]);

  const enrolmentPlanIid = selectedClass?.iid || activeClassIid || "";

  const { data: ketQuaKiemTraData = {}, isLoading: isLoadingHocVien } =
    useQuery({
      queryKey: [
        "ketQuaKiemTra",
        enrolmentPlanIid,
        params.page,
        params.limit,
        params.text,
        params.loai_het_mon,
      ],
      queryFn: () =>
        ketQuaKiemTra(enrolmentPlanIid, {
          page: params.page,
          limit: params.limit,
          text: params.text,
          maKhoa: selectedClass?.code || "",
          ...(params.loai_het_mon === null
            ? {}
            : { loai_het_mon: params.loai_het_mon }),
        }),
      staleTime: 1000 * 60 * 5,
      retry: false,
      enabled: Boolean(enrolmentPlanIid),
    });

  const students = useMemo(
    () => normalizeApiList(ketQuaKiemTraData),
    [ketQuaKiemTraData],
  );

  const totalStudents = Number(
    ketQuaKiemTraData?.total ||
      ketQuaKiemTraData?.pagination?.total ||
      ketQuaKiemTraData?.meta?.total ||
      students.length ||
      0,
  );

  const getStudentCode = (record) =>
    String(
      record?.ma_dk ||
        record?.user?.admission_code ||
        record?.user?.code ||
        record?.id ||
        "",
    );

  const isPassAllLyThuyet = (record) => {
    const scoreByRubrik = record?.learning?.learning_progress || [];
    if (!Array.isArray(scoreByRubrik) || scoreByRubrik.length === 0) {
      return Boolean(record?.learning?.passed);
    }
    return scoreByRubrik.every((item) => Number(item?.passed) !== 0);
  };

  const parseGhiChu = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value !== "string") return String(value);
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.note === "string") return parsed.note;
      return "";
    } catch {
      return value;
    }
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
    const maDk = getStudentCode(record);
    const localOverride = studentStatusOverrides[maDk] || {};
    const savedData = {
      ...(record?.trang_thai || {}),
      ...localOverride,
    };
    const autoLyThuyetPassed = isPassAllLyThuyet(record);

    const lyThuyetDat =
      savedData?.loai_ly_thuyet === undefined
        ? autoLyThuyetPassed
        : normalizeBoolean(savedData?.loai_ly_thuyet);
    const loaiLyThuyet = lyThuyetDat;

    const hetMonChecked =
      savedData?.loai_het_mon === undefined
        ? true
        : normalizeBoolean(savedData?.loai_het_mon, true);

    const cabinChecked = normalizeBoolean(
      savedData?.dat_cabin ?? savedData?.cabin,
    );
    const datChecked = normalizeBoolean(savedData?.dat);
    const ghiChu = parseGhiChu(savedData?.ghi_chu);
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
      maDk,
      loaiLyThuyet,
      lyThuyetDat,
      hetMonChecked,
      cabinChecked,
      datChecked,
      ghiChu,
      statusUpdatedAt,
      isDuDieuKien,
    };
  };

  const { mutate: saveStudentCheck } = useMutation({
    mutationFn: ({ maDk, payload }) =>
      capNhatTrangThaiHocVienLyThuyet(maDk, payload),
    onSuccess: (_response, variables) => {
      message.success(
        `Cập nhật trạng thái thành công của học viên ${toTitleCase(variables?.payload?.ho_ten)}`,
      );
      setStudentStatusOverrides((prev) => ({
        ...prev,
        [variables.maDk]: {
          ...(prev[variables.maDk] || {}),
          loai_het_mon: variables.payload.loai_het_mon,
          ghi_chu: variables.payload.ghi_chu,
          status_updated_at: variables.payload.status_updated_at,
          dat_cabin: variables.payload.dat_cabin,
          is_du_dieu_kien:
            variables.payload.loai_ly_thuyet === true &&
            variables.payload.loai_het_mon === true,
        },
      }));
    },
    onError: (error, variables) => {
      if (variables?.rollbackState) {
        setStudentStatusOverrides((prev) => ({
          ...prev,
          [variables.maDk]: {
            ...(prev[variables.maDk] || {}),
            ...variables.rollbackState,
          },
        }));
      }
      message.error(
        `Lưu trạng thái thất bại: ${error?.response?.data?.message || error?.message || "Có lỗi xảy ra"}`,
      );
    },

    onSettled: () => {
      setSavingStudentCode("");
    },
  });

  const buildPayload = (record, overrides = {}) => {
    const currentState = resolveCheckState(record);
    const loaiLyThuyet = overrides.loai_ly_thuyet ?? currentState.loaiLyThuyet;
    const loaiHetMon = overrides.loai_het_mon ?? currentState.hetMonChecked;

    return {
      loai_ly_thuyet: loaiLyThuyet,
      loai_het_mon: loaiHetMon,
      ghi_chu: overrides.ghi_chu ?? currentState.ghiChu,
      ma_khoa: selectedClass?.iid || "",
      ten_khoa:
        selectedClass?.name || selectedClass?.suffix_name || program_code || "",
      status_updated_at:
        overrides.status_updated_at || new Date().toISOString(),
      ho_ten: record?.user?.name,
      can_cuoc: record?.user?.identification_card,
      nam_sinh: record?.user?.birth_year,
      dat_cabin: loaiLyThuyet === true && loaiHetMon === true,
    };
  };

  const handleToggleCheckbox = (record, fieldName, checkedValue) => {
    const maDk = getStudentCode(record);
    if (!maDk) {
      message.warning("Không tìm thấy mã học viên để lưu dữ liệu.");
      return;
    }

    const currentState = resolveCheckState(record);
    const nextCheckedValue =
      fieldName === "loai_het_mon" ? !currentState.hetMonChecked : checkedValue;
    const overrides = { [fieldName]: nextCheckedValue };
    const rollbackState =
      fieldName === "loai_het_mon"
        ? {
            loai_het_mon: currentState.hetMonChecked,
          }
        : {};

    const payload = buildPayload(record, overrides);
    setStudentStatusOverrides((prev) => ({
      ...prev,
      [maDk]: {
        ...(prev[maDk] || {}),
        [fieldName]: nextCheckedValue,
        status_updated_at: payload.status_updated_at,
        dat_cabin: payload.dat_cabin,
        is_du_dieu_kien:
          payload.loai_ly_thuyet === true && payload.loai_het_mon === true,
      },
    }));
    setSavingStudentCode(maDk);
    saveStudentCheck({ maDk, payload, rollbackState });
  };

  const handleBlurGhiChu = (record, value) => {
    const maDk = getStudentCode(record);
    if (!maDk) return;

    const currentState = resolveCheckState(record);
    const nextGhiChu = typeof value === "string" ? value.trim() : "";

    if ((currentState.ghiChu || "").trim() === nextGhiChu) return;

    setSavingStudentCode(maDk);
    saveStudentCheck({
      maDk,
      payload: buildPayload(record, { ghi_chu: nextGhiChu }),
    });
  };

  const handleFilter = () => {
    const text = keywordInputRef.current?.input?.value?.trim() || "";
    setParams({
      page: 1,
      limit: params.limit,
      text,
      loai_het_mon: trangThaiLamBaiHetMon,
    });
  };

  const handleReset = () => {
    if (keywordInputRef.current?.input) {
      keywordInputRef.current.input.value = "";
    }
    setTrangThaiLamBaiHetMon(null);
    setParams({
      page: 1,
      limit: params.limit,
      text: "",
      loai_het_mon: null,
    });
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
      render: () =>
        selectedClass?.name ||
        selectedClass?.suffix_name ||
        selectedClass?.code ||
        program_code ||
        "-",
    },
    {
      title: "Điều kiện học Cabin",
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
      width: 130,
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
        const studentCode = getStudentCode(record);
        const checked = resolveCheckState(record).hetMonChecked;
        const isSaving = savingStudentCode === studentCode;

        return (
          <Spin spinning={isSaving} size="small">
            <Checkbox
              checked={checked}
              disabled={isSaving}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                handleToggleCheckbox(record, "loai_het_mon", e.target.checked)
              }
            />
          </Spin>
        );
      },
    },
    // {
    //   title: "Cabin",
    //   key: "updated_ts",
    //   width: 110,
    //   align: "center",
    //   render: (_, record) => {
    //     const checked = resolveCheckState(record).cabinChecked;
    //     return (
    //       <span
    //         className={checked ? "text-green-600 font-medium" : "text-gray-400"}
    //       >
    //         {checked ? "Đạt" : "Chưa đạt"}
    //       </span>
    //     );
    //   },
    // },
    // {
    //   title: "DAT",
    //   key: "dat",
    //   width: 90,
    //   align: "center",
    //   render: (_, record) => {
    //     const checked = resolveCheckState(record).datChecked;
    //     return (
    //       <span
    //         className={checked ? "text-green-600 font-medium" : "text-gray-400"}
    //       >
    //         {checked ? "Đã ký" : "Chưa kí"}
    //       </span>
    //     );
    //   },
    // },
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
      title: "Thời gian đổi trạng thái",
      key: "status_updated_at",
      width: 180,
      align: "center",
      render: (_, record) =>
        formatDateTime(resolveCheckState(record).statusUpdatedAt),
    },
    // {
    //   title: "Tiến trình học tập",
    //   key: "chi_tiet_tien_trinh",
    //   width: 140,
    //   align: "center",
    //   render: (_, record) => (
    //     <Button
    //       type="primary"
    //       size="small"
    //       className="!bg-[#3366cc]"
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         handleOpenStudentDetail(record);
    //       }}
    //     >
    //       <EyeOutlined />
    //       Xem
    //     </Button>
    //   ),
    // },
    // {
    //   title: "Tốt nghiệp",
    //   key: "detail",
    //   width: 110,
    //   align: "center",
    //   render: (_, record) => {
    //     const checked = resolveCheckState(record).totNghiepChecked;
    //     return (
    //       <span
    //         className={checked ? "text-green-600 font-medium" : "text-gray-400"}
    //       >
    //         {checked ? "Đạt" : "-"}
    //       </span>
    //     );
    //   },
    // },
    {
      title: "Ghi chú",
      key: "ghi_chu",
      width: 280,
      align: "center",
      render: (_, record) => {
        const state = resolveCheckState(record);
        const maDk = getStudentCode(record);
        return (
          <Input
            key={`${maDk}-${state.ghiChu}`}
            defaultValue={state.ghiChu}
            disabled={savingStudentCode === maDk}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => handleBlurGhiChu(record, e.target.value)}
          />
        );
      },
    },
  ];

  return (
    <Spin spinning={isLoadingHocVien || isLoadingKhoaHoc}>
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Quản lý học viên lý thuyết
      </h1>

      <Card className="!mt-5 !mb-4">
        <Row gutter={[12, 12]} align="bottom">
          <Col span={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Khóa Học
            </label>
            <Select
              className="w-full"
              placeholder="--Chọn lớp--"
              value={activeClassIid || undefined}
              onChange={(value) => {
                setSelectedClassIid(value || "");
                setParams((prev) => ({ ...prev, page: 1 }));
              }}
              options={classOptions}
              loading={isLoadingKhoaHoc}
              showSearch
              optionFilterProp="label"
              notFoundContent={
                isLoadingKhoaHoc ? "Đang tải khóa học..." : "Không có khóa học"
              }
            />
          </Col>

          <Col span={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Từ khóa
            </label>
            <Input
              aria-label="Tên học viên"
              ref={keywordInputRef}
              placeholder="Tên học viên "
              onPressEnter={handleFilter}
            />
          </Col>
          <Col span={7}>
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
              <Button onClick={handleReset}>Bỏ Lọc</Button>
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
        rowKey={(record) => record?.user?.iid || record?.ma_dk || record?.id}
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
        program_name={selectedClass?.name || selectedClass?.suffix_name || ""}
        maKhoaHoc={selectedClass?.code || selectedClass?.name || ""}
      />
    </Spin>
  );
};

export default QuanLyHocVienLyThuyet;
