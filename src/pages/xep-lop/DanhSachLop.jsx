import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Input, Spin, Table, message } from "antd";
import { FaUsersRectangle, FaMagnifyingGlass, FaPrint, FaUsers } from "react-icons/fa6";
import dayjs from "dayjs";
import { getXlLop, getXlChiTietLop, errMsg } from "../../apis/apiTiepSinh";
import { fmtDate } from "../tiep-sinh/tiepSinhShared";
import { inHtml } from "../ke-toan/phieuThu";
import { C, SHADOW, HEAD, TABLE_HEAD, tenLop, danhSachLopHtml } from "./xepLopShared";

const headCell = (props) => (
  <th {...props} style={{ ...props.style, background: TABLE_HEAD, color: "#fff", fontWeight: 600, fontSize: 14, padding: "8px", borderColor: TABLE_HEAD }} />
);

function HocVienLop({ id }) {
  const { data, isLoading } = useQuery({ queryKey: ["xl-lop", id], queryFn: () => getXlChiTietLop(id), staleTime: 0 });
  const ds = data?.data?.hoc_vien || [];
  if (isLoading) return <div className="py-6 text-center"><Spin /></div>;
  return (
    <Table rowKey="id" size="small" pagination={false} dataSource={ds}
      components={{ header: { cell: (p) => <th {...p} style={{ ...p.style, background: C.bg2, color: C.title, fontWeight: 700 }} /> } }}
      columns={[
        { title: "STT", width: 50, align: "center", render: (_, __, i) => i + 1 },
        { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 120 },
        { title: "Họ và tên", dataIndex: "ho_ten", width: 180 },
        { title: "Ngày sinh", dataIndex: "ngay_sinh", width: 100, align: "center", render: (v) => fmtDate(v) },
        { title: "CCCD", dataIndex: "cccd", width: 130 },
        { title: "SĐT", dataIndex: "dien_thoai", width: 115 },
        { title: "Địa chỉ", dataIndex: "dia_chi", ellipsis: true },
        { title: "Đầu mối", dataIndex: "dau_moi", width: 120, ellipsis: true },
      ]} />
  );
}

/** Danh sách lớp đã vào khoá (từ màn Xếp lớp học viên) */
export default function DanhSachLop() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["xl-lop", "da_vao_khoa"], queryFn: () => getXlLop({ trang_thai: "da_vao_khoa" }), staleTime: 0 });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data || []).filter((l) => !q || [tenLop(l), l.co_so, l.nguoi_vao_khoa].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [data, search]);

  const inLop = async (lop) => {
    try {
      const r = await getXlChiTietLop(lop.id);
      inHtml(danhSachLopHtml(r.data.lop, r.data.hoc_vien));
    } catch (e) {
      message.error(errMsg(e, "Không in được danh sách"));
    }
  };

  return (
    <div className="-m-4 flex min-h-[calc(100vh-64px)] flex-col gap-4 px-4 pb-5 pt-4 sm:px-5" style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 60%)` }}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[28px]" style={{ boxShadow: SHADOW, color: C.primary }}>
          <FaUsersRectangle />
        </span>
        <div className="flex-1">
          <div className="text-[26px] font-extrabold leading-tight" style={{ color: C.title }}>Danh sách lớp</div>
          <div className="text-[15px]" style={{ color: C.text }}>Các lớp đã vào khoá từ màn Xếp lớp học viên</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: C.border, boxShadow: SHADOW }}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-white" style={{ background: HEAD }}>
          <span className="flex flex-1 items-center gap-2.5 text-[17px] font-bold"><FaUsers /> Lớp đã vào khoá ({rows.length})</span>
          <Input allowClear placeholder="Tìm lớp, cơ sở, người vào khoá..." value={search} onChange={(e) => setSearch(e.target.value)}
            prefix={<FaMagnifyingGlass style={{ color: C.sub }} />} className="!h-9 !rounded-lg" style={{ width: 300 }} />
        </div>
        <div className="p-3">
          <Table rowKey="id" size="middle" loading={isLoading} dataSource={rows} pagination={{ pageSize: 20, hideOnSinglePage: true }}
            components={{ header: { cell: headCell } }} scroll={{ x: 1000 }}
            expandable={{ expandedRowRender: (l) => <HocVienLop id={l.id} />, expandRowByClick: true }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lớp nào vào khoá" /> }}
            className="[&_.ant-table-tbody>tr.ant-table-row>td]:!text-[14px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[#263B5E]"
            columns={[
              { title: "Lớp", width: 140, render: (_, l) => <b style={{ color: C.title }}>{tenLop(l)}</b> },
              { title: "Ngày khai giảng", dataIndex: "ngay_khai_giang", width: 130, align: "center", render: (v) => fmtDate(v) || "—" },
              { title: "Cơ sở", dataIndex: "co_so", width: 140, render: (v) => v || "—" },
              { title: "Sĩ số", width: 90, align: "center", render: (_, l) => <span className="font-semibold">{l.si_so}/{l.suc_chua}</span> },
              { title: "Ngày vào khoá", dataIndex: "vao_khoa_at", width: 150, align: "center", render: (v) => (v ? dayjs(v).format("HH:mm DD/MM/YYYY") : "—") },
              { title: "Người vào khoá", dataIndex: "nguoi_vao_khoa", width: 160, render: (v) => v || "—" },
              { title: "Ghi chú", dataIndex: "ghi_chu", ellipsis: true },
              {
                title: "Thao tác", width: 120, align: "center",
                render: (_, l) => (
                  <button type="button" onClick={(e) => { e.stopPropagation(); inLop(l); }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-[13px] font-semibold hover:border-blue-400"
                    style={{ borderColor: C.border, color: C.sidebar }}>
                    <FaPrint /> In DS
                  </button>
                ),
              },
            ]} />
        </div>
      </div>
    </div>
  );
}
