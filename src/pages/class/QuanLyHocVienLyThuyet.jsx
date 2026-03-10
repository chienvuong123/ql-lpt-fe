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
} from "antd";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hocVienTheoKhoa } from "../../apis/hocVien";
import { lopHocLyThuyet } from "../../apis/khoaHoc";
import { DangNhapLopLyThuyet } from "../../apis/auth";
import {
  capNhatTrangThaiHocVienLyThuyet,
  getDanhSachHocVienLyThuyet,
} from "../../apis/apiHocVienLopLyThuyet";

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

const QuanLyHocVienLyThuyet = () => {
  const [selectedClassIid, setSelectedClassIid] = useState("");
  const [savingStudentCode, setSavingStudentCode] = useState("");
  const keywordInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [params, setParams] = useState({
    page: 1,
    text: "",
  });

  const location = useLocation();
  const { program_code } = location?.state || {};

  const { data: loginData } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity,
    select: (data) => data?.result,
  });

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["lopHocLyThuyet", params],
    queryFn: () => lopHocLyThuyet(loginData, params),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const classOptions = useMemo(() => {
    const list = dataKhoaHoc?.result || [];
    return list.map((item) => ({
      label: item?.suffix_name || item?.name || `#${item?.iid}`,
      value: item?.iid,
    }));
  }, [dataKhoaHoc]);

  const activeClassIid = selectedClassIid || classOptions?.[0]?.value || "";

  const selectedClass = useMemo(() => {
    const list = dataKhoaHoc?.result || [];
    return list.find((item) => String(item?.iid) === String(activeClassIid));
  }, [dataKhoaHoc, activeClassIid]);

  const { data: danhSachHocVien = {}, isLoading: isLoadingHocVien } = useQuery({
    queryKey: ["danhSachHocVien", activeClassIid, params],
    queryFn: () => hocVienTheoKhoa(activeClassIid, params),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!activeClassIid,
  });

  const students = useMemo(() => {
    const list = danhSachHocVien?.result;
    return Array.isArray(list) ? list : [];
  }, [danhSachHocVien]);

  const getStudentCode = (record) =>
    String(
      record?.user?.admission_code || record?.user?.code || record?.id || "",
    );

  const isPassAllLyThuyet = (record) => {
    const scoreByRubrik = record?.learning_progress?.score_by_rubrik || [];
    if (!Array.isArray(scoreByRubrik) || scoreByRubrik.length === 0)
      return false;
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

  const maKhoaFilter =
    selectedClass?.suffix_name || selectedClass?.name || program_code || "";
  const statusQueryKey = [
    "trang-thai-hoc-vien-ly-thuyet-hoc-vien",
    maKhoaFilter,
  ];

  const { data: trangThaiHocVienData } = useQuery({
    queryKey: statusQueryKey,
    queryFn: () => getDanhSachHocVienLyThuyet({ maKhoa: maKhoaFilter }),
    enabled: !!maKhoaFilter,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const studentCheckMap = useMemo(() => {
    const result = {};
    const list = Array.isArray(trangThaiHocVienData?.data)
      ? trangThaiHocVienData.data
      : [];

    list.forEach((item) => {
      if (!item?.ma_dk) return;
      result[String(item.ma_dk)] = item;
    });

    return result;
  }, [trangThaiHocVienData]);

  const resolveCheckState = (record) => {
    const maDk = getStudentCode(record);
    const savedData = studentCheckMap?.[maDk] || {};
    const autoLyThuyetPassed = isPassAllLyThuyet(record);

    const lyThuyetChecked =
      savedData?.loai_ly_thuyet === undefined
        ? !autoLyThuyetPassed
        : Boolean(savedData?.loai_ly_thuyet);

    // Loại hết môn mặc định được tích sẵn; nếu loại lý thuyết tích thì luôn ép tích theo.
    const hetMonChecked = lyThuyetChecked
      ? true
      : savedData?.loai_het_mon === undefined
        ? true
        : Boolean(savedData?.loai_het_mon);

    const cabinChecked = Boolean(savedData?.cabin);
    const datChecked = Boolean(savedData?.dat);
    const ghiChu = parseGhiChu(savedData?.ghi_chu);
    const statusUpdatedAt =
      savedData?.status_updated_at ||
      savedData?.updated_at ||
      savedData?.updatedAt ||
      savedData?.updated_ts ||
      null;

    // Đủ điều kiện khi cả 2 đều không bị loại
    const isDuDieuKien = !lyThuyetChecked && !hetMonChecked;

    return {
      maDk,
      lyThuyetChecked,
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
      queryClient.setQueryData(statusQueryKey, (old) => {
        const currentList = Array.isArray(old?.data) ? old.data : [];
        const nextList = [...currentList];
        const targetIndex = nextList.findIndex(
          (item) => String(item?.ma_dk) === String(variables?.maDk),
        );

        if (targetIndex >= 0) {
          nextList[targetIndex] = {
            ...nextList[targetIndex],
            ...variables?.payload,
            ma_dk: variables?.maDk,
          };
        } else {
          nextList.push({
            ma_dk: variables?.maDk,
            ...variables?.payload,
          });
        }

        return {
          ...(old || {}),
          data: nextList,
        };
      });
      // queryClient.invalidateQueries({ queryKey: statusQueryKey });
    },
    onError: (error) => {
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
    const loaiLyThuyet =
      overrides.loai_ly_thuyet ?? currentState.lyThuyetChecked;
    const loaiHetMon = overrides.loai_het_mon ?? currentState.hetMonChecked;

    return {
      loai_ly_thuyet: loaiLyThuyet,
      loai_het_mon: loaiHetMon,
      ghi_chu: overrides.ghi_chu ?? currentState.ghiChu,
      ma_khoa:
        selectedClass?.suffix_name || selectedClass?.name || program_code || "",
      ten_khoa: selectedClass?.name || program_code || "",
      status_updated_at:
        overrides.status_updated_at || new Date().toISOString(),
      ho_ten: record?.user?.name,
      can_cuoc: record?.user?.code,
      // ma_dk: record?.user?.admission_code,
      nam_sinh: record?.user?.birth_year,
      dat_cabin: loaiLyThuyet === false && loaiHetMon === false,
    };
  };

  const handleToggleCheckbox = (record, fieldName, checkedValue) => {
    const maDk = getStudentCode(record);
    if (!maDk) {
      message.warning("Không tìm thấy mã học viên để lưu dữ liệu.");
      return;
    }

    const overrides = { [fieldName]: checkedValue };

    // Tích loại lý thuyết → tự động tích loại hết môn
    if (fieldName === "loai_ly_thuyet" && checkedValue === true) {
      overrides.loai_het_mon = true;
    }

    // Bỏ tích loại hết môn → tự động bỏ loại lý thuyết
    if (fieldName === "loai_het_mon" && checkedValue === false) {
      overrides.loai_ly_thuyet = false;
    }

    const payload = buildPayload(record, overrides);
    setSavingStudentCode(maDk);
    saveStudentCheck({ maDk, payload });
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
      text,
    });
  };

  const handleReset = () => {
    if (keywordInputRef.current?.input) {
      keywordInputRef.current.input.value = "";
    }
    setParams({
      page: 1,
      text: "",
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
            className="!h-11 !w-10.5 rounded-lg"
            alt="av"
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-600 text-sm">
              {user?.name || "-"}
            </span>
            <span className="text-xs text-gray-500">
              {user?.admission_code || "-"}
            </span>
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
      render: () => selectedClass?.name || program_code || "-",
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
      title: "Loại lý thuyết",
      key: "passed_total",
      width: 120,
      align: "center",
      render: (_, record) => {
        const studentCode = getStudentCode(record);
        const checked = resolveCheckState(record).lyThuyetChecked;
        const isSaving = savingStudentCode === studentCode;

        return (
          <Spin spinning={isSaving} size="small">
            <Checkbox
              checked={checked}
              disabled={isSaving}
              onChange={(e) =>
                handleToggleCheckbox(record, "loai_ly_thuyet", e.target.checked)
              }
            />
          </Spin>
        );
      },
    },
    {
      title: "Loại hết môn",
      key: "last_login",
      width: 120,
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
              onChange={(e) =>
                handleToggleCheckbox(record, "loai_het_mon", e.target.checked)
              }
            />
          </Spin>
        );
      },
    },
    {
      title: "Cabin",
      key: "updated_ts",
      width: 130,
      align: "center",
      render: (_, record) => {
        const checked = resolveCheckState(record).cabinChecked;
        return (
          <span
            className={checked ? "text-green-600 font-medium" : "text-gray-400"}
          >
            {checked ? "Đạt" : "Chưa đạt"}
          </span>
        );
      },
    },
    {
      title: "DAT",
      key: "detail",
      width: 90,
      align: "center",
      render: (_, record) => {
        const checked = resolveCheckState(record).datChecked;
        return (
          <span
            className={checked ? "text-green-600 font-medium" : "text-gray-400"}
          >
            {checked ? "Đã ký" : "Chưa kí"}
          </span>
        );
      },
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
      key: "detail",
      width: 260,
      align: "center",
      render: (_, record) => {
        const state = resolveCheckState(record);
        const maDk = getStudentCode(record);
        return (
          <Input
            key={`${maDk}-${state.ghiChu}`}
            defaultValue={state.ghiChu}
            disabled={savingStudentCode === maDk}
            onBlur={(e) => handleBlurGhiChu(record, e.target.value)}
          />
        );
      },
    },
  ];

  return (
    <Spin spinning={isLoadingHocVien || isLoadingKhoaHoc}>
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Quản lý học viên lý thuyết - Khóa: {selectedClass?.name}
        <span className="text-gray-500 italic">
          {" "}
          (#{danhSachHocVien?.total || 0} Thành viên)
        </span>
      </h1>

      <Card className="!mt-5 !mb-4">
        <Row gutter={[12, 12]} align="bottom">
          <Col span={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Khóa Học
            </label>
            <Select
              className="w-full"
              placeholder="--Chon lop--"
              value={activeClassIid || undefined}
              onChange={(value) => {
                setSelectedClassIid(value || "");
                setParams((prev) => ({ ...prev, page: 1 }));
              }}
              options={classOptions}
              loading={isLoadingKhoaHoc}
              showSearch
              optionFilterProp="label"
            />
          </Col>

          <Col span={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Từ khóa
            </label>
            <Input
              aria-label="Tên học viên"
              ref={keywordInputRef}
              placeholder="Ten hoc vien"
              onPressEnter={handleFilter}
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
        pagination={false}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1200 }}
        className="overflow-hidden table-blue-header"
      />
    </Spin>
  );
};

export default QuanLyHocVienLyThuyet;
