import React from "react";
import { Modal, InputNumber } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const CabinLimitModal = ({
  open,
  onOk,
  onCancel,
  tempLimit,
  setTempLimit,
  globalConfig,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <SettingOutlined />
          Cài đặt giới hạn Cabin
        </div>
      }
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      width={420}
    >
      <div className="py-4 space-y-6">
        {/* Max per cabin */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-1">
            Số học viên tối đa / cabin
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Mỗi slot cabin chỉ cho phép tối đa số học viên này (gộp nhóm hay xếp
            riêng đều không vượt quá).
          </div>
          <InputNumber
            min={1}
            max={10}
            value={tempLimit.maxPerCabin}
            onChange={(v) => setTempLimit((p) => ({ ...p, maxPerCabin: v }))}
            addonAfter="HV"
            style={{ width: "100%" }}
          />
        </div>

        {/* Interval */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-1">
            Khoảng cách giữa các học viên
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Thời gian chờ giữa 2 học viên liên tiếp trong cùng 1 cabin. Công
            thức:{" "}
            <code className="bg-gray-100 px-1 rounded">
              Tổng = Σ(phút học) + (n-1) × khoảng_cách
            </code>
          </div>
          <InputNumber
            min={0}
            max={60}
            value={tempLimit.intervalMinutes}
            onChange={(v) =>
              setTempLimit((p) => ({ ...p, intervalMinutes: v }))
            }
            addonAfter="phút"
            style={{ width: "100%" }}
          />
        </div>

        {/* Preview */}
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
          <div className="font-semibold mb-1">
            Ví dụ: ca {globalConfig.duration} phút, mỗi HV còn thiếu 30 phút:
          </div>
          <div className="text-gray-500 mb-1 italic">
            Công thức: Σ(phút còn thiếu) + (n−1) × khoảng_cách ≤ độ dài ca
          </div>

          {[2, 3, 4]
            .filter((n) => n <= tempLimit.maxPerCabin)
            .map((n) => {
              const eachNeeded = 30;
              const total =
                n * eachNeeded + (n - 1) * tempLimit.intervalMinutes;

              return (
                <div key={n}>
                  {n} HV × 30ph thiếu + {n - 1} khoảng ×{" "}
                  {tempLimit.intervalMinutes}ph = <b>{total} phút</b>
                  {total <= globalConfig.duration ? (
                    <span className="text-green-700"> ✓ hợp lệ</span>
                  ) : (
                    <span className="text-red-600">
                      {" "}
                      ✗ vượt ca ({globalConfig.duration}ph)
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </Modal>
  );
};

export default CabinLimitModal;
