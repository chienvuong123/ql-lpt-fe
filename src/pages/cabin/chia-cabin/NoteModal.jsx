import React, { useState, useEffect } from "react";
import { Modal, Input } from "antd";

/**
 * CabinNoteModal component for adding/editing notes.
 * optimized with local state to prevent laggy typing.
 */
export const CabinNoteModal = ({
  visible,
  slotKey,
  initialNote, // The existing note content
  isAddMode,   // True if triggered by '+' button
  onCancel,
  onSave,      // Callback: (newNoteContent) => void
}) => {
  const [localNote, setLocalNote] = useState("");

  // Update local state when modal opens or initialNote changes
  useEffect(() => {
    if (visible) {
      setLocalNote(isAddMode ? "" : (initialNote || ""));
    }
  }, [visible, initialNote, isAddMode]);

  const handleOk = () => {
    let finalNote = localNote;
    if (isAddMode && initialNote) {
      // Append if adding a new note to existing content
      finalNote = `${initialNote}\n${localNote}`.trim();
    }
    onSave(finalNote);
  };

  return (
    <Modal
      title={isAddMode ? "Thêm ghi chú mới" : (slotKey ? "Ghi chú Cabin" : "Xem/Sửa ghi chú")}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <div className="py-2">
        {isAddMode && initialNote && (
          <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Ghi chú hiện tại:</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{initialNote}</p>
          </div>
        )}
        <p className="text-gray-500 mb-2 text-xs">
          {isAddMode ? "Nhập thêm nội dung ghi chú mới:" : "Nội dung ghi chú hiện tại:"}
        </p>
        <Input.TextArea
          rows={5}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          placeholder={isAddMode ? "Nhập nội dung mới tại đây..." : "Nội dung ghi chú..."}
          autoFocus
        />
      </div>
    </Modal>
  );
};

export default CabinNoteModal;
