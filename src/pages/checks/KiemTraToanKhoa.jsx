import { useState, useRef, useCallback } from "react";
import { Button, Progress, Typography, message, Input, Modal } from "antd";
import {
  DownloadOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  WarningFilled,
  EyeOutlined,
} from "@ant-design/icons";
import { FaCar, FaRoad, FaRegClock, FaTrophy, FaRegFileAlt } from "react-icons/fa";
import { GiSteeringWheel } from "react-icons/gi";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { kiemTraToanKhoa } from "../../apis/kiemTra";

const { TextArea } = Input;
const { Text } = Typography;

const DEFAULT_START_DATE = "2020-01-01";

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─── Định dạng số liệu ─────────────────────────────────────
const formatGio = (hours) => {
  if (hours === null || hours === undefined || isNaN(hours)) return "-";
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} giờ ${String(m).padStart(2, "0")} phút`;
};

const formatGiay = (seconds) =>
  seconds === null || seconds === undefined ? "-" : formatGio(Number(seconds) / 3600);

const formatKm = (km) =>
  km === null || km === undefined || isNaN(km) ? "-" : `${Number(km).toFixed(2)} km`;

const CABIN_STATUS = {
  dat: { label: "Đạt", color: "success" },
  chua_dat: { label: "Chưa đạt", color: "error" },
  chua_hoc: { label: "Chưa học", color: "default" },
};

// ─── Chuẩn hóa kết quả API ─────────────────────────────────────
const normalizeIssue = (issue = {}, fallbackType) => ({
  type: issue?.type || fallbackType,
  label: issue?.label || (fallbackType === "warning" ? "Cảnh báo" : "Lỗi"),
  message: issue?.message || "Không có chi tiết.",
});

const pickStats = (item = {}) => ({
  hoTen: item?.hoTen || null,
  cccd: item?.cccd || null,
  maKhoa: item?.maKhoa || null,
  lyThuyet: item?.lyThuyet || null,
  cabin: item?.cabin || null,
  dat: {
    soPhien: item?.totalSessions ?? null,
    gioThucTe: item?.summary?.tongThoiGianChuaLoaiGio ?? null,
    kmThucTe: item?.summary?.tongQuangDuongChuaLoai ?? null,
    gioHopLe: item?.summary?.tongThoiGianGio ?? null,
    kmHopLe: item?.summary?.tongQuangDuong ?? null,
  },
});

const createMissingResult = (code) => ({
  code,
  status: "Lỗi",
  errors: [
    {
      type: "error",
      label: "Thiếu dữ liệu phản hồi",
      message: "Không nhận được kết quả kiểm tra từ API cho mã học viên này.",
    },
  ],
  warnings: [],
  rawStatus: "missing",
  ...pickStats(),
});

const mapApiItemToResult = (item = {}) => {
  const rawStatus = String(item?.status || "fail").toLowerCase();
  const errors = Array.isArray(item?.errors)
    ? item.errors.map((error) => normalizeIssue(error, "error"))
    : [];
  const warnings = Array.isArray(item?.warnings)
    ? item.warnings.map((warning) => normalizeIssue(warning, "warning"))
    : [];
  const base = { code: item?.maDK || "", warnings, rawStatus, ...pickStats(item) };

  if (rawStatus === "pass") return { ...base, status: "Đạt", errors };
  if (rawStatus === "fail") return { ...base, status: "Chưa đạt", errors };

  if (rawStatus === "nodata" || rawStatus === "no_data") {
    return {
      ...base,
      status: "Chưa đạt",
      errors:
        errors.length > 0
          ? errors
          : [
              {
                type: "error",
                label: "Chưa có dữ liệu",
                message: "Không tìm thấy phiên học DAT nào của học viên này.",
              },
            ],
    };
  }

  return {
    ...base,
    status: "Lỗi",
    errors:
      errors.length > 0
        ? errors
        : [
            {
              type: "error",
              label: "Lỗi xử lý",
              message: item?.message
                ? `Không kiểm tra được: ${item.message}`
                : "API trả về trạng thái lỗi cho học viên này.",
            },
          ],
  };
};

// ─── Xuất Excel ─────────────────────────────────────
const buildExcelRow = (item, idx) => {
  const lt = item.lyThuyet || {};
  const cb = item.cabin || {};
  return {
    STT: idx + 1,
    "Mã học viên": item.code,
    "Họ tên": item.hoTen || "",
    CCCD: item.cccd || "",
    "Khóa": item.maKhoa || "",
    "Kết quả DAT": item.status,
    "Lý thuyết - Đạt chương trình":
      lt.dat_chuong_trinh === true ? "Đạt" : lt.dat_chuong_trinh === false ? "Chưa đạt" : "Chưa có dữ liệu",
    "Lý thuyết - Điểm từng môn": (lt.mon || [])
      .map((m) => `${m.ten}: ${m.diem} ${m.dat ? "✓" : "✗"}`)
      .join("; "),
    "Cabin - Tổng thời gian": cb.loi ? "Lỗi tải dữ liệu" : formatGiay(cb.tong_thoi_gian_giay),
    "Cabin - Số giờ": cb.tong_thoi_gian_giay != null ? +(cb.tong_thoi_gian_giay / 3600).toFixed(2) : "",
    "Cabin - Số bài": cb.so_bai_hoc ?? "",
    "Cabin - Trạng thái": CABIN_STATUS[cb.trang_thai]?.label || "",
    "DAT - Số phiên": item.dat.soPhien ?? "",
    "DAT thực tế - Thời gian": formatGio(item.dat.gioThucTe),
    "DAT thực tế - Quãng đường (km)": item.dat.kmThucTe ?? "",
    "DAT sau trừ phiên lỗi - Thời gian": formatGio(item.dat.gioHopLe),
    "DAT sau trừ phiên lỗi - Quãng đường (km)": item.dat.kmHopLe ?? "",
    "Điều kiện chưa đạt": item.errors
      .map((e) => `[${e.label}] ${e.message}`)
      .join("; "),
    "Cảnh báo": item.warnings.map((w) => `[${w.label}] ${w.message}`).join("; "),
  };
};

const exportExcel = (list, filePrefix, sheetName) => {
  if (list.length === 0) {
    message.warning("Danh sách rỗng!");
    return;
  }
  const rows = list.map(buildExcelRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0]).map((key) => ({
    wch: Math.min(
      60,
      Math.max(
        key.length,
        ...rows.map((r) => String(r[key] ?? "").length),
      ) + 2,
    ),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filePrefix}_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
};

// ─── UI con ─────────────────────────────────────
const GREEN = "#1f6b45";

const STATUS_STYLE = {
  "Đạt": {
    pill: "bg-[#e7f5ec] text-[#1f6b45] border-[#bfe3cc]",
    icon: <CheckCircleFilled className="!text-[#2e9b5f]" />,
  },
  "Chưa đạt": {
    pill: "bg-[#fdecec] text-[#c62828] border-[#f5c2c2]",
    icon: <CloseCircleFilled className="!text-[#e53935]" />,
  },
  "Lỗi": {
    pill: "bg-gray-100 text-gray-600 border-gray-300",
    icon: <ExclamationCircleFilled className="!text-gray-500" />,
  },
};

const StatusPill = ({ status }) => {
  const st = STATUS_STYLE[status] || STATUS_STYLE["Chưa đạt"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm font-bold border ${st.pill}`}
    >
      {st.icon} {status}
    </span>
  );
};

// Điều kiện cabin (giống backend getCabinStatus): >= 150 phút và >= 8 bài
const CABIN_YEU_CAU_GIAY = 150 * 60;
const CABIN_YEU_CAU_BAI = 8;

const PassText = ({ value, emptyText = "Chưa có dữ liệu" }) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic font-medium">{emptyText}</span>;
  }
  return (
    <span className={`font-bold text-base ${value ? "text-[#1f6b45]" : "text-[#c62828]"}`}>
      {value ? "Đạt" : "Chưa đạt"}
    </span>
  );
};

const StatCard = ({ icon, title, onClick, children }) => (
  <div
    role="button"
    tabIndex={0}
    title="Bấm để xem chi tiết"
    onClick={onClick}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    className="flex items-center gap-3 rounded-xl border border-[#e3ece6] bg-[#f6faf7] px-4 py-3 min-w-0 cursor-pointer transition hover:border-[#1f6b45]/40 hover:bg-[#eef6f1] hover:shadow-sm"
  >
    <span className="text-2xl shrink-0" style={{ color: GREEN }}>
      {icon}
    </span>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
        {title}
      </div>
      <div className="text-sm text-gray-900 truncate">{children}</div>
    </div>
  </div>
);

const StudentStats = ({ item, onOpen }) => {
  const lt = item.lyThuyet || {};
  const cb = item.cabin || {};
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <StatCard icon={<FaCar />} title="Lý thuyết" onClick={() => onOpen("lt")}>
        <PassText value={lt.dat_chuong_trinh} />
      </StatCard>
      <StatCard icon={<GiSteeringWheel />} title="Cabin" onClick={() => onOpen("cabin")}>
        {cb.loi ? (
          <span className="text-gray-400 italic">Lỗi tải dữ liệu</span>
        ) : (
          <PassText value={cb.trang_thai ? cb.trang_thai === "dat" : null} />
        )}
      </StatCard>
      <StatCard icon={<FaRegClock />} title="DAT thực tế đã chạy" onClick={() => onOpen("dat")}>
        <b>
          {formatGio(item.dat.gioThucTe)} - {formatKm(item.dat.kmThucTe)}
        </b>
        {item.dat.soPhien ? (
          <span className="text-xs text-gray-500"> ({item.dat.soPhien} phiên)</span>
        ) : null}
      </StatCard>
      <StatCard icon={<FaRoad />} title="DAT sau khi trừ phiên lỗi" onClick={() => onOpen("dat")}>
        <b>
          {formatGio(item.dat.gioHopLe)} - {formatKm(item.dat.kmHopLe)}
        </b>
      </StatCard>
    </div>
  );
};

const LINE_STYLE = {
  ok: {
    box: "bg-[#eaf6ee] text-gray-800",
    icon: <CheckCircleFilled className="!text-[#2e9b5f] text-base" />,
  },
  fail: {
    box: "bg-[#fdecec] text-[#c62828]",
    icon: <CloseCircleFilled className="!text-[#e53935] text-base" />,
  },
  warn: {
    box: "bg-[#fff6dc] border border-[#f6d58a] text-[#8a5a00]",
    icon: <WarningFilled className="!text-[#e6a100] text-base" />,
  },
};

const CheckLine = ({ type, children }) => (
  <div className={`flex items-start gap-2.5 text-sm rounded-lg px-3 py-1.5 ${LINE_STYLE[type].box}`}>
    <span className="mt-0.5 shrink-0">{LINE_STYLE[type].icon}</span>
    <div className="min-w-0">{children}</div>
  </div>
);

const DetailColumn = ({ icon, title, headerColor = GREEN, watermark, children }) => (
  <div className="relative rounded-xl border border-[#e3ece6] bg-white overflow-hidden flex flex-col">
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 text-white font-bold text-[15px]"
      style={{ backgroundColor: headerColor }}
    >
      <span className="text-lg flex">{icon}</span>
      {title}
    </div>
    <div className="relative z-10 p-2.5 space-y-1.5 flex-1">{children}</div>
    {watermark && (
      <span className="pointer-events-none absolute -right-6 -bottom-6 text-[150px] text-[#1f6b45] opacity-[0.06]">
        {watermark}
      </span>
    )}
  </div>
);

// only: "lt" | "cabin" | "dat" | undefined (hiện cả 3)
const StudentDetail = ({ item, only }) => {
  const lt = item.lyThuyet || {};
  const cb = item.cabin || {};
  const cabinGiay = Number(cb.tong_thoi_gian_giay) || 0;
  const cabinBai = Number(cb.so_bai_hoc) || 0;
  const cabinDat = cb.trang_thai === "dat";

  const datHeader =
    item.status === "Đạt"
      ? {
          color: GREEN,
          icon: item.warnings.length ? <WarningFilled /> : <CheckCircleFilled />,
        }
      : item.status === "Lỗi"
        ? { color: "#6b7280", icon: <ExclamationCircleFilled /> }
        : { color: "#c62828", icon: <CloseCircleFilled /> };

  return (
    <div className={`grid grid-cols-1 gap-3 ${only ? "" : "lg:grid-cols-3"}`}>
      {(!only || only === "lt") && (
      <DetailColumn
        icon={lt.dat_chuong_trinh === false ? <CloseCircleFilled /> : <CheckCircleFilled />}
        title="Lý thuyết"
        headerColor={lt.dat_chuong_trinh === false ? "#c62828" : GREEN}
      >
        {(lt.mon || []).length === 0 ? (
          <div className="text-sm text-gray-400 italic px-1">Chưa có dữ liệu lý thuyết</div>
        ) : (
          lt.mon.map((m) => (
            <CheckLine key={m.ten} type={m.dat ? "ok" : "fail"}>
              {m.ten}: <b>{m.diem}</b>
            </CheckLine>
          ))
        )}
      </DetailColumn>
      )}

      {(!only || only === "cabin") && (
      <DetailColumn
        icon={<FaCar />}
        title="Cabin"
        headerColor={cb.loi || cabinDat ? GREEN : "#c62828"}
        watermark={<GiSteeringWheel />}
      >
        {cb.loi ? (
          <div className="text-sm text-gray-400 italic px-1">Lỗi tải dữ liệu cabin</div>
        ) : (
          <>
            <CheckLine type={cabinGiay >= CABIN_YEU_CAU_GIAY ? "ok" : "fail"}>
              Thời gian: <b>{formatGiay(cabinGiay)}</b>
              <div className="text-xs opacity-80">
                (yêu cầu ≥ {formatGiay(CABIN_YEU_CAU_GIAY)})
              </div>
            </CheckLine>
            <CheckLine type={cabinBai >= CABIN_YEU_CAU_BAI ? "ok" : "fail"}>
              Số bài: <b>{cabinBai}</b>
              <div className="text-xs opacity-80">(yêu cầu ≥ {CABIN_YEU_CAU_BAI} bài)</div>
            </CheckLine>
          </>
        )}
      </DetailColumn>
      )}

      {(!only || only === "dat") && (
      <DetailColumn icon={datHeader.icon} title={`DAT - ${item.status}`} headerColor={datHeader.color}>
        {item.errors.length === 0 && item.warnings.length === 0 && (
          <CheckLine type="ok">Đạt tất cả điều kiện DAT</CheckLine>
        )}
        {item.errors.map((err, i) => (
          <CheckLine key={`e-${i}`} type="fail">
            <span className="font-bold">[{err.label}]</span> {err.message}
          </CheckLine>
        ))}
        {item.warnings.map((warn, i) => (
          <CheckLine key={`w-${i}`} type="warn">
            <span className="font-bold">[{warn.label}]</span> {warn.message}
          </CheckLine>
        ))}
      </DetailColumn>
      )}
    </div>
  );
};

const SummaryPill = ({ className, icon, label, value }) => (
  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold ${className}`}>
    {icon} {label}: {value}
  </span>
);

const KiemTraHangLoat = () => {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  // Chi tiết mở trong modal: { item, only }
  const [detail, setDetail] = useState(null);

  const abortControllerRef = useRef(null);
  const resultsRef = useRef(null);

  const datCount = results.filter((r) => r.status === "Đạt").length;
  const chuaDatCount = results.filter((r) => r.status === "Chưa đạt").length;
  const loiCount = results.filter((r) => r.status === "Lỗi").length;

  const handleRun = useCallback(async () => {
    const uniqueCodes = [
      ...new Set(
        inputText
          .split("\n")
          .map((c) => c.trim())
          .filter(Boolean),
      ),
    ];

    if (uniqueCodes.length === 0) {
      message.warning("Vui lòng dán ít nhất một mã học viên!");
      return;
    }

    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setDetail(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await kiemTraToanKhoa(
        {
          ma_dk: uniqueCodes,
          ngaybatdau: DEFAULT_START_DATE,
          ngayketthuc: `${getTodayString()}T23:59:00`,
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted) {
        throw new DOMException("Đã dừng", "AbortError");
      }

      const responseData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response)
            ? response
            : [];
      const mappedByCode = new Map(
        responseData
          .map((item) => {
            const mappedItem = mapApiItemToResult(item);
            return mappedItem.code ? [mappedItem.code, mappedItem] : null;
          })
          .filter(Boolean),
      );

      // Mã không có trong phản hồi => Lỗi (không được coi là Đạt)
      const orderedResults = uniqueCodes.map(
        (code) => mappedByCode.get(code) || createMissingResult(code),
      );

      setResults(orderedResults);
      setProgress(100);

      const finalDat = orderedResults.filter((r) => r.status === "Đạt").length;
      const finalChuaDat = orderedResults.filter((r) => r.status === "Chưa đạt").length;
      const finalLoi = orderedResults.filter((r) => r.status === "Lỗi").length;

      const summaryMessage = [`Đạt: ${finalDat}`, `Chưa đạt: ${finalChuaDat}`];
      if (finalLoi > 0) summaryMessage.push(`Lỗi: ${finalLoi}`);

      message.success(`Hoàn tất! ${summaryMessage.join(" | ")}`);
      resultsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
        message.info("Đã dừng kiểm tra");
      } else {
        message.error(
          err?.response?.data?.message ||
            err?.message ||
            "Quá trình kiểm tra bị gián đoạn.",
        );
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [inputText]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const openDetail = (item, only) => setDetail({ item, only });
  const DETAIL_TITLE = { lt: "Lý thuyết", cabin: "Cabin", dat: "DAT" };

  return (
    <div className="-m-4 p-4 sm:p-6 min-h-full bg-gradient-to-br from-[#eef6f1] via-[#f5f9f6] to-[#e9f3ee]">
      <h1 className="text-2xl !font-bold text-gray-900 !mb-4">Báo cáo học viên hàng loạt</h1>

      {/* Nhập mã */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <Button
          type="primary"
          size="large"
          icon={isRunning ? <StopOutlined /> : <CheckCircleOutlined />}
          onClick={isRunning ? handleStop : handleRun}
          danger={isRunning}
          loading={isRunning && !abortControllerRef.current?.signal.aborted}
          disabled={!isRunning && !inputText.trim()}
          className="!rounded-xl !px-6 !font-bold !h-11 !shadow-[0_6px_18px_rgba(22,119,255,0.35)]"
        >
          {isRunning ? "DỪNG" : "KIỂM TRA"}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            size="large"
            icon={<DownloadOutlined />}
            className="!rounded-xl !text-sm"
            onClick={() =>
              exportExcel(
                results.filter((r) => r.status === "Đạt"),
                "danh-sach-dat",
                "Dat",
              )
            }
          >
            Xuất danh sách đạt
          </Button>
          <Button
            size="large"
            type="primary"
            icon={<DownloadOutlined />}
            className="!rounded-xl !text-sm"
            onClick={() =>
              exportExcel(
                results.filter((r) => r.status !== "Đạt"),
                "danh-sach-chua-dat",
                "ChuaDat",
              )
            }
          >
            Xuất danh sách chưa đạt
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/90 border border-[#e3ece6] shadow-sm px-4 pt-3 pb-2 mb-5">
        <TextArea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Dán danh sách mã học viên (mỗi dòng 1 mã)\nVí dụ:\n30004-20250620145059557\n30004-20250620145059558`}
          className="!border-0 !shadow-none !px-0 font-mono text-sm"
          disabled={isRunning}
          autoSize={{ minRows: 2, maxRows: 10 }}
        />
        <Progress
          percent={progress}
          status={isRunning ? "active" : progress === 100 ? "success" : "normal"}
          strokeColor="#1677ff"
          size={["100%", 8]}
          className="!mb-0"
        />
      </div>

      {/* Kết quả */}
      <div className="rounded-2xl bg-white/95 border border-[#e3ece6] shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: GREEN }}
            >
              <FaRegFileAlt />
            </span>
            <div>
              <h2 className="text-xl !font-bold text-gray-900 !mb-0">Kết quả kiểm tra</h2>
              <p className="text-[#64748b] text-[13px] !mb-0">
                Danh sách kết quả kiểm tra sẽ hiển thị ở đây.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-[#f3f6f4] p-1">
            <SummaryPill
              className="text-gray-800"
              icon={<FaTrophy className="text-[#e0a100]" />}
              label="Tổng"
              value={results.length}
            />
            <SummaryPill
              className="bg-[#e7f5ec] text-[#1f6b45]"
              icon={<CheckCircleFilled className="!text-[#2e9b5f]" />}
              label="Đạt"
              value={datCount}
            />
            <SummaryPill
              className="bg-[#fdecec] text-[#c62828]"
              icon={<CloseCircleFilled className="!text-[#e53935]" />}
              label="Chưa đạt"
              value={chuaDatCount}
            />
            {loiCount > 0 && (
              <SummaryPill
                className="bg-gray-100 text-gray-600"
                icon={<ExclamationCircleFilled />}
                label="Lỗi"
                value={loiCount}
              />
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-16 text-gray-500 italic">
            {isRunning ? "Đang xử lý..." : "Chưa có thông tin kiểm tra."}
          </div>
        ) : (
          <div ref={resultsRef} className="max-h-[75vh] overflow-y-auto space-y-3 pr-1">
            {results.map((item, idx) => {
              return (
                <div
                  key={`${item.code}-${idx}`}
                  className="rounded-2xl border border-[#e3ece6] bg-white shadow-[0_2px_10px_rgba(31,107,69,0.06)]"
                >
                  {/* Dòng tiêu đề */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => openDetail(item)}
                  >
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-[#e7f5ec] text-[#1f6b45] font-bold flex items-center justify-center text-sm">
                        {idx + 1}
                      </span>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Text
                          copyable={{ text: item.code }}
                          className="!font-bold !text-[15px] !text-gray-900"
                        >
                          {item.code}
                        </Text>
                      </span>
                      {item.hoTen && (
                        <span className="font-bold text-gray-800 uppercase">{item.hoTen}</span>
                      )}
                      {item.maKhoa && (
                        <span className="px-3 py-0.5 rounded-full bg-[#eef2f6] text-gray-700 text-sm">
                          {item.maKhoa}
                        </span>
                      )}
                      {item.errors.length > 0 && (
                        <span
                          title={`${item.errors.length} điều kiện không đạt`}
                          className="w-6 h-6 rounded-full bg-[#e53935] text-white text-xs font-bold flex items-center justify-center"
                        >
                          {item.errors.length}
                        </span>
                      )}
                      {item.warnings.length > 0 && (
                        <span
                          title={`${item.warnings.length} cảnh báo`}
                          className="w-6 h-6 rounded-full bg-[#f59e0b] text-white text-xs font-bold flex items-center justify-center"
                        >
                          {item.warnings.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusPill status={item.status} />
                      <span className="hidden sm:inline-flex items-center gap-1 text-sm text-[#1f6b45] font-medium">
                        <EyeOutlined /> Chi tiết
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <StudentStats item={item} onOpen={(only) => openDetail(item, only)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        centered
        destroyOnHidden
        width={detail?.only ? 600 : 1150}
        title={
          detail && (
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <span>
                {detail.only ? `${DETAIL_TITLE[detail.only]} - ` : "Chi tiết - "}
                {detail.item.hoTen || detail.item.code}
              </span>
              <span className="text-sm font-normal text-gray-500">{detail.item.code}</span>
              {!detail.only && <StatusPill status={detail.item.status} />}
            </div>
          )
        }
      >
        {detail && (
          <div className="pt-2">
            <StudentDetail item={detail.item} only={detail.only} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KiemTraHangLoat;
