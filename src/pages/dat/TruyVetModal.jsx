import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
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
  updatePhienHocDAT,
} from "../../apis/hocVien";
import {
  HANG_DAO_TAO_CONFIG,
  evaluateNghiGiuaPhien,
  evaluateSaiBienSo,
  evaluateSaiGiaoVien,
  evaluateTocDoPhien,
} from "../checks/DieuKienKiemTraPublic";

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

const TruyVetModal = ({
  open,
  onCancel,
  loading,
  student,
  courseLabel,
  studentCheckInfo = null,
  rows = [],
}) => {
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [approveState, setApproveState] = useState({
    duyet_tong: false,
    duyet_tu_dong: false,
    duyet_dem: false,
  });
  const [approveLoadingKey, setApproveLoadingKey] = useState("");

  const maDk = String(student?.user?.admission_code || "").trim();

  const fetchSessionStatuses = useCallback(async () => {
    if (!maDk) return;
    setLoadingStatus(true);
    try {
      const response = await getPhienHocDAT(maDk);
      setStatusMap(toStatusMap(response));
    } finally {
      setLoadingStatus(false);
    }
  }, [maDk]);

  const fetchApproveStatuses = useCallback(async () => {
    if (!maDk) return;
    try {
      const response = await hocVienKyDAT(maDk);
      const payload = response?.data || response?.Data || response || {};
      console.log("[TruyVetModal] fetch approve status:", payload);
      setApproveState(normalizeApproveState(payload));
    } catch (error) {
      console.log("[TruyVetModal] fetch approve status error:", error);
    }
  }, [maDk]);

  useEffect(() => {
    if (!open) return;
    setStatusMap({});
    setApproveLoadingKey("");
    fetchSessionStatuses();
    fetchApproveStatuses();
  }, [open, fetchSessionStatuses, fetchApproveStatuses]);

  const rowsWithStatus = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap),
    );

    const nghiErrors = evaluateNghiGiuaPhien(sorted);
    const tocDoErrors = evaluateTocDoPhien(sorted);
    const giaoVienErrors = evaluateSaiGiaoVien(sorted, studentCheckInfo);
    const bienSoErrors = evaluateSaiBienSo(sorted, studentCheckInfo);

    return sorted.map((item, index) => {
      const phienLabel = `Phiên ${index + 1}`;

      const isSpeedInvalid = tocDoErrors.some((e) =>
        e.message.startsWith(phienLabel),
      );
      const isTeacherMismatch = giaoVienErrors.some((e) =>
        e.message.startsWith(phienLabel),
      );
      const isPlateMismatch = bienSoErrors.some((e) =>
        e.message.startsWith(phienLabel),
      );
      const isRestTooShort = nghiErrors.some(
        (e) =>
          e.message.includes(`Phiên ${index + 1} và`) ||
          e.message.includes(`và ${index + 1}:`),
      );

      const derivedInvalid =
        isSpeedInvalid ||
        isTeacherMismatch ||
        isPlateMismatch ||
        isRestTooShort;
      const persistedStatus = getMappedStatus(item, statusMap);
      const effectiveStatus =
        persistedStatus || (derivedInvalid ? "HUY" : "DUYET");

      return {
        ...item,
        _isSpeedInvalid: isSpeedInvalid,
        _isTeacherMismatch: isTeacherMismatch,
        _isPlateMismatch: isPlateMismatch,
        _isRestTooShort: isRestTooShort,
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

  const summaryMissingCases = useMemo(() => {
    const hangDaoTao =
      rows?.[0]?.HangDaoTao ||
      studentCheckInfo?.hangDaoTao ||
      studentCheckInfo?.HangDaoTao ||
      "B1";
    const yeuCauHang =
      HANG_DAO_TAO_CONFIG[hangDaoTao] || HANG_DAO_TAO_CONFIG.B1;
    const validRows = rowsWithStatus.filter((item) => !item?._isInvalid);

    const tongGio = validRows.reduce(
      (sum, item) => sum + toNumber(item?.TongThoiGian) / 3600,
      0,
    );
    const tongKm = validRows.reduce(
      (sum, item) => sum + toNumber(item?.TongQuangDuong),
      0,
    );

    const demTotals = validRows.reduce(
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

    const bienSoTuDong = getAutoPlateFromRows(validRows);
    const tuDongTotals = validRows.reduce(
      (acc, item) => {
        if (!bienSoTuDong) return acc;
        if (normalizePlate(item?.BienSo) !== bienSoTuDong) return acc;
        acc.gio += toNumber(item?.TongThoiGian) / 3600;
        acc.km += toNumber(item?.TongQuangDuong);
        return acc;
      },
      { gio: 0, km: 0 },
    );

    const buildCase = (
      key,
      label,
      currentHours,
      currentKm,
      requiredHours,
      requiredKm,
      approved,
    ) => {
      const thieuGio = Math.max(requiredHours - currentHours, 0);
      const thieuKm = Math.max(requiredKm - currentKm, 0);
      if (thieuGio <= 0 && thieuKm <= 0) return null;
      return {
        key,
        label,
        approved,
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
      ),
      buildCase(
        "duyet_dem",
        "Thiếu quãng đường/thời gian đêm",
        demTotals.gio,
        demTotals.km,
        toNumber(yeuCauHang?.thoiGian?.banDem),
        toNumber(yeuCauHang?.quangDuong?.banDem),
        approveState.duyet_dem,
      ),
      buildCase(
        "duyet_tu_dong",
        "Thiếu quãng đường/thời gian số tự động",
        tuDongTotals.gio,
        tuDongTotals.km,
        toNumber(yeuCauHang?.thoiGian?.tuDong),
        toNumber(yeuCauHang?.quangDuong?.tuDong),
        approveState.duyet_tu_dong,
      ),
    ].filter(Boolean);
  }, [rows, rowsWithStatus, studentCheckInfo, approveState]);

  const handleApproveMissingCase = async (caseKey, nextApproved) => {
    if (!maDk || !caseKey) return;
    setApproveLoadingKey(caseKey);
    console.log("[TruyVetModal] approve toggle click:", {
      ma_dk: maDk,
      caseKey,
      nextApproved,
      action: nextApproved ? "duyet" : "huy_duyet",
    });
    try {
      const payload = {
        ma_dk: maDk,
        [caseKey]: nextApproved,
      };
      const response = await updatePhienHocDAT(payload);
      console.log("[TruyVetModal] approve toggle response:", response);
      await fetchApproveStatuses();
      setApproveState((prev) => ({ ...prev, [caseKey]: nextApproved }));
      message.success(nextApproved ? "Đã duyệt." : "Đã hủy duyệt.");
    } catch (error) {
      console.log("[TruyVetModal] approve toggle error:", error);
      message.error(error?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setApproveLoadingKey("");
    }
  };

  const handleSessionAction = async (item) => {
    if (!item || !maDk) return;

    const sessionId = String(item?.ID || "");
    const start = item?.ThoiDiemDangNhap ? dayjs(item.ThoiDiemDangNhap) : null;
    const end = item?.ThoiDiemDangXuat ? dayjs(item.ThoiDiemDangXuat) : null;
    const actionStatus = item?._status === "DUYET" ? "HUY" : "DUYET";

    const payload = {
      ngay: start?.isValid() ? start.format("YYYY-MM-DD") : null,
      bien_so: item?.BienSo || null,
      gio_vao: start?.isValid() ? start.format("HH:mm:ss") : null,
      gio_ra: end?.isValid() ? end.format("HH:mm:ss") : null,
      thoi_gian: Number((toNumber(item?.TongThoiGian) / 3600).toFixed(2)),
      tong_km: Number(toNumber(item?.TongQuangDuong).toFixed(2)),
      ma_dk: maDk,
      trang_thai: actionStatus,
      nguoi_thay_doi:
        sessionStorage.getItem("name") ||
        sessionStorage.getItem("username") ||
        "unknown",
      phien_hoc_id: item?.ID || null,
    };

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
    loading ||
    loadingStatus ||
    actioningId !== null ||
    approveLoadingKey !== "";

  return (
    <Drawer
      title="Chi tiết DAT"
      open={open}
      onClose={onCancel}
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

            {/* {invalidSessionCount > 0 && (
              <Card
                bodyStyle={{ padding: 8 }}
                className="!mb-3 !bg-[#fff1f0] !border-[#ffa39e]"
              >
                <Text className="!text-[#cf1322] !text-xs !font-semibold">
                  Có {invalidSessionCount} phiên lỗi. Bấm duyệt để tính.
                </Text>
              </Card>
            )} */}

            {summaryMissingCases.length > 0 && (
              <Card
                bodyStyle={{ padding: 10 }}
                className="!mb-3 !bg-[#fff1f0] !border-[#ffa39e]"
              >
                <div className="!space-y-2">
                  {summaryMissingCases.map((item) => (
                    <div
                      key={item.key}
                      className="!flex !items-center !justify-between !gap-2"
                    >
                      <div className="!text-xs">
                        <div className="!font-semibold !text-[#cf1322]">
                          {item.label}
                        </div>
                        <div className="!text-[#8c8c8c]">{item.detail}</div>
                      </div>
                      <Button
                        type={item.approved ? "default" : "primary"}
                        danger={item.approved}
                        className="!w-[56px]"
                        size="small"
                        loading={approveLoadingKey === item.key}
                        onClick={() =>
                          handleApproveMissingCase(item.key, !item.approved)
                        }
                      >
                        {item.approved ? "Hủy" : "Duyệt"}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="!space-y-2 !overflow-y-auto !max-h-[56vh]">
              {rowsWithStatus.map((item, index) => {
                const start = item?.ThoiDiemDangNhap;
                const end = item?.ThoiDiemDangXuat;
                const sessionId = String(item?.ID || "");
                const isActioning = actioningId === sessionId;

                return (
                  <div key={item?.ID || index}>
                    <Card
                      bodyStyle={{ padding: 0 }}
                      className="!border-0 !shadow-sm !overflow-hidden "
                      style={{
                        borderLeft: `3px solid ${item?._isInvalid ? "#cf1322" : "#52c41a"}`,
                        borderRadius: "8px",
                        opacity: isActioning ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <div className="!flex !items-stretch">
                        <div
                          className="!w-8 !shrink-0 !flex !items-center !justify-center !text-xs !font-bold"
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
                            <span className="!font-semibold !text-gray-800 !text-sm">
                              {start ? dayjs(start).format("DD-MM-YYYY") : "--"}
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
                          disabled={Boolean(actioningId)}
                          className="!shrink-0 !w-[52px] !text-xs !font-semibold !text-white !border-0 !cursor-pointer !transition-all"
                          style={{
                            background: item?._isInvalid
                              ? "#1e88d8"
                              : "#cf1322",
                            borderRadius: "0 8px 8px 0",
                            opacity: actioningId ? 0.5 : 1,
                            cursor: actioningId ? "not-allowed" : "pointer",
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
          <Empty description="Khong co du lieu DAT" />
        )}
      </Spin>
    </Drawer>
  );
};

export default TruyVetModal;
