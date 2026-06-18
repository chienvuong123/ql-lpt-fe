import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ClockCircleOutlined, CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import {
  Card,
  Drawer,
  Empty,
  Image,
  Spin,
  Typography,
  message,
  Button,
  Modal,
  Input,
} from "antd";
import {
  getLichSuDuyetPhienHoc,
  updateDuyetPhienHoc,
  getHocVienDuyet,
  updateHocVienDuyet,
} from "../../apis/apiDuyetPhienHoc";
import {
  HANG_DAO_TAO_CONFIG,
  getInvalidSessionIndexes,
} from "../checks/DieuKienKiemTra";
import { LoTringOnline } from "../../apis/xeOnline";
import ConfigModal from "./ConfigModal";

const { Text } = Typography;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizePlate = (plate) =>
  String(plate || "")
    .replace(/[-.\s]/g, "")
    .toUpperCase()
    .trim();

const formatSessionDate = (value) => {
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD") : "";
};

const formatSessionTime = (value) => {
  const date = dayjs(value);
  return date.isValid() ? date.format("HH:mm:ss") : "";
};

const getSessionKeys = (item) => {
  const keys = new Set();
  const sessionId = item?.phien_hoc_id ?? item?.ID ?? item?.id;
  const plate = normalizePlate(item?.bien_so ?? item?.BienSo);
  const date = formatSessionDate(
    item?.ngay ?? item?.Ngay ?? item?.ThoiDiemDangNhap,
  );
  const startTime = formatSessionTime(item?.gio_vao ?? item?.ThoiDiemDangNhap);
  const endTime = formatSessionTime(item?.gio_ra ?? item?.ThoiDiemDangXuat);

  if (sessionId) keys.add(`id:${String(sessionId)}`);
  if (date && plate && startTime && endTime) {
    keys.add(`slot:${date}|${plate}|${startTime}|${endTime}`);
  }
  if (date && startTime && endTime) {
    keys.add(`time:${date}|${startTime}|${endTime}`);
  }

  return Array.from(keys);
};

const formatDurationFromSeconds = (seconds) => {
  const totalMinutes = Math.round(toNumber(seconds) / 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour}h ${String(minute).padStart(2, "0")}`;
};

const formatDurationFromHours = (hours) => {
  const totalMinutes = Math.round(toNumber(hours) * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour}h ${String(minute).padStart(2, "0")}`;
};

const normalizeStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toUpperCase();
  if (status === "DUYET") return "DUYET";
  if (status === "HUY") return "HUY";
  return null;
};

const toStatusMap = (response) => {
  const root = response?.data ?? response?.Data ?? response ?? [];
  const list = Array.isArray(root)
    ? root
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.Data)
        ? root.Data
        : Array.isArray(root?.phien_hoc_list)
          ? root.phien_hoc_list
          : [];

  return list.reduce((map, item) => {
    if (item?.phien_hoc_dat_id !== undefined) {
      const status = item.trang_thai === 1 ? "DUYET" : "HUY";
      map[`id:${String(item.phien_hoc_dat_id)}`] = status;
      return map;
    }

    const status = normalizeStatus(
      item?.trang_thai ?? item?.TrangThai ?? item?.status,
    );
    if (!status) return map;
    getSessionKeys(item).forEach((key) => {
      map[key] = status;
    });
    return map;
  }, {});
};

const parseHocVienDuyetResponse = (response) => {
  const data = response?.data || response?.Data || response || {};

  const approveState = {
    duyet_tong: data.tong?.trang_thai === 1,
    duyet_tu_dong: data.tu_dong?.trang_thai === 1,
    duyet_dem: data.dem?.trang_thai === 1,
    duyet_so_san: data.so_san?.trang_thai === 1,
  };

  const approveReasons = {
    duyet_tong: data.tong?.ly_do || "",
    duyet_tu_dong: data.tu_dong?.ly_do || "",
    duyet_dem: data.dem?.ly_do || "",
    duyet_so_san: data.so_san?.ly_do || "",
  };

  const approveMeta = {
    duyet_tong: {
      updatedAt: data.tong?.thoi_gian_duyet || "",
      updatedBy: data.tong?.nguoi_duyet || "",
    },
    duyet_tu_dong: {
      updatedAt: data.tu_dong?.thoi_gian_duyet || "",
      updatedBy: data.tu_dong?.nguoi_duyet || "",
    },
    duyet_dem: {
      updatedAt: data.dem?.thoi_gian_duyet || "",
      updatedBy: data.dem?.nguoi_duyet || "",
    },
    duyet_so_san: {
      updatedAt: data.so_san?.thoi_gian_duyet || "",
      updatedBy: data.so_san?.nguoi_duyet || "",
    },
  };

  return { approveState, approveReasons, approveMeta };
};

const getMappedStatus = (item, statusMap = {}) => {
  const sessionKeys = getSessionKeys(item);
  for (const key of sessionKeys) {
    const entry = statusMap[key];
    if (entry) {
      const status = typeof entry === "string" ? entry : entry.status;
      if (status === "DUYET" || status === "HUY") {
        return status;
      }
    }
  }
  return null;
};

const getMappedEntry = (item, statusMap = {}) => {
  const sessionKeys = getSessionKeys(item);
  for (const key of sessionKeys) {
    const entry = statusMap[key];
    if (entry) return entry;
  }
  return null;
};



const INITIAL_APPROVE_STATE = {
  duyet_tong: false,
  duyet_tu_dong: false,
  duyet_dem: false,
  duyet_so_san: false,
};

const INITIAL_APPROVE_REASONS = {
  duyet_tong: "",
  duyet_tu_dong: "",
  duyet_dem: "",
  duyet_so_san: "",
};

const INITIAL_APPROVE_META = {
  duyet_tong: { updatedAt: "", updatedBy: "" },
  duyet_tu_dong: { updatedAt: "", updatedBy: "" },
  duyet_dem: { updatedAt: "", updatedBy: "" },
  duyet_so_san: { updatedAt: "", updatedBy: "" },
};

const getAutoPlateFromRows = (rows = []) => {
  const count = rows.reduce((acc, item) => {
    const plate = normalizePlate(item?.BienSo);
    if (!plate) return acc;
    acc[plate] = (acc[plate] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(count);
  if (entries.length <= 1) return null;
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min))[0];
};

// ─── Helper kiểm tra phiên đêm ───────────────────────────────────────────────
const isNightSession = (item) => {
  const demGiay = toNumber(item?.ThoiGianBanDem);
  const demKm = toNumber(item?.QuangDuongBanDem);
  if (demGiay > 0 || demKm > 0) return true;
  if (item?.ThoiDiemDangNhap) {
    const hour = new Date(item.ThoiDiemDangNhap).getHours();
    return hour >= 18 || hour < 5;
  }
  return false;
};

const TruyVetModal = ({
  open,
  onCancel,
  onClose,
  loading,
  student,
  courseLabel,
  studentCheckInfo = null,
  rows = [],
}) => {
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [approveState, setApproveState] = useState(INITIAL_APPROVE_STATE);
  const [approveReasons, setApproveReasons] = useState(INITIAL_APPROVE_REASONS);
  const [approveMeta, setApproveMeta] = useState(INITIAL_APPROVE_META);
  const [approveLoadingKey, setApproveLoadingKey] = useState("");
  const [openConfigModal, setOpenConfigModal] = useState(false);
  const [actionType, setActionType] = useState("approve");
  const [configMode, setConfigMode] = useState("edit");
  const [payloadConfig, setPayloadConfig] = useState({});
  const [bulkActioning, setBulkActioning] = useState(false);
  const [loTrinhData, setLoTrinhData] = useState([]);
  const [loadingLoTrinh, setLoadingLoTrinh] = useState(false);

  const maDk = String(student?.user?.admission_code || "").trim();

  const fetchLoTrinh = useCallback(async () => {
    if (!maDk) return;
    setLoadingLoTrinh(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await LoTringOnline({
        ngaybatdau: "2022-01-01T00:00:00",
        ngayketthuc: `${today}T23:59:00`,
        madk: maDk,
      });
      const list = response?.data || response || [];
      setLoTrinhData(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log("[TruyVetModal] fetch lo trinh error:", error);
    } finally {
      setLoadingLoTrinh(false);
    }
  }, [maDk]);

  const fetchSessionStatuses = useCallback(async () => {
    if (!maDk) return;
    setLoadingStatus(true);
    try {
      const response = await getLichSuDuyetPhienHoc(maDk);
      setStatusMap(toStatusMap(response));
    } catch (error) {
      console.log("[TruyVetModal] fetch session status error:", error);
    } finally {
      setLoadingStatus(false);
    }
  }, [maDk]);

  const fetchApproveStatuses = useCallback(async () => {
    if (!maDk) return;
    try {
      const response = await getHocVienDuyet(maDk);
      const parsed = parseHocVienDuyetResponse(response);
      setApproveState(parsed.approveState);
      setApproveReasons(parsed.approveReasons);
      setApproveMeta(parsed.approveMeta);
    } catch (error) {
      console.log("[TruyVetModal] fetch approve status error:", error);
    }
  }, [maDk]);

  useEffect(() => {
    if (!open) return;
    setStatusMap({});
    setApproveState(INITIAL_APPROVE_STATE);
    setApproveReasons(INITIAL_APPROVE_REASONS);
    setApproveMeta(INITIAL_APPROVE_META);
    setApproveLoadingKey("");
    setLoTrinhData([]);
    const run = async () => {
      await fetchApproveStatuses();
      await fetchSessionStatuses();
      await fetchLoTrinh();
    };
    run();
  }, [open, fetchSessionStatuses, fetchApproveStatuses, fetchLoTrinh]);

  const rowsWithStatus = useMemo(() => {
    // Lọc trùng theo ID, giữ lại 1 phiên
    const unique = Object.values(
      rows.reduce((acc, item) => {
        acc[item.ID] = item;
        return acc;
      }, {})
    );

    const sorted = unique.sort(
      (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap),
    );

    const { invalidIndexes, invalidReasons } = getInvalidSessionIndexes(
      sorted,
      studentCheckInfo,
      loTrinhData,
    );

    return sorted.map((item, index) => {
      const reasons = invalidReasons.get(index) || [];
      // Tốc độ TB < 18 km/h
      const isSpeedInvalid = reasons.some((r) => r.includes("Tốc độ TB"));

      // Sai tên giáo viên (cả "Tên giáo viên" lẫn "Không có tên giáo viên")
      const isTeacherMismatch = reasons.some(
        (r) =>
          r.includes("Tên giáo viên") || r.includes("Không có tên giáo viên"),
      );

      // Sai biển số xe
      const isPlateMismatch = reasons.some(
        (r) => r.includes("Biển số xe") || r.includes("không thuộc xe đăng ký"),
      );

      // Nghỉ giữa phiên < 15 phút
      const isRestTooShort = reasons.some((r) => r.includes("Nghỉ giữa phiên"));

      // Xe tự động sai khung giờ
      const isTuDongInvalid = reasons.some((r) =>
        r.includes("Xe tự động bắt đầu"),
      );

      // Dừng nghỉ sai quy định (nghỉ quá 10 phút)
      const isStopViolation = reasons.some((r) =>
        r.includes("Dừng nghỉ sai quy định"),
      );

      // Phiên dưới 5 phút (không có trong getInvalidSessionIndexes, check riêng)
      const thoiGianPhut = toNumber(item?.TongThoiGian) / 60;
      const isTooShort = thoiGianPhut > 0 && thoiGianPhut < 5;

      const derivedInvalid = invalidIndexes.has(index) || isStopViolation;
      const persistedStatus = getMappedStatus(item, statusMap);
      const effectiveStatus =
        persistedStatus || (derivedInvalid ? "HUY" : "DUYET");

      return {
        ...item,
        _isSpeedInvalid: isSpeedInvalid,
        _isTeacherMismatch: isTeacherMismatch,
        _isPlateMismatch: isPlateMismatch,
        _isRestTooShort: isRestTooShort,
        _isTuDongInvalid: isTuDongInvalid,
        _isStopViolation: isStopViolation,
        _isTooShort: isTooShort,
        _status: effectiveStatus,
        _isInvalid: effectiveStatus === "HUY",
      };
    });
  }, [rows, studentCheckInfo, statusMap, loTrinhData]);

  const totalDistance = useMemo(
    () =>
      rowsWithStatus.reduce(
        (sum, item) =>
          item?._isInvalid ? sum : sum + toNumber(item?.TongQuangDuong),
        0,
      ),
    [rowsWithStatus],
  );

  const totalSeconds = useMemo(
    () =>
      rowsWithStatus.reduce(
        (sum, item) =>
          item?._isInvalid ? sum : sum + toNumber(item?.TongThoiGian),
        0,
      ),
    [rowsWithStatus],
  );

  const bienSoTuDong = useMemo(
    () =>
      getAutoPlateFromRows(rowsWithStatus.filter((item) => !item._isInvalid)),
    [rowsWithStatus],
  );

  // ─── Tính toán thực tế tổng / đêm / tự động từ phiên hợp lệ ─────────────
  const actualTotals = useMemo(() => {
    const validRows = rowsWithStatus.filter((item) => !item?._isInvalid);

    const tongGio = validRows.reduce(
      (sum, item) => sum + toNumber(item?.TongThoiGian) / 3600,
      0,
    );
    const tongKm = validRows.reduce(
      (sum, item) => sum + toNumber(item?.TongQuangDuong),
      0,
    );

    const dem = validRows.reduce(
      (acc, item) => {
        const demGiay = toNumber(item?.ThoiGianBanDem);
        const demKm = toNumber(item?.QuangDuongBanDem);
        if (demGiay > 0 || demKm > 0) {
          acc.gio += demGiay / 3600;
          acc.km += demKm;
          return acc;
        }
        if (item?.ThoiDiemDangNhap) {
          const hour = new Date(item.ThoiDiemDangNhap).getHours();
          if (hour >= 18 || hour < 5) {
            acc.gio += toNumber(item?.TongThoiGian) / 3600;
            acc.km += toNumber(item?.TongQuangDuong);
          }
        }
        return acc;
      },
      { gio: 0, km: 0 },
    );

    const tuDong = validRows.reduce(
      (acc, item) => {
        if (!bienSoTuDong) return acc;
        if (normalizePlate(item?.BienSo) !== bienSoTuDong) return acc;
        acc.gio += toNumber(item?.TongThoiGian) / 3600;
        acc.km += toNumber(item?.TongQuangDuong);
        return acc;
      },
      { gio: 0, km: 0 },
    );

    return { tongGio, tongKm, dem, tuDong };
  }, [rowsWithStatus, bienSoTuDong]);

  // ─── Lấy yêu cầu hạng đào tạo ────────────────────────────────────────────
  const hangDaoTao = useMemo(() => {
    return (
      rows?.[0]?.HangDaoTao ||
      studentCheckInfo?.hangDaoTao ||
      studentCheckInfo?.HangDaoTao ||
      "B1"
    );
  }, [rows, studentCheckInfo]);

  // ─── Lấy yêu cầu hạng đào tạo ────────────────────────────────────────────
  const yeuCauHang = useMemo(() => {
    return HANG_DAO_TAO_CONFIG[hangDaoTao] || HANG_DAO_TAO_CONFIG.B1;
  }, [hangDaoTao]);

  // ─── Kiểm tra từng điều kiện đã đủ chưa ──────────────────────────────────
  const summaryMissingCases = useMemo(() => {
    const { tongGio, tongKm, dem, tuDong } = actualTotals;

    const normalizedH = String(hangDaoTao || "").trim().toUpperCase();
    const isB2 = normalizedH === "B2" || normalizedH === "B";
    const isC1 = normalizedH === "C1" || normalizedH === "C";
    const isSoSanClass = isB2 || isC1;

    const limitManualTime = isC1 ? 23.0 : 18.0;
    const limitManualKm = isC1 ? 795.0 : 730.0;

    const soSanGio = tongGio - tuDong.gio;
    const soSanKm = tongKm - tuDong.km;

    const buildCase = (
      key,
      label,
      currentHours,
      currentKm,
      requiredHours,
      requiredKm,
      approved,
      reason,
    ) => {
      const currentMins = Math.round(toNumber(currentHours) * 60);
      const requiredMins = Math.round(toNumber(requiredHours) * 60);
      const thieuMins = Math.max(requiredMins - currentMins, 0);
      const thieuGio = thieuMins / 60;
      const thieuKm = Math.max(requiredKm - currentKm, 0);
      if (thieuMins <= 0 && thieuKm <= 0) return null;

      return {
        key,
        label,
        approved,
        reason,
        detail: `Thiếu ${formatDurationFromHours(thieuGio)} / ${thieuKm.toFixed(2)} km`,
      };
    };

    return [
      buildCase(
        "duyet_tong",
        "Thiếu tổng quãng đường/thời gian",
        tongGio,
        tongKm,
        toNumber(yeuCauHang?.thoiGian?.tong),
        toNumber(yeuCauHang?.quangDuong?.tong),
        approveState.duyet_tong,
        approveReasons.duyet_tong,
      ),
      buildCase(
        "duyet_dem",
        "Thiếu quãng đường/thời gian đêm",
        dem.gio,
        dem.km,
        toNumber(yeuCauHang?.thoiGian?.banDem),
        toNumber(yeuCauHang?.quangDuong?.banDem),
        approveState.duyet_dem,
        approveReasons.duyet_dem,
      ),
      buildCase(
        "duyet_tu_dong",
        "Thiếu quãng đường/thời gian số tự động",
        tuDong.gio,
        tuDong.km,
        toNumber(yeuCauHang?.thoiGian?.tuDong),
        toNumber(yeuCauHang?.quangDuong?.tuDong),
        approveState.duyet_tu_dong,
        approveReasons.duyet_tu_dong,
      ),
      isSoSanClass &&
      buildCase(
        "duyet_so_san",
        "Thiếu quãng đường/thời gian số sàn",
        soSanGio,
        soSanKm,
        limitManualTime,
        limitManualKm,
        approveState.duyet_so_san,
        approveReasons.duyet_so_san,
      ),
    ].filter(Boolean);
  }, [actualTotals, yeuCauHang, approveReasons, approveState, hangDaoTao]);

  // ─── Bulk action toàn bộ phiên hợp lệ (dùng cho duyệt tổng) ─────────────
  const handleBulkSessionAction = async (nextApproved) => {
    if (!maDk) return 0;

    const targetRows = rowsWithStatus.filter((item) =>
      nextApproved ? item._status === "HUY" : item._status === "DUYET",
    );

    if (targetRows.length === 0) return 0;

    setBulkActioning(true);
    try {
      for (const item of targetRows) {
        const sessionId = item?.phien_hoc_id ?? item?.ID ?? item?.id;
        if (!sessionId) continue;

        const payload = {
          trang_thai: nextApproved ? 1 : 0,
          ly_do: nextApproved ? "Duyệt phiên học hàng loạt" : "Hủy duyệt phiên học hàng loạt",
          nguoi_duyet:
            sessionStorage.getItem("name") ||
            sessionStorage.getItem("username") ||
            "Admin",
          ma_dk: maDk,
        };
        await updateDuyetPhienHoc(sessionId, payload);
      }

      await fetchSessionStatuses();

      message.success(
        nextApproved
          ? `Đã duyệt ${targetRows.length} phiên học.`
          : `Đã hủy ${targetRows.length} phiên học.`,
      );

      return targetRows.length;
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
        "Cập nhập trạng thái hàng loạt thất bại.",
      );
      return 0;
    } finally {
      setBulkActioning(false);
    }
  };

  const handleBulkSessionActionByType = async (type, nextApproved) => {
    if (!maDk) return 0;

    const targetRows = rowsWithStatus.filter((item) => {
      if (type === "dem") {
        if (!isNightSession(item)) return false;
      } else if (type === "tuDong") {
        if (!bienSoTuDong) return false;
        if (normalizePlate(item?.BienSo) !== bienSoTuDong) return false;
      } else {
        return false;
      }

      return nextApproved ? item._status === "HUY" : item._status === "DUYET";
    });

    if (targetRows.length === 0) return 0;

    setBulkActioning(true);
    try {
      for (const item of targetRows) {
        const sessionId = item?.phien_hoc_id ?? item?.ID ?? item?.id;
        if (!sessionId) continue;

        const payload = {
          trang_thai: nextApproved ? 1 : 0,
          ly_do: nextApproved
            ? `Duyệt phiên ${type === "dem" ? "ban đêm" : "số tự động"} hàng loạt`
            : `Hủy duyệt phiên ${type === "dem" ? "ban đêm" : "số tự động"} hàng loạt`,
          nguoi_duyet:
            sessionStorage.getItem("name") ||
            sessionStorage.getItem("username") ||
            "Admin",
          ma_dk: maDk,
        };
        await updateDuyetPhienHoc(sessionId, payload);
      }
      await fetchSessionStatuses();
      message.success(
        `Đã ${nextApproved ? "duyệt" : "hủy"} ${targetRows.length} phiên ${type === "dem" ? "ban đêm" : "số tự động"
        }.`,
      );
      return targetRows.length;
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Cập nhập hàng loạt thất bại.",
      );
      return 0;
    } finally {
      setBulkActioning(false);
    }
  };

  const handleApproveMissingCase = async (caseKey, nextApproved) => {
    if (!maDk || !caseKey) return;

    setConfigMode("edit");
    setActionType(nextApproved ? "approve" : "reject");
    setApproveLoadingKey(caseKey);

    const payload = {
      ma_dk: maDk,
      [caseKey]: nextApproved,
    };

    setPayloadConfig(payload);
    setOpenConfigModal(true);
  };

  const handleViewApproveReason = (caseKey) => {
    if (!caseKey) return;
    setConfigMode("view");
    setActionType("approve");
    setPayloadConfig({
      [caseKey]: approveReasons[caseKey] || "",
    });
    setOpenConfigModal(true);
  };

  // ─── Duyệt/hủy từng phiên đơn lẻ ────────────────────────────────────────
  const handleSessionAction = async (item) => {
    if (!item || !maDk) return;

    const sessionId = item?.phien_hoc_id ?? item?.ID ?? item?.id;
    if (!sessionId) {
      message.error("Không tìm thấy ID phiên học.");
      return;
    }

    const actionStatus = item?._status === "DUYET" ? "HUY" : "DUYET";
    const nextApproved = actionStatus === "DUYET";
    const existingEntry = getMappedEntry(item, statusMap);

    Modal.confirm({
      title: nextApproved ? "Xác nhận duyệt phiên học" : "Xác nhận hủy duyệt phiên học",
      content: (
        <div>
          <div className="!mb-3">
            Nhập ghi chú cho phiên học này (bắt buộc):
          </div>
          <Input.TextArea
            id="session-note-input"
            placeholder="Nhập ghi chú"
            rows={3}
            defaultValue={existingEntry?.ly_do || ""}
          />
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        const noteInput = document.getElementById("session-note-input");
        const noteValue = noteInput ? noteInput.value.trim() : "";

        if (!noteValue) {
          message.error("Vui lòng nhập ghi chú bắt buộc!");
          return Promise.reject("Ghi chú trống");
        }

        const payload = {
          trang_thai: nextApproved ? 1 : 0,
          ly_do: noteValue,
          nguoi_duyet:
            sessionStorage.getItem("name") ||
            sessionStorage.getItem("username") ||
            "Admin",
          ma_dk: maDk,
        };

        setActioningId(String(sessionId));
        try {
          await updateDuyetPhienHoc(sessionId, payload);

          setStatusMap((prev) => ({
            ...prev,
            [`id:${String(sessionId)}`]: {
              status: actionStatus,
              ly_do: payload.ly_do,
              nguoi_duyet: payload.nguoi_duyet,
              trang_thai: payload.trang_thai,
            },
          }));

          await fetchSessionStatuses();
          message.success(
            nextApproved ? "Đã duyệt phiên học." : "Đã hủy duyệt phiên học.",
          );
        } catch (error) {
          message.error(
            error?.response?.data?.message || "Cập nhật trạng thái thất bại.",
          );
        } finally {
          setActioningId(null);
        }
      }
    });
  };

  const isModalLoading =
    loading || loadingStatus || loadingLoTrinh || actioningId !== null || bulkActioning;

  // ─── Helper cập nhật state sau khi approve thành công ────────────────────
  const applyApproveSuccess = (key, nextApproved, value) => {
    setApproveState((prev) => ({ ...prev, [key]: nextApproved }));
    setApproveReasons((prev) => ({
      ...prev,
      [key]: nextApproved ? value : "",
    }));
    setApproveMeta((prev) => ({
      ...prev,
      [key]: {
        updatedAt: new Date().toISOString(),
        updatedBy:
          sessionStorage.getItem("name") ||
          sessionStorage.getItem("username") ||
          "unknown",
      },
    }));
  };

  const handleSubmitConfig = async (value) => {
    const selectedApproveKey = Object.keys(payloadConfig).find((key) => key !== "ma_dk") || "";
    if (!selectedApproveKey || !maDk) return;

    const nextApproved = Boolean(payloadConfig[selectedApproveKey]);
    const loaiDuyetMap = {
      duyet_tong: "tong",
      duyet_dem: "dem",
      duyet_tu_dong: "tu_dong",
      duyet_so_san: "so_san",
    };
    const loaiDuyet = loaiDuyetMap[selectedApproveKey];

    const payload = {
      ma_dk: maDk,
      loai_duyet: loaiDuyet,
      trang_thai: nextApproved ? 1 : 0,
      ly_do: value || null,
      nguoi_duyet:
        sessionStorage.getItem("name") ||
        sessionStorage.getItem("username") ||
        "Admin",
    };

    setOpenConfigModal(false);
    setPayloadConfig({});

    try {
      if (loaiDuyet === "so_san") {
        const res = await updateHocVienDuyet(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_so_san", nextApproved, value);
          message.success("Cập nhật trạng thái số sàn thành công.");
        }
      } else if (loaiDuyet === "tong") {
        await handleBulkSessionAction(nextApproved);
        const res = await updateHocVienDuyet(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_tong", nextApproved, value);
          message.success("Cập nhật trạng thái tổng thành công.");
        }
      } else if (loaiDuyet === "dem") {
        await handleBulkSessionActionByType("dem", nextApproved);
        const res = await updateHocVienDuyet(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_dem", nextApproved, value);
          message.success("Cập nhật trạng thái ban đêm thành công.");
        }
      } else if (loaiDuyet === "tu_dong") {
        await handleBulkSessionActionByType("tuDong", nextApproved);
        const res = await updateHocVienDuyet(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_tu_dong", nextApproved, value);
          message.success("Cập nhật trạng thái tự động thành công.");
        }
      }
    } catch (error) {
      console.log("[TruyVetModal] handleSubmitConfig error:", error);
      message.error(error?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setApproveLoadingKey("");
    }
  };

  const selectedApproveKey =
    Object.keys(payloadConfig).find((key) => key !== "ma_dk") || "";

  const handleClose = () => {
    onCancel?.();
    onClose?.();
  };

  // ─── Render badge lỗi trên từng phiên ────────────────────────────────────
  const renderSessionErrorBadges = (item) => {
    const badges = [];
    if (item._isSpeedInvalid)
      badges.push({ label: "Tốc độ thấp", color: "#fa8c16" });
    if (item._isTeacherMismatch)
      badges.push({ label: "Sai GV", color: "#cf1322" });
    if (item._isPlateMismatch)
      badges.push({ label: "Sai xe", color: "#cf1322" });
    if (item._isRestTooShort)
      badges.push({ label: "Nghỉ <15p", color: "#d46b08" });
    if (item._isTuDongInvalid)
      badges.push({ label: "TĐ sai giờ", color: "#722ed1" });
    if (item._isTooShort) badges.push({ label: "<5 phút", color: "#fa541c" });
    if (item._isStopViolation)
      badges.push({ label: "Nghỉ >10p", color: "#eb2f96" });
    if (badges.length === 0) return null;
    return (
      <div className="!flex !flex-wrap !gap-1 !mt-1">
        {badges.map((b) => (
          <span
            key={b.label}
            className="!text-[10px] !px-1.5 !py-0.5 !rounded-full !font-medium"
            style={{
              background: `${b.color}18`,
              color: b.color,
              border: `1px solid ${b.color}40`,
            }}
          >
            {b.label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Drawer
      title="Chi tiết truy vết DAT"
      open={open}
      onClose={handleClose}
      footer={null}
      width={680}
      destroyOnClose
    >
      <Spin spinning={isModalLoading}>
        <Card
          bodyStyle={{ padding: 12 }}
          className="!mb-3 !rounded-xl !border-0 !bg-[linear-gradient(120deg,#1e7ec8,#1aa0dd)]"
        >
          <div className="!flex !items-center !justify-between !gap-3">
            <div className="!text-white">
              <div className="!mb-1 !text-xs">
                Họ tên:{" "}
                <span className="!font-bold">
                  {student?.user?.name || "Khong ro ten"}
                </span>
              </div>
              <div className="!mb-1 !text-xs">
                Mã học viên: {student?.user?.admission_code || "--"}
              </div>
              <div className="!mb-1 !text-xs">Khóa: {courseLabel || "--"}</div>
              <div className="!text-xs">
                Năm sinh: {student?.user?.birth_year || "--"}
              </div>
            </div>
            <Image
              src={student?.user?.avatar || student?.user?.default_avatar || ""}
              width={88}
              height={110}
              preview={false}
              className="!rounded-md !border !border-white/70 !object-cover"
            />
          </div>
        </Card>

        {rowsWithStatus.length > 0 ? (
          <>
            <Card bodyStyle={{ padding: 8 }} className="!mb-3 !bg-[#dff4f7]">
              <div className="!grid !grid-cols-2 !text-center">
                <Text strong>Tổng Km: {totalDistance.toFixed(2)} km</Text>
                <Text strong>
                  Tổng giờ: {formatDurationFromSeconds(totalSeconds)}
                </Text>
              </div>
            </Card>

            {summaryMissingCases.length > 0 && (
              <div className="!space-y-2 mb-3 w-[98%]">
                {summaryMissingCases.map((item) => {
                  return (
                    <div
                      key={item.key}
                      className={`!flex !items-center !justify-between !gap-3 !rounded-lg !border ${item.approved
                        ? "!border-[#b7eb8f] !bg-[#f6ffed]"
                        : "!border-[#ffccc7] !bg-white"
                        }`}
                    >
                      <div className="!text-xs px-2">
                        <div
                          className={`!font-semibold ${item.approved
                            ? "!text-[#389e0d]"
                            : "!text-[#cf1322]"
                            }`}
                        >
                          {item.label} (
                          <span className="!text-[#8c8c8c]">{item.detail}</span>
                          )
                        </div>
                      </div>
                      <div className="!flex !items-center !gap-2">
                        {item.reason ? (
                          <Button
                            type="text"
                            size="small"
                            className="!text-[#1d39c4]"
                            icon={<ClockCircleOutlined />}
                            onClick={() => handleViewApproveReason(item.key)}
                          />
                        ) : null}
                        <button
                          type="button"
                          className="!w-[52px] !rounded-none !rounded-r-lg !self-stretch h-[30px] !text-white !text-xs !font-bold"
                          style={{
                            background: !item?.approved ? "#1e88d8" : "#cf1322",
                            borderRadius: "0 8px 8px 0",
                            opacity: actioningId || bulkActioning ? 0.5 : 1,
                            cursor:
                              actioningId || bulkActioning
                                ? "not-allowed"
                                : "pointer",
                          }}
                          loading={approveLoadingKey === item.key}
                          disabled={Boolean(actioningId) || bulkActioning}
                          onClick={() => {
                            handleApproveMissingCase(item.key, !item.approved);
                          }}
                        >
                          {item.approved ? "Hủy" : "Duyệt"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="!space-y-2 !overflow-y-auto !max-h-[55vh]">
              {rowsWithStatus.map((item, index) => {
                const start = item?.ThoiDiemDangNhap;
                const end = item?.ThoiDiemDangXuat;
                const sessionId = String(item?.ID || "");
                const isActioning = actioningId === sessionId;

                return (
                  <div key={item?.ID || index}>
                    <Card
                      bodyStyle={{ padding: 0 }}
                      className="!border-0 !shadow-sm !overflow-hidden"
                      style={{
                        borderLeft: `3px solid ${item?._isInvalid ? "#cf1322" : "#52c41a"}`,
                        borderRadius: "8px",
                        opacity: isActioning ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <div className="!flex !items-stretch">
                        <div
                          className="!w-8 !shrink-0 !flex !items-center !justify-center !text-xs !font-semibold"
                          style={{
                            color: item?._isInvalid ? "#cf1322" : "#52c41a",
                            background: item?._isInvalid
                              ? "#fff1f0"
                              : "#f6ffed",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div className="!flex-1 !px-3 !py-2 !text-xs">
                          <div className="!flex !items-center !justify-between !mb-1">
                            <span className="!font-semibold !text-gray-800 !text-sm flex items-center gap-3">
                              {start ? dayjs(start).format("DD-MM-YYYY") : "--"}
                              <span className="flex items-center">
                                {renderSessionErrorBadges(item)}
                              </span>
                            </span>
                            <span
                              className="!text-xs !font-semibold !px-2 !py-0.5 !rounded-full"
                              style={{
                                color: item?._isInvalid ? "#cf1322" : "#1e88d8",
                                background: item?._isInvalid
                                  ? "#fff1f0"
                                  : "#e6f4ff",
                                border: `1px solid ${item?._isInvalid ? "#ffccc7" : "#91caff"}`,
                              }}
                            >
                              {item?.BienSo || "--"}
                            </span>
                          </div>
                          <div className="!flex !items-center !justify-between !text-gray-500">
                            <span>
                              {start ? dayjs(start).format("HH:mm") : "--"} -{" "}
                              {end ? dayjs(end).format("HH:mm") : "--"}
                            </span>

                            <span className="!text-gray-400">
                              {formatDurationFromSeconds(item?.TongThoiGian)} ·{" "}
                              {toNumber(item?.TongQuangDuong).toFixed(2)} km
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSessionAction(item)}
                          disabled={Boolean(actioningId) || bulkActioning}
                          className="!shrink-0 !w-[52px] !text-xs !font-semibold !text-white !border-0 !cursor-pointer !transition-all"
                          style={{
                            background: item?._isInvalid
                              ? "#1e88d8"
                              : "#cf1322",
                            borderRadius: "0 8px 8px 0",
                            opacity: actioningId || bulkActioning ? 0.5 : 1,
                            cursor:
                              actioningId || bulkActioning
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isActioning
                            ? "..."
                            : item?._status === "HUY"
                              ? "Duyệt"
                              : "Hủy"}
                        </button>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <Empty description="Không có dữ liệu DAT" />
        )}

        <ConfigModal
          open={openConfigModal}
          actionType={actionType}
          mode={configMode}
          initialReason={
            configMode === "view"
              ? approveReasons[selectedApproveKey] || ""
              : ""
          }
          updatedAt={
            configMode === "view"
              ? approveMeta[selectedApproveKey]?.updatedAt
              : ""
          }
          updatedBy={
            configMode === "view"
              ? approveMeta[selectedApproveKey]?.updatedBy
              : ""
          }
          onCancel={() => {
            setOpenConfigModal(false);
            setApproveLoadingKey("");
            setConfigMode("edit");
          }}
          onSubmit={handleSubmitConfig}
        />
      </Spin>
    </Drawer>
  );
};

export default TruyVetModal;
