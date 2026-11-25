/* eslint-disable react-refresh/only-export-components */
// Cài đặt chụp ảnh học viên: chọn camera / độ phân giải / lật hình + thư mục lưu ảnh trên máy.
// Lưu theo từng máy (trình duyệt): camera -> localStorage, thư mục -> IndexedDB (quyền truy cập thư mục).
import { useEffect, useState } from "react";
import { Alert, Button, Modal, Select, Switch, message } from "antd";
import { FolderOpenOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";

// ─── Camera ─────────────────────────────
const CAM_KEY = "tiep-sinh-camera";
export const DO_PHAN_GIAI = [
  { value: "640x480", label: "640 × 480 (nhẹ)" },
  { value: "1280x720", label: "1280 × 720 (HD)" },
  { value: "1280x960", label: "1280 × 960 (mặc định)" },
  { value: "1920x1080", label: "1920 × 1080 (Full HD)" },
];
const CAM_MAC_DINH = { deviceId: "", doPhanGiai: "1280x960", latHinh: true, tuLuuThuMuc: true };

export function docCaiDatCamera() {
  try {
    return { ...CAM_MAC_DINH, ...(JSON.parse(localStorage.getItem(CAM_KEY)) || {}) };
  } catch {
    return { ...CAM_MAC_DINH };
  }
}
function ghiCaiDatCamera(v) {
  try {
    localStorage.setItem(CAM_KEY, JSON.stringify(v));
  } catch {
    /* bỏ qua */
  }
}

/** Ràng buộc getUserMedia theo cài đặt */
export function camConstraints(cd) {
  const [w, h] = String(cd.doPhanGiai || CAM_MAC_DINH.doPhanGiai).split("x").map(Number);
  return {
    video: {
      width: { ideal: w },
      height: { ideal: h },
      ...(cd.deviceId ? { deviceId: { exact: cd.deviceId } } : {}),
    },
  };
}

// ─── Thư mục lưu ảnh (File System Access API — Chrome/Edge, cần localhost hoặc HTTPS) ─────────────────────────────
const DB = "tiep-sinh";
const STORE = "kv";
const DIR_KEY = "thu-muc-anh";

function idb(mode, fn) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
    };
  });
}

export const hoTroThuMuc = () => typeof window !== "undefined" && "showDirectoryPicker" in window && window.isSecureContext;

export async function layThuMuc() {
  if (!hoTroThuMuc()) return null;
  try {
    return (await idb("readonly", (s) => s.get(DIR_KEY))) || null;
  } catch {
    return null;
  }
}

async function chonThuMuc() {
  const h = await window.showDirectoryPicker({ id: "anh-hoc-vien", mode: "readwrite" });
  await idb("readwrite", (s) => s.put(h, DIR_KEY));
  return h;
}

async function boThuMuc() {
  await idb("readwrite", (s) => s.delete(DIR_KEY));
}

const DUOI_ANH = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/bmp": "bmp", "image/heic": "heic" };

/**
 * Ghi ảnh vào thư mục đã chọn, tên file = mã hồ sơ (đổi tên tự động, ghi đè nếu đã có).
 * nguon: dataURL hoặc File/Blob (ảnh gốc NV chọn). Gọi ngay trong lúc bấm nút
 * (trình duyệt chỉ cho xin lại quyền ghi khi người dùng vừa thao tác). -> "thư mục/tên file" | null
 */
export async function luuAnhVaoThuMuc(nguon, ten) {
  const h = await layThuMuc();
  if (!h) return null;
  let quyen = await h.queryPermission({ mode: "readwrite" });
  if (quyen !== "granted") quyen = await h.requestPermission({ mode: "readwrite" });
  if (quyen !== "granted") throw new Error(`Chưa cho phép ghi vào thư mục "${h.name}"`);
  const blob = nguon instanceof Blob ? nguon : await (await fetch(nguon)).blob();
  const ext = DUOI_ANH[blob.type] || String(nguon?.name || "").split(".").pop()?.toLowerCase() || "jpg";
  const tenFile = `${String(ten || "anh").replace(/[\\/:*?"<>|]/g, "_")}.${ext}`;
  const fh = await h.getFileHandle(tenFile, { create: true });
  const w = await fh.createWritable();
  await w.write(blob);
  await w.close();
  return `${h.name}/${tenFile}`;
}

/** Tên thư mục đang chọn (để hiển thị) */
export function useThuMuc(open = true) {
  const [ten, setTen] = useState(null);
  const tai = () => layThuMuc().then((h) => setTen(h?.name || null));
  useEffect(() => {
    if (open) tai();
  }, [open]);
  return [ten, tai];
}

// ─── Hộp thoại cài đặt ─────────────────────────────
const Row = ({ label, children, desc }) => (
  <div className="mb-3">
    <div className="mb-1 text-[13px] font-semibold text-slate-700">{label}</div>
    {children}
    {desc && <div className="mt-1 text-xs text-slate-500">{desc}</div>}
  </div>
);

/** Chỉ render khi mở (state đọc lại cài đặt mỗi lần mở) */
export function CaiDatChupAnhModal({ open, onClose, onSaved }) {
  const [cd, setCd] = useState(docCaiDatCamera);
  const [devices, setDevices] = useState([]);
  const [thuMuc, taiThuMuc] = useThuMuc(open);

  const taiCamera = () =>
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((ds) => setDevices(ds.filter((d) => d.kind === "videoinput")))
      .catch(() => setDevices([]));

  useEffect(() => {
    taiCamera();
  }, []);

  const luu = () => {
    ghiCaiDatCamera(cd);
    onSaved?.(cd);
    onClose();
    message.success("Đã lưu cài đặt chụp ảnh");
  };

  const chon = async () => {
    try {
      await chonThuMuc();
      await taiThuMuc();
    } catch (e) {
      if (e?.name !== "AbortError") message.error(e.message || "Không chọn được thư mục");
    }
  };

  return (
    <Modal open={open} onCancel={onClose} onOk={luu} okText="Lưu cài đặt" title="Cài đặt chụp ảnh" destroyOnHidden width={560}>
      <div className="mb-2 text-sm font-bold text-blue-800">Camera</div>
      <Row label="Thiết bị camera">
        <div className="flex gap-2">
          <Select className="flex-1" value={cd.deviceId} onChange={(v) => setCd({ ...cd, deviceId: v })}
            options={[
              { value: "", label: "Mặc định của máy" },
              ...devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` })),
            ]} />
          <Button icon={<ReloadOutlined />} onClick={taiCamera} title="Tải lại danh sách camera" />
        </div>
      </Row>
      <Row label="Độ phân giải">
        <Select className="w-full" value={cd.doPhanGiai} onChange={(v) => setCd({ ...cd, doPhanGiai: v })} options={DO_PHAN_GIAI} />
      </Row>
      <Row label="Lật hình xem trước (như soi gương)" desc="Chỉ đổi hình trên màn hình, ảnh lưu vẫn đúng chiều thật">
        <Switch checked={cd.latHinh} onChange={(v) => setCd({ ...cd, latHinh: v })} />
      </Row>

      <div className="mb-2 mt-4 text-sm font-bold text-blue-800">Thư mục lưu ảnh trên máy</div>
      {hoTroThuMuc() ? (
        <>
          <Row label="Thư mục" desc="Ảnh chụp được lưu thêm vào thư mục này, tên file = mã hồ sơ (vd 2611250001.jpg)">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">
                {thuMuc ? <b>{thuMuc}</b> : <span className="italic text-slate-400">Chưa chọn — ảnh chỉ lưu vào hồ sơ</span>}
              </div>
              <Button icon={<FolderOpenOutlined />} onClick={chon}>{thuMuc ? "Đổi" : "Chọn thư mục"}</Button>
              {thuMuc && <Button danger icon={<DeleteOutlined />} onClick={async () => { await boThuMuc(); taiThuMuc(); }} title="Bỏ thư mục" />}
            </div>
          </Row>
          <Row label="Tự lưu vào thư mục khi chụp">
            <Switch checked={cd.tuLuuThuMuc} disabled={!thuMuc} onChange={(v) => setCd({ ...cd, tuLuuThuMuc: v })} />
          </Row>
        </>
      ) : (
        <Alert type="warning" showIcon
          message="Trình duyệt này không chọn được thư mục lưu ảnh"
          description="Cần mở web bằng Chrome hoặc Edge, qua địa chỉ localhost (hoặc HTTPS). Khi mở bằng địa chỉ IP trong mạng LAN, dùng nút “Tải ảnh” để lưu file." />
      )}
    </Modal>
  );
}
