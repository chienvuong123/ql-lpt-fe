// Nghiệp vụ sau khi hồ sơ đã duyệt: chuyển học phí, chuyển hạng, chuyển phí khám sức khoẻ, bỏ học.
// Mọi thao tác đều ghi lịch sử ở cả 2 hồ sơ (xem "Chi tiết & lịch sử").
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Checkbox, Input, InputNumber, Modal, Radio, Select, Tooltip, message } from "antd";
import { SwapOutlined, SyncOutlined, HeartOutlined, StopOutlined } from "@ant-design/icons";
import {
  getDanhSachHoSo, getCauHinhTiepSinh, chuyenHocPhiHoSo, chuyenHangHoSo, chuyenPhiKhamHoSo, boHocHoSo, errMsg,
} from "../../apis/apiTiepSinh";
import { LOAI_HINH_OPTIONS, KHAM_SK_TRUNG_TAM, tinhPhaiThu, fmtTien, fmtDate } from "./tiepSinhShared";

const MONEY = {
  formatter: (v) => (v === undefined || v === null || v === "" ? "" : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")),
  parser: (v) => (v || "").replace(/[^\d]/g, ""),
};

/** Nghiệp vụ chỉ hiện khi hồ sơ đã duyệt (hoặc đã bỏ học — vẫn chuyển tiền được) */
export const coNghiepVu = (hs) => ["da_duyet", "da_in", "bo_hoc"].includes(hs?.trang_thai);

function useCfg() {
  const { data } = useQuery({ queryKey: ["tiep-sinh-cau-hinh"], queryFn: getCauHinhTiepSinh, staleTime: 60000 });
  return data?.data || {};
}

/** Chọn học viên nhận tiền (tìm theo tên / CCCD / mã hồ sơ) */
function ChonHocVien({ value, onChange, excludeId }) {
  const [q, setQ] = useState("");
  const [debQ, setDebQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isFetching } = useQuery({
    queryKey: ["tiep-sinh-chon-hv", debQ],
    queryFn: () => getDanhSachHoSo({ search: debQ || undefined, page: 1, limit: 20 }),
    staleTime: 10000,
  });
  const options = (data?.data || [])
    .filter((r) => r.id !== excludeId && r.trang_thai !== "bo_hoc")
    .map((r) => ({
      value: r.id,
      label: (
        <span>
          <b>{r.ho_ten}</b> <span className="text-slate-500">· {r.ma_ho_so} · {r.cccd || "chưa có CCCD"} · {r.loai_hinh || r.hang || ""}</span>
        </span>
      ),
    }));
  return (
    <Select
      showSearch
      allowClear
      className="w-full"
      placeholder="Gõ tên, CCCD hoặc mã hồ sơ của học viên nhận"
      filterOption={false}
      onSearch={setQ}
      loading={isFetching}
      value={value}
      onChange={onChange}
      options={options}
      notFoundContent={isFetching ? "Đang tìm..." : "Không tìm thấy"}
    />
  );
}

const Field = ({ label, children }) => (
  <div className="mb-3">
    <div className="mb-1 text-[13px] font-medium text-slate-600">{label}</div>
    {children}
  </div>
);

function TomTat({ hs }) {
  return (
    <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <b>{hs.ho_ten}</b> · {hs.ma_ho_so} · {hs.cccd} · {hs.loai_hinh || hs.hang}
      {hs.ngay_sinh ? ` · ${fmtDate(hs.ngay_sinh)}` : ""}
    </div>
  );
}

// ─── 8. Chuyển toàn bộ học phí ─────────────────────────────
function ChuyenHocPhiModal({ hs, open, onClose, onDone }) {
  const cfg = useCfg();
  const [den, setDen] = useState();
  const [soTien, setSoTien] = useState(null);
  const [ghiChu, setGhiChu] = useState("");
  const [loading, setLoading] = useState(false);
  const hocPhi = tinhPhaiThu(hs, cfg)?.hocPhi ?? null;
  useEffect(() => {
    if (open) {
      setDen(undefined);
      setGhiChu("");
      setSoTien(hocPhi);
    }
  }, [open, hocPhi]);
  const ok = async () => {
    setLoading(true);
    try {
      const r = await chuyenHocPhiHoSo(hs.id, { den_id: den, so_tien: soTien, ghi_chu: ghiChu });
      message.success(`Đã chuyển ${fmtTien(r.data.so_tien)} học phí sang ${r.data.to?.ho_ten}`);
      onDone();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onCancel={onClose} title="Chuyển toàn bộ học phí sang học viên khác" okText="Chuyển học phí"
      onOk={ok} okButtonProps={{ loading, disabled: !den || !soTien }} destroyOnHidden>
      <TomTat hs={hs} />
      <Field label="Học viên nhận">
        <ChonHocVien value={den} onChange={setDen} excludeId={hs.id} />
      </Field>
      <Field label="Số tiền chuyển (mặc định = học phí theo bảng giá)">
        <InputNumber {...MONEY} min={0} step={100000} className="!w-full" suffix="đ" value={soTien} onChange={setSoTien} />
      </Field>
      <Field label="Ghi chú">
        <Input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="VD: nhường suất cho em trai" />
      </Field>
      <Alert type="info" showIcon message="Số tiền này được trừ vào phần phải thu của học viên nhận. Lịch sử được ghi ở cả 2 hồ sơ." />
    </Modal>
  );
}

// ─── 9. Chuyển hạng ─────────────────────────────
function ChuyenHangModal({ hs, open, onClose, onDone }) {
  const cfg = useCfg();
  const [moi, setMoi] = useState();
  const [ghiChu, setGhiChu] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setMoi(undefined);
      setGhiChu("");
    }
  }, [open]);
  const cu = tinhPhaiThu(hs, cfg)?.tong ?? null;
  const sau = moi ? tinhPhaiThu({ ...hs, loai_hinh: moi, tong_thu: null }, cfg)?.tong ?? null : null;
  const chenh = cu !== null && sau !== null ? sau - cu : null;
  const ok = async () => {
    setLoading(true);
    try {
      await chuyenHangHoSo(hs.id, { loai_hinh: moi, ghi_chu: ghiChu });
      message.success("Đã chuyển hạng — cần in lại hồ sơ theo hạng mới");
      onDone();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onCancel={onClose} title="Chuyển hạng đào tạo" okText="Chuyển hạng"
      onOk={ok} okButtonProps={{ loading, disabled: !moi }} destroyOnHidden>
      <TomTat hs={hs} />
      <Field label="Chuyển sang">
        <Select className="w-full" placeholder="Chọn loại hình mới" value={moi} onChange={setMoi}
          options={LOAI_HINH_OPTIONS.filter((o) => o.value !== hs.loai_hinh)} />
      </Field>
      {moi && (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Phải thu cũ</div><b>{fmtTien(cu) || "—"}</b></div>
          <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Phải thu mới</div><b>{fmtTien(sau) || "—"}</b></div>
          <div className={`rounded-lg p-2 ${chenh < 0 ? "bg-green-50 text-green-700" : chenh > 0 ? "bg-orange-50 text-orange-700" : "bg-slate-50"}`}>
            <div>{chenh < 0 ? "Dư tiền (hoàn HV)" : chenh > 0 ? "Thu thêm" : "Chênh lệch"}</div>
            <b>{chenh === null ? "Chưa có giá" : fmtTien(Math.abs(chenh))}</b>
          </div>
        </div>
      )}
      <Field label="Ghi chú">
        <Input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
      </Field>
      {hs.trang_thai === "da_in" && (
        <Alert type="warning" showIcon message="Hồ sơ đã in — sau khi chuyển hạng, hồ sơ về trạng thái Đã duyệt để in lại bộ hồ sơ theo hạng mới." />
      )}
    </Modal>
  );
}

// ─── 10. Phí khám sức khoẻ ─────────────────────────────
function ChuyenPhiKhamModal({ hs, open, onClose, onDone }) {
  const cfg = useCfg();
  const [hinhThuc, setHinhThuc] = useState("chuyen");
  const [den, setDen] = useState();
  const [ghiChu, setGhiChu] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setHinhThuc("chuyen");
      setDen(undefined);
      setGhiChu("");
    }
  }, [open]);
  const ok = async () => {
    setLoading(true);
    try {
      await chuyenPhiKhamHoSo(hs.id, { hinh_thuc: hinhThuc, den_id: den, ghi_chu: ghiChu });
      message.success(hinhThuc === "hoan" ? "Đã ghi nhận hoàn phí khám" : "Đã chuyển phí khám sức khoẻ");
      onDone();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onCancel={onClose} title="Chuyển / hoàn phí khám sức khoẻ" okText="Xác nhận"
      onOk={ok} okButtonProps={{ loading, disabled: hinhThuc === "chuyen" && !den }} destroyOnHidden>
      <TomTat hs={hs} />
      <Alert className="!mb-3" type="info" showIcon
        message={`Học viên đã tự khám sức khoẻ — phí khám ${fmtTien(Number(cfg.phi_kham_suc_khoe) || 0)} đã đóng sẽ được hoàn lại hoặc chuyển cho học viên khác. Hồ sơ này chuyển sang "Tự khám - tự nộp".`} />
      <Field label="Xử lý tiền dư">
        <Radio.Group value={hinhThuc} onChange={(e) => setHinhThuc(e.target.value)}
          options={[{ value: "chuyen", label: "Chuyển sang học viên khác" }, { value: "hoan", label: "Hoàn tiền cho học viên" }]} />
      </Field>
      {hinhThuc === "chuyen" && (
        <Field label="Học viên nhận">
          <ChonHocVien value={den} onChange={setDen} excludeId={hs.id} />
        </Field>
      )}
      <Field label="Ghi chú">
        <Input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
      </Field>
    </Modal>
  );
}

// ─── 11. Bỏ học ─────────────────────────────
function BoHocModal({ hs, open, onClose, onDone }) {
  const [lyDo, setLyDo] = useState("");
  const [vaoKhoa, setVaoKhoa] = useState(false);
  const [xuLy, setXuLy] = useState("giu");
  const [loading, setLoading] = useState(false);
  const khoa = hs.khoa_da_vao;
  useEffect(() => {
    if (open) {
      setLyDo("");
      setVaoKhoa(!!khoa);
      setXuLy("giu");
    }
  }, [open, khoa]);
  const ok = async () => {
    setLoading(true);
    try {
      await boHocHoSo(hs.id, { ly_do: lyDo, da_vao_khoa: vaoKhoa, xu_ly_tien: xuLy });
      message.success("Đã chuyển học viên sang bỏ học");
      onDone();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onCancel={onClose} title="Cho học viên bỏ học" okText="Xác nhận bỏ học"
      onOk={ok} okButtonProps={{ danger: true, loading, disabled: !lyDo.trim() }} destroyOnHidden>
      <TomTat hs={hs} />
      <Field label="Lý do bỏ học">
        <Input.TextArea rows={2} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
      </Field>
      <Checkbox className="!mb-3" checked={vaoKhoa} disabled={!!khoa} onChange={(e) => setVaoKhoa(e.target.checked)}>
        Học viên đã vào khoá {khoa ? <b>({khoa} — theo danh sách học viên)</b> : ""}
      </Checkbox>
      {vaoKhoa ? (
        <Alert type="warning" showIcon message="Đã vào khoá: không hoàn học phí — chỉ trả lại giấy khám sức khoẻ cho học viên." />
      ) : (
        <Field label="Chưa vào khoá — xử lý tiền đã đóng">
          <Radio.Group value={xuLy} onChange={(e) => setXuLy(e.target.value)}
            options={[{ value: "giu", label: "Giữ lại để chuyển cho HV khác" }, { value: "hoan", label: "Hoàn tiền cho học viên" }]} />
        </Field>
      )}
    </Modal>
  );
}

const NUT = [
  { key: "hoc_phi", label: "Chuyển toàn bộ học phí", icon: <SwapOutlined />, color: "#1d4ed8", bg: "#eaf1ff", border: "#bcd2fb" },
  { key: "hang", label: "Chuyển hạng", icon: <SyncOutlined />, color: "#7c3aed", bg: "#f3edff", border: "#d9c8fb" },
  { key: "kham", label: "Chuyển phí khám sức khỏe", icon: <HeartOutlined />, color: "#15803d", bg: "#e9f8ee", border: "#bfe8cc" },
  { key: "bo_hoc", label: "Bỏ học", icon: <StopOutlined />, color: "#ea580c", bg: "#fff1e6", border: "#fcd2b0" },
];

/** 4 nút nghiệp vụ + hộp thoại. Chỉ hiển thị với hồ sơ đã duyệt. */
export function NghiepVuButtons({ hs, className = "" }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(null);
  if (!coNghiepVu(hs)) return null;
  const daChuyenHocPhi = (hs.lich_su || []).some((l) => l.hanh_dong === "chuyen_hoc_phi_di");
  const boHoc = hs.trang_thai === "bo_hoc";
  const camLy = {
    hoc_phi: daChuyenHocPhi ? "Học phí đã được chuyển trước đó" : hs.khoa_da_vao ? `Đã vào khoá ${hs.khoa_da_vao}` : null,
    hang: boHoc ? "Học viên đã bỏ học" : null,
    kham: hs.kham_suc_khoe !== KHAM_SK_TRUNG_TAM ? "Học viên không đóng phí khám tại trung tâm" : null,
    bo_hoc: boHoc ? "Học viên đã bỏ học" : null,
  };
  const done = () => {
    setOpen(null);
    qc.invalidateQueries({ queryKey: ["tiep-sinh-ho-so"] });
    qc.invalidateQueries({ queryKey: ["tiep-sinh-list"] });
    qc.invalidateQueries({ queryKey: ["tiep-sinh-thong-ke"] });
  };
  const props = (k) => ({ hs, open: open === k, onClose: () => setOpen(null), onDone: done });
  return (
    <>
      <div className={`grid grid-cols-4 gap-2 ${className}`}>
        {NUT.map((n) => (
          <Tooltip key={n.key} title={camLy[n.key] || n.label}>
            <button type="button" disabled={!!camLy[n.key]} onClick={() => setOpen(n.key)}
              className="flex h-full min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1 text-center text-[12.5px] font-semibold leading-tight transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ color: n.color, background: n.bg, borderColor: n.border }}>
              <span className="text-[19px]">{n.icon}</span>
              {n.label}
            </button>
          </Tooltip>
        ))}
      </div>
      <ChuyenHocPhiModal {...props("hoc_phi")} />
      <ChuyenHangModal {...props("hang")} />
      <ChuyenPhiKhamModal {...props("kham")} />
      <BoHocModal {...props("bo_hoc")} />
    </>
  );
}
