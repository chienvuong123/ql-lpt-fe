import React, { useState } from "react";
import { Alert, DatePicker, Modal, Progress, Table, Tag, Typography, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { importXmlSatHach } from "../../apis/apiSatHach";

const { Text } = Typography;

const LOAI_FILE = {
    danh_sach: { label: "Danh sách thi", color: "blue" },
    ly_thuyet: { label: "Lý thuyết", color: "geekblue" },
    mo_phong: { label: "Mô phỏng", color: "purple" },
    sa_hinh: { label: "Sa hình", color: "green" },
    duong_truong: { label: "Đường trường", color: "orange" },
};

const ImportSatHachModal = ({ open, onClose, onImported }) => {
    const [fileList, setFileList] = useState([]);
    const [ngayThi, setNgayThi] = useState(dayjs());
    const [uploading, setUploading] = useState(false);
    const [percent, setPercent] = useState(0);
    const [result, setResult] = useState(null);

    const reset = () => {
        setFileList([]);
        setResult(null);
        setPercent(0);
    };

    const handleClose = () => {
        if (uploading) return;
        reset();
        onClose();
    };

    const handleImport = async () => {
        if (fileList.length === 0) {
            message.warning("Vui lòng chọn file XML!");
            return;
        }
        setUploading(true);
        setPercent(0);
        try {
            const res = await importXmlSatHach(
                fileList.map((f) => f.originFileObj || f),
                ngayThi?.format("YYYY-MM-DD"),
                setPercent,
            );
            const data = res?.data?.data;
            setResult(data);
            setFileList([]);
            const loi = data?.files?.filter((f) => f.loi).length || 0;
            if (loi) message.warning(`Import xong, ${loi} file bị lỗi`);
            else message.success("Import dữ liệu sát hạch thành công!");
            onImported?.(data);
        } catch (err) {
            message.error(err?.response?.data?.message || err.message || "Import thất bại");
        } finally {
            setUploading(false);
        }
    };

    const columns = [
        { title: "File", dataIndex: "ten_file", ellipsis: true },
        {
            title: "Nhận diện",
            dataIndex: "loai",
            width: 150,
            render: (loai) =>
                (loai || []).map((l) => (
                    <Tag key={l} color={LOAI_FILE[l]?.color}>{LOAI_FILE[l]?.label || l}</Tag>
                )),
        },
        {
            title: "Kết quả",
            width: 200,
            render: (_, r) =>
                r.loi ? (
                    <Text type="danger">{r.loi}</Text>
                ) : (
                    <Text>
                        {r.so_thi_sinh} thí sinh ({r.inserted} mới, {r.updated} cập nhật)
                    </Text>
                ),
        },
    ];

    return (
        <Modal
            title="Import dữ liệu ngày thi sát hạch"
            open={open}
            onCancel={handleClose}
            onOk={result ? handleClose : handleImport}
            okText={result ? "Đóng" : "Import"}
            cancelButtonProps={{ style: result ? { display: "none" } : undefined }}
            confirmLoading={uploading}
            width={720}
            destroyOnHidden
        >
            {result ? (
                <Table rowKey="ten_file" size="small" pagination={false} columns={columns} dataSource={result.files} />
            ) : (
                <>
                    <Alert
                        type="info"
                        showIcon
                        className="mb-3"
                        title="Chọn cùng lúc các file XML của ngày thi"
                        description={
                            <span>
                                File danh sách thi (<Text code>SAT_HACH</Text>), file lý thuyết, sa hình, đường trường
                                (<Text code>DULIEU_SATHACH</Text>). Hệ thống tự nhận diện từng loại; có thể import từng
                                file khi có kết quả, import lại sẽ cập nhật điểm phần thi tương ứng.
                            </span>
                        }
                    />
                    <Upload.Dragger
                        multiple
                        accept=".xml"
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList: list }) => setFileList(list)}
                        disabled={uploading}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Kéo thả hoặc bấm để chọn file XML</p>
                        <p className="ant-upload-hint">Tối đa 10 file, mỗi file ≤ 100MB</p>
                    </Upload.Dragger>
                    <div className="mt-3 flex items-center gap-2">
                        <Text>Ngày thi:</Text>
                        <DatePicker value={ngayThi} onChange={setNgayThi} format="DD/MM/YYYY" allowClear={false} />
                        <Text type="secondary" className="text-xs">
                            (chỉ dùng khi chưa có file danh sách — file danh sách đã ghi ngày sát hạch)
                        </Text>
                    </div>
                    {uploading && (
                        <div className="mt-3">
                            <Progress percent={percent} status="active" />
                            {percent === 100 && <Text type="secondary">Đang xử lý và lưu dữ liệu...</Text>}
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};

export default ImportSatHachModal;
