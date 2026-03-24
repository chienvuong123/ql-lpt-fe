import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ClockCircleOutlined } from "@ant-design/icons";
import {
  Card,
  Drawer,
  Empty,
  Image,
  Spin,
  Typography,
  message,
  Button,
} from "antd";
import {
  getPhienHocDAT,
  hocVienKyDAT,
  updateDuyetTheoMaDK,
  updatePhienHocDAT,
} from "../../apis/hocVien";
import {
  HANG_DAO_TAO_CONFIG,
  getInvalidSessionIndexes,
} from "../checks/DieuKienKiemTra";
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

const getMappedStatus = (item, statusMap = {}) => {
  const sessionKeys = getSessionKeys(item);
  for (const key of sessionKeys) {
    const status = statusMap[key];
    if (status === "DUYET" || status === "HUY") {
      return status;
    }
  }
  return null;
};

const normalizeApproveState = (payload = {}) => ({
  duyet_tong:
    payload?.duyet_tong === true ||
    payload?.duyet_tong === 1 ||
    String(payload?.duyet_tong || "").toLowerCase() === "true",
  duyet_tu_dong:
    payload?.duyet_tu_dong === true ||
    payload?.duyet_tu_dong === 1 ||
    String(payload?.duyet_tu_dong || "").toLowerCase() === "true",
  duyet_dem:
    payload?.duyet_dem === true ||
    payload?.duyet_dem === 1 ||
    String(payload?.duyet_dem || "").toLowerCase() === "true",
});

const hasApproveField = (payload = {}) =>
  payload?.duyet_tong !== undefined ||
  payload?.duyet_tu_dong !== undefined ||
  payload?.duyet_dem !== undefined;

const normalizeApproveReasons = (payload = {}) => ({
  duyet_tong: payload?.ly_do_tong || "",
  duyet_tu_dong: payload?.ly_do_td || "",
  duyet_dem: payload?.ly_do_dem || "",
});

const normalizeApproveMeta = (payload = {}) => ({
  duyet_tong: {
    updatedAt: payload?.thoi_gian_thay_doi || payload?.updated_at || "",
    updatedBy: payload?.nguoi_thay_doi || "",
  },
  duyet_tu_dong: {
    updatedAt: payload?.thoi_gian_thay_doi || payload?.updated_at || "",
    updatedBy: payload?.nguoi_thay_doi || "",
  },
  duyet_dem: {
    updatedAt: payload?.thoi_gian_thay_doi || payload?.updated_at || "",
    updatedBy: payload?.nguoi_thay_doi || "",
  },
});

const INITIAL_APPROVE_STATE = {
  duyet_tong: false,
  duyet_tu_dong: false,
  duyet_dem: false,
};

const INITIAL_APPROVE_REASONS = {
  duyet_tong: "",
  duyet_tu_dong: "",
  duyet_dem: "",
};

const INITIAL_APPROVE_META = {
  duyet_tong: { updatedAt: "", updatedBy: "" },
  duyet_tu_dong: { updatedAt: "", updatedBy: "" },
  duyet_dem: { updatedAt: "", updatedBy: "" },
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

/**
 * Kiểm tra phiên có lỗi "cứng" không thể duyệt tổng:
 * - Nghỉ giữa phiên chưa đủ 15p       → _isRestTooShort
 * - Sai giáo viên                      → _isTeacherMismatch
 * - Sai biển số (sai xe)               → _isPlateMismatch
 * - Xe tự động sai giờ                 → _isTuDongInvalid
 * - Tốc độ TB ≤ 18 km/h               → _isSpeedInvalid   ← BỎ QUA khi duyệt tổng
 * - Phiên dưới 5 phút                  → _isTooShort       ← BỎ QUA khi duyệt tổng
 *
 * Lưu ý: _isSpeedInvalid và _isTooShort KHÔNG thuộc hard error
 * → vẫn được duyệt tổng bình thường.
 */
const isHardError = (item) =>
  item?._isRestTooShort ||
  item?._isTeacherMismatch ||
  item?._isPlateMismatch ||
  item?._isTuDongInvalid;

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

  const maDk = String(student?.user?.admission_code || "").trim();

  const fetchSessionStatuses = useCallback(async () => {
    if (!maDk) return;
    setLoadingStatus(true);
    try {
      const response = await getPhienHocDAT(maDk);
      setStatusMap(toStatusMap(response));

      const root = response?.data ?? response?.Data ?? response ?? {};
      const list = Array.isArray(root?.phien_hoc_list)
        ? root.phien_hoc_list
        : Array.isArray(root)
          ? root
          : Array.isArray(root?.data)
            ? root.data
            : Array.isArray(root?.Data)
              ? root.Data
              : [];

      const firstItem = list.find((item) => hasApproveField(item));
      if (firstItem) {
        setApproveState(normalizeApproveState(firstItem));
        setApproveReasons(normalizeApproveReasons(firstItem));
        setApproveMeta(normalizeApproveMeta(firstItem));
      }
    } finally {
      setLoadingStatus(false);
    }
  }, [maDk]);

  const fetchApproveStatuses = useCallback(async () => {
    if (!maDk) return;
    try {
      const response = await hocVienKyDAT(maDk);
      const payload = response?.data || response?.Data || response || {};
      setApproveState(normalizeApproveState(payload));
      setApproveReasons(normalizeApproveReasons(payload));
      setApproveMeta(normalizeApproveMeta(payload));
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
    const run = async () => {
      await fetchApproveStatuses();
      await fetchSessionStatuses();
    };
    run();
  }, [open, fetchSessionStatuses, fetchApproveStatuses]);

  const rowsWithStatus = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap),
    );

    // Nguồn duy nhất để xác định phiên lỗi — tất cả flag đều lấy từ đây
    // để đảm bảo nhất quán với derivedInvalid / _status
    const { invalidIndexes, invalidReasons } = getInvalidSessionIndexes(
      sorted,
      studentCheckInfo,
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

      // Phiên dưới 5 phút (không có trong getInvalidSessionIndexes, check riêng)
      const thoiGianPhut = toNumber(item?.TongThoiGian) / 60;
      const isTooShort = thoiGianPhut > 0 && thoiGianPhut < 5;

      const derivedInvalid = invalidIndexes.has(index);
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
        _isTooShort: isTooShort,
        _status: effectiveStatus,
        _isInvalid: effectiveStatus === "HUY",
      };
    });
  }, [rows, studentCheckInfo, statusMap]);

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
  const yeuCauHang = useMemo(() => {
    const hangDaoTao =
      rows?.[0]?.HangDaoTao ||
      studentCheckInfo?.hangDaoTao ||
      studentCheckInfo?.HangDaoTao ||
      "B1";
    return HANG_DAO_TAO_CONFIG[hangDaoTao] || HANG_DAO_TAO_CONFIG.B1;
  }, [rows, studentCheckInfo]);

  // ─── Kiểm tra từng điều kiện đã đủ chưa ──────────────────────────────────
  const conditionMet = useMemo(() => {
    const { tongGio, tongKm, dem, tuDong } = actualTotals;
    return {
      // Đủ tổng = đủ cả thời gian lẫn quãng đường tổng
      tong:
        tongGio >= toNumber(yeuCauHang?.thoiGian?.tong) &&
        tongKm >= toNumber(yeuCauHang?.quangDuong?.tong),
      // Đủ đêm
      dem:
        dem.gio >= toNumber(yeuCauHang?.thoiGian?.banDem) &&
        dem.km >= toNumber(yeuCauHang?.quangDuong?.banDem),
      // Đủ tự động (chỉ cần kiểm tra nếu hạng có yêu cầu tự động)
      tuDong:
        toNumber(yeuCauHang?.thoiGian?.tuDong) === 0 &&
        toNumber(yeuCauHang?.quangDuong?.tuDong) === 0
          ? true // hạng không yêu cầu tự động → coi là đủ (không hiện nút)
          : tuDong.gio >= toNumber(yeuCauHang?.thoiGian?.tuDong) &&
            tuDong.km >= toNumber(yeuCauHang?.quangDuong?.tuDong),
    };
  }, [actualTotals, yeuCauHang]);

  const summaryMissingCases = useMemo(() => {
    const { tongGio, tongKm, dem, tuDong } = actualTotals;

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
      const thieuGio = Math.max(requiredHours - currentHours, 0);
      const thieuKm = Math.max(requiredKm - currentKm, 0);
      if (thieuGio <= 0 && thieuKm <= 0) return null;

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
    ].filter(Boolean);
  }, [actualTotals, yeuCauHang, approveReasons, approveState]);

  // ─── Build payload cho updatePhienHocDAT ─────────────────────────────────
  const buildSessionPayload = (item, actionStatus) => {
    const start = item?.ThoiDiemDangNhap ? dayjs(item.ThoiDiemDangNhap) : null;
    const end = item?.ThoiDiemDangXuat ? dayjs(item.ThoiDiemDangXuat) : null;
    return {
      ngay: start?.isValid() ? start.format("YYYY-MM-DD") : null,
      bien_so: item?.BienSo || null,
      gio_vao: start?.isValid() ? start.format("HH:mm:ss") : null,
      gio_ra: end?.isValid() ? end.format("HH:mm:ss") : null,
      thoi_gian: Number((toNumber(item?.TongThoiGian) / 3600).toFixed(2)),
      tong_km: Number(toNumber(item?.TongQuangDuong).toFixed(2)),
      ma_dk: maDk,
      trang_thai: actionStatus,
      nguoi_thay_doi: sessionStorage.getItem("name"),
      phien_hoc_id: item?.ID || null,
    };
  };

  // ─── Bulk action toàn bộ phiên hợp lệ (dùng cho duyệt tổng) ─────────────
  // Bỏ qua phiên có hard error: sai GV, sai xe, nghỉ <15p, xe tự động sai giờ
  // Tốc độ ≤18 km/h và phiên <5p KHÔNG phải hard error → vẫn được duyệt tổng
  const handleBulkSessionAction = async (nextApproved) => {
    if (!maDk) return 0;
    const actionStatus = nextApproved ? "DUYET" : "HUY";

    const targetRows = rowsWithStatus.filter((item) => {
      if (isHardError(item)) return false;
      return nextApproved ? item._status === "HUY" : item._status === "DUYET";
    });

    if (targetRows.length === 0) return 0;

    setBulkActioning(true);
    try {
      for (const item of targetRows) {
        const payload = buildSessionPayload(item, actionStatus);
        await updatePhienHocDAT(payload);
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
        error?.response?.data?.message || "Cập nhật hàng loạt thất bại.",
      );
      return 0;
    } finally {
      setBulkActioning(false);
    }
  };

  // ─── Bulk action theo loại phiên: "dem" | "tuDong" ───────────────────────
  const handleBulkSessionActionByType = async (type, nextApproved) => {
    if (!maDk) return 0;
    const actionStatus = nextApproved ? "DUYET" : "HUY";

    const targetRows = rowsWithStatus.filter((item) => {
      if (isHardError(item)) return false;

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
        const payload = buildSessionPayload(item, actionStatus);
        await updatePhienHocDAT(payload);
      }
      await fetchSessionStatuses();
      message.success(
        `Đã ${nextApproved ? "duyệt" : "hủy"} ${targetRows.length} phiên ${
          type === "dem" ? "ban đêm" : "số tự động"
        }.`,
      );
      return targetRows.length;
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Cập nhật hàng loạt thất bại.",
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

    const sessionId = String(item?.ID || "");
    const actionStatus = item?._status === "DUYET" ? "HUY" : "DUYET";
    const payload = buildSessionPayload(item, actionStatus);

    const sessionKeys = getSessionKeys({
      ...item,
      ngay: payload.ngay,
      bien_so: payload.bien_so,
      gio_vao: payload.gio_vao,
      gio_ra: payload.gio_ra,
      phien_hoc_id: payload.phien_hoc_id,
    });

    setActioningId(sessionId);
    try {
      await updatePhienHocDAT(payload);
      setStatusMap((prev) => {
        const next = { ...prev };
        sessionKeys.forEach((key) => {
          next[key] = actionStatus;
        });
        return next;
      });
      await fetchSessionStatuses();
      message.success(
        actionStatus === "DUYET" ? "Đã duyệt phiên học." : "Đã hủy phiên học.",
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Cập nhật trạng thái thất bại.",
      );
    } finally {
      setActioningId(null);
    }
  };

  const isModalLoading =
    loading || loadingStatus || actioningId !== null || bulkActioning;

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
    const reasonMap = {
      duyet_tong: "ly_do_tong",
      duyet_dem: "ly_do_dem",
      duyet_tu_dong: "ly_do_td",
    };

    const payload = {
      ...payloadConfig,
      value,
    };

    Object.keys(reasonMap).forEach((key) => {
      if (payloadConfig[key] !== undefined) {
        payload[reasonMap[key]] = value;
      }
    });

    const isDuyetTong = payloadConfig?.duyet_tong !== undefined;
    const isDuyetDem = payloadConfig?.duyet_dem !== undefined;
    const isDuyetTuDong = payloadConfig?.duyet_tu_dong !== undefined;

    try {
      // ── Duyệt tổng: bulk action toàn bộ phiên hợp lệ + update flag ──
      if (isDuyetTong) {
        const nextApproved = Boolean(payloadConfig.duyet_tong);

        setOpenConfigModal(false);
        setPayloadConfig({});

        const processedCount = await handleBulkSessionAction(nextApproved);

        if (processedCount === 0) {
          message.warning(
            nextApproved
              ? "Không có phiên hợp lệ nào để duyệt."
              : "Không có phiên hợp lệ nào để hủy.",
          );
          setApproveLoadingKey("");
          return;
        }

        const res = await updateDuyetTheoMaDK(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_tong", nextApproved, value);
          message.success("Đã cập nhật duyệt tổng thành công.");
        }

        setApproveLoadingKey("");
        return;
      }

      // ── Duyệt đêm: bulk action phiên đêm hợp lệ + update flag ──
      if (isDuyetDem) {
        const nextApproved = Boolean(payloadConfig.duyet_dem);

        setOpenConfigModal(false);
        setPayloadConfig({});

        const processedCount = await handleBulkSessionActionByType(
          "dem",
          nextApproved,
        );

        if (processedCount === 0) {
          message.warning(
            nextApproved
              ? "Không có phiên ban đêm hợp lệ nào để duyệt."
              : "Không có phiên ban đêm hợp lệ nào để hủy.",
          );
          setApproveLoadingKey("");
          return;
        }

        const res = await updateDuyetTheoMaDK(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_dem", nextApproved, value);
          message.success("Đã cập nhật duyệt ban đêm thành công.");
        }

        setApproveLoadingKey("");
        return;
      }

      // ── Duyệt tự động: bulk action phiên tự động hợp lệ + update flag ──
      if (isDuyetTuDong) {
        const nextApproved = Boolean(payloadConfig.duyet_tu_dong);

        setOpenConfigModal(false);
        setPayloadConfig({});

        const processedCount = await handleBulkSessionActionByType(
          "tuDong",
          nextApproved,
        );

        if (processedCount === 0) {
          message.warning(
            nextApproved
              ? "Không có phiên số tự động hợp lệ nào để duyệt."
              : "Không có phiên số tự động hợp lệ nào để hủy.",
          );
          setApproveLoadingKey("");
          return;
        }

        const res = await updateDuyetTheoMaDK(payload);
        if (res?.success) {
          applyApproveSuccess("duyet_tu_dong", nextApproved, value);
          message.success("Đã cập nhật duyệt số tự động thành công.");
        }

        setApproveLoadingKey("");
        return;
      }
    } catch (error) {
      console.log(error);
      setApproveLoadingKey("");
      message.error("Thất bại.");
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
                  // ── Xác định nút có bị disabled vì điều kiện đã đủ không ──
                  // conditionMet[key] = true khi thực tế đã đủ yêu cầu
                  // → Nếu đủ rồi thì không cần duyệt tổng/đêm/tự động nữa,
                  //   chỉ cho duyệt từng phiên thôi.
                  // Lưu ý: summaryMissingCases chỉ trả về những case ĐANG THIẾU
                  // (thieuGio > 0 hoặc thieuKm > 0), nên conditionMet[key]
                  // sẽ là false ở đây trong mọi trường hợp bình thường.
                  // Tuy nhiên vẫn kiểm tra để an toàn.
                  const metKey =
                    item.key === "duyet_tong"
                      ? "tong"
                      : item.key === "duyet_dem"
                        ? "dem"
                        : "tuDong";
                  const isConditionAlreadyMet = conditionMet[metKey];

                  return (
                    <div
                      key={item.key}
                      className={`!flex !items-center !justify-between !gap-3 !rounded-lg !border ${
                        item.approved
                          ? "!border-[#b7eb8f] !bg-[#f6ffed]"
                          : "!border-[#ffccc7] !bg-white"
                      }`}
                    >
                      <div className="!text-xs px-2">
                        <div
                          className={`!font-semibold ${
                            item.approved
                              ? "!text-[#389e0d]"
                              : "!text-[#cf1322]"
                          }`}
                        >
                          {item.label} (
                          <span className="!text-[#8c8c8c]">{item.detail}</span>
                          )
                        </div>
                        {isConditionAlreadyMet && (
                          <div className="!text-[10px] !text-[#8c8c8c] !mt-0.5">
                            Đã đủ điều kiện — chỉ duyệt từng phiên
                          </div>
                        )}
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
                            background: isConditionAlreadyMet
                              ? "#d9d9d9"
                              : !item?.approved
                                ? "#1e88d8"
                                : "#cf1322",
                            borderRadius: "0 8px 8px 0",
                            opacity:
                              actioningId ||
                              bulkActioning ||
                              isConditionAlreadyMet
                                ? 0.5
                                : 1,
                            cursor:
                              actioningId ||
                              bulkActioning ||
                              isConditionAlreadyMet
                                ? "not-allowed"
                                : "pointer",
                          }}
                          loading={approveLoadingKey === item.key}
                          disabled={
                            Boolean(actioningId) ||
                            bulkActioning ||
                            isConditionAlreadyMet
                          }
                          onClick={() => {
                            if (isConditionAlreadyMet) return;
                            handleApproveMissingCase(item.key, !item.approved);
                          }}
                        >
                          {isConditionAlreadyMet
                            ? "—"
                            : item.approved
                              ? "Hủy"
                              : "Duyệt"}
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
