import { useEffect, useState } from "react";
import { AutoComplete, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { kgTaoLop, kgSuaLop, errMsg } from "../../apis/apiTiepSinh";
import { HANG_OPTIONS } from "../tiep-sinh/tiepSinhShared";
import { C } from "./xepLopShared";

const TRONG = {
  hang: undefined, khoa: "", ngay_khai_giang: null, co_so: "", suc_chua: 40, si_so_toi_thieu: null, ghi_chu: "",
  nguoi_phu_trach: "", phong_hoc: "", xe_thuc_hanh: "", giao_vien: "", cv_xe: false, cv_giao_vien: false, cv_tai_lieu: false,
};

/** Tạo / sửa lớp khai giảng: thông tin lớp + công việc chuẩn bị */
export default function KhaiGiangLopModal({ open, lop, goiY = {}, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(lop ? { ...TRONG, ...lop, ngay_khai_giang: lop.ngay_khai_giang ? dayjs(lop.ngay_khai_giang) : null } : TRONG);
  }, [open, lop, form]);

  const hangOptions = [...new Set([...HANG_OPTIONS.map((h) => h.value), "B1", "B2", "C1", "C", "D1", "D", ...(goiY.hang || [])])].map((v) => ({
    value: v,
    label: HANG_OPTIONS.find((h) => h.value === v)?.label || v,
  }));
  const ac = (list = []) => [...new Set(list.filter(Boolean))].map((v) => ({ value: v }));

  const luu = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      const body = { ...v, ngay_khai_giang: v.ngay_khai_giang ? v.ngay_khai_giang.format("YYYY-MM-DD") : null };
      const r = lop ? await kgSuaLop(lop.id, body) : await kgTaoLop(body);
      message.success(lop ? "Đã cập nhật lớp" : "Đã tạo lớp khai giảng mới");
      onSaved?.(r.data);
    } catch (e) {
      message.error(errMsg(e, "Lưu lớp thất bại"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} onOk={luu} confirmLoading={saving} destroyOnHidden width={720}
      title={lop ? `Chỉnh sửa lớp ${lop.hang} - ${lop.khoa}` : "Tạo lớp khai giảng mới"} okText={lop ? "Lưu" : "Tạo lớp"} cancelText="Huỷ">
      <Form form={form} layout="vertical" className="mt-3">
        <div className="mb-2 text-[14px] font-bold" style={{ color: C.title }}>Thông tin lớp học</div>
        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item name="hang" label="Hạng đào tạo" rules={[{ required: true, message: "Chọn hạng" }]}>
            <Select options={hangOptions} placeholder="Chọn hạng" disabled={!!lop?.si_so} showSearch />
          </Form.Item>
          <Form.Item name="khoa" label="Khoá" rules={[{ required: true, whitespace: true, message: "Nhập tên khoá" }]}>
            <Input placeholder="VD: K26/2025" maxLength={50} />
          </Form.Item>
          <Form.Item name="ngay_khai_giang" label="Ngày dự kiến khai giảng">
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
          <Form.Item name="suc_chua" label="Sĩ số tối đa" rules={[{ required: true, message: "Nhập sĩ số tối đa" }]}>
            <InputNumber className="!w-full" min={Math.max(1, lop?.si_so || 0)} max={500} />
          </Form.Item>
          <Form.Item name="si_so_toi_thieu" label="Sĩ số tối thiểu để khai giảng" tooltip="Để trống = 90% sĩ số tối đa">
            <InputNumber className="!w-full" min={1} max={500} placeholder="Mặc định 90%" />
          </Form.Item>
          <Form.Item name="co_so" label="Cơ sở">
            <AutoComplete options={ac(goiY.co_so)} placeholder="VD: Cơ sở 1" />
          </Form.Item>
          <Form.Item name="nguoi_phu_trach" label="Người phụ trách">
            <AutoComplete options={ac(goiY.nguoi_phu_trach)} placeholder="Họ tên" />
          </Form.Item>
          <Form.Item name="phong_hoc" label="Phòng học">
            <AutoComplete options={ac(goiY.phong_hoc)} placeholder="VD: Phòng 01 (Nhà đào tạo)" />
          </Form.Item>
          <Form.Item name="xe_thuc_hanh" label="Xe thực hành">
            <Input placeholder="VD: Xe 01, 02, 03" />
          </Form.Item>
          <Form.Item name="giao_vien" label="Giáo viên giảng dạy" className="col-span-2">
            <Input placeholder="Họ tên giáo viên" />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Ghi chú">
            <Input maxLength={500} />
          </Form.Item>
        </div>

        <div className="mb-2 mt-1 text-[14px] font-bold" style={{ color: C.title }}>Công việc chuẩn bị khai giảng</div>
        <div className="grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: C.bg2 }}>
          <Form.Item name="cv_xe" valuePropName="checked" className="!mb-0"><Checkbox>Đã xác nhận xe thực hành</Checkbox></Form.Item>
          <Form.Item name="cv_giao_vien" valuePropName="checked" className="!mb-0"><Checkbox>Đã phân công giáo viên</Checkbox></Form.Item>
          <Form.Item name="cv_tai_lieu" valuePropName="checked" className="!mb-0"><Checkbox>Đã chuẩn bị tài liệu</Checkbox></Form.Item>
        </div>
        <div className="mt-2 text-[12px]" style={{ color: C.sub }}>
          "Danh sách học viên" tự đạt khi đủ sĩ số tối thiểu; "Phòng học" tự đạt khi đã nhập phòng.
        </div>
      </Form>
    </Modal>
  );
}
