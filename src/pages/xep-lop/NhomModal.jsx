import { useEffect, useMemo, useState } from "react";
import { AutoComplete, Form, Modal, message } from "antd";
import dayjs from "dayjs";
import { tdTaoNhom, tdSuaNhom, errMsg } from "../../apis/apiTiepSinh";
import { C } from "./xepLopShared";

/** Thêm / sửa nhóm giáo viên – xe. Chọn giáo viên -> tự gợi ý xe giáo viên đó hay dùng */
export default function NhomModal({ open, lopId, hang, nhom, goiY, batBuocXe, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) form.setFieldsValue({ giao_vien: nhom?.giao_vien || "", xe: nhom?.xe || "" });
  }, [open, nhom, form]);

  const gvOptions = useMemo(() => (goiY?.giao_vien || []).map((g) => ({
    value: g.ten,
    label: (
      <span className="flex justify-between gap-3">
        <span>{g.ten}</span>
        <span style={{ color: C.sub }}>{[g.xe_b1, g.xe_b2].filter(Boolean).join(" · ")}</span>
      </span>
    ),
  })), [goiY]);
  const xeOptions = useMemo(() => (goiY?.xe || []).map((x) => {
    const het = x.het_han_gpxtl && x.het_han_gpxtl < dayjs().format("YYYY-MM-DD");
    return {
      value: x.bien_so_xe,
      label: (
        <span className="flex justify-between gap-3">
          <span>{x.bien_so_xe} <span style={{ color: C.sub }}>{x.nhan_hieu || ""}</span></span>
          <span style={{ color: het ? C.danger : C.sub }}>{x.het_han_gpxtl ? `GPXTL ${dayjs(x.het_han_gpxtl).format("DD/MM/YYYY")}` : ""}</span>
        </span>
      ),
    };
  }), [goiY]);

  const chonGv = (ten) => {
    if (!batBuocXe || form.getFieldValue("xe")) return;
    const g = (goiY?.giao_vien || []).find((x) => x.ten === ten);
    const xe = String(hang).toUpperCase() === "B1" ? g?.xe_b1 || g?.xe_b2 : g?.xe_b2 || g?.xe_b1;
    if (xe) form.setFieldValue("xe", xe);
  };

  const luu = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (nhom) await tdSuaNhom(lopId, nhom.id, v);
      else await tdTaoNhom(lopId, v);
      message.success(nhom ? "Đã cập nhật nhóm" : "Đã thêm nhóm");
      onSaved?.();
    } catch (e) {
      message.error(errMsg(e, "Lưu nhóm thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const loc = (input, o) => String(o.value).toLowerCase().includes(String(input).toLowerCase());
  return (
    <Modal open={open} onCancel={onClose} onOk={luu} confirmLoading={saving} destroyOnHidden width={520}
      title={nhom ? `Nhóm ${nhom.stt} — giáo viên & xe` : "Thêm nhóm giáo viên – xe"} okText="Lưu" cancelText="Huỷ">
      <Form form={form} layout="vertical" className="mt-3">
        <Form.Item name="giao_vien" label="Giáo viên" rules={[{ required: true, whitespace: true, message: "Chọn hoặc nhập giáo viên" }]}>
          <AutoComplete options={gvOptions} filterOption={loc} onSelect={chonGv} placeholder="Gõ tên giáo viên..." />
        </Form.Item>
        <Form.Item name="xe" label={`Xe tập lái${batBuocXe ? "" : " (không bắt buộc với mô tô)"}`}
          rules={batBuocXe ? [{ required: true, whitespace: true, message: "Chọn hoặc nhập biển số xe" }] : []} className="!mb-1">
          <AutoComplete options={xeOptions} filterOption={loc} placeholder="Gõ biển số..." />
        </Form.Item>
        <div className="text-[12px]" style={{ color: C.sub }}>Gợi ý lấy từ Danh sách xe và lịch sử phân công giáo viên – xe.</div>
      </Form>
    </Modal>
  );
}
