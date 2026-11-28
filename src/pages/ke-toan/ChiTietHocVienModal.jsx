import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Modal, Spin, Table, message } from "antd";
import { CloseOutlined, UserOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { FaRegCalendarAlt, FaPhoneAlt, FaHome, FaWallet, FaCheck, FaDatabase, FaTrophy, FaPrint, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { getKtChiTiet, getChiTietHoSo, errMsg } from "../../apis/apiTiepSinh";
import { fmtDate, fmtTien, printHoSo } from "../tiep-sinh/tiepSinhShared";
import { HINH_THUC, tenKhoa } from "./phieuThu";

const NAVY = "#102D62";
const BLUE = "#0878F9";
const SO_DONG = 5; // số dòng hiện trước khi bấm "Xem tất cả"
const CHUYEN_LABEL = {
  chuyen_hoc_phi_di: "Chuyển học phí đi",
  chuyen_hoc_phi_den: "Nhận học phí chuyển đến",
  chuyen_phi_kham_di: "Chuyển phí khám đi",
  chuyen_phi_kham_den: "Nhận phí khám chuyển đến",
  hoan_phi_kham: "Hoàn phí khám",
};

function Khung({ icon, title, extra, children }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[26px]" style={{ color: BLUE }}>{icon}</span>
        <span className="flex-1 text-[19px] font-bold" style={{ color: NAVY }}>{title}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

function XemTatCa({ tong, mo, onClick }) {
  if (tong <= SO_DONG) return null;
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-[14px] font-semibold text-blue-700 hover:bg-blue-50">
      <FaRegCalendarAlt /> {mo ? "Thu gọn" : `Xem tất cả (${tong})`} <ArrowRightOutlined />
    </button>
  );
}

const headCell = (props) => <th {...props} style={{ ...props.style, background: "#eaf2ff", color: NAVY, fontWeight: 600, textAlign: "center" }} />;

/** Chi tiết học viên tại phòng kế toán: thông tin, công nợ, lịch sử đóng tiền, lịch sử thi */
export default function ChiTietHocVienModal({ id, open, onClose }) {
  const [moTien, setMoTien] = useState(false);
  const [inLoading, setInLoading] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["kt-hoc-vien", id], queryFn: () => getKtChiTiet(id), enabled: open && !!id, staleTime: 0 });
  const hs = data?.data?.id === id ? data.data : null;

  // Đóng tiền = phiếu thu + chuyển học phí / phí khám giữa học viên
  const lichSu = hs
    ? [
        ...(hs.phieu_thu || []).map((p) => ({
          key: `p${p.id}`,
          ngay: p.created_at,
          so_phieu: p.so_phieu,
          hinh_thuc: HINH_THUC[p.hinh_thuc] || p.hinh_thuc,
          so_tien: p.so_tien,
          noi_dung: `Đóng học phí ${tenKhoa(hs)}${p.ghi_chu ? ` — ${p.ghi_chu}` : ""}`,
          chuyen_cho: "-",
        })),
        ...(hs.chuyen_tien || []).map((l) => ({
          key: `l${l.id}`,
          ngay: l.created_at,
          so_phieu: "-",
          hinh_thuc: CHUYEN_LABEL[l.hanh_dong] || l.hanh_dong,
          so_tien: l.so_tien,
          am: /_di$/.test(l.hanh_dong),
          noi_dung: l.noi_dung,
          chuyen_cho: l.doi_tac_ten ? `${l.doi_tac_ten} (${l.doi_tac_ma})` : "-",
        })),
      ].sort((a, b) => String(b.ngay).localeCompare(String(a.ngay)))
    : [];

  const inHoSo = async () => {
    setInLoading(true);
    try {
      const r = await getChiTietHoSo(id);
      printHoSo(r.data);
    } catch (e) {
      message.error(errMsg(e, "Không in được hồ sơ"));
    } finally {
      setInLoading(false);
    }
  };

  const boHoc = hs?.trang_thai === "bo_hoc";
  const congNo = hs?.con_lai ?? null;

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width="min(1300px, 96vw)" style={{ top: 24 }} destroyOnHidden
      afterOpenChange={(o) => !o && setMoTien(false)}
      styles={{ container: { padding: 0, overflow: "hidden", borderRadius: 20 }, content: { padding: 0 }, body: { padding: 0 } }}>
      <div className="flex items-center gap-3 px-6 py-3.5 text-white" style={{ background: `linear-gradient(110deg, #0646A8, ${BLUE} 60%, #2495FF)` }}>
        <UserOutlined className="text-[26px]" />
        <span className="flex-1 text-[22px] font-bold">Chi tiết học viên</span>
        <button type="button" onClick={onClose} aria-label="Đóng" title="Đóng" className="text-[22px]" style={{ color: "#fff" }}>
          <CloseOutlined style={{ color: "#fff" }} />
        </button>
      </div>

      <div className="bg-[#F5F9FF] p-4">
        {isLoading || !hs ? (
          <div className="py-24 text-center"><Spin /></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
            {/* Thông tin + công nợ */}
            <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                {hs.anh_chan_dung ? (
                  <img src={hs.anh_chan_dung} alt={hs.ho_ten} className="h-[200px] w-[150px] shrink-0 rounded-xl object-cover shadow" />
                ) : (
                  <span className="flex h-[200px] w-[150px] shrink-0 items-center justify-center rounded-xl bg-blue-50 text-6xl text-blue-300"><UserOutlined /></span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[22px] font-bold leading-tight" style={{ color: NAVY }}>{hs.ho_ten}</div>
                  <span className="mt-2 inline-block rounded-lg bg-blue-50 px-2.5 py-0.5 text-[16px] font-bold text-blue-700">{hs.ma_ho_so}</span>
                  <div className="mt-2">
                    {boHoc ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[14px] font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Bỏ học
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[14px] font-semibold text-green-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Đang học
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-[15px] text-slate-700">
                <span className="flex items-center gap-2.5"><FaRegCalendarAlt className="text-blue-600" />Ngày sinh: {fmtDate(hs.ngay_sinh) || "—"}</span>
                <span className="flex items-center gap-2.5"><FaPhoneAlt className="text-blue-600" />SĐT: {hs.dien_thoai || "—"}</span>
                <span className="flex items-start gap-2.5"><FaHome className="mt-1 shrink-0 text-blue-600" />Địa chỉ: {hs.dia_chi || "—"}</span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-blue-50 px-4 py-4">
                <FaWallet className="text-[40px]" style={{ color: BLUE }} />
                <div>
                  <div className="text-[17px] font-semibold" style={{ color: NAVY }}>Tổng công nợ hiện tại</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[30px] font-extrabold" style={{ color: congNo ? "#dc2626" : BLUE }}>
                      {congNo === null ? "—" : fmtTien(congNo)}
                    </span>
                    {congNo === 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-0.5 text-[13px] font-semibold text-green-700"><FaCheck /> Đã thanh toán đủ</span>
                    ) : congNo === null ? (
                      <span className="text-[13px] text-slate-500">Chưa có giá</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-[13px] font-semibold text-red-600"><FaExclamationCircle /> Còn nợ</span>
                    )}
                  </div>
                  <div className="text-[13px] text-slate-600">Phải thu {hs.phai_thu === null ? "—" : fmtTien(hs.phai_thu)} · Đã thu {fmtTien(hs.da_thu)}</div>
                </div>
              </div>
            </div>

            {/* Lịch sử */}
            <div className="flex min-w-0 flex-col gap-4">
              <Khung icon={<FaDatabase />} title="Lịch sử đóng tiền" extra={<XemTatCa tong={lichSu.length} mo={moTien} onClick={() => setMoTien((v) => !v)} />}>
                <Table size="middle" rowKey="key" pagination={false} bordered dataSource={moTien ? lichSu : lichSu.slice(0, SO_DONG)}
                  components={{ header: { cell: headCell } }} scroll={{ x: 990 }}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lần đóng tiền nào" /> }}
                  columns={[
                    { title: "Ngày thu", dataIndex: "ngay", width: 110, align: "center", render: (v) => fmtDate(v) },
                    { title: "Số phiếu thu", dataIndex: "so_phieu", width: 130, align: "center" },
                    { title: "Hình thức thanh toán", dataIndex: "hinh_thuc", width: 190 },
                    { title: "Số tiền", dataIndex: "so_tien", width: 130, align: "right",
                      render: (v, r) => (v === null || v === undefined ? "-" : <span className={r.am ? "text-red-600" : ""}>{r.am ? "−" : ""}{fmtTien(v)}</span>) },
                    { title: "Nội dung", dataIndex: "noi_dung", width: 240 },
                    { title: "Chuyển học phí cho", dataIndex: "chuyen_cho", width: 190, align: "center" },
                  ]} />
              </Khung>

              <Khung icon={<FaTrophy />} title="Lịch sử thi đã đóng">
                <Table size="middle" rowKey="key" pagination={false} bordered dataSource={[]}
                  components={{ header: { cell: headCell } }}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu lệ phí thi" /> }}
                  columns={[
                    { title: "Ngày đăng ký", dataIndex: "ngay", width: 140, align: "center" },
                    { title: "Kỳ thi", dataIndex: "ky_thi" },
                    { title: "Lệ phí", dataIndex: "le_phi", width: 130, align: "right" },
                    { title: "Trạng thái", dataIndex: "trang_thai", width: 140, align: "center", render: () => <FaCheckCircle /> },
                    { title: "Ghi chú", dataIndex: "ghi_chu", width: 160 },
                  ]} />
              </Khung>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Button size="large" icon={<FaPrint />} loading={inLoading} disabled={!hs} onClick={inHoSo} className="!h-12 !w-[240px] !border-blue-300 !font-semibold !text-blue-700">
            In hồ sơ
          </Button>
          <Button size="large" type="primary" icon={<CloseOutlined />} onClick={onClose} className="!h-12 !w-[150px] !font-semibold" style={{ background: BLUE }}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
