import React, { useEffect, useState } from "react";
import {
    Card,
    Typography,
    Switch,
    DatePicker,
    Button,
    Table,
    message,
    Space,
    Modal,
    Form,
    Input,
    Tooltip,
} from "antd";
import {
    SettingOutlined,
    SaveOutlined,
    PlusOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getCheckConfigs,
    updateCheckConfig,
    addCheckConfig,
} from "../../apis/apiSetting";
import { usePermission } from "../../util/permission";

const { Title, Text } = Typography;

const RULE_NAMES = {
    checkTocDo: "Kiểm tra tốc độ trung bình",
    checkKhungGioTuDong: "Kiểm tra khung giờ xe tự động",
    checkNghiGiuaPhien: "Kiểm tra nghỉ giữa các phiên",
    checkSaiGiaoVien: "Kiểm tra sai tên giáo viên",
    checkSaiXe: "Kiểm tra sai biển số xe",
    checkDungNghi: "Kiểm tra dừng nghỉ xe quá 10 phút",
    checkPhienNgan: "Kiểm tra phiên học quá ngắn",
};

export default function CaiDatHeThong() {
    const { canEdit } = usePermission();
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await getCheckConfigs();
            // Lấy dữ liệu trả về từ res.data.data hoặc fallback res.data
            const data = res?.data?.data ?? res?.data ?? {};
            setConfig(data);

            // Đồng bộ cache xuống LocalStorage để các utility kiểm tra (như DieuKienKiemTra.js) có thể đọc tức thời
            localStorage.setItem("SYSTEM_CONFIG_CHECK_DAT", JSON.stringify(data));
        } catch (error) {
            console.error("Lỗi fetchConfigs:", error);
            message.error("Không thể lấy dữ liệu danh sách cấu hình!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const updateRuleRemoteConfig = async (ruleKey, field, value) => {
        if (!canEdit) return;
        const currentRule = config[ruleKey] || {};
        const updatedRule = {
            ...currentRule,
            [field]: value,
        };

        // Cập nhật local state tức thời để mang lại cảm giác mượt mà cho UI
        setConfig((prev) => ({
            ...prev,
            [ruleKey]: updatedRule,
        }));

        try {
            // Chỉ gửi payload cập nhật riêng cho quy tắc này lên máy chủ
            const payload = {
                [ruleKey]: {
                    enabled: updatedRule.enabled,
                    startDate: updatedRule.startDate || null,
                    value: updatedRule.value !== undefined ? updatedRule.value : null,
                },
            };

            await updateCheckConfig(payload);

            // Ghi đè cache LocalStorage để tiện ích DieuKienKiemTra cập nhật tức thời
            const nextConfig = { ...config, [ruleKey]: updatedRule };
            localStorage.setItem("SYSTEM_CONFIG_CHECK_DAT", JSON.stringify(nextConfig));

            message.success(`Đã cập nhật: ${RULE_NAMES[ruleKey] || ruleKey}`);
            window.dispatchEvent(new Event("storage"));
        } catch (error) {
            console.error("Lỗi đồng bộ cấu hình:", error);
            message.error("Không thể lưu cấu hình lên máy chủ. Đang khôi phục lại trạng thái cũ!");

            // Hoàn tác lại giá trị cũ nếu API bị lỗi hoặc mất mạng
            setConfig((prev) => ({
                ...prev,
                [ruleKey]: currentRule,
            }));
        }
    };

    const handleAddNew = async (values) => {
        if (!canEdit) return;
        try {
            const payload = {
                checkKey: values.checkKey,
                enabled: values.enabled ?? true,
                startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : null,
                description: values.description,
                value: values.value !== undefined ? values.value : null,
            };

            await addCheckConfig(payload);
            message.success("Đã thêm cấu hình quy tắc mới thành công!");
            setIsModalOpen(false);
            form.resetFields();
            fetchConfigs();
        } catch (error) {
            console.error("Lỗi thêm mới:", error);
            message.error("Không thể thêm mới quy tắc. Vui lòng kiểm tra lại dữ liệu!");
        }
    };

    const dataSource = Object.entries(config).map(([key, val]) => ({
        key,
        ...val,
    }));

    const columns = [
        {
            title: "Tên quy tắc & Mô tả",
            key: "ruleName",
            width: "40%",
            render: (_, record) => {
                const displayName = RULE_NAMES[record.key] || record.key;
                const isCustom = !RULE_NAMES[record.key];

                return (
                    <Space direction="vertical" size={0}>
                        <Space>
                            <Text strong style={{ fontSize: "15px" }}>
                                {displayName}
                            </Text>
                            {isCustom && (
                                <Tooltip title="Quy tắc mới thêm">
                                    <InfoCircleOutlined style={{ color: "#faad14" }} />
                                </Tooltip>
                            )}
                        </Space>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            {record.description || "(Không có mô tả)"}
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: "Trạng thái",
            key: "status",
            align: "center",
            width: "15%",
            render: (_, record) => {
                return (
                    <Switch
                        checked={!!record.enabled}
                        onChange={(checked) =>
                            updateRuleRemoteConfig(record.key, "enabled", checked)
                        }
                        checkedChildren="BẬT"
                        unCheckedChildren="TẮT"
                        disabled={!canEdit}
                    />
                );
            },
        },
        {
            title: "Giá trị áp dụng",
            key: "value",
            width: "15%",
            render: (_, record) => {
                const allowedKeys = ["checkPhienNgan", "checkDungNghi", "checkTocDo", "checkNghiGiuaPhien"];
                if (!allowedKeys.includes(record.key)) {
                    return <Text type="secondary">-</Text>;
                }
                const isEnabled = record.enabled;
                return (
                    <Input
                        key={record.key + "_" + (record.value ?? "")}
                        disabled={!isEnabled || !canEdit}
                        defaultValue={record.value ?? ""}
                        placeholder="Ví dụ: 20"
                        style={{ width: "100%" }}
                        onBlur={(e) => {
                            const newVal = e.target.value;
                            if (newVal !== String(record.value ?? "")) {
                                updateRuleRemoteConfig(record.key, "value", newVal);
                            }
                        }}
                        onPressEnter={(e) => {
                            const newVal = e.target.value;
                            if (newVal !== String(record.value ?? "")) {
                                updateRuleRemoteConfig(record.key, "value", newVal);
                                e.target.blur();
                            }
                        }}
                    />
                );
            },
        },
        {
            title: "Thời gian áp dụng",
            key: "startDate",
            width: "30%",
            render: (_, record) => {
                const isEnabled = record.enabled;
                const dateVal = record.startDate ? dayjs(record.startDate) : null;

                return (
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <DatePicker
                            disabled={!isEnabled || !canEdit}
                            placeholder="Chọn ngày bắt đầu áp dụng"
                            format="DD/MM/YYYY"
                            style={{ width: "220px" }}
                            value={dateVal}
                            onChange={(date) => {
                                const dateStr = date ? date.format("YYYY-MM-DD") : "";
                                updateRuleRemoteConfig(record.key, "startDate", dateStr);
                            }}
                        />
                        {isEnabled && record.startDate ? (
                            <Text type="warning" style={{ fontSize: "11px" }}>
                                Chỉ kiểm tra từ ngày {dayjs(record.startDate).format("DD/MM/YYYY")}.
                            </Text>
                        ) : isEnabled ? (
                            <Text type="secondary" style={{ fontSize: "11px" }}>
                                Áp dụng cho TẤT CẢ các phiên.
                            </Text>
                        ) : null}
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Tiêu đề và Action Bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <Space size={10}>
                    <SettingOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
                    <Title level={3} style={{ margin: 0 }}>
                        Cấu hình hệ thống kiểm tra DAT
                    </Title>
                </Space>

                {canEdit && (
                    <Space size={12}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={() => setIsModalOpen(true)}
                            style={{ borderRadius: "6px" }}
                        >
                            Thêm quy tắc mới
                        </Button>
                    </Space>
                )}
            </div>

            {/* Bảng Danh sách quy tắc */}
            <Card
                className="shadow-sm"
                bodyStyle={{ padding: "16px" }}
                style={{ borderRadius: "8px" }}
            >
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                    loading={loading}
                    rowKey="key"
                    bordered
                    locale={{ emptyText: "Hiện chưa có dữ liệu cấu hình quy tắc" }}
                />
            </Card>

            {/* Modal Thêm quy tắc mới */}
            <Modal
                title="Thêm mới quy tắc kiểm tra"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Tạo mới"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddNew}
                    initialValues={{ enabled: true }}
                    style={{ marginTop: "16px" }}
                >
                    <Form.Item
                        label="Mã quy tắc (checkKey)"
                        name="checkKey"
                        rules={[
                            { required: true, message: "Vui lòng điền mã quy tắc!" },
                            {
                                pattern: /^[a-zA-Z0-9_]+$/,
                                message: "Mã quy tắc chỉ gồm chữ cái, số và dấu gạch dưới!",
                            },
                        ]}
                    >
                        <Input placeholder="Ví dụ: checkVuotDen" />
                    </Form.Item>

                    <Form.Item
                        label="Mô tả quy tắc"
                        name="description"
                        rules={[{ required: true, message: "Vui lòng nhập mô tả quy tắc!" }]}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Ví dụ: Kiểm tra phương tiện vượt đèn đỏ"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Giá trị cấu hình (value)"
                        name="value"
                        tooltip="Giá trị cụ thể của quy tắc (Ví dụ: 20, 15, 20phut)"
                    >
                        <Input placeholder="Ví dụ: 20 hoặc 20phut" />
                    </Form.Item>

                    <Form.Item
                        label="Kích hoạt hoạt động"
                        name="enabled"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
                    </Form.Item>

                    <Form.Item label="Ngày bắt đầu áp dụng (Nếu có)" name="startDate">
                        <DatePicker
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày bắt đầu"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
