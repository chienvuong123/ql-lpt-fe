import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  Drawer,
  Empty,
  Image,
  Modal,
  Spin,
  Typography,
  message,
} from "antd";
import { getPhienHocDAT, updatePhienHocDAT } from "../../apis/hocVien";
import {
  evaluateNghiGiuaPhien,
  evaluateSaiBienSo,
  evaluateSaiGiaoVien,
  evaluateTocDoPhien,
} from "../checks/DieuKienKiemTraPublic";

const { Text } = Typography;

const MIN_DAT_SPEED = 18;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// const normalizeName = (name) =>
//   String(name || "")
//     .trim()
//     .toUpperCase()
//     .replace(/\s+/g, " ");

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

// const getAvgSpeed = (item) => {
//   const km = toNumber(item?.TongQuangDuong);
//   const seconds = toNumber(item?.TongThoiGian);
//   if (km <= 0 || seconds <= 0) return 0;
//   return km / (seconds / 3600);
// };

const formatDurationFromSeconds = (seconds) => {
  const totalMinutes = Math.round(toNumber(seconds) / 60);
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
          ? root.phien_hoc_list // ← thêm case này khớp với response BE
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
  const [actioningId, setActioningId] = useState(null); // ← id đang được action

  const maDk = String(student?.user?.admission_code || "").trim();

  const fetchSessionStatuses = async () => {
    if (!maDk) return;
    setLoadingStatus(true);
    try {
      const response = await getPhienHocDAT(maDk);
      setStatusMap(toStatusMap(response));
    } catch {
      // message.error("Khong lay duoc trang thai phien DAT.");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setStatusMap({}); // ← reset khi mở modal mới
    fetchSessionStatuses();
  }, [open, maDk]);

  const rowsWithStatus = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap),
    );

    // Chạy toàn bộ check từ evaluateUtils
    const nghiErrors = evaluateNghiGiuaPhien(sorted);
    const tocDoErrors = evaluateTocDoPhien(sorted);
    const giaoVienErrors = evaluateSaiGiaoVien(sorted, studentCheckInfo);
    const bienSoErrors = evaluateSaiBienSo(sorted, studentCheckInfo);

    // Gán lỗi vào từng phiên theo index
    return sorted.map((item, index) => {
      const phienLabel = `Phiên ${index + 1}`;

      const _isSpeedInvalid = tocDoErrors.some((e) =>
        e.message.startsWith(phienLabel),
      );
      const _isTeacherMismatch = giaoVienErrors.some((e) =>
        e.message.startsWith(phienLabel),
      );
      const _isPlateMismatch = bienSoErrors.some((e) =>
        e.message.startsWith(phienLabel),
      );
      const _isRestTooShort = nghiErrors.some(
        (e) =>
          e.message.includes(`Phiên ${index + 1} và`) ||
          e.message.includes(`và ${index + 1}:`),
      );

      const _isInvalid =
        _isSpeedInvalid ||
        _isTeacherMismatch ||
        _isPlateMismatch ||
        _isRestTooShort;

      return {
        ...item,
        _isSpeedInvalid,
        _isTeacherMismatch,
        _isPlateMismatch,
        _isRestTooShort,
        _isInvalid,
      };
    });
  }, [rows, studentCheckInfo]);

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

  const handleSessionAction = async (item) => {
    if (!item || !maDk) return;

    const sessionId = String(item?.ID || "");
    const start = item?.ThoiDiemDangNhap ? dayjs(item.ThoiDiemDangNhap) : null;
    const end = item?.ThoiDiemDangXuat ? dayjs(item.ThoiDiemDangXuat) : null;
    const actionStatus = item?._isInvalid ? "DUYET" : "HUY";

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

    setActioningId(sessionId); // ← bật loading modal

    try {
      await updatePhienHocDAT(payload);

      // Cập nhật statusMap ngay lập tức, không chờ fetch
      setStatusMap((prev) => {
        const next = { ...prev };
        sessionKeys.forEach((key) => {
          next[key] = actionStatus;
        });
        return next;
      });

      // Sau đó fetch lại để đồng bộ với BE
      await fetchSessionStatuses();

      message.success(
        actionStatus === "DUYET" ? "Đã hủy phiên học." : "Đã duyệt phiên học.",
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Cập nhập trạng thái thất bại.",
      );
    } finally {
      setActioningId(null); // ← tắt loading modal
    }
  };

  // Modal đang loading khi: fetch lần đầu, hoặc đang xử lý action
  const isModalLoading = loading || loadingStatus || actioningId !== null;

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
                  Tổng giờ: {formatDurationFromSeconds(totalSeconds)}p
                </Text>
              </div>
            </Card>

            {invalidSessionCount > 0 && (
              <Card
                bodyStyle={{ padding: 8 }}
                className="!mb-3 !bg-[#fff1f0] !border-[#ffa39e]"
              >
                <Text className="!text-[#cf1322] !text-xs !font-semibold">
                  Có {invalidSessionCount} phiên lỗi. Bấm duyệt để tính.
                </Text>
              </Card>
            )}

            <div className="!space-y-2 !overflow-y-auto !max-h-[60vh]">
              {rowsWithStatus.map((item, index) => {
                const start = item?.ThoiDiemDangNhap;
                const end = item?.ThoiDiemDangXuat;
                const sessionId = String(item?.ID || "");
                const isActioning = actioningId === sessionId;

                return (
                  <div>
                    <Card
                      key={item?.ID || index}
                      bodyStyle={{ padding: 0 }}
                      className="!border-0 !shadow-sm !overflow-hidden"
                      style={{
                        borderLeft: `3px solid ${item?._isInvalid ? "#cf1322" : "#52c41a"}`,
                        borderRadius: "8px",
                        // ← dim card đang được xử lý
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
                          disabled={!!actioningId} // ← disable tất cả button khi đang action
                          className="!shrink-0 !w-[52px] !text-xs !font-semibold !text-white !border-0 !cursor-pointer !transition-all"
                          style={{
                            background: item?._isInvalid
                              ? "#1e88d8"
                              : "#cf1322",
                            borderRadius: "0 8px 8px 0",
                            // eslint-disable-next-line no-extra-boolean-cast
                            opacity: !!actioningId ? 0.5 : 1,
                            // eslint-disable-next-line no-extra-boolean-cast
                            cursor: !!actioningId ? "not-allowed" : "pointer",
                          }}
                        >
                          {isActioning
                            ? "..."
                            : item?._isInvalid
                              ? "Duyệt"
                              : "Hủy"}
                        </button>
                      </div>
                    </Card>
                    {/* {item?._isInvalid && (
                      <div className="!mt-1.5 !space-y-0.5 !pt-1">
                        {item?._isPlateMismatch && (
                          <div className="!flex !items-center !gap-1 !text-[10px] !text-[#cf1322]">
                            <span className="text-xs font-medium">
                              Sai xe đăng ký ({item?.BienSo})
                            </span>
                          </div>
                        )}
                        {item?._isTeacherMismatch && (
                          <div className="!flex !items-center !gap-1 !text-[10px] !text-[#cf1322]">
                            <span className="text-xs font-medium">
                              Sai giáo viên ({item?.HoTenGV || "--"})
                            </span>
                          </div>
                        )}
                        {item?._isSpeedInvalid && (
                          <div className="!flex !items-center !gap-1 !text-[10px] !text-[#cf1322]">
                            <span className="text-xs font-medium">
                              Tốc độ thấp (
                              {(
                                toNumber(item?.TongQuangDuong) /
                                (toNumber(item?.TongThoiGian) / 3600)
                              ).toFixed(1)}{" "}
                              km/h &lt; {MIN_DAT_SPEED} km/h)
                            </span>
                          </div>
                        )}
                        {item?._isRestTooShort && (
                          <div className="!flex !items-center !gap-1 !text-[10px] !text-[#cf1322]">
                            <span className="text-xs font-medium">
                              Nghỉ chưa đủ 15 phút so với phiên trước
                            </span>
                          </div>
                        )}
                      </div>
                    )} */}
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
