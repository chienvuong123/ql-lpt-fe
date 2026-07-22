import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, DatePicker, Modal, Tabs, Typography, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getNgayNhanBuuDienOptions, importExcelGplxHoan } from "../../apis/apiGplxHoan";
import { usePermission } from "../../util/permission";
import ChoNhapKhoTab from "./gplx-hoan/ChoNhapKhoTab";
import NhapKhoTab from "./gplx-hoan/NhapKhoTab";
import XuatKhoTab from "./gplx-hoan/XuatKhoTab";

const { Title, Text } = Typography;

const GplxHoan = () => {
    const { canEdit } = usePermission();
    const queryClient = useQueryClient();
    const fileInputRefModal = useRef(null);

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importDate, setImportDate] = useState(dayjs());
    const [uploading, setUploading] = useState(false);

    // Ngày nhận bưu điện đang xem
    const [selectedNgayNhan, setSelectedNgayNhan] = useState(null);

    // Tab đang mở — cần biết để chỉ bật lắng nghe quét QR ở đúng tab đang hiển thị
    const [activeTabKey, setActiveTabKey] = useState("cho-nhap-kho");

    const { data: ngayOptionsRes } = useQuery({
        queryKey: ["ngayNhanBuuDienOptions"],
        queryFn: getNgayNhanBuuDienOptions,
    });

    const ngayOptions = useMemo(() => {
        const list = ngayOptionsRes?.data || [];
        return list.map((item) => {
            const value = dayjs(item.ngay_nhan_buu_dien).format("YYYY-MM-DD");
            return { value, label: `${dayjs(value).format("DD/MM/YYYY")} (${item.so_luong} bằng)` };
        });
    }, [ngayOptionsRes]);

    useEffect(() => {
        if (!selectedNgayNhan && ngayOptions.length > 0) {
            setSelectedNgayNhan(ngayOptions[0].value);
        }
    }, [ngayOptions, selectedNgayNhan]);

    const handleConfirmImport = async () => {
        if (!canEdit) return;
        if (!selectedFile) {
            message.warning("Vui lòng chọn file Excel!");
            return;
        }
        if (!importDate) {
            message.warning("Vui lòng chọn ngày nhận bưu điện!");
            return;
        }
        setUploading(true);
        try {
            const res = await importExcelGplxHoan(selectedFile, importDate.format("YYYY-MM-DD"));
            const { total, inserted, updated, skipped } = res?.data?.data || {};
            message.success(
                `Import thành công! Hợp lệ: ${total ?? 0} (thêm mới: ${inserted ?? 0}, cập nhật: ${updated ?? 0})` +
                (skipped ? `, bỏ qua ${skipped} dòng thiếu thông tin` : "")
            );
            setIsImportModalOpen(false);
            setSelectedFile(null);
            setSelectedNgayNhan(importDate.format("YYYY-MM-DD"));
            queryClient.invalidateQueries({ queryKey: ["ngayNhanBuuDienOptions"] });
            queryClient.invalidateQueries({ queryKey: ["listGplxHoan"] });
        } catch (err) {
            message.error(err.response?.data?.message || "Lỗi khi nhập Excel!");
        } finally {
            setUploading(false);
        }
    };

    const tabItems = [
        {
            key: "cho-nhap-kho",
            label: "Chờ nhập kho",
            children: (
                <ChoNhapKhoTab
                    ngayNhanBuuDien={selectedNgayNhan}
                    ngayOptions={ngayOptions}
                    onChangeNgayNhanBuuDien={setSelectedNgayNhan}
                    active={activeTabKey === "cho-nhap-kho"}
                />
            ),
        },
        {
            key: "nhap-kho",
            label: "Nhập kho",
            children: (
                <NhapKhoTab
                    ngayNhanBuuDien={selectedNgayNhan}
                    ngayOptions={ngayOptions}
                    onChangeNgayNhanBuuDien={setSelectedNgayNhan}
                    active={activeTabKey === "nhap-kho"}
                />
            ),
        },
        {
            key: "xuat-kho",
            label: "Xuất kho",
            children: (
                <XuatKhoTab
                    ngayNhanBuuDien={selectedNgayNhan}
                    ngayOptions={ngayOptions}
                    onChangeNgayNhanBuuDien={setSelectedNgayNhan}
                />
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={3} className="!mb-1">
                        GPLX Hoàn Trả Bưu Điện
                    </Title>
                    <Text type="secondary">
                        Quản lý danh sách giấy phép lái xe tồn được trả về qua bưu điện
                    </Text>
                </div>
                <div>
                    <Button
                        type="default"
                        icon={<UploadOutlined />}
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white text-gray-600 !h-8"
                        disabled={!canEdit}
                    >
                        Import Excel
                    </Button>
                </div>
            </div>

            <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabItems} className="theory-tabs" />

            {/* Import Excel Modal */}
            <Modal
                title="Nhập danh sách GPLX hoàn trả bưu điện từ Excel"
                open={isImportModalOpen}
                onCancel={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
                }}
                onOk={handleConfirmImport}
                confirmLoading={uploading}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <div className="space-y-4 my-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                            Ngày nhận bưu điện
                        </label>
                        <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            value={importDate}
                            onChange={setImportDate}
                            allowClear={false}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                            Chọn File Excel
                        </label>
                        <div
                            className="border border-dashed border-gray-300 rounded p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => fileInputRefModal.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRefModal}
                                style={{ display: "none" }}
                                accept=".xlsx, .xls"
                                onChange={(e) => setSelectedFile(e.target.files?.[0])}
                            />
                            <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                            <div>
                                {selectedFile ? (
                                    <span className="text-green-600 font-semibold">{selectedFile.name}</span>
                                ) : (
                                    <span className="text-gray-500">Nhấp để chọn file excel (.xlsx, .xls)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GplxHoan;
