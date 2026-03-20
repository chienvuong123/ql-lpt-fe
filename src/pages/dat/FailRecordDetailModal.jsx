import { useEffect, useMemo, useState } from "react";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Card, Modal, Typography, message } from "antd";
import ConfigModal from "./ConfigModal";
import { updateDuyetTheoMaDK } from "../../apis/hocVien";

const { Text } = Typography;

const normalizeApproveFlag = (value) => {
  return (
    value === true ||
    value === 1 ||
    String(value || "").toLowerCase() === "true"
  );
};

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

const normalizeSessionIssues = (payload = {}) => {
  const candidates = [
    payload?.sessionErrors,
    payload?.session_errors,
    payload?.invalidSessions,
    payload?.invalid_sessions,
    payload?.sessionIssues,
    payload?.session_issues,
    payload?.phienLoi,
    payload?.loiPhien,
  ];

  const list = candidates.find((item) => Array.isArray(item)) || [];

  return list.map((item, index) => ({
    key:
      item?.id ||
      item?.ID ||
      item?.phien_hoc_id ||
      item?.sessionId ||
      `session-issue-${index}`,
    label:
      item?.label ||
      item?.title ||
      item?.ten_loi ||
      item?.error ||
      `Phiên ${index + 1}`,
    message: item?.message || item?.detail || item?.mo_ta || item?.reason || "",
  }));
};

const ACTIONS = [
  { key: "duyet_tong", label: "Tổng" },
  { key: "duyet_dem", label: "Đêm" },
  { key: "duyet_tu_dong", label: "Tự động" },
];

const reasonFieldMap = {
  duyet_tong: "ly_do_tong",
  duyet_dem: "ly_do_dem",
  duyet_tu_dong: "ly_do_td",
};

const getApproveKeyForError = (item = {}) => {
  const normalizedKey = String(item?.key || item?.type || "").toLowerCase();
  const normalizedText =
    `${item?.label || ""} ${item?.message || ""}`.toLowerCase();

  if (
    normalizedKey.includes("tu_dong") ||
    normalizedKey.includes("tudong") ||
    normalizedText.includes("tự động") ||
    normalizedText.includes("tu dong")
  ) {
    return "duyet_tu_dong";
  }

  if (
    normalizedKey.includes("dem") ||
    normalizedText.includes("ban đêm") ||
    normalizedText.includes("ban dem") ||
    normalizedText.includes("đêm") ||
    normalizedText.includes("dem")
  ) {
    return "duyet_dem";
  }

  return "duyet_tong";
};

const FailRecordDetailModal = ({ open, record, onCancel, onUpdated }) => {
  const [currentRecord, setCurrentRecord] = useState(record);
  const [actionKey, setActionKey] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [configMode, setConfigMode] = useState("edit");
  const [actionType, setActionType] = useState("approve");
  const [selectedApproveKey, setSelectedApproveKey] = useState("");

  useEffect(() => {
    setCurrentRecord(record || null);
  }, [record]);

  const approveReasons = useMemo(
    () => normalizeApproveReasons(currentRecord),
    [currentRecord],
  );

  const approveMeta = useMemo(
    () => normalizeApproveMeta(currentRecord),
    [currentRecord],
  );

  const sessionIssues = useMemo(
    () => normalizeSessionIssues(currentRecord),
    [currentRecord],
  );

  const handleOpenApproveModal = (key, nextActionType) => {
    setSelectedApproveKey(key);
    setActionType(nextActionType);
    setConfigMode("edit");
    setConfigOpen(true);
  };

  const handleSubmitConfig = async (value) => {
    if (!currentRecord?.maDK || !selectedApproveKey) return;

    const nextApproved = actionType === "approve";
    const reasonField = reasonFieldMap[selectedApproveKey];

    try {
      setActionKey(selectedApproveKey);
      const payload = {
        ma_dk: currentRecord.maDK,
        [selectedApproveKey]: nextApproved,
        [reasonField]: value,
        value,
      };

      const response = await updateDuyetTheoMaDK(payload);
      if (response?.success === false) {
        throw new Error(response?.message || "Cập nhật duyệt thất bại.");
      }

      const nextRecord = {
        ...currentRecord,
        [selectedApproveKey]: nextApproved,
        [reasonField]: value,
        thoi_gian_thay_doi: new Date().toISOString(),
        nguoi_thay_doi:
          sessionStorage.getItem("name") ||
          sessionStorage.getItem("username") ||
          "",
      };

      setCurrentRecord(nextRecord);
      setConfigOpen(false);
      message.success(nextApproved ? "Đã duyệt." : "Đã hủy duyệt.");
      await onUpdated?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Cập nhật duyệt thất bại.",
      );
    } finally {
      setActionKey("");
    }
  };

  return (
    <>
      <Modal
        title="Chi tiết học viên"
        open={open}
        onCancel={onCancel}
        footer={null}
        width={900}
      >
        {currentRecord ? (
          <div className="space-y-4">
            <Card size="small" className="!mb-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <Text strong>Học viên: </Text>
                  <Text>{currentRecord?.hoTen || "-"}</Text>
                </div>
                <div>
                  <Text strong>Mã ĐK: </Text>
                  <Text>{currentRecord?.maDK || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tên khóa học: </Text>
                  <Text>{currentRecord?.studentInfo?.khoaHoc || "-"}</Text>
                </div>
                <div>
                  <Text strong>Hạng đào tạo: </Text>
                  <Text>{currentRecord?.hangDaoTao || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tổng phiên: </Text>
                  <Text>{currentRecord?.totalSessions ?? "-"}</Text>
                </div>
                <div>
                  <Text strong>Giáo viên: </Text>
                  <Text>{currentRecord?.studentInfo?.giaoVien || "-"}</Text>
                </div>
                <div>
                  <Text strong>Xe B1: </Text>
                  <Text>{currentRecord?.studentInfo?.xeB1 || "-"}</Text>
                </div>
                <div>
                  <Text strong>Xe B2: </Text>
                  <Text>{currentRecord?.studentInfo?.xeB2 || "-"}</Text>
                </div>
              </div>
            </Card>

            <Card size="small" title="Lỗi" className="!mb-3">
              {currentRecord?.errors?.length > 0 ? (
                <div className="space-y-2">
                  {currentRecord.errors.map((item, index) => (
                    <div
                      key={`${item?.label}-${index}`}
                      className="flex items-start justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2"
                    >
                      <div className="flex-1">
                        <Text strong>{item?.label || "Lỗi"}: </Text>
                        <Text>{item?.message || "-"}</Text>
                      </div>
                      <Button
                        size="small"
                        type={
                          normalizeApproveFlag(
                            currentRecord?.[getApproveKeyForError(item)],
                          )
                            ? "default"
                            : "primary"
                        }
                        danger={normalizeApproveFlag(
                          currentRecord?.[getApproveKeyForError(item)],
                        )}
                        loading={actionKey === getApproveKeyForError(item)}
                        onClick={() => {
                          const approveKey = getApproveKeyForError(item);
                          const isApproved = normalizeApproveFlag(
                            currentRecord?.[approveKey],
                          );

                          handleOpenApproveModal(
                            approveKey,
                            isApproved ? "reject" : "approve",
                          );
                        }}
                      >
                        {normalizeApproveFlag(
                          currentRecord?.[getApproveKeyForError(item)],
                        )
                          ? "Hủy"
                          : "Duyệt"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">Không có lỗi.</Text>
              )}
            </Card>

            <Card size="small" title="Lỗi phiên" className="!mb-3">
              {sessionIssues.length > 0 ? (
                <div className="space-y-2">
                  {sessionIssues.map((item) => (
                    <div
                      key={item.key}
                      className="rounded border border-orange-200 bg-orange-50 px-3 py-2"
                    >
                      <Text strong>{item.label}: </Text>
                      <Text>{item.message || "-"}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">Không có lỗi phiên.</Text>
              )}
            </Card>

            <Card size="small" title="Cảnh báo">
              {currentRecord?.warnings?.length > 0 ? (
                <div className="space-y-2">
                  {currentRecord.warnings.map((item, index) => (
                    <div
                      key={`${item?.label}-${index}`}
                      className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2"
                    >
                      <Text strong>{item?.label || "Cảnh báo"}: </Text>
                      <Text>{item?.message || "-"}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">Không có cảnh báo.</Text>
              )}
            </Card>
          </div>
        ) : null}
      </Modal>

      <ConfigModal
        open={configOpen}
        onCancel={() => setConfigOpen(false)}
        onSubmit={handleSubmitConfig}
        actionType={actionType}
        mode={configMode}
        initialReason={
          selectedApproveKey ? approveReasons[selectedApproveKey] : ""
        }
        updatedAt={
          selectedApproveKey ? approveMeta[selectedApproveKey]?.updatedAt : ""
        }
        updatedBy={
          selectedApproveKey ? approveMeta[selectedApproveKey]?.updatedBy : ""
        }
      />
    </>
  );
};

export default FailRecordDetailModal;
