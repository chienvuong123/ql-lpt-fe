import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Card, Empty, Image, Modal, Spin, Typography } from "antd";

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

const DatJourneyModal = ({
  open,
  onCancel,
  loading,
  student,
  courseLabel,
  studentCheckInfo = null,
  rows = [],
}) => {  
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

        const isInvalid =
          isSpeedInvalid || isTeacherMismatch || isPlateMismatch;

        return {
          ...item,
          _avgSpeed: avgSpeed,
          _isSpeedInvalid: isSpeedInvalid,
          _isTeacherMismatch: isTeacherMismatch,
          _isPlateMismatch: isPlateMismatch,
          _isInvalid: isInvalid,
        };
      }),
    [rows, studentCheckInfo],
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
      rowsWithStatus.reduce(
        (sum, item) => sum + toNumber(item?.TongThoiGian),
        0,
      ),
    [rowsWithStatus],
  );

  const invalidSessionCount = useMemo(
    () => rowsWithStatus.filter((item) => item?._isInvalid).length,
    [rowsWithStatus],
  );

  return (
    <Modal
      title="Chi tiết DAT"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={420}
      destroyOnClose
    >
      <Spin spinning={loading}>
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
                  Tổng giờ: {formatDurationFromSeconds(totalSeconds)}'
                </Text>
              </div>
            </Card>

            {invalidSessionCount > 0 && (
              <Card
                bodyStyle={{ padding: 8 }}
                className="!mb-3 !bg-[#fff1f0] !border-[#ffa39e]"
              >
                <Text className="!text-[#cf1322] !text-xs !font-semibold">
                  Bạn có ({invalidSessionCount} phiên lỗi) liên hệ phòng DAT để
                  kiểm tra chi tiết.
                </Text>
              </Card>
            )}

            <div className="!space-y-2 !overflow-y-auto !max-h-[60vh]">
              {rowsWithStatus.map((item, index) => {
                const start = item?.ThoiDiemDangNhap;
                const end = item?.ThoiDiemDangXuat;
                return (
                  <Card
                    key={item?.ID || index}
                    bodyStyle={{ padding: 0 }}
                    className={item?._isInvalid ? "!border-[#cf1322]" : ""}
                  >
                    <div className="!flex">
                      <div
                        className={`!w-8 !text-center !text-xs !font-semibold !text-white !py-3 ${
                          item?._isInvalid ? "!bg-[#cf1322]" : "!bg-[#1e88d8]"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="!flex-1 !text-xs">
                        <div
                          className={`!flex !items-center !justify-between !border-b !px-3 !py-2 ${
                            item?._isInvalid ? "!bg-[#fff1f0]" : "!bg-[#f5f7fb]"
                          }`}
                        >
                          <Text strong>
                            {start ? dayjs(start).format("DD-MM-YYYY") : "--"}
                          </Text>
                          <div
                            className={`!rounded !px-3 !py-1 !text-white !font-semibold ${
                              item?._isInvalid
                                ? "!bg-[#cf1322]"
                                : "!bg-[#1e88d8]"
                            }`}
                          >
                            {item?.BienSo || "--"}
                          </div>
                        </div>
                        <div
                          className={`!grid !grid-cols-2 !px-3 !py-2 ${
                            item?._isInvalid ? "!bg-[#fff1f0]" : ""
                          }`}
                        >
                          <span>
                            {start ? dayjs(start).format("HH:mm") : "--"} -{" "}
                            {end ? dayjs(end).format("HH:mm") : "--"}
                          </span>
                          <div className="!text-right">
                            {formatDurationFromSeconds(item?.TongThoiGian)} |{" "}
                            {toNumber(item?.TongQuangDuong).toFixed(2)} km
                          </div>
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
    </Modal>
  );
};

export default DatJourneyModal;
