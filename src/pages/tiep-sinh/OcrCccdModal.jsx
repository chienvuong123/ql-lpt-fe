// Nhập thông tin từ ảnh CCCD: ảnh chụp thẻ (mặt trước/sau) hoặc ảnh chụp màn hình VNeID.
// Ưu tiên đọc mã QR trên ảnh (chính xác tuyệt đối), không có QR thì gửi máy chủ OCR.
import { useEffect, useState } from "react";
import { Alert, Button, Descriptions, Modal, Spin, Tag, Upload, message } from "antd";
import { InboxOutlined, DeleteOutlined, ScanOutlined, CheckOutlined } from "@ant-design/icons";
import jsQR from "jsqr";
import { ocrAnhCccd, errMsg } from "../../apis/apiTiepSinh";
import { parseCccdQr, fmtDate } from "./tiepSinhShared";

const MAX_FILES = 2;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không mở được ảnh"));
    };
    img.src = url;
  });
}

/** Tìm mã QR CCCD trong ảnh (thử vài kích thước) */
async function docQrTuAnh(file) {
  const { img, url } = await loadImage(file);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    for (const maxW of [1600, 1000, 2400]) {
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
      const data = code && parseCccdQr(code.data);
      if (data) return data;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const FIELDS = [
  ["ho_ten", "Họ và tên"],
  ["cccd", "Số CCCD"],
  ["ngay_sinh", "Ngày sinh", fmtDate],
  ["gioi_tinh", "Giới tính"],
  ["ngay_cap_cccd", "Ngày cấp", fmtDate],
  ["noi_cap", "Nơi cấp"],
  ["dia_chi", "Nơi thường trú"],
];

export default function OcrCccdModal({ open, onClose, onResult }) {
  const [files, setFiles] = useState([]); // { file, url }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { data, nguon }

  const reset = () => {
    setFiles((fs) => {
      fs.forEach((f) => URL.revokeObjectURL(f.url));
      return [];
    });
    setResult(null);
  };

  const addFiles = (list) => {
    const imgs = [...list].filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) return;
    setResult(null);
    setFiles((fs) => {
      const next = [...fs, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file) }))];
      next.slice(MAX_FILES).forEach((f) => URL.revokeObjectURL(f.url));
      return next.slice(0, MAX_FILES);
    });
  };

  // Dán ảnh bằng Ctrl+V (vd chụp màn hình VNeID gửi qua Zalo rồi copy)
  useEffect(() => {
    if (!open) return undefined;
    const onPaste = (e) => {
      const items = [...(e.clipboardData?.files || [])];
      if (items.length) addFiles(items);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open]);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const doc = async () => {
    if (!files.length) return message.warning("Chọn hoặc dán ảnh CCCD trước");
    setLoading(true);
    try {
      // 1) mã QR
      for (const f of files) {
        const qr = await docQrTuAnh(f.file).catch(() => null);
        if (qr) {
          setResult({ data: qr, nguon: "qr" });
          return;
        }
      }
      // 2) OCR trên máy chủ
      const res = await ocrAnhCccd(files.map((f) => f.file));
      const data = res?.data?.data || {};
      if (!Object.keys(data).length) {
        message.error("Không đọc được thông tin — hãy chụp rõ, thẳng, đủ sáng");
        return;
      }
      setResult({ data, nguon: res?.data?.nguon === "qr" ? "qr" : "ocr", tinCay: res?.data?.do_tin_cay });
    } catch (e) {
      message.error(errMsg(e, "Đọc ảnh thất bại"));
    } finally {
      setLoading(false);
    }
  };

  const thieu = result ? FIELDS.filter(([k]) => !result.data[k]).map(([, l]) => l) : [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span><ScanOutlined /> Nhập thông tin từ ảnh CCCD</span>}
      width={720}
      destroyOnHidden
      footer={[
        <Button key="close" onClick={onClose}>Đóng</Button>,
        <Button key="read" icon={<ScanOutlined />} loading={loading} disabled={!files.length} onClick={doc}>
          Đọc thông tin
        </Button>,
        <Button key="ok" type="primary" icon={<CheckOutlined />} disabled={!result} onClick={() => onResult(result.data, result.nguon)}>
          Điền vào hồ sơ
        </Button>,
      ]}
    >
      <Spin spinning={loading} tip="Đang đọc ảnh...">
        <div className="flex flex-col gap-3">
          <Upload.Dragger
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={(_, list) => {
              if (list[0] === _) addFiles(list);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Kéo thả, bấm để chọn, hoặc <b>Ctrl+V</b> để dán ảnh</p>
            <p className="ant-upload-hint">
              Ảnh chụp thẻ CCCD (mặt trước, mặt sau) hoặc ảnh chụp màn hình VNeID — tối đa {MAX_FILES} ảnh
            </p>
          </Upload.Dragger>

          {!!files.length && (
            <div className="flex flex-wrap gap-3">
              {files.map((f) => (
                <div key={f.url} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img src={f.url} alt="Ảnh CCCD đã chọn" className="block h-32 w-auto max-w-[220px] object-contain" />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    className="!absolute right-1 top-1"
                    aria-label="Bỏ ảnh"
                    onClick={() => {
                      URL.revokeObjectURL(f.url);
                      setFiles((fs) => fs.filter((x) => x !== f));
                      setResult(null);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {result && (
            <>
              <Alert
                type={result.nguon === "qr" ? "success" : "warning"}
                showIcon
                title={
                  result.nguon === "qr"
                    ? "Đọc từ mã QR trên thẻ — thông tin chính xác"
                    : `Đọc bằng nhận dạng chữ (OCR${result.tinCay ? `, độ tin cậy ${result.tinCay}%` : ""}) — vui lòng kiểm tra lại trước khi lưu`
                }
              />
              <Descriptions size="small" bordered column={1}>
                {FIELDS.map(([k, label, fmt]) => (
                  <Descriptions.Item key={k} label={label}>
                    {result.data[k] ? <b>{fmt ? fmt(result.data[k]) : result.data[k]}</b> : <Tag>Không đọc được</Tag>}
                  </Descriptions.Item>
                ))}
              </Descriptions>
              {!!thieu.length && (
                <div className="text-sm text-slate-500">Các mục chưa đọc được ({thieu.join(", ")}) nhập tay ở form sau khi điền.</div>
              )}
            </>
          )}
        </div>
      </Spin>
    </Modal>
  );
}
