import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Card, Drawer, Empty, Grid, Image, Spin, Typography } from "antd";
import {
  HANG_DAO_TAO_CONFIG,
  getInvalidSessionIndexes,
} from "./DieuKienKiemTra";
import { getPhienHocDATPublic } from "../../apis/apiDeploy";

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
  if (date && plate && startTime && endTime)
    keys.add(`slot:${date}|${plate}|${startTime}|${endTime}`);
  if (date && startTime && endTime)
    keys.add(`time:${date}|${startTime}|${endTime}`);

  return Array.from(keys);
};

const formatDurationFromSeconds = (seconds) => {
  const totalMinutes = Math.round(toNumber(seconds) / 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour}h ${String(minute).padStart(2, "0")}'`;
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

const INITIAL_APPROVE_STATE = {
  duyet_tong: false,
  duyet_tu_dong: false,
  duyet_dem: false,
};

// ─── Summary Check ────────────────────────────────────────────────────────────

const computeQuickSummary = (rowsWithStatus, hangDaoTao) => {
  const yeuCau = HANG_DAO_TAO_CONFIG[hangDaoTao];
  if (!yeuCau) return null;

  const validRows = rowsWithStatus.filter((r) => !r._isInvalid);

  let tongGiay = 0;
  let tongKm = 0;
  let demGiay = 0;
  let demKm = 0;
  let tuDongGiay = 0;
  let tuDongKm = 0;

  const bienSoCount = {};
  validRows.forEach((item) => {
    if (item.BienSo)
      bienSoCount[item.BienSo] = (bienSoCount[item.BienSo] || 0) + 1;
  });
  const bienSoEntries = Object.entries(bienSoCount);
  const bienSoTuDong =
    bienSoEntries.length > 1
      ? bienSoEntries.reduce((min, cur) => (cur[1] < min[1] ? cur : min))[0]
      : null;

  validRows.forEach((item) => {
    const giay = toNumber(item.TongThoiGian);
    const km = toNumber(item.TongQuangDuong);
    const isTuDong =
      bienSoTuDong &&
      normalizePlate(item.BienSo) === normalizePlate(bienSoTuDong);

    tongGiay += giay;
    tongKm += km;

    const demGiayAPI = toNumber(item.ThoiGianBanDem);
    if (demGiayAPI > 0) {
      demGiay += demGiayAPI;
      demKm += toNumber(item.QuangDuongBanDem);
    } else if (item.ThoiDiemDangNhap) {
      const hour = new Date(item.ThoiDiemDangNhap).getHours();
      if (hour >= 18) {
        demGiay += giay;
        demKm += km;
      }
    }

    if (isTuDong) {
      tuDongGiay += giay;
      tuDongKm += km;
    }
  });

  const tongGio = tongGiay / 3600;
  const demGio = demGiay / 3600;
  const tuDongGio = tuDongGiay / 3600;

  const warnings = [];

  const thieu_tongGio = yeuCau.thoiGian.tong - tongGio;
  const thieu_tongKm = yeuCau.quangDuong.tong - tongKm;
  if (thieu_tongGio > 0 || thieu_tongKm > 0) {
    warnings.push({
      key: "duyet_tong",
      color: "#FF0000",
      label: "Tổng km và thời gian chưa đạt.",
      detail: "",
    });
  }

  const thieu_demGio = yeuCau.thoiGian.banDem - demGio;
  const thieu_demKm = yeuCau.quangDuong.banDem - demKm;
  if (thieu_demGio > 0 || thieu_demKm > 0) {
    warnings.push({
      key: "duyet_dem",
      color: "#FF0000",
      label: "Thời gian và quãng đường ban đêm chưa đạt.",
      detail: "",
    });
  }

  if (yeuCau.thoiGian.tuDong > 0 || yeuCau.quangDuong.tuDong > 0) {
    const thieu_tuDongGio = yeuCau.thoiGian.tuDong - tuDongGio;
    const thieu_tuDongKm = yeuCau.quangDuong.tuDong - tuDongKm;
    if (thieu_tuDongGio > 0 || thieu_tuDongKm > 0) {
      warnings.push({
        key: "duyet_tu_dong",
        color: "#FF0000",
        label: "Thời gian và quãng đường số tự động chưa đạt.",
        detail: "",
      });
    }
  }

  return warnings;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ModalTest = ({
  open,
  onCancel,
  loading,
  student,
  courseLabel,
  studentCheckInfo = null,
  rows = [],
  bat_dau_dat = null,
  ket_thuc_dat = null,
}) => {

  const [statusMap, setStatusMap] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [approveState, setApproveState] = useState(INITIAL_APPROVE_STATE);

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  const maDk = String(student?.user?.admission_code || "").trim();

  const fetchSessionStatuses = useCallback(async () => {
    if (!maDk) return;
    setLoadingStatus(true);
    try {
      const response = await getPhienHocDATPublic(maDk);
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

      const firstItem = list.find(
        (item) =>
          item?.duyet_tong !== undefined ||
          item?.duyet_tu_dong !== undefined ||
          item?.duyet_dem !== undefined,
      );

      if (firstItem) {
        setApproveState(normalizeApproveState(firstItem));
      }
    } catch {
      // silent
    } finally {
      setLoadingStatus(false);
    }
  }, [maDk]);

  useEffect(() => {
    if (!open) return;
    setStatusMap({});
    setApproveState(INITIAL_APPROVE_STATE);
    fetchSessionStatuses();
  }, [open, fetchSessionStatuses]);

  const rowsWithStatus = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap),
    );

    // Nguồn duy nhất — nhất quán với derivedInvalid/_status
    const { invalidIndexes, invalidReasons } = getInvalidSessionIndexes(
      sorted,
      studentCheckInfo,
    );

    return sorted.map((item, index) => {
      const reasons = invalidReasons.get(index) || [];

      // Tốc độ TB < 18 km/h
      const _isSpeedInvalid = reasons.some((r) => r.includes("Tốc độ TB"));

      // Sai tên giáo viên
      const _isTeacherMismatch = reasons.some(
        (r) =>
          r.includes("Tên giáo viên") || r.includes("Không có tên giáo viên"),
      );

      // Sai biển số xe
      const _isPlateMismatch = reasons.some(
        (r) => r.includes("Biển số xe") || r.includes("không thuộc xe đăng ký"),
      );

      // Nghỉ giữa phiên < 15 phút
      const _isRestTooShort = reasons.some((r) =>
        r.includes("Nghỉ giữa phiên"),
      );

      // Xe tự động sai khung giờ
      const _isTuDongInvalid = reasons.some((r) =>
        r.includes("Xe tự động bắt đầu"),
      );

      // Phiên dưới 5 phút (check riêng, không có trong getInvalidSessionIndexes)
      const thoiGianPhut = toNumber(item?.TongThoiGian) / 60;
      const _isTooShort = thoiGianPhut > 0 && thoiGianPhut < 5;

      const derivedInvalid = invalidIndexes.has(index);
      const persistedStatus = getMappedStatus(item, statusMap);
      const effectiveStatus =
        persistedStatus || (derivedInvalid ? "HUY" : "DUYET");

      return {
        ...item,
        _isSpeedInvalid,
        _isTeacherMismatch,
        _isPlateMismatch,
        _isRestTooShort,
        _isTuDongInvalid,
        _isTooShort,
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

  const invalidSessionCount = useMemo(
    () => rowsWithStatus.filter((item) => item?._isInvalid).length,
    [rowsWithStatus],
  );

  const hangDaoTao = useMemo(() => {
    return (
      rows[0]?.HangDaoTao ||
      studentCheckInfo?.HangDaoTao ||
      student?.hang_dao_tao ||
      ""
    );
  }, [rows, studentCheckInfo, student]);

  const summaryWarnings = useMemo(
    () => computeQuickSummary(rowsWithStatus, hangDaoTao),
    [rowsWithStatus, hangDaoTao],
  );

  const filteredSummaryWarnings = useMemo(
    () =>
      (summaryWarnings || []).filter((item) => {
        if (!item?.key) return true;
        return !approveState[item.key];
      }),
    [summaryWarnings, approveState],
  );

  const isModalLoading = loading || loadingStatus;

  return (
    <Drawer
      title="Chi tiết DAT"
      open={open}
      onClose={onCancel}
      footer={null}
      width={screens.xs ? "100%" : 600}
      destroyOnClose
    >
      <Spin spinning={isModalLoading}>
        {/* Thông tin học viên */}
        <Card
          bodyStyle={{ padding: 12 }}
          className="!mb-3 !rounded-xl !border-0 !bg-[linear-gradient(120deg,#1e7ec8,#1aa0dd)]"
        >
          <div className="!flex !items-center !justify-between !gap-3">
            <div className="!text-white">
              <div className="!mb-1 !text-xs">
                Họ tên:{" "}
                <span className="!font-bold">
                  {student?.user?.name || "Không rõ tên"}
                </span>
              </div>
              <div className="!mb-1 !text-xs">
                Mã học viên: {student?.user?.admission_code || "--"}
              </div>
              <div className="!mb-1 !text-xs">Khoa: {courseLabel || "--"}</div>
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
            <Card bodyStyle={{ padding: 8 }} className="!mb-2 !bg-[#dff4f7]">
              <div className="!grid !grid-cols-2 !text-center">
                <Text strong>Bắt đầu DAT: {dayjs(bat_dau_dat).format("DD/MM/YYYY")}</Text>
                <Text strong>
                  Kết thúc DAT: {dayjs(ket_thuc_dat).format("DD/MM/YYYY")}
                </Text>
              </div>
            </Card>
            {/* Tổng km + giờ */}
            <Card bodyStyle={{ padding: 8 }} className="!mb-3 !bg-[#dff4f7]">
              <div className="!grid !grid-cols-2 !text-center">
                <Text strong>Tổng Km: {totalDistance.toFixed(2)} km</Text>
                <Text strong>
                  Tổng giờ: {formatDurationFromSeconds(totalSeconds)}
                </Text>
              </div>
            </Card>

            {/* Cảnh báo */}
            {(invalidSessionCount > 0 ||
              filteredSummaryWarnings.length > 0) && (
                <Card
                  bodyStyle={{ padding: 8 }}
                  className="!mb-2 !bg-[#fff1f0] !border-[#ffa39e]"
                >
                  <div className="!space-y-2">
                    {invalidSessionCount > 0 && (
                      <Text className="!text-[#cf1322] !text-xs !font-semibold">
                        Có {invalidSessionCount} phiên lỗi. Liên hệ phòng DAT để
                        kiểm tra chi tiết.
                      </Text>
                    )}
                    {filteredSummaryWarnings.length > 0 && (
                      <div>
                        {filteredSummaryWarnings.map((w, i) => (
                          <div
                            key={i}
                            className="flex items-start pb-0 text-[#cf1322]"
                          >
                            <div>
                              <div className="text-[12px] font-semibold">
                                {w.label}
                              </div>
                              <div className="text-[11px] text-gray-700">
                                {w.detail}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

            {/* Danh sách phiên */}
            <div className="!space-y-2 !overflow-y-auto !max-h-[56vh]">
              {rowsWithStatus.map((item, index) => {
                const start = item?.ThoiDiemDangNhap;
                const end = item?.ThoiDiemDangXuat;

                return (
                  <Card
                    key={item?.ID || index}
                    bodyStyle={{ padding: 0 }}
                    className="!border-0 !shadow-sm !overflow-hidden"
                    style={{
                      borderLeft: `3px solid ${item?._isInvalid ? "#cf1322" : "#52c41a"}`,
                      borderRadius: "8px",
                    }}
                  >
                    <div className="!flex !items-stretch">
                      <div
                        className="!w-8 !shrink-0 !flex !items-center !justify-center !text-xs !font-bold"
                        style={{
                          color: item?._isInvalid ? "#cf1322" : "#52c41a",
                          background: item?._isInvalid ? "#fff1f0" : "#f6ffed",
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
                          <span className="!text-gray-600 text-[13px] font-bold">
                            {formatDurationFromSeconds(item?.TongThoiGian)} ·{" "}
                            {toNumber(item?.TongQuangDuong).toFixed(2)} km
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Empty description="Không có dữ liệu DAT" />
        )}
      </Spin>
    </Drawer>
  );
};

export default ModalTest;
