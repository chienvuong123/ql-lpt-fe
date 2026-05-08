import { Button, Tag, Space, Popconfirm } from "antd";
import { EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { renderTrangThaiHocBu, renderTrangThaiThucHanh } from "../../../constants/hocBuConstants";
import HocVienInfo from "../../../components/HocVienInfor";

export const getHocBuDatColumns = ({ pagination }) => [
    {
        title: "#", key: "stt", width: 50, align: "center",
        render: (_, __, i) => (pagination.page - 1) * pagination.limit + i + 1,
    },
    {
        title: "Học viên", key: "hoc_vien", width: 250,
        render: (_, record) => <HocVienInfo record={record} />,
    },
    {
        title: "CCCD", key: "cccd", width: 140, align: "center",
        render: (_, r) => r?.cccd || "-",
    },
    {
        title: "Ngày sinh", key: "ngay_sinh", width: 100, align: "center",
        render: (_, r) => r?.ngay_sinh ? dayjs(r.ngay_sinh).format("DD/MM/YYYY") : "-",
    },
    {
        title: "Khóa", key: "ma_khoa", width: 120, align: "center",
        render: (_, r) => r?.ma_khoa || "-",
    },
    {
        title: "Giáo viên", key: "thay_giao", width: 150,
        render: (_, r) => r?.thay_giao || "-",
    },
];

export const getChoDuyetColumns = ({ pagination, onOpenDetail, handleDuyet, handleHuyDuyet }) => [
    ...getHocBuDatColumns({ pagination }),
    {
        title: "Trạng thái", key: "trang_thai", align: "center", width: 160,
        render: (_, record) => renderTrangThaiHocBu(record.trang_thai),
    },
    {
        title: "Trạng thái TH", key: "trang_thai_thuc_hanh", align: "center", width: 120,
        render: (_, record) => renderTrangThaiThucHanh(record.trang_thai_thuc_hanh),
    },
    {
        title: "Thời gian đăng ký", key: "created_at", width: 160, align: "center",
        render: (_, r) => dayjs(r.created_at).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
        title: "Thao tác", key: "action", width: 90, align: "center",
        render: (_, record) => {
            const st = record.trang_thai;
            const isChoDuyet = ["1", "4"].includes(String(st));
            const isDaDuyet = ["2", "5"].includes(String(st));
            return (
                <Space>
                    <Button type="primary" className="!bg-[#3366cc]" icon={<EyeOutlined />} size="small"
                        onClick={() => onOpenDetail(record)} />
                    {isChoDuyet && (
                        <Popconfirm title="Duyệt học bù" description="Bạn có chắc chắn muốn duyệt không?"
                            onConfirm={() => handleDuyet(record.id, record)} okText="Có" cancelText="Không">
                            <Button type="primary" className="!bg-green-600" icon={<CheckOutlined />} size="small" />
                        </Popconfirm>
                    )}
                    {isDaDuyet && (
                        <Popconfirm title="Hủy duyệt" description="Bạn có chắc chắn muốn hủy duyệt không?"
                            onConfirm={() => handleHuyDuyet(record.id, record)} okText="Có" cancelText="Không">
                            <Button type="primary" className="!bg-red-500" icon={<CloseOutlined />} size="small" />
                        </Popconfirm>
                    )}
                </Space>
            );
        },
    },
];