import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Input, Modal, Table, Tooltip, message } from "antd";
import { SearchOutlined, ReloadOutlined, EyeOutlined, SendOutlined, RightOutlined } from "@ant-design/icons";
import { FaRegCalendarAlt, FaUsers, FaMoneyBillWave, FaCheckCircle, FaUserCircle, FaRegFileAlt, FaPrint, FaRegClock, FaExclamationCircle } from "react-icons/fa";
import dayjs from "dayjs";
import { getNopKeToanTiepSinh, nopKeToanTiepSinh, errMsg } from "../../apis/apiTiepSinh";
import { HeaderBanner, fmtDate, fmtTien } from "./tiepSinhShared";
import { bienBanHtml } from "./bienBanNopKt";

const BLUE = "#1f6ae0";
const HEAD_BG = "linear-gradient(90deg, #1d5fd6, #3b82f6)";
const NHANH = [
  { key: "hom_nay", label: "Hôm nay", range: () => [dayjs(), dayjs()] },
  { key: "hom_qua", label: "Hôm qua", range: () => [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")] },
  { key: "7", label: "7 ngày qua", range: () => [dayjs().subtract(6, "day"), dayjs()] },
  { key: "30", label: "30 ngày qua", range: () => [dayjs().subtract(29, "day"), dayjs()] },
];
const tenNguoi = () => sessionStorage.getItem("name") || sessionStorage.getItem("username") || "Nhân viên";
function inHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 150);
}

function StatBox({ icon, color, label, children }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white px-5 py-3 shadow-sm">
      <span className="text-[38px]" style={{ color }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[15px] font-medium text-slate-700">{label}</div>
        <div className="flex items-baseline gap-2 font-extrabold" style={{ color }}>{children}</div>
      </div>
    </div>
  );
}

const MAC_DINH = NHANH[2]; // 7 ngày qua
const toParams = (r, ids) => ({ tu_ngay: r[0].format("YYYY-MM-DD"), den_ngay: r[1].format("YYYY-MM-DD"), ...(ids ? { ids } : {}) });

/**
 * Danh sách gửi = mọi hồ sơ ĐÃ DUYỆT trong khoảng ngày (mặc định 7 ngày qua)
 * + hồ sơ NV tích chọn tay ở bảng chính (ids) — hồ sơ chưa duyệt chỉ được gửi theo cách này.
 */
export default function NopKeToanModal({ open, onClose, ids = [] }) {
  const qc = useQueryClient();
  const [range, setRange] = useState(() => MAC_DINH.range());
  const [nhanh, setNhanh] = useState(MAC_DINH.key);
  const [params, setParams] = useState(null);
  const [checked, setChecked] = useState([]);
  const [ghiChu, setGhiChu] = useState("");
  const [sending, setSending] = useState(false);
  const [daGui, setDaGui] = useState(null); // { dot, data } sau khi gửi
  const [preview, setPreview] = useState(null);

  const idsKey = ids.join(",");
  useEffect(() => {
    if (!open) return;
    const r = MAC_DINH.range();
    setRange(r);
    setNhanh(MAC_DINH.key);
    setParams(toParams(r, idsKey));
    setGhiChu("");
    setDaGui(null);
  }, [open, idsKey]);

  const { data: res, isFetching, refetch } = useQuery({
    queryKey: ["tiep-sinh-nop-kt", params],
    queryFn: () => getNopKeToanTiepSinh(params),
    enabled: open && !!params,
    staleTime: 0,
  });
  const info = res?.data;
  const rows = useMemo(() => info?.data || [], [info]);
  const tuNgay = params?.tu_ngay;
  const denNgay = params?.den_ngay;
  const soChuaDuyet = rows.filter((r) => !r.da_duyet).length;

  // Mặc định tick hết: hồ sơ đã duyệt trong kỳ + hồ sơ đã tích tay ở bảng chính
  useEffect(() => {
    setChecked(rows.map((r) => r.id));
  }, [rows]);

  const xem = () => {
    if (!range?.[0] || !range?.[1]) return message.warning("Chọn khoảng thời gian");
    const p = toParams(range, idsKey);
    setDaGui(null);
    if (JSON.stringify(p) === JSON.stringify(params)) refetch();
    else setParams(p);
  };
  const chonNhanh = (n) => {
    const r = n.range();
    setRange(r);
    setNhanh(n.key);
    setDaGui(null);
    setParams(toParams(r, idsKey));
  };

  const selRows = rows.filter((r) => checked.includes(r.id));
  const tatCa = rows.length > 0 && checked.length === rows.length;
  const htmlIn = (list, gui) =>
    bienBanHtml({
      rows: list,
      tu: tuNgay,
      den: denNgay,
      nguoi: gui?.dot?.nguoi || tenNguoi(),
      ghiChu: gui ? gui.dot.ghi_chu : ghiChu.trim(),
      thoiGian: gui?.dot?.created_at,
    });
  const dsIn = daGui ? daGui.data : selRows;

  const gui = () => {
    if (!selRows.length) return message.warning("Chưa chọn học viên nào");
    const khongHopLe = selRows.filter((r) => !r.hop_le).length;
    const chuaDuyet = selRows.filter((r) => !r.da_duyet).length;
    Modal.confirm({
      title: "Gửi dữ liệu lên kế toán?",
      content: (
        <div>
          Gửi <b>{selRows.length}</b> học viên, tổng <b>{fmtTien(selRows.reduce((s, r) => s + (r.so_tien || 0), 0))}</b>.
          {chuaDuyet ? <div className="mt-1 font-semibold text-red-600">Trong đó {chuaDuyet} hồ sơ CHƯA DUYỆT (đã tích chọn tay).</div> : null}
          {khongHopLe - chuaDuyet > 0 ? <div className="mt-1 text-orange-600">Có {khongHopLe - chuaDuyet} hồ sơ cần bổ sung / chưa có giá.</div> : null}
          <div className="mt-1 text-slate-500">Hồ sơ đã gửi sẽ không còn trong danh sách này.</div>
        </div>
      ),
      okText: "Gửi",
      onOk: async () => {
        setSending(true);
        try {
          const r = await nopKeToanTiepSinh({ ids: selRows.map((x) => x.id), ghi_chu: ghiChu.trim(), tu_ngay: tuNgay, den_ngay: denNgay });
          message.success(`Đã gửi ${r.data.dot.so_hv} học viên lên kế toán`);
          setDaGui(r.data);
          inHtml(htmlIn(r.data.data, r.data));
          qc.invalidateQueries({ queryKey: ["tiep-sinh-nop-kt"] });
          qc.invalidateQueries({ queryKey: ["tiep-sinh-ho-so"] });
        } catch (e) {
          message.error(errMsg(e, "Gửi thất bại"));
        } finally {
          setSending(false);
        }
      },
    });
  };

  const columns = [
    { title: "STT", width: 48, align: "center", render: (_, __, i) => i + 1 },
    { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 105 },
    { title: "Họ và tên", dataIndex: "ho_ten", width: 160, ellipsis: true },
    { title: "Năm sinh", dataIndex: "ngay_sinh", width: 95, render: (v) => <span className="whitespace-nowrap">{fmtDate(v)}</span> },
    { title: "CCCD", dataIndex: "cccd", width: 115, render: (v) => <span className="whitespace-nowrap">{v}</span> },
    { title: "Điện thoại", dataIndex: "dien_thoai", width: 105, render: (v) => <span className="whitespace-nowrap">{v}</span> },
    { title: "Loại hình", dataIndex: "loai_hinh", width: 160, ellipsis: { showTitle: true } },
    { title: "Đầu mối", dataIndex: "dau_moi", width: 100, ellipsis: { showTitle: true } },
    { title: "Hạng", dataIndex: "hang", width: 56, align: "center" },
    { title: "Phải thu", dataIndex: "so_tien", width: 110, align: "right", render: (v) => (v === null ? <span className="text-slate-400">Chưa có giá</span> : <span className="whitespace-nowrap">{fmtTien(v)}</span>) },
    {
      title: "Trạng thái", width: 120, align: "center",
      render: (_, r) =>
        r.hop_le ? (
          <span className="rounded-full bg-green-100 px-3 py-0.5 text-[13px] font-semibold text-green-700">Đầy đủ</span>
        ) : (
          <Tooltip title={r.ly_do}>
            {!r.da_duyet ? (
              <span className="rounded-full bg-red-100 px-3 py-0.5 text-[13px] font-semibold text-red-600">Chưa duyệt</span>
            ) : (
              <span className="rounded-full bg-orange-100 px-3 py-0.5 text-[13px] font-semibold text-orange-600">{r.so_tien === null ? "Chưa có giá" : "Cần bổ sung"}</span>
            )}
          </Tooltip>
        ),
    },
  ];

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width="min(1500px, 96vw)" style={{ top: 16 }} destroyOnHidden
      styles={{ container: { padding: 0, background: "#eef4fd" }, content: { padding: 0, background: "#eef4fd" }, body: { padding: 0 } }}>
      <div className="flex flex-col gap-3 p-3">
        <HeaderBanner title="Gửi dữ liệu lên kế toán" subtitle="Kiểm tra hồ sơ đã thu tiền và hoàn thiện dữ liệu trước khi nộp kế toán" icon={<FaRegFileAlt />} />

        {/* Thời gian thống kê */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white px-5 py-3 shadow-sm">
          <FaRegCalendarAlt className="text-[30px]" style={{ color: BLUE }} />
          <div>
            <div className="mb-1 text-[15px] font-semibold text-slate-800">Thời gian thống kê</div>
            <DatePicker.RangePicker value={range} format="DD/MM/YYYY" allowClear={false}
              onChange={(v) => { setRange(v); setNhanh(null); }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {NHANH.map((n) => (
              <button key={n.key} type="button" onClick={() => chonNhanh(n)}
                className={`h-10 rounded-xl border px-4 text-[14px] font-medium transition ${nhanh === n.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                {n.label}
              </button>
            ))}
          </div>
          <Button type="primary" size="large" icon={<SearchOutlined />} loading={isFetching} onClick={xem} className="ml-auto" style={{ background: BLUE }}>
            Xem danh sách
          </Button>
        </div>

        {(ids.length > 0 || soChuaDuyet > 0) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[14px] text-blue-800">
            <FaCheckCircle className="shrink-0" />
            Danh sách gồm các hồ sơ đã duyệt trong khoảng thời gian{ids.length ? ` + ${ids.length} hồ sơ đã tích chọn ở bảng` : ""}.
            {soChuaDuyet > 0 && <span className="font-semibold text-orange-600">{soChuaDuyet} hồ sơ chưa duyệt (do tích chọn tay).</span>}
          </div>
        )}
        {!ids.length && (
          <div className="-mt-1 text-[13px] italic text-slate-500">
            Hồ sơ chưa duyệt muốn gửi kế toán: tích chọn ở bảng danh sách hồ sơ rồi bấm "Nộp KT".
          </div>
        )}

        {/* Thẻ số liệu */}
        <div className="grid gap-3 md:grid-cols-3">
          <StatBox icon={<FaUsers />} color="#1d5fd6" label="Tổng số học viên đã thu tiền">
            <span className="text-[30px]">{info?.tong_hv ?? 0}</span><span className="text-[15px] font-medium">học viên</span>
          </StatBox>
          <StatBox icon={<FaMoneyBillWave />} color="#16a34a" label="Tổng số tiền đã thu">
            <span className="text-[30px]">{fmtTien(info?.tong_tien ?? 0)}</span>
          </StatBox>
          <StatBox icon={<FaCheckCircle />} color="#7c3aed" label="Số hồ sơ hợp lệ">
            <span className="text-[30px]">{info?.so_hop_le ?? 0} / {info?.tong_hv ?? 0}</span><span className="text-[15px] font-medium">hồ sơ</span>
          </StatBox>
        </div>

        {/* Danh sách + thông tin gửi */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-2.5 text-white" style={{ background: HEAD_BG }}>
              <span className="flex items-center gap-2.5 text-[16px] font-bold"><FaUserCircle className="text-xl" /> Danh sách học viên đủ điều kiện gửi lên kế toán</span>
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input type="checkbox" className="h-4 w-4" checked={tatCa} disabled={!rows.length || !!daGui}
                  onChange={(e) => setChecked(e.target.checked ? rows.map((r) => r.id) : [])} />
                Chọn tất cả
              </label>
            </div>
            <div className="p-3">
              <Table rowKey="id" size="small" columns={columns} dataSource={rows} loading={isFetching} pagination={false}
                scroll={{ x: 1200, y: "calc(100vh - 560px)" }}
                locale={{ emptyText: daGui ? "Đã gửi xong — không còn hồ sơ chờ gửi trong khoảng này" : "Không có hồ sơ đã thu tiền chưa gửi kế toán" }}
                rowSelection={{ selectedRowKeys: checked, onChange: setChecked, columnWidth: 48, getCheckboxProps: () => ({ disabled: !!daGui }) }}
                className="[&_.ant-table-thead_th]:!font-semibold [&_.ant-table-tbody_td]:!text-[14px]" />
              <div className="mt-2 flex justify-end gap-6 text-[14px] text-slate-700">
                <span>Đã chọn: <b>{selRows.length}</b> học viên</span>
                <span>Tổng tiền: <b className="text-green-700">{fmtTien(selRows.reduce((s, r) => s + (r.so_tien || 0), 0))}</b></span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-2.5 text-[16px] font-bold text-white" style={{ background: HEAD_BG }}>
              <FaRegFileAlt className="text-xl" /> Thông tin gửi dữ liệu
            </div>
            <div className="flex flex-col gap-4 p-5 text-[15px]">
              <div className="flex items-center gap-4">
                <span className="w-36 text-slate-700">Người thực hiện:</span>
                <FaUserCircle className="text-2xl text-slate-400" />
                <b>{daGui?.dot?.nguoi || tenNguoi()}</b>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-36 text-slate-700">Thời gian gửi:</span>
                <FaRegClock className="text-xl text-slate-400" />
                {daGui ? (
                  <b className="text-green-700">{dayjs(daGui.dot.created_at).format("HH:mm:ss DD/MM/YYYY")}</b>
                ) : (
                  <span className="text-red-500">— Chưa gửi —</span>
                )}
              </div>
              <div>
                <div className="mb-1.5 font-semibold text-slate-800">Ghi chú (tuỳ chọn):</div>
                <Input.TextArea rows={4} value={daGui ? daGui.dot.ghi_chu || "" : ghiChu} disabled={!!daGui}
                  onChange={(e) => setGhiChu(e.target.value)} placeholder="Nhập ghi chú nếu cần..." maxLength={1000} />
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-[14px] text-slate-700">
                <FaExclamationCircle className="mt-0.5 shrink-0 text-xl text-orange-500" />
                {daGui
                  ? `Đã gửi đợt #${daGui.dot.id}: ${daGui.dot.so_hv} học viên, ${fmtTien(daGui.dot.tong_tien)}. Có thể in lại biên bản bằng nút "In danh sách xác nhận".`
                  : "Sau khi gửi, hệ thống sẽ tự động in Biên bản xác nhận chi phí phải nộp lên kế toán."}
              </div>
            </div>
          </div>
        </div>

        {/* Thao tác */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Button size="large" icon={<FaPrint />} disabled={!dsIn.length} onClick={() => inHtml(htmlIn(dsIn, daGui))}
            className="!border-blue-500 !font-semibold !text-blue-700">
            In danh sách xác nhận
          </Button>
          <Button size="large" icon={<EyeOutlined />} disabled={!dsIn.length} onClick={() => setPreview(htmlIn(dsIn, daGui))}
            className="!border-blue-500 !font-semibold !text-blue-700">
            Xem trước biểu mẫu in
          </Button>
          <div className="ml-auto flex gap-3">
            <Button size="large" icon={<ReloadOutlined />} onClick={onClose}>{daGui ? "Đóng" : "Huỷ thao tác"}</Button>
            {!daGui && (
              <Button size="large" type="primary" icon={<SendOutlined />} loading={sending} disabled={!selRows.length} onClick={gui}
                style={{ background: selRows.length ? "#16a34a" : undefined }} className="!font-semibold">
                Gửi dữ liệu lên kế toán <RightOutlined />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!preview} onCancel={() => setPreview(null)} width={900} title="Xem trước biên bản" destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setPreview(null)}>Đóng</Button>,
          <Button key="p" type="primary" icon={<FaPrint />} onClick={() => inHtml(preview)}>In</Button>,
        ]}>
        <iframe title="Xem trước biên bản" srcDoc={preview || ""} className="h-[70vh] w-full rounded border" />
      </Modal>
    </Modal>
  );
}
