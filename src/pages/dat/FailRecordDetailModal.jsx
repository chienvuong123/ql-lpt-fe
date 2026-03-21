import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Tabs,
  Typography,
  Table,
  Tag,
  Space,
} from "antd";
import { AiOutlineSelect } from "react-icons/ai";
import { formatHoursToHM } from "../../util/helper";

const { Text } = Typography;

const normalizeApproveFlag = (value) => {
  return (
    value === true ||
    value === 1 ||
    String(value || "").toLowerCase() === "true"
  );
};

const FailRecordDetailModal = ({ open, record, onCancel }) => {
  const navigate = useNavigate();
  const currentRecord = record || null;

  const errorCount = currentRecord?.errors?.length ?? 0;
  const warningCount = currentRecord?.warnings?.length ?? 0;

  const tabItems = [
    {
      key: "errors",
      label: (
        <Badge count={errorCount ?? 0} offset={[15, 0]}>
          <span>Lỗi</span>
        </Badge>
      ),
      children: (
        <Space direction="vertical" className="w-full" size="small">
          {errorCount > 0 ? (
            currentRecord.errors.map((item, index) => (
              <div
                key={`${item?.label}-${index}`}
                className="flex items-start justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2"
              >
                <div className="flex gap-1">
                  <Text strong>{item?.label || "Lỗi"}</Text>
                  <Text>{item?.message || "-"}</Text>
                </div>
              </div>
            ))
          ) : (
            <Text type="secondary">Không có lỗi.</Text>
          )}
        </Space>
      ),
    },
    {
      key: "warnings",
      label: (
        <Badge count={warningCount ?? 0} offset={[15, 0]} color="#faad14">
          <span>Cảnh báo</span>
        </Badge>
      ),
      children: (
        <Space direction="vertical" className="w-full" size="small">
          {warningCount > 0 ? (
            currentRecord.warnings.map((item, index) => (
              <div
                key={`${item?.label}-${index}`}
                className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2"
              >
                <Text strong>{item?.label || "Cảnh báo"}: </Text>
                <Text>{item?.message || "-"}</Text>
              </div>
            ))
          ) : (
            <Text type="secondary">Không có cảnh báo.</Text>
          )}
        </Space>
      ),
    },
  ];

  // Sessions table columns
  const sessionColumns = [
    {
      title: "#",
      dataIndex: "stt",
      key: "stt",
      width: 30,
      align: "center",
      render: (text, _, index) => text ?? index + 1,
    },
    {
      title: "Thời gian",
      key: "thoiGian",
      width: 110,
      align: "center",
      render: (_, session) => (
        <span>
          {session.thoiDiemDangNhap
            ? new Date(session.thoiDiemDangNhap).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 95,
      align: "center",
      render: (_, session) => {
        const invalid = session.isValid === false;
        const isApproved = normalizeApproveFlag(session?.duyet) || !invalid;

        let statusColor, statusText;
        if (!invalid) {
          if (isApproved) {
            statusColor = "success";
            statusText = "Hợp lệ";
          } else {
            statusColor = "warning";
            statusText = "Đã hủy";
          }
        } else {
          if (isApproved) {
            statusColor = "processing";
            statusText = "Đã duyệt";
          } else {
            statusColor = "error";
            statusText = "Bị loại";
          }
        }
        return (
          <Tag variant={"outlined"} color={statusColor}>
            {statusText}
          </Tag>
        );
      },
    },
    {
      title: "Biển số",
      key: "bienSo",
      width: 90,
      align: "center",
      render: (value) => value?.bienSo,
    },
    {
      title: "Tổng km",
      key: "bienSo",
      width: 90,
      align: "center",
      render: (value) => `${value.tongQuangDuongKm.toFixed(2)} km`,
    },
    {
      title: "Tổng giờ",
      key: "bienSo",
      width: 90,
      align: "center",
      render: (value) => {
        const total = value.tongThoiGianGiay || 0;
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);

        return `${h ? `${h}h ` : ""}${m}'`;
      },
    },
    {
      title: "Chi tiết lỗi",
      key: "chiTiet",
      render: (_, session) =>
        session.sessionErrors.length > 0 ? (
          <Space size={4} direction="vertical">
            {session.sessionErrors.map((e, i) => (
              <Text key={i} className="block text-xs" type="danger">
                {e?.message}
              </Text>
            ))}
          </Space>
        ) : (
          <span className="w-full flex justify-center items-center">-</span>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center",
      render: () => {
        return (
          <Space>
            <Button
              type="primary"
              className="!w-10"
              size="small"
              onClick={() => navigate("/truy-vet-loi")}
            >
              <AiOutlineSelect />
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Drawer
        title="Chi tiết học viên"
        open={open}
        onClose={onCancel}
        footer={null}
        width={1200}
      >
        {currentRecord ? (
          <Space direction="vertical" className="w-full" size="large">
            <Card size="small">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <Text strong>Học viên: </Text>
                  <Text>{currentRecord?.hoTen || "-"}</Text>
                </div>
                <div>
                  <Text strong>Mã ĐK: </Text>
                  <Text>{currentRecord?.maDK || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tên khóa học: </Text>
                  <Text>{currentRecord?.studentInfo?.khoaHoc || "-"}</Text>
                </div>
                <div>
                  <Text strong>Hạng đào tạo: </Text>
                  <Text>{currentRecord?.hangDaoTao || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tổng phiên: </Text>
                  <Text>{currentRecord?.totalSessions ?? "-"}</Text>
                </div>
                <div>
                  <Text strong>Giáo viên: </Text>
                  <Text>{currentRecord?.studentInfo?.giaoVien || "-"}</Text>
                </div>
                <div>
                  <Text strong>Xe B1: </Text>
                  <Text>{currentRecord?.studentInfo?.xeB1 || "-"}</Text>
                </div>
                <div>
                  <Text strong>Xe B2: </Text>
                  <Text>{currentRecord?.studentInfo?.xeB2 || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tổng quãng đường: </Text>
                  <Text>
                    {currentRecord?.summary?.tongQuangDuongChuaLoai} km
                  </Text>
                </div>
                <div>
                  <Text strong>Tổng thời gian: </Text>
                  <Text>
                    {formatHoursToHM(
                      currentRecord?.summary?.tongThoiGianChuaLoaiGio,
                    )}{" "}
                  </Text>
                </div>
              </div>
            </Card>

            {/* ─── Tab Lỗi / Cảnh báo ─── */}
            <Card size="small" className="!mb-0">
              <Tabs defaultActiveKey="errors" size="small" items={tabItems} />
            </Card>

            {/* ─── Các phiên học (Table) ─── */}
            <Card size="small" title="Các phiên học" className="!mb-0">
              <Table
                columns={sessionColumns}
                dataSource={currentRecord?.sessions || []}
                rowKey={(_, index) => index}
                pagination={false}
                bordered
                size="small"
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

export default FailRecordDetailModal;
