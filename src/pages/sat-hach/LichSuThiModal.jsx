import React from "react";
import { Modal, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getLichSuSatHach } from "../../apis/apiSatHach";
import { PHAN_THI, formatDate, formatSbd, idThiSinh } from "./satHach.constants";
import { KetQuaTag, PhanThiTag } from "./SatHachTags";

const LichSuThiModal = ({ open, onClose, thiSinh }) => {
    const { data = [], isLoading } = useQuery({
        queryKey: ["lichSuSatHach", idThiSinh(thiSinh)],
        queryFn: () => getLichSuSatHach({ soCmt: thiSinh?.so_cmt, maDk: thiSinh?.ma_dk }),
        enabled: open && !!thiSinh,
    });

    const columns = [
        {
            title: "Kỳ sát hạch",
            render: (_, r) => (
                <div>
                    <div className="font-medium">{r.ten_ky_sh || r.ma_ky_sh}</div>
                    <div className="text-xs text-gray-500">{formatDate(r.ngay_sh)}</div>
                </div>
            ),
        },
        { title: "SBD", dataIndex: "so_bao_danh", width: 70, render: formatSbd },
        { title: "Hạng", dataIndex: "hang_gplx", width: 70 },
        { title: "Nội dung", dataIndex: "noi_dung_sh_ten", width: 170 },
        ...PHAN_THI.map((p) => ({
            title: p.label,
            dataIndex: p.key,
            align: "center",
            width: 130,
            render: (v) => <PhanThiTag phanKey={p.key} phan={v} />,
        })),
        { title: "Kết quả", dataIndex: "ket_qua", align: "center", width: 140, render: (v) => <KetQuaTag value={v} /> },
    ];

    return (
        <Modal
            title={`Lịch sử sát hạch — ${thiSinh?.ho_ten || ""}`}
            open={open}
            onCancel={onClose}
            footer={null}
            width={1000}
        >
            <Table
                rowKey="ma_ky_sh"
                size="small"
                loading={isLoading}
                columns={columns}
                dataSource={data}
                pagination={false}
                scroll={{ x: 900 }}
            />
        </Modal>
    );
};

export default LichSuThiModal;
