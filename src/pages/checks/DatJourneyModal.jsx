import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Card, Empty, Image, Modal, Spin, Typography } from "antd";

const { Text } = Typography;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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
  rows = [],
}) => {
  const totalDistance = useMemo(
    () => rows.reduce((sum, item) => sum + toNumber(item?.TongQuangDuong), 0),
    [rows],
  );

  const totalSeconds = useMemo(
    () => rows.reduce((sum, item) => sum + toNumber(item?.TongThoiGian), 0),
    [rows],
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
                  {student?.user?.name || "Không rõ tên"}
                </span>
              </div>
              <div className="!mb-1 !text-xs">
                Mã học viên: {student?.user?.admission_code || "--"}
              </div>
              <div className="!mb-1 !text-xs">Khóa: {courseLabel || "--"}</div>
              <div className="!text-xs">
                Ngày sinh: {student?.user?.birth_year || "--"}
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

        {rows.length > 0 ? (
          <>
            <Card bodyStyle={{ padding: 8 }} className="!mb-3 !bg-[#dff4f7]">
              <div className="!grid !grid-cols-2 !text-center">
                <Text strong>Tổng Km: {totalDistance.toFixed(2)} km</Text>
                <Text strong>
                  Tổng giờ: {formatDurationFromSeconds(totalSeconds)}'
                </Text>
              </div>
            </Card>

            <div className="!space-y-2 !overflow-y-auto !max-h-[60vh]">
              {rows.map((item, index) => {
                const start = item?.ThoiDiemDangNhap;
                const end = item?.ThoiDiemDangXuat;
                return (
                  <Card key={item?.ID || index} bodyStyle={{ padding: 0 }}>
                    <div className="!flex">
                      <div className="!w-8 !bg-[#1e88d8] !text-center !text-xs !font-semibold !text-white !py-3">
                        {index + 1}
                      </div>
                      <div className="!flex-1 !text-xs">
                        <div className="!flex !items-center !justify-between !border-b !bg-[#f5f7fb] !px-3 !py-2">
                          <Text strong>
                            {start ? dayjs(start).format("DD-MM-YYYY") : "--"}
                          </Text>
                          <div className="!rounded !bg-[#1e88d8] !px-3 !py-1 !text-white !font-semibold">
                            {item?.BienSo || "--"}
                          </div>
                        </div>
                        <div className="!grid !grid-cols-2 !px-3 !py-2">
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
