import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Card, Empty, Image, Modal, Spin, Typography, message } from "antd";
import { getPhienHocDAT, updatePhienHocDAT } from "../../apis/hocVien";

const { Text } = Typography;

const MIN_DAT_SPEED = 18;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeName = (name) =>
  String(name || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

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

  if (sessionId) {
    keys.add(`id:${String(sessionId)}`);
  }

  if (date && plate && startTime && endTime) {
    keys.add(`slot:${date}|${plate}|${startTime}|${endTime}`);
  }

  if (date && startTime && endTime) {
    keys.add(`time:${date}|${startTime}|${endTime}`);
  }

  return Array.from(keys);
};

const getAvgSpeed = (item) => {
  const km = toNumber(item?.TongQuangDuong);
  const seconds = toNumber(item?.TongThoiGian);

  if (km <= 0 || seconds <= 0) return 0;

  return km / (seconds / 3600);
};

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
  const [loadingActionById, setLoadingActionById] = useState({});

  const maDk = String(student?.user?.admission_code || "").trim();

  const fetchSessionStatuses = async () => {
    if (!maDk) return;

    setLoadingStatus(true);
    try {
      const response = await getPhienHocDAT(maDk);
      setStatusMap(toStatusMap(response));
    } catch (_error) {
      message.error("Khong lay duoc trang thai phien DAT.");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchSessionStatuses();
  }, [open, maDk]);

  const rowsWithStatus = useMemo(
    () =>
      rows.map((item) => {
        const avgSpeed = getAvgSpeed(item);
        const isSpeedInvalid = avgSpeed > 0 && avgSpeed < MIN_DAT_SPEED;

        const registeredTeacher = normalizeName(studentCheckInfo?.giaoVien);
        const sessionTeacher = normalizeName(item?.HoTenGV);
        const isTeacherMismatch =
          !!registeredTeacher && !!sessionTeacher
            ? sessionTeacher !== registeredTeacher
            : false;

        const registeredPlateB1 = normalizePlate(studentCheckInfo?.xeB1);
        const registeredPlateB2 = normalizePlate(studentCheckInfo?.xeB2);
        const sessionPlate = normalizePlate(item?.BienSo);
        const allowedPlates = [registeredPlateB1, registeredPlateB2].filter(
          Boolean,
        );
        const isPlateMismatch =
          allowedPlates.length > 0 && sessionPlate
            ? !allowedPlates.includes(sessionPlate)
            : false;

        const isInvalidByRule =
          isSpeedInvalid || isTeacherMismatch || isPlateMismatch;

        const matchedStatusKey = getSessionKeys(item).find(
          (key) => statusMap[key],
        );
        const serverStatus = matchedStatusKey
          ? statusMap[matchedStatusKey]
          : null;
        const isInvalid =
          serverStatus === "DUYET"
            ? false
            : serverStatus === "HUY"
              ? true
              : isInvalidByRule;

        return {
          ...item,
          _avgSpeed: avgSpeed,
          _isSpeedInvalid: isSpeedInvalid,
          _isTeacherMismatch: isTeacherMismatch,
          _isPlateMismatch: isPlateMismatch,
          _isInvalidByRule: isInvalidByRule,
          _serverStatus: serverStatus,
          _isInvalid: isInvalid,
        };
      }),
    [rows, studentCheckInfo, statusMap],
  );

  const totalDistance = useMemo(
    () =>
      rowsWithStatus.reduce((sum, item) => {
        if (item?._isInvalid) return sum;
        return sum + toNumber(item?.TongQuangDuong);
      }, 0),
    [rowsWithStatus],
  );

  const totalSeconds = useMemo(
    () =>
      rowsWithStatus.reduce((sum, item) => {
        if (item?._isInvalid) return sum;
        return sum + toNumber(item?.TongThoiGian);
      }, 0),
    [rowsWithStatus],
  );

  const invalidSessionCount = useMemo(
    () => rowsWithStatus.filter((item) => item?._isInvalid).length,
    [rowsWithStatus],
  );

  const handleSessionAction = async (item) => {
    if (!item || !maDk) return;

    const start = item?.ThoiDiemDangNhap ? dayjs(item.ThoiDiemDangNhap) : null;
    const end = item?.ThoiDiemDangXuat ? dayjs(item.ThoiDiemDangXuat) : null;
    const totalSecondsValue = Number(item?.TongThoiGian || 0);
    const actionStatus = item?._isInvalid ? "DUYET" : "HUY";
    const sessionId = String(item?.ID || "");

    const payload = {
      ngay: start?.isValid() ? start.format("YYYY-MM-DD") : null,
      bien_so: item?.BienSo || null,
      gio_vao: start?.isValid() ? start.format("HH:mm:ss") : null,
      gio_ra: end?.isValid() ? end.format("HH:mm:ss") : null,
      tong_gio: Number((totalSecondsValue / 3600).toFixed(2)),
      tong_km: Number(Number(item?.TongQuangDuong || 0).toFixed(2)),
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

    setLoadingActionById((prev) => ({ ...prev, [sessionId]: true }));

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
        actionStatus === "DUYET"
          ? "Da duyet phien hoc DAT."
          : "Da huy phien hoc DAT.",
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Cap nhat trang thai phien that bai.",
      );
    } finally {
      setLoadingActionById((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  return (
    <Modal
      title="Chi tiet DAT"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Spin spinning={loading || loadingStatus}>
        <Card
          bodyStyle={{ padding: 12 }}
          className="!mb-3 !rounded-xl !border-0 !bg-[linear-gradient(120deg,#1e7ec8,#1aa0dd)]"
        >
          <div className="!flex !items-center !justify-between !gap-3">
            <div className="!text-white">
              <div className="!mb-1 !text-xs">
                Ho ten:{" "}
                <span className="!font-bold">
                  {student?.user?.name || "Khong ro ten"}
                </span>
              </div>
              <div className="!mb-1 !text-xs">
                Ma hoc vien: {student?.user?.admission_code || "--"}
              </div>
              <div className="!mb-1 !text-xs">Khoa: {courseLabel || "--"}</div>
              <div className="!text-xs">
                Nam sinh: {student?.user?.birth_year || "--"}
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
                <Text strong>Tong Km: {totalDistance.toFixed(2)} km</Text>
                <Text strong>
                  Tong gio: {formatDurationFromSeconds(totalSeconds)}
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
                const isActionLoading =
                  !!loadingActionById[String(item?.ID || "")];

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
                          <span className="!text-gray-400">
                            {formatDurationFromSeconds(item?.TongThoiGian)} ·{" "}
                            {toNumber(item?.TongQuangDuong).toFixed(2)} km
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSessionAction(item)}
                        disabled={isActionLoading}
                        className="!shrink-0 !w-[52px] !text-xs !font-semibold !text-white !border-0 !cursor-pointer !transition-all"
                        style={{
                          background: item?._isInvalid ? "#1e88d8" : "#cf1322",
                          borderRadius: "0 8px 8px 0",
                          opacity: isActionLoading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActionLoading)
                            e.currentTarget.style.opacity = "0.88";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActionLoading)
                            e.currentTarget.style.opacity = "1";
                        }}
                      >
                        {isActionLoading
                          ? "..."
                          : item?._isInvalid
                            ? "Duyet"
                            : "Huy"}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Empty description="Khong co du lieu DAT" />
        )}
      </Spin>
    </Modal>
  );
};

export default TruyVetModal;
