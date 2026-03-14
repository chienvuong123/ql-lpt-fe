/* eslint-disable react-hooks/set-state-in-effect */
import { Modal, Input, Button, Typography } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const { Paragraph, Text } = Typography;

export default function ConfigModal({
  open,
  onCancel,
  onSubmit,
  actionType = "approve",
  mode = "edit",
  initialReason = "",
  updatedAt = "",
  updatedBy = "",
}) {
  const [reason, setReason] = useState("");

  const isApprove = actionType === "approve";
  const isViewMode = mode === "view";

  const title = isViewMode
    ? "Ghi chú"
    : isApprove
      ? "Lý do duyệt"
      : "Lý do hủy";
  const placeholder = isApprove ? "Nhập lý do duyệt..." : "Nhập lý do hủy...";
  const submitText = isApprove ? "Duyệt" : "Hủy";

  useEffect(() => {
    if (open) {
      setReason(initialReason || "");
    }
  }, [initialReason, open]);

  const handleSubmit = () => {
    if (isViewMode) return;
    onSubmit(reason);
  };

  const formattedUpdatedAt = dayjs(updatedAt).isValid()
    ? dayjs(updatedAt).format("DD-MM-YYYY HH:mm:ss")
    : "";

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onCancel}
      centered
      title={<span className="text-lg font-semibold">{title}</span>}
    >
      <div className="mt-4 space-y-4">
        {isViewMode ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <Paragraph className="!mb-0 whitespace-pre-wrap">
              {reason || "Khong co ghi chu"}
            </Paragraph>
          </div>
        ) : (
          <Input
            placeholder={placeholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        {isViewMode && (formattedUpdatedAt || updatedBy) ? (
          <div className="space-y-1 rounded-md border border-gray-200 bg-white px-3 py-2">
            {formattedUpdatedAt ? (
              <Text className="!block !text-xs !text-gray-500">
                Thời gian thay đổi: {formattedUpdatedAt}
              </Text>
            ) : null}
            {updatedBy ? (
              <Text className="!block !text-xs !text-gray-500">
                Người thay đổi: {updatedBy}
              </Text>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex justify-end gap-2">
          <Button onClick={onCancel}>Đóng</Button>
          {!isViewMode && (
            <Button
              type={isApprove ? "primary" : "default"}
              danger={!isApprove}
              onClick={handleSubmit}
              disabled={!reason.trim()}
            >
              {submitText}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
