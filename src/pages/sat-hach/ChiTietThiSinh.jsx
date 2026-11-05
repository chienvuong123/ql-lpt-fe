import React, { useState } from "react";
import { Button, Empty, Image, Tooltip } from "antd";
import { ExportOutlined, UserOutlined } from "@ant-design/icons";
import { getAnhSatHachUrl } from "../../apis/apiSatHach";
import { KET_QUA, PHAN_THI, formatDate, formatSbd, idThiSinh } from "./satHach.constants";
import { PhanThiTag } from "./SatHachTags";
import LichSuThiModal from "./LichSuThiModal";

const GIOI_TINH = { M: "Nam", F: "Nữ" };

const AnhThiSinh = ({ maKySh, id, coAnh }) => {
    const [loi, setLoi] = useState(false);
    if (!coAnh || loi) {
        return (
            <div className="flex h-[128px] w-[100px] shrink-0 items-center justify-center rounded-lg bg-gray-100 text-4xl text-gray-300">
                <UserOutlined />
            </div>
        );
    }
    return (
        <Image
            width={100}
            height={128}
            style={{ objectFit: "cover", borderRadius: 8 }}
            src={getAnhSatHachUrl(maKySh, id)}
            onError={() => setLoi(true)}
        />
    );
};

const ThongTin = ({ label, value }) => (
    <div className="flex gap-2 text-[13px] leading-6">
        <span className="w-[92px] shrink-0 text-gray-500">{label}:</span>
        <span className="min-w-0 break-all font-medium text-gray-800">{value || "—"}</span>
    </div>
);

const ChiTietThiSinh = ({ thiSinh }) => {
    const [openLichSu, setOpenLichSu] = useState(false);
    const kq = thiSinh ? KET_QUA[thiSinh.ket_qua] || KET_QUA.CHUA_HOAN_THANH : null;

    return (
        <div className="flex min-h-0 flex-col rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
            <div className="flex shrink-0 items-center justify-between pb-2">
                <div className="text-[15px] font-semibold">Chi tiết thí sinh</div>
                {thiSinh && (
                    <Tooltip title="Xem lịch sử thi lại">
                        <Button type="text" size="small" icon={<ExportOutlined />} onClick={() => setOpenLichSu(true)} />
                    </Tooltip>
                )}
            </div>

            {!thiSinh ? (
                <div className="flex flex-1 items-center justify-center">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn thí sinh trong danh sách để xem chi tiết" />
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="flex gap-3">
                        <AnhThiSinh
                            key={`${thiSinh.ma_ky_sh}-${idThiSinh(thiSinh)}`}
                            maKySh={thiSinh.ma_ky_sh}
                            id={idThiSinh(thiSinh)}
                            coAnh={thiSinh.co_anh}
                        />
                        <div className="min-w-0 flex-1 text-[13px] leading-6 text-gray-600">
                            <div className="text-base font-bold uppercase leading-6 text-[#1a56db]">{thiSinh.ho_ten}</div>
                            <div>
                                SBD: {formatSbd(thiSinh.so_bao_danh)}
                                {thiSinh.gioi_tinh && ` | ${GIOI_TINH[thiSinh.gioi_tinh] || thiSinh.gioi_tinh}`}
                            </div>
                            <div>Ngày sinh: {formatDate(thiSinh.ngay_sinh)}</div>
                            <div>Hạng GPLX: <b className="text-gray-800">{thiSinh.hang_gplx}</b></div>
                        </div>
                    </div>

                    {/* Dấu kết quả nổi ở góc phải dòng tiêu đề — vùng trống giữa thông tin và bảng phần thi, không che chữ */}
                    <div className="relative mt-3 mb-1.5 text-[14px] font-semibold">
                        Kết quả từng phần thi
                        <span
                            className="pointer-events-none absolute right-1 bottom-3 -rotate-6 whitespace-nowrap rounded-md border-[3px] bg-white/85 px-2.5 py-0.5 text-[15px] font-extrabold uppercase leading-6"
                            style={{ color: kq.color, borderColor: kq.color }}
                        >
                            {kq.label}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                        {PHAN_THI.map((p) => (
                            <div key={p.key} className="flex items-center justify-between px-3 py-1.5 text-[13px]">
                                <span className="flex items-center gap-2">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                                    <span>
                                        {p.label}
                                        {thiSinh[p.key]?.dat_truoc && (
                                            <span className="block text-xs leading-4 text-gray-400">
                                                Đạt kỳ {thiSinh[p.key].dat_truoc.ten_ky_sh || thiSinh[p.key].dat_truoc.ma_ky_sh}
                                                {" "}({formatDate(thiSinh[p.key].dat_truoc.ngay_sh)})
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <PhanThiTag phanKey={p.key} phan={thiSinh[p.key]} />
                            </div>
                        ))}
                    </div>

                    <div className="mt-2">
                        <ThongTin label="CCCD" value={thiSinh.so_cmt} />
                        <ThongTin label="Mã đăng ký" value={thiSinh.ma_dk} />
                        <ThongTin label="Khóa học" value={thiSinh.ma_khoa_hoc} />
                        <ThongTin label="Nội dung SH" value={thiSinh.noi_dung_sh_ten} />
                    </div>
                </div>
            )}

            <LichSuThiModal open={openLichSu} onClose={() => setOpenLichSu(false)} thiSinh={thiSinh} />
        </div>
    );
};

export default ChiTietThiSinh;
