import { useEffect, useState } from "react";
import { AutoComplete, DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { xlTaoLop, xlSuaLop, errMsg } from "../../apis/apiTiepSinh";
import { HANG_OPTIONS } from "../tiep-sinh/tiepSinhShared";

/** Tạo / sửa lớp dự kiến */
export default function LopModal({ open, lop, coSoGoiY = [], hangGoiY = [], onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      lop
        ? { ...lop, ngay_khai_giang: lop.ngay_khai_giang ? dayjs(lop.ngay_khai_giang) : null }
        : { hang: undefined, khoa: "", ngay_khai_giang: null, co_so: "", suc_chua: 40, ghi_chu: "" },
    );
  }, [open, lop, form]);

  const hangOptions = [...new Set([...HANG_OPTIONS.map((h) => h.value), ...hangGoiY])].map((v) => ({
    value: v,
    label: HANG_OPTIONS.find((h) => h.value === v)?.label || v,
  }));

  const luu = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      const body = { ...v, ngay_khai_giang: v.ngay_khai_giang ? v.ngay_khai_giang.format("YYYY-MM-DD") : null };
      const r = lop ? await xlSuaLop(lop.id, body) : await xlTaoLop(body);
      message.success(lop ? "Đã cập nhật lớp" : "Đã tạo lớp mới");
      onSaved?.(r.data);
    } catch (e) {
      message.error(errMsg(e, "Lưu lớp thất bại"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} onOk={luu} confirmLoading={saving} destroyOnHidden
      title={lop ? "Sửa lớp dự kiến" : "Tạo lớp mới"} okText={lop ? "Lưu" : "Tạo lớp"} cancelText="Huỷ" width={520}>
      <Form form={form} layout="vertical" className="mt-3">
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="hang" label="Hạng" rules={[{ required: true, message: "Chọn hạng" }]}>
            <Select options={hangOptions} placeholder="Chọn hạng" disabled={!!lop?.si_so} />
          </Form.Item>
          <Form.Item name="khoa" label="Khoá" rules={[{ required: true, whitespace: true, message: "Nhập tên khoá" }]}>
            <Input placeholder="VD: K25" maxLength={50} />
          </Form.Item>
          <Form.Item name="ngay_khai_giang" label="Ngày khai giảng">
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
          <Form.Item name="suc_chua" label="Sức chứa tối đa" rules={[{ required: true, message: "Nhập sức chứa" }]}>
            <InputNumber className="!w-full" min={Math.max(1, lop?.si_so || 0)} max={500} addonAfter="học viên" />
          </Form.Item>
        </div>
        <Form.Item name="co_so" label="Cơ sở">
          <AutoComplete options={coSoGoiY.map((v) => ({ value: v }))} placeholder="VD: Cơ sở 1"
            filterOption={(i, o) => String(o.value).toLowerCase().includes(i.toLowerCase())} />
        </Form.Item>
        <Form.Item name="ghi_chu" label="Ghi chú" className="!mb-0">
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
