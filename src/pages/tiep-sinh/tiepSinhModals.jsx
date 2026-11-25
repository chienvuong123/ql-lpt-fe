import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Empty, Form, Input, InputNumber, Modal, QRCode, Spin, Tabs, Upload, message } from "antd";
import { SyncOutlined, SettingOutlined, DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import { FaDesktop } from "react-icons/fa";
import dayjs from "dayjs";
import {
  getCauHinhTiepSinh, luuCauHinhTiepSinh, dongBoGoogleSheetTiepSinh, importExcelTiepSinh, errMsg,
} from "../../apis/apiTiepSinh";
import { BLUE, BLUE_DARK, LOAI_HINH_OPTIONS } from "./tiepSinhShared";

const MONEY = {
  className: "!w-full",
  min: 0,
  step: 100000,
  addonAfter: "đ",
  placeholder: "VD: 2.500.000",
  formatter: (v) => (v === undefined || v === null || v === "" ? "" : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")),
  parser: (v) => String(v || "").replace(/[^\d]/g, ""),
};

// ─── Modal cấu hình / đồng bộ / QR ─────────────────────────────
export function CauHinhModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["tiep-sinh-cau-hinh"], queryFn: getCauHinhTiepSinh, enabled: open });
  useEffect(() => {
    if (open && data?.data) form.setFieldsValue(data.data);
  }, [open, data, form]);
  const save = async () => {
    setSaving(true);
    try {
      await luuCauHinhTiepSinh(form.getFieldsValue());
      qc.invalidateQueries({ queryKey: ["tiep-sinh-cau-hinh"] });
      message.success("Đã lưu cấu hình");
      onClose();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onCancel={onClose} onOk={save} okText="Lưu" confirmLoading={saving} title="Cấu hình tiếp nhận hồ sơ" destroyOnHidden width={620}>
      <Form form={form} layout="vertical">
        <Form.Item name="google_form_url" label="Link biểu mẫu Google Form cho học viên tự khai" extra="Dùng để tạo mã QR dán tại phòng tiếp sinh và mở trên máy tính khai hồ sơ.">
          <Input placeholder="https://forms.gle/..." />
        </Form.Item>
        <Form.Item name="spreadsheet_id" label="Google Sheet nhận câu trả lời (link hoặc ID)" extra="Chia sẻ quyền xem Sheet cho tài khoản Google mà máy chủ đang dùng để đọc Sheet.">
          <Input placeholder="https://docs.google.com/spreadsheets/d/..../edit#gid=0" />
        </Form.Item>
        <Form.Item name="gid" label="gid của tab (để trống = tab đầu tiên)">
          <Input placeholder="0" />
        </Form.Item>
        <Form.Item name="apps_script_url" label="Link Apps Script của Sheet (Web app /exec)" extra="Đọc Sheet bằng chính tài khoản Google tạo script — không cần cấp quyền cho máy chủ. Ưu tiên dùng khi có.">
          <Input placeholder="https://script.google.com/macros/s/..../exec" />
        </Form.Item>
        <Form.Item name="apps_script_key" label="Mã bí mật Apps Script (giống KEY trong script)">
          <Input.Password placeholder="KEY" />
        </Form.Item>
        <div className="mb-2 mt-1 font-semibold" style={{ color: BLUE_DARK }}>Bảng giá — số tiền phải thu (VNĐ)</div>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          {LOAI_HINH_OPTIONS.map((o) => (
            <Form.Item key={o.giaKey} name={o.giaKey} label={o.label}>
              <InputNumber {...MONEY} />
            </Form.Item>
          ))}
          <Form.Item name="phi_kham_suc_khoe" label="Phí khám sức khoẻ (khám theo lịch trung tâm)">
            <InputNumber {...MONEY} />
          </Form.Item>
          <Form.Item name="giam_tru_gplx" label="Giảm trừ học phí khi HV đã có GPLX ô tô">
            <InputNumber {...MONEY} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

function KetQuaDongBo({ r }) {
  if (!r) return null;
  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        <div>Tổng dòng: <b>{r.tong_dong}</b></div>
        <div className="text-green-600">Thêm mới: <b>{r.them_moi}</b></div>
        <div className="text-blue-600">Bổ sung: <b>{r.bo_sung}</b></div>
        <div className="text-slate-500">Bỏ qua: <b>{r.bo_qua_trung + r.bo_qua_cu}</b></div>
      </div>
      {r.loi?.length > 0 && <div className="mt-2 text-red-500">{r.loi.slice(0, 5).join("; ")}</div>}
    </div>
  );
}

export function DongBoModal({ open, onClose, onDone }) {
  const [tuNgay, setTuNgay] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (open) setResult(null);
  }, [open]);
  const sync = async () => {
    setLoading(true);
    try {
      const res = await dongBoGoogleSheetTiepSinh({ tu_ngay: tuNgay?.format("YYYY-MM-DD") });
      setResult(res.data);
      message.success(`Đồng bộ xong: thêm ${res.data.them_moi} hồ sơ`);
      onDone();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  const upload = async (file) => {
    setLoading(true);
    try {
      const res = await importExcelTiepSinh(file, tuNgay?.format("YYYY-MM-DD"));
      setResult(res.data);
      message.success(`Import xong: thêm ${res.data.them_moi} hồ sơ`);
      onDone();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
    return false;
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Đồng bộ hồ sơ học viên tự khai" destroyOnHidden width={560}>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span>Lấy hồ sơ khai từ ngày</span>
        <DatePicker value={tuNgay} onChange={setTuNgay} format="DD/MM/YYYY" allowClear={false} />
      </div>
      <Tabs
        items={[
          {
            key: "sheet",
            label: "Từ Google Sheet",
            children: (
              <div>
                <p className="text-sm text-slate-500">Đọc trực tiếp Google Sheet đã cấu hình. Hồ sơ trùng CCCD chỉ được điền thêm các trường còn trống.</p>
                <Button type="primary" icon={<SyncOutlined spin={loading} />} loading={loading} onClick={sync} style={{ background: BLUE }}>
                  Đồng bộ ngay
                </Button>
              </div>
            ),
          },
          {
            key: "excel",
            label: "Từ file Excel",
            children: (
              <Upload.Dragger accept=".xlsx,.xls" showUploadList={false} beforeUpload={upload} disabled={loading}>
                <p className="text-3xl" style={{ color: BLUE }}><InboxOutlined /></p>
                <p>Kéo thả hoặc bấm chọn file Excel tải về từ Google Sheet / Google Form</p>
              </Upload.Dragger>
            ),
          },
        ]}
      />
      <KetQuaDongBo r={result} />
    </Modal>
  );
}

export function QrKhaiModal({ open, onClose, onConfig }) {
  const { data, isLoading } = useQuery({ queryKey: ["tiep-sinh-cau-hinh"], queryFn: getCauHinhTiepSinh, enabled: open });
  const url = data?.data?.google_form_url;
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Mã QR biểu mẫu khai hồ sơ" destroyOnHidden width={420}>
      {isLoading ? (
        <div className="py-10 text-center"><Spin /></div>
      ) : !url ? (
        <Empty description="Chưa cấu hình link Google Form">
          <Button onClick={onConfig} icon={<SettingOutlined />}>Cấu hình</Button>
        </Empty>
      ) : (
        <div id="qr-khai-ho-so" className="flex flex-col items-center gap-3 text-center">
          <div className="text-lg font-bold" style={{ color: BLUE_DARK }}>QUÉT MÃ ĐỂ KHAI HỒ SƠ HỌC LÁI XE MÔ TÔ</div>
          <QRCode value={url} size={260} color={BLUE_DARK} bordered={false} />
          <div className="break-all text-xs text-slate-400">{url}</div>
          <div className="flex gap-2">
            <Button icon={<FaDesktop />} onClick={() => window.open(url, "_blank", "noopener")}>Mở trên máy này</Button>
            <Button icon={<DownloadOutlined />} onClick={() => {
              const canvas = document.querySelector("#qr-khai-ho-so canvas");
              if (!canvas) return;
              const a = document.createElement("a");
              a.href = canvas.toDataURL("image/png");
              a.download = "QR-khai-ho-so.png";
              a.click();
            }}>Tải ảnh QR</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

