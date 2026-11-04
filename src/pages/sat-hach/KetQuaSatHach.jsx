import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Input, Pagination, Progress, Select, Spin, Table } from "antd";
import {
    CarOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    DownloadOutlined,
    HourglassOutlined,
    SearchOutlined,
    TeamOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { getKetQuaKySatHach, getKySatHachList, getThongKeCacKySatHach } from "../../apis/apiSatHach";
import { usePermission } from "../../util/permission";
import ImportSatHachModal from "./ImportSatHachModal";
import ChiTietThiSinh from "./ChiTietThiSinh";
import { KET_QUA, PHAN_THI, TRANG_THAI_PHAN, boDau, diemText, formatDate, formatSbd } from "./satHach.constants";
import { KetQuaTag, PhanThiTag } from "./SatHachTags";
import "./satHach.css";

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

// Header layout 64px + padding Content 2×16px
const CHIEU_CAO_TRANG = "calc(100vh - 96px)";

const BOX = "rounded-xl border border-gray-100 bg-white shadow-sm";

const StatCard = ({ title, value, percent, sub, icon, gradient }) => (
    <div className="flex items-center gap-4 rounded-xl px-5 py-2.5 text-white shadow-sm" style={{ background: gradient }}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">{icon}</div>
        <div className="min-w-0">
            <div className="truncate text-[13px] opacity-90">{title}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold leading-tight">{value}</span>
                {percent != null && (
                    <span className="rounded-full bg-white/25 px-2 text-[11px] font-semibold">{percent}%</span>
                )}
            </div>
            {sub && <div className="truncate text-xs opacity-90">{sub}</div>}
        </div>
    </div>
);

const PhanThiStat = ({ phan, stat }) => (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-2 py-2">
        <Progress
            type="circle"
            size={68}
            strokeWidth={9}
            percent={stat?.ty_le_dat ?? 0}
            strokeColor={phan.color}
            format={() => (
                <span className="text-[13px] font-bold text-gray-800">
                    {stat?.ty_le_dat != null ? `${stat.ty_le_dat}%` : "—"}
                </span>
            )}
        />
        <div className="min-w-0 flex-1 text-[13px] leading-[22px]">
            <div className="font-semibold" style={{ color: phan.color }}>{phan.label}</div>
            <div className="flex justify-between"><span><span className="text-green-600">●</span> Đạt</span><b>{stat?.dat ?? 0}</b></div>
            <div className="flex justify-between"><span><span className="text-red-600">●</span> Trượt</span><b>{stat?.truot ?? 0}</b></div>
            <div className="flex justify-between"><span><span className="text-gray-400">●</span> Chưa thi</span><b>{stat?.chua_thi ?? 0}</b></div>
        </div>
    </div>
);

const TABS = [
    { value: "ALL", label: "Tất cả" },
    { value: "DAT", label: "Đạt" },
    { value: "TRUOT", label: "Trượt" },
    { value: "CHUA_HOAN_THANH", label: "Chưa hoàn thành" },
];

const KetQuaSatHach = () => {
    const { canEdit } = usePermission();
    const queryClient = useQueryClient();

    const [kyDaChon, setKyDaChon] = useState(null);
    const [hang, setHang] = useState("ALL");
    const [keyword, setKeyword] = useState("");
    const [tab, setTab] = useState("ALL");
    const [selected, setSelected] = useState(null);
    const [openImport, setOpenImport] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortSbd, setSortSbd] = useState(null);

    // Đo khung bảng để thân bảng cuộn bên trong khi chọn nhiều dòng/trang
    const tableBoxRef = useRef(null);
    const [khung, setKhung] = useState({ bodyHeight: 300 });

    useEffect(() => {
        const box = tableBoxRef.current;
        if (!box) return undefined;
        const tinh = () => {
            const thead = box.querySelector(".ant-table-thead")?.offsetHeight || 39;
            const bodyHeight = Math.max(120, box.clientHeight - thead);
            setKhung((k) => (k.bodyHeight === bodyHeight ? k : { bodyHeight }));
        };
        tinh();
        const ro = new ResizeObserver(tinh);
        ro.observe(box);
        return () => ro.disconnect();
    });

    const { data: kyList = [], isLoading: loadingKy } = useQuery({
        queryKey: ["kySatHachList"],
        queryFn: getKySatHachList,
    });

    // Mặc định xem kỳ mới nhất
    const maKySh = kyDaChon ?? kyList[0]?.ma_ky_sh ?? null;

    const chonKy = (ma) => {
        setKyDaChon(ma);
        setSelected(null);
        setPage(1);
    };

    const { data: ketQua, isFetching: loadingKetQua } = useQuery({
        queryKey: ["ketQuaKySatHach", maKySh],
        queryFn: () => getKetQuaKySatHach(maKySh),
        enabled: !!maKySh,
    });

    const { data: thongKeCacKy = [] } = useQuery({
        queryKey: ["thongKeCacKySatHach", maKySh],
        queryFn: () => getThongKeCacKySatHach(maKySh, 5),
        enabled: !!maKySh,
    });

    const rows = useMemo(() => ketQua?.rows || [], [ketQua]);
    const thongKe = ketQua?.thong_ke;

    const hangOptions = useMemo(() => {
        const set = [...new Set(rows.map((r) => r.hang_gplx).filter(Boolean))].sort();
        return [{ value: "ALL", label: "Tất cả" }, ...set.map((h) => ({ value: h, label: h }))];
    }, [rows]);

    // Lọc theo hạng + từ khóa trước, tab Đạt/Trượt lọc sau để số đếm trên tab khớp bộ lọc
    const rowsLoc = useMemo(() => {
        const kw = boDau(keyword.trim());
        return rows.filter((r) => {
            if (hang !== "ALL" && r.hang_gplx !== hang) return false;
            if (!kw) return true;
            return (
                boDau(r.ho_ten).includes(kw) ||
                formatSbd(r.so_bao_danh).includes(kw) ||
                (r.so_cmt || "").includes(kw) ||
                boDau(r.ma_dk).includes(kw)
            );
        });
    }, [rows, hang, keyword]);

    const demTab = useMemo(() => {
        const d = { ALL: rowsLoc.length, DAT: 0, TRUOT: 0, CHUA_HOAN_THANH: 0 };
        rowsLoc.forEach((r) => { d[r.ket_qua] = (d[r.ket_qua] || 0) + 1; });
        return d;
    }, [rowsLoc]);

    const rowsHienThi = useMemo(() => {
        const list = tab === "ALL" ? rowsLoc : rowsLoc.filter((r) => r.ket_qua === tab);
        if (!sortSbd) return list;
        const dir = sortSbd === "ascend" ? 1 : -1;
        return [...list].sort((a, b) => ((a.so_bao_danh ?? 0) - (b.so_bao_danh ?? 0)) * dir);
    }, [rowsLoc, tab, sortSbd]);

    const soTrang = Math.max(1, Math.ceil(rowsHienThi.length / pageSize));
    const trang = Math.min(page, soTrang);
    const rowsTrang = rowsHienThi.slice((trang - 1) * pageSize, trang * pageSize);

    const doiBoLoc = (fn) => (v) => {
        fn(v);
        setPage(1);
    };

    const kyHienTai = ketQua?.ky;
    const kyOptions = kyList.map((k) => ({
        value: k.ma_ky_sh,
        label: `${k.ten_ky_sh || k.ma_ky_sh} – ${formatDate(k.ngay_sh)} (${k.so_thi_sinh} TS)`,
    }));

    const chartData = thongKeCacKy.map((k) => ({
        name: `${k.ten_ky_sh || k.ma_ky_sh} (${formatDate(k.ngay_sh)})`,
        ly_thuyet: k.ly_thuyet,
        sa_hinh: k.sa_hinh,
        duong_truong: k.duong_truong,
    }));

    const handleImported = (data) => {
        queryClient.invalidateQueries({ queryKey: ["kySatHachList"] });
        queryClient.invalidateQueries({ queryKey: ["ketQuaKySatHach"] });
        queryClient.invalidateQueries({ queryKey: ["thongKeCacKySatHach"] });
        queryClient.invalidateQueries({ queryKey: ["lichSuSatHach"] });
        if (data?.ma_ky_sh?.[0]) chonKy(data.ma_ky_sh[0]);
    };

    const handleExport = () => {
        const kqText = (k) => KET_QUA[k]?.label || "";
        const ptText = (p) => TRANG_THAI_PHAN[p?.trang_thai]?.label || "";
        const data = rowsHienThi.map((r, i) => ({
            STT: i + 1,
            SBD: formatSbd(r.so_bao_danh),
            "Họ và tên": r.ho_ten,
            "Ngày sinh": formatDate(r.ngay_sinh),
            "Giới tính": r.gioi_tinh === "F" ? "Nữ" : r.gioi_tinh === "M" ? "Nam" : "",
            CCCD: r.so_cmt,
            "Hạng GPLX": r.hang_gplx,
            "Mã đăng ký": r.ma_dk,
            "Khóa học": r.ma_khoa_hoc,
            "Nội dung SH": r.noi_dung_sh_ten,
            ...Object.fromEntries(
                PHAN_THI.flatMap((p) => [
                    [`Điểm ${p.label}`, diemText(p.key, r[p.key])],
                    [`KQ ${p.label}`, ptText(r[p.key])],
                ]),
            ),
            "Kết quả chung": kqText(r.ket_qua),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "KetQuaSatHach");
        const ten = kyHienTai?.ten_ky_sh || kyHienTai?.ma_ky_sh || "sat-hach";
        XLSX.writeFile(wb, `KetQuaSatHach_${ten}_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
    };

    const columns = [
        { title: "STT", width: 55, align: "center", render: (_, __, i) => (trang - 1) * pageSize + i + 1 },
        {
            title: "SBD",
            dataIndex: "so_bao_danh",
            width: 75,
            render: formatSbd,
            sorter: true,
            sortOrder: sortSbd,
        },
        {
            title: "Họ và tên",
            dataIndex: "ho_ten",
            width: 200,
            ellipsis: true,
            render: (v) => <span className="font-semibold uppercase">{v}</span>,
        },
        { title: "Ngày sinh", dataIndex: "ngay_sinh", width: 100, render: formatDate },
        { title: "Hạng", dataIndex: "hang_gplx", width: 60, align: "center" },
        ...PHAN_THI.map((p) => ({
            title: <span style={{ color: p.color }}>{p.label}</span>,
            dataIndex: p.key,
            width: 120,
            align: "center",
            render: (v) => <PhanThiTag phanKey={p.key} phan={v} />,
        })),
        {
            title: "Kết quả chung",
            dataIndex: "ket_qua",
            width: 140,
            align: "center",
            render: (v) => <KetQuaTag value={v} />,
        },
    ];

    const tong = thongKe?.tong || 0;
    const capNhat = kyHienTai
        ? [kyHienTai.thoi_gian_danh_sach, kyHienTai.thoi_gian_ly_thuyet, kyHienTai.thoi_gian_sa_hinh, kyHienTai.thoi_gian_duong_truong]
            .filter(Boolean)
            .sort()
            .pop()
        : null;

    const chuaCoDuLieu = !loadingKy && kyList.length === 0;

    return (
        <div className="flex flex-col gap-3" style={{ height: CHIEU_CAO_TRANG, minHeight: 640 }}>
            {/* Tiêu đề + nút */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <CarOutlined style={{ fontSize: 30, color: "#1a56db" }} />
                    <div>
                        <div className="text-2xl font-bold leading-tight text-[#1a3fa8]">Quản lý kết quả sát hạch</div>
                        <div className="text-[13px] text-gray-500">Theo dõi kết quả và thống kê chi tiết từng kỳ thi</div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canEdit && (
                        <Button type="primary" size="large" icon={<UploadOutlined />} onClick={() => setOpenImport(true)}>
                            Import XML ngày thi
                        </Button>
                    )}
                    <Button size="large" icon={<DownloadOutlined />} onClick={handleExport} disabled={rowsHienThi.length === 0}>
                        Xuất Excel
                    </Button>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className={`${BOX} flex shrink-0 flex-wrap items-center gap-3 px-4 py-2`}>
                <div className="flex items-center gap-2">
                    <span>Kỳ sát hạch:</span>
                    <Select
                        style={{ minWidth: 300 }}
                        loading={loadingKy}
                        value={maKySh}
                        onChange={chonKy}
                        options={kyOptions}
                        placeholder="Chưa có kỳ sát hạch — hãy import file XML"
                        showSearch
                        optionFilterProp="label"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span>Hạng GPLX:</span>
                    <Select style={{ width: 130 }} value={hang} onChange={doiBoLoc(setHang)} options={hangOptions} />
                </div>
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tìm theo tên, SBD, CCCD, mã đăng ký..."
                    style={{ maxWidth: 320 }}
                    value={keyword}
                    onChange={(e) => doiBoLoc(setKeyword)(e.target.value)}
                />
                {kyHienTai && (
                    <span className="ml-auto text-[13px] font-medium text-[#1a3fa8]">
                        {kyHienTai.so_qd && `QĐ ${kyHienTai.so_qd}`}
                        {kyHienTai.so_qd && kyHienTai.chu_tich_hdsh && " · "}
                        {kyHienTai.chu_tich_hdsh && `Chủ tịch HĐSH: ${kyHienTai.chu_tich_hdsh}`}
                    </span>
                )}
            </div>

            {chuaCoDuLieu ? (
                <div className={`${BOX} flex flex-1 items-center justify-center`}>
                    <Empty description="Chưa có dữ liệu sát hạch. Bấm 'Import XML ngày thi' để thêm dữ liệu." />
                </div>
            ) : (
                <>
                    {/* Thẻ tổng quan */}
                    <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
                        <StatCard
                            title="Tổng thí sinh"
                            value={tong}
                            icon={<TeamOutlined />}
                            sub={kyHienTai ? `Kỳ ${kyHienTai.ten_ky_sh || kyHienTai.ma_ky_sh}` : ""}
                            gradient="linear-gradient(135deg,#2f6fed,#1a3fa8)"
                        />
                        <StatCard
                            title="Đạt"
                            value={thongKe?.dat ?? 0}
                            percent={pct(thongKe?.dat, tong)}
                            icon={<CheckCircleFilled />}
                            sub="Đạt tất cả phần phải thi"
                            gradient="linear-gradient(135deg,#22c55e,#15803d)"
                        />
                        <StatCard
                            title="Trượt ít nhất 1 phần"
                            value={thongKe?.truot ?? 0}
                            percent={pct(thongKe?.truot, tong)}
                            icon={<CloseCircleFilled />}
                            gradient="linear-gradient(135deg,#f87171,#dc2626)"
                        />
                        <StatCard
                            title="Chưa hoàn thành"
                            value={thongKe?.chua_hoan_thanh ?? 0}
                            percent={pct(thongKe?.chua_hoan_thanh, tong)}
                            icon={<HourglassOutlined />}
                            sub="Vắng / chưa thi đủ các phần"
                            gradient="linear-gradient(135deg,#fbbf24,#f97316)"
                        />
                    </div>

                    {/* Thống kê phần thi + biểu đồ */}
                    <div className="grid shrink-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <div className={`${BOX} px-4 py-2.5`}>
                            <div className="mb-2 text-[15px] font-semibold">Thống kê kết quả từng phần thi</div>
                            <div className="grid grid-cols-3 gap-2">
                                {PHAN_THI.map((p) => (
                                    <PhanThiStat key={p.key} phan={p} stat={thongKe?.phan?.[p.key]} />
                                ))}
                            </div>
                        </div>
                        <div className={`${BOX} px-4 py-2.5`}>
                            <div className="text-[15px] font-semibold">Tỷ lệ đạt qua các kỳ (%)</div>
                            {chartData.length === 0 ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                <ResponsiveContainer width="100%" height={126}>
                                    <BarChart data={chartData} margin={{ top: 16, right: 0, left: -18, bottom: 0 }} barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={false} height={4} />
                                        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v) => (v == null ? "—" : `${v}%`)} />
                                        <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 13 }} />
                                        {PHAN_THI.map((p) => (
                                            <Bar key={p.key} dataKey={p.key} name={p.label} fill={p.color} maxBarSize={60}>
                                                <LabelList dataKey={p.key} position="top" fontSize={11} formatter={(v) => (v == null ? "" : `${v}%`)} />
                                            </Bar>
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Danh sách + chi tiết: chiếm phần còn lại của màn hình */}
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
                        <div className={`${BOX} flex min-h-0 flex-col px-4 py-2.5`}>
                            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-1">
                                <div className="text-[15px] font-semibold">Danh sách thí sinh</div>
                                <div className="flex flex-wrap gap-2">
                                    {TABS.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => doiBoLoc(setTab)(t.value)}
                                            className={`cursor-pointer rounded-md border px-3 py-0.5 text-[13px] transition-colors ${tab === t.value
                                                ? "border-[#1a56db] bg-[#eaf2ff] text-[#1a56db]"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                                }`}
                                        >
                                            {t.label} ({demTab[t.value] ?? 0})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div ref={tableBoxRef} className="min-h-0 flex-1 overflow-hidden">
                                <Table
                                    className="sat-hach-table"
                                    rowKey="ma_dk"
                                    size="small"
                                    loading={loadingKetQua}
                                    columns={columns}
                                    dataSource={rowsTrang}
                                    pagination={false}
                                    scroll={{ x: 1000, y: khung.bodyHeight }}
                                    onChange={(_, __, sorter) => setSortSbd(sorter?.order || null)}
                                    onRow={(r) => ({
                                        onClick: () => setSelected(r),
                                        style: { cursor: "pointer" },
                                    })}
                                    rowClassName={(r) => (selected?.ma_dk === r.ma_dk ? "sat-hach-row-active" : "")}
                                />
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2">
                                <span className="text-[13px] text-gray-500">
                                    {/* SYSDATETIME() là giờ máy chủ nhưng driver mssql gắn hậu tố Z → bỏ Z để không bị cộng múi giờ */}
                                    {capNhat && `Cập nhật lần cuối: ${dayjs(String(capNhat).replace(/Z$/, "")).format("HH:mm DD/MM/YYYY")}`}
                                </span>
                                <Pagination
                                    size="small"
                                    current={trang}
                                    pageSize={pageSize}
                                    total={rowsHienThi.length}
                                    showSizeChanger
                                    pageSizeOptions={[10, 20, 50, 100]}
                                    showTotal={(t) => `${t} thí sinh`}
                                    onChange={(p, size) => {
                                        if (size !== pageSize) {
                                            setPageSize(size);
                                            setPage(1);
                                        } else {
                                            setPage(p);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <ChiTietThiSinh thiSinh={selected} />
                    </div>
                </>
            )}

            <ImportSatHachModal open={openImport} onClose={() => setOpenImport(false)} onImported={handleImported} />
            {loadingKetQua && !ketQua && <Spin fullscreen />}
        </div>
    );
};

export default KetQuaSatHach;
