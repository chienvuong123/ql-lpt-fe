import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AutoComplete, Button, Checkbox, DatePicker, Dropdown, Empty, Form, Image, Input, Modal, Select, Spin, Tooltip, message,
} from "antd";
import {
  CheckOutlined, CameraFilled, ReloadOutlined, PictureOutlined, SearchOutlined, ScanOutlined,
  FileTextOutlined, RollbackOutlined, RightOutlined, CheckCircleFilled, CloseCircleFilled,
  PrinterOutlined, PlusOutlined, IdcardOutlined, UserOutlined, ExclamationCircleFilled,
  SafetyCertificateFilled, ArrowLeftOutlined, ThunderboltFilled, UndoOutlined,
  SyncOutlined, QrcodeOutlined, SettingOutlined, CloseOutlined, FileWordOutlined, LeftOutlined, DownOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  FaUser, FaRegCalendarAlt, FaRegIdCard, FaPhoneAlt, FaHome, FaGraduationCap, FaCar,
  FaPrint, FaCamera, FaCheck, FaClipboardCheck, FaMoneyBillWave, FaHeartbeat,
} from "react-icons/fa";
import dayjs from "dayjs";
import {
  getChiTietHoSo, taoHoSo, capNhatHoSo, capNhatAnhHoSo, duyetHoSo, traBoSungHoSo, moLaiHoSo,
  ghiNhanInHoSo, getDanhSachHoSo, getThongKeTiepSinh, getCauHinhTiepSinh, getDauMoiTiepSinh, errMsg,
} from "../../apis/apiTiepSinh";
import {
  BLUE, BLUE_DARK, LOAI_HINH_OPTIONS, KHAM_SK_OPTIONS, tinhPhaiThu, fmtTien, hangTuLoaiHinh, NGUON_META, TRANG_THAI_META, WEEKDAYS, useNow, StatusTag, CccdScanModal,
  HoSoDetailModal, TraBoSungModal, fmtDate, fmtDateTime, toPortraitDataUrl, fileToPortraitDataUrl, taiAnhHoSo,
  DAU_MOI_MAC_DINH, boDau, goiYDauMoi, kiemTraSo,
} from "./tiepSinhShared";
import { CauHinhModal, DongBoModal, QrKhaiModal } from "./tiepSinhModals";
import OcrCccdModal from "./OcrCccdModal";
import { NghiepVuButtons, coNghiepVu } from "./NghiepVuHoSo";
import { MAU_DON, mauTheoHang, renderForms, printForms, downloadWord } from "./mauDon";

const STEPS = [
  { title: "Thông tin học viên", icon: <FaUser /> },
  { title: "Chụp ảnh", icon: <FaCamera /> },
  { title: "Duyệt hồ sơ", icon: <FaClipboardCheck /> },
  { title: "In hồ sơ", icon: <FaPrint /> },
];

// 0 Thông tin · 1 Chụp ảnh · 2 Duyệt · 3 In
function suggestStep(hs) {
  if (!hs) return 0;
  if (hs.trang_thai === "da_duyet" || hs.trang_thai === "da_in") return 3;
  // hồ sơ chờ duyệt / cần bổ sung: mở ở bước Thông tin học viên để NV kiểm tra trước
  return 0;
}

// Bảng giá trong cấu hình (dùng chung cache với modal Cấu hình)
function useBangGia() {
  const { data } = useQuery({ queryKey: ["tiep-sinh-cau-hinh"], queryFn: getCauHinhTiepSinh, staleTime: 60000 });
  return data?.data || {};
}

/** Danh sách đầu mối chuẩn (NV đã nhập trước đây) */
function useDauMoi() {
  const { data } = useQuery({ queryKey: ["tiep-sinh-dau-moi"], queryFn: getDauMoiTiepSinh, staleTime: 60000 });
  return data?.data || [];
}

/**
 * Ô "Đầu mối tuyển sinh": gõ để chọn tên chuẩn đã ghi nhớ. Để trống = TT.
 * HV tự ghi tên ngắn ("Hiếu") -> hiện gợi ý tên chuẩn để NV bấm chọn.
 */
function DauMoiInput({ value, onChange }) {
  const list = useDauMoi();
  const q = boDau(value);
  const options = list
    .filter((d) => !q || boDau(d.ten).includes(q))
    .slice(0, 12)
    .map((d) => ({ value: d.ten, label: <span className="flex justify-between gap-2"><span>{d.ten}</span>{d.so_lan ? <span className="text-xs text-slate-400">{d.so_lan} lần</span> : null}</span> }));
  const goiY = goiYDauMoi(value, list);
  return (
    <div>
      <AutoComplete value={value} onChange={onChange} options={options} allowClear className="w-full"
        placeholder={`Để trống = ${DAU_MOI_MAC_DINH} (trung tâm)`} />
      {goiY.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-orange-600">
          HV ghi “{value}” — chọn tên chuẩn:
          {goiY.map((t) => (
            <button key={t} type="button" onClick={() => onChange(t)}
              className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 font-medium text-blue-700 hover:bg-blue-100">
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Khung "Số tiền phải thu" */
function PhaiThuBox({ hs, compact = false }) {
  const cfg = useBangGia();
  const t = tinhPhaiThu(hs, cfg);
  if (!t) return null;
  const chiTiet = [
    t.hocPhi !== null && t.hocPhi !== undefined ? `Học phí ${fmtTien(t.hocPhi)}` : null,
    t.phiKham ? `Khám SK ${fmtTien(t.phiKham)}` : null,
  ].filter(Boolean).join(" + ") + (t.duocChuyen ? ` − được chuyển ${fmtTien(t.duocChuyen)}` : "");
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 ${compact ? "px-3 py-2" : "px-4 py-2.5"}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-700"><FaMoneyBillWave /> Số tiền phải thu</div>
        {(chiTiet || t.nhapTay) && (
          <div className="truncate text-xs text-slate-500">
            {t.nhapTay ? `Theo cột Tổng thu${t.duocChuyen ? ` − được chuyển ${fmtTien(t.duocChuyen)}` : ""}` : chiTiet}
          </div>
        )}
      </div>
      <div className={`shrink-0 font-extrabold text-orange-600 ${compact ? "text-xl" : "text-2xl"}`}>
        {t.tong !== null ? (t.conLai < 0 ? <span className="text-green-600">Dư {fmtTien(-t.conLai)}</span> : fmtTien(t.conLai)) : (
          <span className="text-sm font-semibold italic text-red-500">
            {!hs.loai_hinh ? "Chưa chọn loại hình" : "Chưa cài bảng giá (Cấu hình)"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Khung có tiêu đề nền xanh (như ảnh mẫu) ─────────────────────
function BluePanel({ title, icon, extra, children, className = "", bodyClassName = "p-4" }) {
  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_rgba(23,64,140,0.10)] ${className}`}>
      <div className="flex items-center justify-between gap-2 px-5 py-3 text-white" style={{ background: "linear-gradient(90deg, #1b56c9 0%, #2f74ea 60%, #5a95f2 100%)" }}>
        <div className="flex items-center gap-3 text-[19px] font-bold">
          <span className="text-[22px]">{icon}</span>
          {title}
        </div>
        {extra}
      </div>
      <div className={`min-h-0 flex-1 overflow-auto ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function IntakeHeader({ menu }) {
  const now = useNow();
  const name = sessionStorage.getItem("name") || sessionStorage.getItem("username") || "Nhân viên";
  return (
    <div className="relative shrink-0 overflow-hidden rounded-2xl px-5 py-3 text-white shadow-md"
      style={{ background: "linear-gradient(100deg, #0e3b9c 0%, #1d5fd6 45%, #4b8cf3 100%)" }}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Lập Phương Thành" className="h-12 w-auto object-contain" />
            <span className="mt-0.5 text-[11px] font-medium tracking-wide text-blue-100">Trung tâm GDNN&amp;SHLX</span>
          </div>
          <div className="h-14 w-px bg-white/40" />
          <div>
            <div className="text-[26px] font-extrabold leading-tight">Hệ thống tiếp nhận hồ sơ học viên</div>
            <div className="text-[15px] italic text-blue-100">Nhanh chóng <span className="mx-1">•</span> Chính xác <span className="mx-1">•</span> Thân thiện</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <div className="flex items-center gap-3">
            <FaRegCalendarAlt className="text-[34px]" />
            <div className="leading-tight">
              <div className="text-[15px] text-blue-50">{WEEKDAYS[now.day()]}, {now.format("DD/MM/YYYY")}</div>
              <div className="text-[26px] font-bold tabular-nums">{now.format("HH:mm:ss")}</div>
            </div>
          </div>
          <div className="h-12 w-px bg-white/40" />
          <Dropdown trigger={["click"]} menu={menu}>
            <button type="button" className="flex items-center gap-3 rounded-xl px-2 py-1 text-left hover:bg-white/10">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl" style={{ color: BLUE }}>
                <UserOutlined />
              </span>
              <span className="leading-tight">
                <span className="block text-[16px] font-bold">{name}</span>
                <span className="block text-[13px] text-blue-100">Nhân viên tiếp sinh</span>
              </span>
              <DownOutlined className="text-sm" />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

// ─── Thanh các bước ─────────────────────────────────────
function StepBar({ step, maxStep, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-2xl bg-white/70 px-3 py-3 shadow-sm backdrop-blur">
      <button type="button" disabled={step === 0} onClick={() => onChange(step - 1)}
        className="mr-1 flex h-8 w-6 shrink-0 items-center justify-center text-lg text-blue-300 hover:text-blue-600 disabled:opacity-30">
        <LeftOutlined />
      </button>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const enabled = i <= maxStep;
        return (
          <div key={s.title} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!enabled}
              onClick={() => onChange(i)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[16px] transition ${
                active ? "border-2 bg-white shadow-md" : "border-2 border-transparent"
              } ${enabled ? "cursor-pointer hover:bg-blue-50" : "cursor-not-allowed opacity-60"}`}
              style={active ? { borderColor: BLUE } : undefined}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: done || active ? BLUE : "#c7d2e0" }}
              >
                {done ? <CheckOutlined /> : active ? i + 1 : <span className="text-[13px]">{s.icon}</span>}
              </span>
              <span
                className="hidden items-center gap-1.5 whitespace-nowrap font-semibold md:inline-flex"
                style={{ color: done || active ? BLUE_DARK : "#94a3b8" }}
              >
                {active && s.icon}
                {s.title}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 min-w-4 flex-1" style={{ background: i < step ? BLUE : "#dbe3ef" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Khung thông tin học viên bên trái ─────────────────────────────
function InfoRow({ icon, label, value, extra }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 w-5 shrink-0 text-base" style={{ color: BLUE }}>{icon}</span>
      <span className="w-28 shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 font-semibold text-slate-800">
        {value || <span className="font-normal italic text-red-400">Chưa có</span>} {extra}
      </span>
    </div>
  );
}

function StudentCard({ hs }) {
  if (!hs) {
    return (
      <BluePanel title="Thông tin học viên" icon={<FaUser />} className="h-full">
        <Empty description="Chưa có hồ sơ — nhập thông tin hoặc quét CCCD" className="py-10" />
      </BluePanel>
    );
  }
  const ok = !hs.thieu_truong?.length;
  const chip = (text) => (
    <span className="rounded-full bg-blue-50 px-3 py-0.5 text-sm font-semibold" style={{ color: BLUE_DARK }}>{text}</span>
  );
  return (
    <BluePanel
      title="Thông tin học viên"
      icon={<FaUser />}
      className="h-full"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative mx-auto w-40 shrink-0 self-start sm:mx-0">
          {hs.anh_chan_dung ? (
            <Image src={hs.anh_chan_dung} className="rounded-xl" width={160} style={{ objectFit: "cover", height: 213 }} />
          ) : (
            <div className="flex h-[213px] w-40 flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-400">
              <UserOutlined className="text-5xl" />
              <span className="text-xs">Chưa có ảnh</span>
            </div>
          )}
          <div
            className={`absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
              ok ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-600"
            }`}
          >
            {ok ? <CheckCircleFilled /> : <ExclamationCircleFilled />}
            {ok ? "Thông tin hợp lệ" : `Thiếu ${hs.thieu_truong.length} mục`}
          </div>
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <InfoRow icon={<FaUser />} label="Họ và tên" value={hs.ho_ten} />
          <InfoRow icon={<FaRegCalendarAlt />} label="Ngày sinh" value={fmtDate(hs.ngay_sinh)} />
          <InfoRow icon={<FaRegIdCard />} label="CCCD" value={hs.cccd} />
          <InfoRow icon={<FaPhoneAlt />} label="SĐT" value={hs.dien_thoai} />
          <InfoRow icon={<FaHome />} label="Địa chỉ" value={hs.dia_chi} />
          <div className="my-1 border-t border-slate-100" />
          <InfoRow icon={<FaGraduationCap />} label="Khóa học" value={hs.khoa_hoc && chip(hs.khoa_hoc)} />
          <InfoRow icon={<FaCar />} label="Hạng đăng ký" value={(hs.loai_hinh || hs.hang) && chip(hs.loai_hinh || `Hạng ${hs.hang}`)} />
          <InfoRow icon={<FaHeartbeat />} label="Khám sức khoẻ" value={hs.kham_suc_khoe && chip(hs.kham_suc_khoe)} />
        </div>
      </div>
      <div className="mt-3">
        <PhaiThuBox hs={hs} />
      </div>
    </BluePanel>
  );
}

// Số tiền phải thu cập nhật ngay khi NV đổi loại hình / khám SK trên form
function PhaiThuForm({ form, hs }) {
  const loai_hinh = Form.useWatch("loai_hinh", form);
  const kham_suc_khoe = Form.useWatch("kham_suc_khoe", form);
  return <PhaiThuBox compact hs={{ loai_hinh, kham_suc_khoe, tong_thu: hs?.tong_thu }} />;
}

// ─── Bước 1: nhập / bổ sung thông tin ─────────────────────────────
function toFormValues(hs) {
  if (!hs) return { khoa_hoc: "Đào tạo lái xe mô tô", quoc_tich: "Việt Nam" };
  return {
    ...hs,
    // hồ sơ cũ chưa có loại hình: hạng A1 chỉ có 1 lựa chọn
    loai_hinh: hs.loai_hinh || (hs.hang === "A1" ? "Hạng A1" : undefined),
    ngay_sinh: hs.ngay_sinh ? dayjs(hs.ngay_sinh) : null,
    ngay_cap_cccd: hs.ngay_cap_cccd ? dayjs(hs.ngay_cap_cccd) : null,
  };
}

function fromFormValues(v) {
  return {
    ...v,
    hang: hangTuLoaiHinh(v.loai_hinh) || undefined,
    // để trống = TT (trung tâm)
    dau_moi: String(v.dau_moi || "").trim() || DAU_MOI_MAC_DINH,
    ngay_sinh: v.ngay_sinh ? v.ngay_sinh.format("YYYY-MM-DD") : null,
    ngay_cap_cccd: v.ngay_cap_cccd ? v.ngay_cap_cccd.format("YYYY-MM-DD") : null,
  };
}

function QueuePicker({ onPick }) {
  const [search, setSearch] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["tiep-sinh-queue-picker", search],
    queryFn: () => getDanhSachHoSo({ search, limit: 30 }),
    staleTime: 10000,
  });
  const options = (data?.data || [])
    .filter((r) => r.trang_thai !== "da_in")
    .map((r) => ({
      value: r.id,
      label: (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">
            <b>{r.so_thu_tu ? String(r.so_thu_tu).padStart(4, "0") : r.ma_ho_so}</b> · {r.ho_ten}
            <span className="text-slate-400"> · {r.cccd || "chưa có CCCD"}</span>
          </span>
          <StatusTag value={r.trang_thai} />
        </div>
      ),
    }));
  return (
    <Select
      showSearch
      allowClear
      filterOption={false}
      onSearch={setSearch}
      loading={isFetching}
      options={options}
      placeholder={<span><SearchOutlined /> Chọn hồ sơ từ hàng đợi / tìm theo tên, CCCD...</span>}
      className="w-full sm:w-96"
      onChange={(v) => v && onPick(v)}
      value={null}
    />
  );
}

// ─── Bước 2: chụp ảnh ─────────────────────────────
function ChupAnhStep({ hs, onSaved }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [camErr, setCamErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [restart, setRestart] = useState(0);

  useEffect(() => {
    let stopped = false;
    setReady(false);
    setCamErr(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 } } })
      .then(async (stream) => {
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setReady(true);
      })
      .catch((e) => setCamErr(e?.message || "Không mở được camera"));
    if (!navigator.mediaDevices) setCamErr("Trình duyệt không hỗ trợ camera (cần HTTPS hoặc localhost)");
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [restart]);

  const save = async (dataUrl) => {
    setSaving(true);
    try {
      const res = await capNhatAnhHoSo(hs.id, dataUrl);
      onSaved(res.data);
      message.success("Đã lưu ảnh học viên");
    } catch (e) {
      message.error(errMsg(e, "Lưu ảnh thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return message.warning("Camera chưa sẵn sàng");
    save(toPortraitDataUrl(v, v.videoWidth, v.videoHeight));
  };

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      save(await fileToPortraitDataUrl(f));
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[1fr_170px_150px]">
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-xl bg-slate-800" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
          {/* khung 3x4 */}
          <div className="pointer-events-none absolute inset-y-[6%] left-1/2 aspect-[3/4] -translate-x-1/2">
            {["left-0 top-0 border-l-4 border-t-4", "right-0 top-0 border-r-4 border-t-4", "left-0 bottom-0 border-l-4 border-b-4", "right-0 bottom-0 border-r-4 border-b-4"].map((c) => (
              <span key={c} className={`absolute h-8 w-8 border-white/90 ${c}`} />
            ))}
          </div>
          <span className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium ${ready ? "text-green-700" : "text-slate-500"}`}>
            <span className={`h-2 w-2 rounded-full ${ready ? "bg-green-500" : "bg-slate-400"}`} />
            {ready ? "Camera sẵn sàng" : camErr ? "Không có camera" : "Đang mở camera..."}
          </span>
          {camErr && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/80">
              {camErr}. Bạn có thể bấm “Chọn ảnh khác” để tải ảnh lên.
            </div>
          )}
        </div>
        {hs.co_anh ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircleFilled className="text-2xl text-green-500" />
            <div>
              <div className="font-semibold text-green-700">Ảnh đạt yêu cầu</div>
              <div className="text-xs text-green-700/80">Ảnh rõ nét, đủ sáng, đúng khuôn mặt — đã lưu vào hồ sơ</div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
            Yêu cầu: chính diện, nhìn thẳng, không đeo kính/khẩu trang, nền sáng, khuôn mặt nằm trong khung.
          </div>
        )}
      </div>
      <div className="flex flex-row gap-3 lg:flex-col">
        <Button
          type="primary"
          onClick={capture}
          loading={saving}
          disabled={!ready}
          className="!h-auto flex-1 !rounded-xl !py-4 lg:!flex-none"
          style={{ background: ready ? `linear-gradient(180deg, #2f7bf5, ${BLUE})` : undefined }}
        >
          <div className="flex flex-col items-center gap-1">
            <CameraFilled className="text-3xl" />
            <span className="text-base font-semibold">Chụp ảnh</span>
          </div>
        </Button>
        <Button icon={<ReloadOutlined />} size="large" className="flex-1 !rounded-xl lg:!flex-none" style={{ color: BLUE, borderColor: BLUE, borderWidth: 2, fontWeight: 600, height: 52 }} onClick={() => setRestart((x) => x + 1)}>
          Chụp lại
        </Button>
        <Button icon={<PictureOutlined />} size="large" className="flex-1 !rounded-xl lg:!flex-none" style={{ color: BLUE, borderColor: BLUE, borderWidth: 2, fontWeight: 600, height: 52 }} onClick={() => fileRef.current?.click()}>
          Chọn ảnh khác
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
      </div>
      <div className="flex flex-col gap-2 rounded-xl bg-blue-50/60 p-2">
        <div className="rounded-lg bg-blue-100/70 px-3 py-2 font-semibold" style={{ color: BLUE_DARK }}>Ảnh đã chụp</div>
        {hs.anh_chan_dung ? (
          <img src={hs.anh_chan_dung} alt="Ảnh học viên" className="w-full rounded-lg object-cover" style={{ aspectRatio: "3/4" }} />
        ) : (
          <div className="flex w-full items-center justify-center rounded-lg bg-white text-xs text-slate-400" style={{ aspectRatio: "3/4" }}>
            Chưa có
          </div>
        )}
        <Button icon={<SearchOutlined />} disabled={!hs.anh_chan_dung} onClick={() => setPreview(true)} style={{ color: BLUE }}>
          Xem lớn
        </Button>
        <Tooltip title={hs.ma_ho_so ? `Lưu ảnh với tên ${hs.ma_ho_so}` : undefined}>
          <Button icon={<DownloadOutlined />} disabled={!hs.anh_chan_dung} onClick={() => taiAnhHoSo(hs)} style={{ color: BLUE }}>
            Tải ảnh
          </Button>
        </Tooltip>
        {hs.anh_chan_dung && (
          <Image
            src={hs.anh_chan_dung}
            style={{ display: "none" }}
            preview={{ open: preview, onOpenChange: setPreview }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Bước 3: duyệt ─────────────────────────────
function CheckItem({ ok, warn = false, title, desc }) {
  // warn: chỉ cảnh báo (vàng), không chặn duyệt
  const tone = ok ? "green" : warn ? "amber" : "red";
  const cls = {
    green: ["border-green-200 bg-green-50/60", "text-green-700", <CheckCircleFilled key="i" className="mt-0.5 text-xl text-green-500" />],
    amber: ["border-amber-300 bg-amber-50", "text-amber-700", <ExclamationCircleFilled key="i" className="mt-0.5 text-xl text-amber-500" />],
    red: ["border-red-200 bg-red-50/60", "text-red-600", <CloseCircleFilled key="i" className="mt-0.5 text-xl text-red-500" />],
  }[tone];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${cls[0]}`}>
      {cls[2]}
      <div>
        <div className={`font-semibold ${cls[1]}`}>{title}</div>
        {desc && <div className="text-sm text-slate-600">{desc}</div>}
      </div>
    </div>
  );
}

function DuyetStep({ hs }) {
  const dauMoiList = useDauMoi();
  const thieu = (hs.thieu_truong || []).filter((t) => t !== "Ảnh chân dung");
  const tuoi = hs.ngay_sinh ? dayjs().diff(dayjs(hs.ngay_sinh), "year") : null;
  const cccd = kiemTraSo(hs.cccd, "cccd");
  const sdt = kiemTraSo(hs.dien_thoai, "sdt");
  const goiY = goiYDauMoi(hs.dau_moi, dauMoiList);
  const dauMoiChuan = !hs.dau_moi || dauMoiList.some((d) => d.ten === hs.dau_moi);
  // Cảnh báo (không chặn duyệt) — NV kiểm tra lại với học viên
  const canhBao = [
    tuoi !== null && tuoi < 18 && {
      key: "tuoi", title: `Chưa đủ 18 tuổi (hiện ${tuoi} tuổi)`,
      desc: `Sinh ngày ${fmtDate(hs.ngay_sinh)} — đủ 18 tuổi vào ${dayjs(hs.ngay_sinh).add(18, "year").format("DD/MM/YYYY")}`,
    },
    hs.cccd && !cccd.ok && { key: "cccd", title: "Số CCCD không đúng", desc: cccd.msg },
    hs.dien_thoai && !sdt.ok && { key: "sdt", title: "Số điện thoại không đúng", desc: sdt.msg },
    !dauMoiChuan && {
      key: "dm", title: `Đầu mối “${hs.dau_moi}” chưa có trong danh sách chuẩn`,
      desc: goiY.length ? `Có phải: ${goiY.join(" / ")}? — sửa ở bước Thông tin học viên` : "Kiểm tra lại tên đầu mối ở bước Thông tin học viên",
    },
  ].filter(Boolean);
  return (
    <div className="flex flex-col gap-3">
      <CheckItem ok={!thieu.length} title="Thông tin bắt buộc" desc={thieu.length ? `Còn thiếu: ${thieu.join(", ")}` : "Đầy đủ họ tên, ngày sinh, CCCD, ngày cấp, địa chỉ, hạng"} />
      <CheckItem ok={!!hs.co_anh} title="Ảnh chân dung" desc={hs.co_anh ? "Đã có ảnh 3x4" : "Chưa chụp ảnh — quay lại bước Chụp ảnh"} />
      {canhBao.length ? (
        canhBao.map((c) => <CheckItem key={c.key} ok={false} warn title={c.title} desc={c.desc} />)
      ) : (
        <CheckItem ok title="Tuổi, CCCD, điện thoại, đầu mối" desc="Đủ 18 tuổi · CCCD 12 số · SĐT 10 số · đầu mối chuẩn" />
      )}
      <div className="grid gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-2">
        <div><span className="text-slate-500">Nguồn hồ sơ: </span><b>{NGUON_META[hs.nguon]?.label || hs.nguon}</b></div>
        <div><span className="text-slate-500">Thời gian khai: </span><b>{fmtDateTime(hs.thoi_gian_khai)}</b></div>
        <div><span className="text-slate-500">Đầu mối: </span><b>{hs.dau_moi || "-"}</b></div>
        <div><span className="text-slate-500">Người tiếp nhận: </span><b>{hs.nguoi_tiep_nhan || "-"}</b></div>
      </div>
      {hs.ly_do_bo_sung && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <b>Yêu cầu bổ sung trước đó:</b> {hs.ly_do_bo_sung}
        </div>
      )}
    </div>
  );
}

// ─── Bước 4: in ─────────────────────────────
// Xem trước đúng file Word đã điền (cùng nguồn với bản in)
function XemTruocMau({ hs, forms }) {
  const ref = useRef(null);
  const formsKey = forms.join(",");
  const key = `${hs.id}|${hs.updated_at}|${formsKey}`;
  const [done, setDone] = useState({ key: null, err: null }); // lần hiển thị gần nhất
  const loading = done.key !== key;
  const err = done.key === key ? done.err : null;
  const renderedKey = useRef(null);
  useEffect(() => {
    // hs đổi object mỗi lần tải lại nhưng nội dung không đổi -> không vẽ lại
    if (!formsKey || !ref.current || renderedKey.current === key) return undefined;
    let cancelled = false;
    renderForms(ref.current, hs, formsKey.split(","), { isCancelled: () => cancelled })
      .then(() => {
        if (cancelled) return;
        renderedKey.current = key;
        setDone({ key, err: null });
      })
      .catch((e) => !cancelled && setDone({ key, err: errMsg(e, "Không tải được mẫu đơn") }));
    return () => {
      cancelled = true;
    };
  }, [hs, key, formsKey]);
  return (
    <Spin spinning={loading} tip="Đang tạo mẫu đơn...">
      {err && <div className="py-6 text-center text-red-500">{err}</div>}
      <div ref={ref} className="tiep-sinh-docx mx-auto" style={{ zoom: 0.6 }} />
    </Spin>
  );
}

function InStep({ hs, forms, setForms }) {
  const [loadingKey, setLoadingKey] = useState(null);
  const daDuyet = hs.trang_thai === "da_duyet" || hs.trang_thai === "da_in";
  const taiWord = async (key) => {
    setLoadingKey(key);
    try {
      await downloadWord(hs.id, key);
    } catch (e) {
      message.error(errMsg(e, "Tải file Word thất bại"));
    } finally {
      setLoadingKey(null);
    }
  };
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusTag value={hs.trang_thai} />
        {hs.so_lan_in > 0 && <span className="text-slate-500">Đã in {hs.so_lan_in} lần · lần đầu {fmtDateTime(hs.in_at)}</span>}
        {!daDuyet && <span className="text-red-500">Hồ sơ cần được duyệt trước khi in</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
        {MAU_DON.map((m) => {
          const on = forms.includes(m.key);
          return (
            <div key={m.key} className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 ${on ? "border-blue-300 bg-blue-50/60" : "border-slate-200"}`}>
              <Checkbox checked={on} onChange={(e) => setForms((f) => (e.target.checked ? [...f, m.key] : f.filter((k) => k !== m.key)))}>
                <span className="font-medium">{m.ten}</span>
              </Checkbox>
              <Button size="small" icon={<FileWordOutlined />} loading={loadingKey === m.key} onClick={() => taiWord(m.key)} className="self-start">
                Tải file Word
              </Button>
            </div>
          );
        })}
      </div>
      <div className="relative min-h-[260px] flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-3">
        {forms.length ? (
          <XemTruocMau hs={hs} forms={forms} />
        ) : (
          <Empty description="Chọn ít nhất 1 mẫu đơn để in" className="py-16" />
        )}
      </div>
    </div>
  );
}

// ─── Trang chính ─────────────────────────────────────
export default function TiepNhanHoSo() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  return (
    <TiepNhanView
      id={params.get("id")}
      onOpen={(newId) => setParams(newId ? { id: String(newId) } : {})}
      onBack={() => navigate("/tiep-sinh")}
    />
  );
}

/** Màn tiếp nhận 4 bước — dùng cho trang /tiep-nhan-ho-so và popup ở trang tổng quan */
export function TiepNhanView({ id: rawId, onOpen, onBack, inModal = false, prefill = null }) {
  const qc = useQueryClient();
  const id = rawId ? String(rawId) : null;
  const [forms, setForms] = useState([]);
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [fromScan, setFromScan] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [traOpen, setTraOpen] = useState(false);
  const [toolModal, setToolModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tiep-sinh-ho-so", id],
    queryFn: () => getChiTietHoSo(id),
    enabled: !!id,
    staleTime: 0,
  });
  const hs = id ? data?.data : null;

  // Khi đổi hồ sơ: nạp form + nhảy tới bước phù hợp
  const loadedId = useRef(null);
  const prefillToast = useRef(true);
  useEffect(() => {
    if (!id) {
      loadedId.current = null;
      form.resetFields();
      form.setFieldsValue(toFormValues(null));
      setStep(0);
      setFromScan(false);
      // Mở từ nút "Nhập từ ảnh CCCD" ở trang tổng quan: điền sẵn dữ liệu đã đọc
      if (prefill?.data) onScanResult(prefill.data, prefill.nguon, prefillToast.current);
      prefillToast.current = false;
      return;
    }
    if (hs && loadedId.current !== hs.id) {
      loadedId.current = hs.id;
      form.resetFields();
      form.setFieldsValue(toFormValues(hs));
      setStep(suggestStep(hs));
      setForms(mauTheoHang(hs.hang));
      setFromScan(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi đổi hồ sơ
  }, [id, hs, form]);

  const setHs = (row) => {
    qc.setQueryData(["tiep-sinh-ho-so", String(row.id)], (old) => ({ ...(old || {}), data: { ...(old?.data || {}), ...row } }));
    qc.invalidateQueries({ queryKey: ["tiep-sinh-thong-ke"] });
    qc.invalidateQueries({ queryKey: ["tiep-sinh-list"] });
    qc.invalidateQueries({ queryKey: ["tiep-sinh-dau-moi"] });
  };

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res?.data?.id) setHs(res.data);
      if (okMsg) message.success(okMsg);
      return res?.data;
    } catch (e) {
      message.error(errMsg(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const openHoSo = (newId) => onOpen(newId || null);

  const goNext = async () => {
    try {
      const res = await getThongKeTiepSinh({});
      const next = (res?.data?.hang_doi || []).find((x) => String(x.id) !== String(id));
      if (next) {
        openHoSo(next.id);
        message.info(`Hồ sơ tiếp theo: ${next.ho_ten}`);
      } else {
        openHoSo(null);
        message.info("Hàng đợi trống — sẵn sàng nhận hồ sơ mới");
      }
    } catch {
      openHoSo(null);
    }
  };

  // Bước 1 — lưu thông tin
  const saveInfo = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const body = fromFormValues(values);
    if (!hs) {
      const row = await run(() => taoHoSo({ ...body, da_doi_chieu_cccd: fromScan }), "Đã tiếp nhận hồ sơ");
      if (row) {
        if (row.da_ton_tai) message.info("CCCD này đã có hồ sơ — đã gộp thông tin vào hồ sơ cũ");
        loadedId.current = row.id;
        qc.setQueryData(["tiep-sinh-ho-so", String(row.id)], { data: row });
        onOpen(row.id);
        setStep(row.co_anh ? 2 : 1);
      }
    } else {
      const row = await run(() => capNhatHoSo(hs.id, { ...body, ...(fromScan ? { da_doi_chieu_cccd: true } : {}) }), "Đã lưu thông tin");
      if (row) setStep(row.co_anh ? 2 : 1);
    }
  };

  const onScanResult = (d, nguon = "qr", toast = true) => {
    setScanOpen(false);
    setOcrOpen(false);
    const cur = form.getFieldsValue();
    form.setFieldsValue({
      ...Object.fromEntries(Object.entries(d).filter(([, v]) => v)),
      ngay_sinh: d.ngay_sinh ? dayjs(d.ngay_sinh) : cur.ngay_sinh,
      ngay_cap_cccd: d.ngay_cap_cccd ? dayjs(d.ngay_cap_cccd) : cur.ngay_cap_cccd,
    });
    // OCR có thể đọc sai -> không tính là đã đối chiếu CCCD
    setFromScan(nguon === "qr");
    if (toast) message.success(
      nguon === "qr"
        ? "Đã điền thông tin từ CCCD — vui lòng bổ sung các trường còn thiếu"
        : "Đã điền thông tin từ ảnh CCCD — vui lòng kiểm tra lại và bổ sung",
    );
  };

  const inMauDon = async (base) => {
    if (!forms.length) {
      message.warning("Chưa chọn mẫu đơn để in");
      return;
    }
    const row = await run(() => ghiNhanInHoSo(base.id));
    if (row) {
      await printForms({ ...base, ...row }, forms).catch((e) => message.error(errMsg(e, "Không tạo được bản in")));
      message.success(`Đang in ${forms.length} mẫu đơn`);
    }
  };

  const doDuyet = async () => {
    if (!hs.co_anh) {
      message.warning("Hãy chụp ảnh học viên trước khi duyệt");
      setStep(1);
      return;
    }
    const row = await run(() => duyetHoSo(hs.id), "Đã duyệt hồ sơ");
    if (row) {
      setStep(3);
      // Duyệt xong in luôn các mẫu đơn cho học viên ký
      await inMauDon({ ...hs, ...row });
    }
  };

  const doIn = () => inMauDon(hs);

  const doTraBoSung = async (lyDo) => {
    const row = await run(() => traBoSungHoSo(hs.id, lyDo), "Đã trả hồ sơ yêu cầu bổ sung");
    if (row) setTraOpen(false);
  };

  const daDuyet = hs?.trang_thai === "da_duyet" || hs?.trang_thai === "da_in";
  const boHoc = hs?.trang_thai === "bo_hoc";
  const maxStep = !hs ? 0 : daDuyet ? 3 : boHoc ? 1 : 2;

  // Nút chính theo bước — bước Chụp ảnh/Duyệt đều là "Duyệt hồ sơ" (như ảnh mẫu)
  const primary = (() => {
    if (step === 0) return { label: hs ? "Lưu & tiếp tục" : "Tiếp nhận hồ sơ", onClick: saveInfo };
    if (!hs || boHoc) return null;
    if (step === 1 || step === 2) {
      if (daDuyet) return { label: "Sang bước in", onClick: () => setStep(3) };
      return { label: "Duyệt hồ sơ", onClick: doDuyet, disabled: hs.thieu_truong?.length > 0 };
    }
    if (step === 3) {
      if (!daDuyet) return { label: "Duyệt hồ sơ", onClick: () => setStep(2) };
      return { label: hs.so_lan_in ? "In lại hồ sơ" : "In hồ sơ", onClick: doIn, disabled: !forms.length };
    }
    return null;
  })();

  const stepTitle = ["Nhập / bổ sung thông tin học viên", "Chụp ảnh học viên", "Kiểm tra & duyệt hồ sơ", "In hồ sơ để học viên ký"][step];
  const stepIcon = STEPS[step].icon;
  // Màu khung trạng thái (chờ duyệt dùng xanh lá như ảnh mẫu)
  const st = (() => {
    const t = hs?.trang_thai;
    if (t === "cho_duyet") return { label: "Đang chờ duyệt", color: "#16a34a", bg: "#e9f9ee", icon: <CheckOutlined /> };
    if (t === "da_duyet") return { label: "Đã duyệt", color: "#16a34a", bg: "#e9f9ee", icon: <CheckOutlined /> };
    if (t === "da_in") return { label: "Đã in hồ sơ", color: "#7c3aed", bg: "#f2ecff", icon: <PrinterOutlined /> };
    if (t === "can_bo_sung") return { label: "Cần bổ sung", color: "#ea580c", bg: "#fff3e6", icon: <ExclamationCircleFilled /> };
    if (t === "bo_hoc") return { label: "Đã bỏ học", color: "#64748b", bg: "#eef1f5", icon: <CloseOutlined /> };
    return { label: "", color: "#64748b", bg: "#f1f5f9", icon: null };
  })();

  return (
    <div
      className={inModal ? "rounded-2xl p-3 sm:p-4 xl:h-[calc(100vh-32px)] xl:min-h-[640px]" : "-m-4 min-h-full p-3 sm:p-5 xl:h-[calc(100vh-64px)] xl:min-h-[640px]"}
      style={{ background: "linear-gradient(180deg, #eaf2ff 0%, #f6f9ff 40%, #f8fafc 100%)" }}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <IntakeHeader
          menu={{
            items: [
              { key: "moi", icon: <PlusOutlined />, label: "Tiếp nhận hồ sơ mới" },
              ...(hs ? [{ key: "tiep", icon: <RightOutlined />, label: "Hồ sơ tiếp theo trong hàng đợi" }] : []),
              { type: "divider" },
              { key: "dong_bo", icon: <SyncOutlined />, label: "Đồng bộ hồ sơ HV tự khai" },
              { key: "qr", icon: <QrcodeOutlined />, label: "Mã QR biểu mẫu khai hồ sơ" },
              { key: "cau_hinh", icon: <SettingOutlined />, label: "Cấu hình" },
              { type: "divider" },
              { key: "back", icon: inModal ? <CloseOutlined /> : <ArrowLeftOutlined />, label: inModal ? "Đóng" : "Về trang tổng quan" },
            ],
            onClick: ({ key }) => {
              if (key === "moi") openHoSo(null);
              else if (key === "tiep") goNext();
              else if (key === "back") onBack();
              else setToolModal(key);
            },
          }}
        />

        <StepBar step={step} maxStep={maxStep} onChange={setStep} />

        {id && isLoading ? (
          <div className="py-24 text-center"><Spin size="large" /></div>
        ) : id && !hs ? (
          <Empty description="Không tìm thấy hồ sơ" className="py-16" />
        ) : (
          <>
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:grid-rows-[minmax(0,1fr)]">
              <StudentCard hs={step === 0 && !hs ? null : hs} />
              <BluePanel
                title={stepTitle}
                icon={stepIcon}
                className="h-full"
                extra={step === 0 && !inModal && <QueuePicker onPick={openHoSo} />}
              >
                {step === 0 && (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Button type="primary" icon={<ScanOutlined />} style={{ background: BLUE }}
                        onClick={() => setScanOpen(true)}>
                        Quét CCCD để điền nhanh
                      </Button>
                      <Button icon={<PictureOutlined />} style={{ color: BLUE, borderColor: BLUE }} onClick={() => setOcrOpen(true)}>
                        Nhập từ ảnh CCCD
                      </Button>
                      {fromScan && <span className="text-sm text-green-600"><CheckCircleFilled /> Dữ liệu lấy từ CCCD</span>}
                    </div>
                    <Form form={form} layout="vertical" requiredMark className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 [&_.ant-form-item]:!mb-3">
                      <Form.Item name="ho_ten" label="Họ và tên" rules={[{ required: true, message: "Nhập họ tên" }]}>
                        <Input placeholder="VD: Phạm Thị Lan Anh" />
                      </Form.Item>
                      <Form.Item name="ngay_sinh" label="Ngày sinh">
                        <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="dd/mm/yyyy" />
                      </Form.Item>
                      <Form.Item name="cccd" label="Số CCCD" rules={[{ pattern: /^\d{12}$/, message: "CCCD gồm 12 chữ số" }]}>
                        <Input maxLength={12} placeholder="12 chữ số" />
                      </Form.Item>
                      <div className="grid grid-cols-2 gap-x-3">
                        <Form.Item name="ngay_cap_cccd" label="Ngày cấp">
                          <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="dd/mm/yyyy" />
                        </Form.Item>
                        <Form.Item name="dien_thoai" label="Số điện thoại" rules={[{ pattern: /^[0-9+ .]{8,15}$/, message: "SĐT không hợp lệ" }]}>
                          <Input placeholder="09xx xxx xxx" />
                        </Form.Item>
                      </div>
                      <Form.Item name="dia_chi" label="Nơi cư trú (thường trú)" className="sm:col-span-2">
                        <Input placeholder="Số nhà, đường, xã/phường, tỉnh/thành phố" />
                      </Form.Item>
                      <Form.Item name="noi_cap" label="Nơi cấp CCCD">
                        <Input placeholder="Cục Cảnh sát QLHC về TTXH" />
                      </Form.Item>
                      <Form.Item name="email" label="Email">
                        <Input />
                      </Form.Item>
                      <Form.Item name="loai_hinh" label="Hạng đăng ký (loại hình học)" rules={[{ required: true, message: "Chọn loại hình học" }]}>
                        <Select options={LOAI_HINH_OPTIONS} placeholder="Chọn theo đăng ký của học viên" />
                      </Form.Item>
                      <Form.Item name="kham_suc_khoe" label="Khám sức khoẻ">
                        <Select options={KHAM_SK_OPTIONS} placeholder="Chọn hình thức khám" allowClear />
                      </Form.Item>
                      <div className="sm:col-span-2 mb-3">
                        <PhaiThuForm form={form} hs={hs} />
                      </div>
                      <Form.Item name="khoa_hoc" label="Khóa học">
                        <Input />
                      </Form.Item>
                      <Form.Item name="dau_moi" label="Đầu mối tuyển sinh" className="!mb-1">
                        <DauMoiInput />
                      </Form.Item>
                      <Form.Item name="ghi_chu" label="Ghi chú" className="sm:col-span-2">
                        <Input.TextArea rows={2} />
                      </Form.Item>
                    </Form>
                  </div>
                )}
                {step === 1 && hs && <ChupAnhStep hs={hs} onSaved={setHs} />}
                {step === 2 && hs && <DuyetStep hs={hs} />}
                {step === 3 && hs && <InStep hs={hs} forms={forms} setForms={setForms} />}
              </BluePanel>
            </div>

            {/* Thanh dưới: trạng thái + thao tác nhanh + nút chính */}
            <div className={`grid shrink-0 items-stretch gap-4 ${coNghiepVu(hs)
              ? "lg:grid-cols-2 2xl:grid-cols-[minmax(0,3.6fr)_minmax(0,3.8fr)_minmax(0,5.6fr)_minmax(0,3.4fr)]"
              : "lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,4fr)]"}`}>
              <div className="rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur">
                <div className="mb-1.5 flex items-center gap-2 text-[14px] font-bold" style={{ color: BLUE_DARK }}>
                  <FileTextOutlined style={{ color: BLUE }} /> Trạng thái hồ sơ
                </div>
                {hs ? (
                  <div className="flex items-center gap-3 rounded-xl px-3 py-1.5" style={{ background: st.bg }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-white"
                      style={{ background: st.color }}>
                      {st.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[17px] font-bold leading-tight" style={{ color: st.color }}>
                        {st.label}
                      </div>
                      <div className="text-[12px] text-slate-700">Thời gian khai: {fmtDateTime(hs.thoi_gian_khai)}</div>
                      {boHoc && hs.ly_do_bo_hoc && <div className="truncate text-[13px] text-slate-600">Lý do: {hs.ly_do_bo_hoc}</div>}
                      {hs.ly_do_bo_sung && hs.trang_thai === "can_bo_sung" && (
                        <div className="truncate text-[13px] text-orange-600">Bổ sung: {hs.ly_do_bo_sung}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-2 py-4 text-sm text-slate-500">Hồ sơ mới — chưa lưu</div>
                )}
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur">
                <div className="mb-1.5 flex items-center gap-2 text-[14px] font-bold" style={{ color: BLUE_DARK }}>
                  <ThunderboltFilled className="text-amber-400" /> Thao tác nhanh
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" disabled={!hs} onClick={() => setDetailOpen(true)}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-blue-400 bg-white font-semibold transition hover:bg-blue-50 disabled:opacity-40" style={{ color: "#1d4ed8", fontSize: 15 }}>
                    <FileTextOutlined className="text-lg" /> Xem chi tiết
                  </button>
                  {hs?.trang_thai === "can_bo_sung" ? (
                    <button type="button" disabled={busy} onClick={() => run(() => moLaiHoSo(hs.id), "Đã chuyển về chờ duyệt")}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-orange-300 bg-orange-50 font-semibold transition hover:brightness-95 disabled:opacity-40" style={{ color: "#ea580c", fontSize: 15 }}>
                      <UndoOutlined className="text-lg" /> Đã bổ sung xong
                    </button>
                  ) : (
                    <button type="button" disabled={!hs || hs.trang_thai === "da_in" || boHoc} onClick={() => setTraOpen(true)}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-red-300 bg-red-50 font-semibold transition hover:brightness-95 disabled:opacity-40" style={{ color: "#ef4444", fontSize: 15 }}>
                      <RollbackOutlined className="text-lg" /> Trả hồ sơ bổ sung
                    </button>
                  )}
                </div>
              </div>
              {coNghiepVu(hs) && <NghiepVuButtons hs={hs} className="self-stretch" />}
              {primary && (
                <Tooltip title={primary.disabled && hs?.thieu_truong?.length ? `Còn thiếu: ${hs.thieu_truong.join(", ")}` : null}>
                  <button
                    type="button"
                    disabled={busy || primary.disabled}
                    onClick={primary.onClick}
                    className="flex h-12 w-full items-center justify-between gap-3 self-center rounded-xl px-5 text-white shadow-[0_10px_24px_rgba(22,163,74,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "linear-gradient(180deg, #2fc35f 0%, #149a43 100%)", color: "#fff" }}
                  >
                    <span className="flex items-center gap-3 text-[18px] font-bold">
                      {busy ? <Spin size="small" /> : primary.label.startsWith("In") ? <FaPrint className="text-[20px]" /> : <FaCheck className="text-[20px]" />}
                      {primary.label}
                    </span>
                    <RightOutlined className="text-base" />
                  </button>
                </Tooltip>
              )}
            </div>
          </>
        )}
      </div>

      <CauHinhModal open={toolModal === "cau_hinh"} onClose={() => setToolModal(null)} />
      <DongBoModal
        open={toolModal === "dong_bo"}
        onClose={() => setToolModal(null)}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["tiep-sinh-thong-ke"] });
          qc.invalidateQueries({ queryKey: ["tiep-sinh-list"] });
          qc.invalidateQueries({ queryKey: ["tiep-sinh-queue-picker"] });
        }}
      />
      <QrKhaiModal open={toolModal === "qr"} onClose={() => setToolModal(null)} onConfig={() => setToolModal("cau_hinh")} />
      <CccdScanModal open={scanOpen} onClose={() => setScanOpen(false)} onResult={onScanResult} />
      <OcrCccdModal open={ocrOpen} onClose={() => setOcrOpen(false)} onResult={onScanResult} />
      <HoSoDetailModal id={hs?.id} open={detailOpen} onClose={() => setDetailOpen(false)} />
      <TraBoSungModal open={traOpen} onClose={() => setTraOpen(false)} onSubmit={doTraBoSung} loading={busy} thieu={hs?.thieu_truong || []} />
    </div>
  );
}
