import React, { useMemo, useState } from "react";
import {
  Table,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  Select,
  Checkbox,
  message,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getListGplxHoan,
  getNgayCapOptions,
  scanGplxHoan,
  updateTrangThaiGplxHoan,
} from "../../../apis/apiGplxHoan";
import ScanInput from "./ScanInput";
import { getGplxHoanColumns } from "./columns";

const ALL_TRANG_THAI = ["cho_nhap_kho", "da_nhap_kho", "da_xuat_kho"];
const HANG_OPTIONS = ["A1", "A", "B", "C", "C1"];

// Nút chuyển trạng thái thủ công hiển thị theo từng tab — chỉ cho phép chuyển 1 bước
// liền kề (tới hoặc lùi), không cho nhảy cóc qua bước.
const MANUAL_ACTIONS = {
  cho_nhap_kho: [{ target: "da_nhap_kho", label: "Nhập kho", type: "primary" }],
  da_nhap_kho: [
    { target: "cho_nhap_kho", label: "Chờ nhập kho", type: "default" },
    { target: "da_xuat_kho", label: "Xuất kho", type: "primary" },
  ],
  da_xuat_kho: [{ target: "da_nhap_kho", label: "Nhập kho", type: "default" }],
};

// Bảng dùng chung cho 3 tab (Chờ nhập kho / Nhập kho / Xuất kho), chỉ khác nhau
// ở trang_thai lọc và có bật ô quét hay không.
const GplxHoanStatusTable = ({
  trangThai,
  ngayNhanBuuDien,
  ngayOptions = [],
  onChangeNgayNhanBuuDien,
  scannable = false,
  active = true,
}) => {
  const queryClient = useQueryClient();

  const [hoTenText, setHoTenText] = useState("");
  const [soGplxText, setSoGplxText] = useState("");
  const [hangChecked, setHangChecked] = useState([]);
  const [dauMoiText, setDauMoiText] = useState("");
  const [appliedHoTen, setAppliedHoTen] = useState("");
  const [appliedSoGplx, setAppliedSoGplx] = useState("");
  const [appliedHang, setAppliedHang] = useState([]);
  const [appliedDauMoi, setAppliedDauMoi] = useState("");
  const [appliedNgayCap, setAppliedNgayCap] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [scanLoading, setScanLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const actions = MANUAL_ACTIONS[trangThai] || [];

  const { data: ngayCapRes } = useQuery({
    queryKey: ["ngayCapOptions"],
    queryFn: getNgayCapOptions,
  });

  const ngayCapOptions = useMemo(() => {
    const list = ngayCapRes?.data || [];
    return list.map((item) => ({
      value: item.ngay_cap,
      label: `${item.ngay_cap} (${item.so_luong} bằng)`,
    }));
  }, [ngayCapRes]);

  const { data: apiResponse, isFetching } = useQuery({
    queryKey: [
      "listGplxHoan",
      trangThai,
      ngayNhanBuuDien,
      pagination.page,
      pagination.limit,
      appliedHoTen,
      appliedSoGplx,
      appliedHang,
      appliedDauMoi,
      appliedNgayCap,
    ],
    queryFn: () =>
      getListGplxHoan({
        page: pagination.page,
        limit: pagination.limit,
        ho_ten: appliedHoTen,
        so_gplx: appliedSoGplx,
        hang: appliedHang.join(","),
        dau_moi: appliedDauMoi,
        ngay_cap: appliedNgayCap,
        trang_thai: trangThai,
        ngay_nhan_buu_dien: ngayNhanBuuDien,
      }),
    enabled: !!ngayNhanBuuDien,
    keepPreviousData: true,
  });

  const records = useMemo(() => apiResponse?.data || [], [apiResponse]);
  const totalItems = apiResponse?.pagination?.total || 0;

  const handleSearch = () => {
    setAppliedHoTen(hoTenText);
    setAppliedSoGplx(soGplxText);
    setAppliedHang(hangChecked);
    setAppliedDauMoi(dauMoiText);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setHoTenText("");
    setSoGplxText("");
    setHangChecked([]);
    setDauMoiText("");
    setAppliedHoTen("");
    setAppliedSoGplx("");
    setAppliedHang([]);
    setAppliedDauMoi("");
    setAppliedNgayCap(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleScan = async (scannedText) => {
    setScanLoading(true);
    try {
      const res = await scanGplxHoan({
        scanned_text: scannedText,
        ngay_nhan_buu_dien: ngayNhanBuuDien,
        from_trang_thai: trangThai,
      });
      const result = res?.data || {};
      if (result.code === "IGNORE") {
        return; // Dòng URL đi kèm mã QR, bỏ qua hoàn toàn, không hiện thông báo gì
      }
      if (result.success) {
        message.success("Quét thành công!");
        ALL_TRANG_THAI.forEach((status) => {
          queryClient.invalidateQueries({
            queryKey: ["listGplxHoan", status, ngayNhanBuuDien],
          });
        });
        queryClient.invalidateQueries({ queryKey: ["ngayNhanBuuDienOptions"] });
      } else if (result.code === "ALREADY_IN_STATE") {
        message.warning(result.message);
      } else {
        message.error("Quét thất bại!");
      }
    } catch {
      message.error("Quét thất bại!");
    } finally {
      setScanLoading(false);
    }
  };

  const handleManualTransition = async (record, targetTrangThai) => {
    setUpdatingId(record.id);
    try {
      const res = await updateTrangThaiGplxHoan({
        id: record.id,
        trang_thai: targetTrangThai,
      });
      const result = res?.data || {};
      if (result.success) {
        message.success("Cập nhật thành công!");
        ALL_TRANG_THAI.forEach((status) => {
          queryClient.invalidateQueries({
            queryKey: ["listGplxHoan", status, ngayNhanBuuDien],
          });
        });
        queryClient.invalidateQueries({ queryKey: ["ngayNhanBuuDienOptions"] });
      } else {
        message.error("Cập nhật thất bại!");
      }
    } catch {
      message.error("Cập nhật thất bại!");
    } finally {
      setUpdatingId(null);
    }
  };

  const baseColumns = getGplxHoanColumns(pagination);
  const columns =
    actions.length === 0
      ? baseColumns
      : [
          ...baseColumns,
          {
            title: "Thao tác",
            key: "actions",
            align: "center",
            width: actions.length > 1 ? 260 : 180,
            render: (_, record) => (
              <Space>
                {actions.map((action) => (
                  <Button
                    key={action.target}
                    size="small"
                    type={action.type}
                    loading={updatingId === record.id}
                    disabled={updatingId !== null && updatingId !== record.id}
                    onClick={() =>
                      handleManualTransition(record, action.target)
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </Space>
            ),
          },
        ];

  return (
    <div>
      {scannable && (
        <div className="mb-4">
          <ScanInput
            onScan={handleScan}
            loading={scanLoading}
            active={active}
          />
        </div>
      )}

      <Card className="!mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={4}>
            <label className="block text-xs text-gray-500 uppercase mb-1">
              Ngày nhận bưu điện
            </label>
            <Select
              className="w-full"
              placeholder="Chọn ngày nhận bưu điện"
              options={ngayOptions}
              value={ngayNhanBuuDien}
              onChange={onChangeNgayNhanBuuDien}
              allowClear={false}
              notFoundContent="Chưa có dữ liệu import"
            />
          </Col>
          <Col xs={24} md={4}>
            <label className="block text-xs text-gray-500 uppercase mb-1">
              Ngày cấp
            </label>
            <Select
              className="w-full"
              placeholder="Tất cả ngày cấp"
              options={ngayCapOptions}
              value={appliedNgayCap}
              onChange={(value) => {
                setAppliedNgayCap(value ?? null);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent="Chưa có dữ liệu"
            />
          </Col>
          <Col xs={24} md={4}>
            <label className="block text-xs text-gray-500 uppercase mb-1">
              Tìm theo họ tên
            </label>
            <Input
              placeholder="Nhập họ và tên..."
              value={hoTenText}
              onChange={(e) => setHoTenText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} md={4}>
            <label className="block text-xs text-gray-500 uppercase mb-1">
              Tìm theo số GPLX
            </label>
            <Input
              placeholder="Nhập số GPLX..."
              value={soGplxText}
              onChange={(e) => setSoGplxText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} md={4}>
            <label className="block text-xs text-gray-500 uppercase mb-1">
              Tìm theo đầu mối
            </label>
            <Input
              placeholder="Nhập tên đầu mối..."
              value={dauMoiText}
              onChange={(e) => setDauMoiText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} md={4}>
            <label className="block text-xs text-gray-500 uppercase mb-1">
              Hạng xe
            </label>
            <Checkbox.Group
              options={HANG_OPTIONS}
              value={hangChecked}
              onChange={(checked) => {
                setHangChecked(checked);
                setAppliedHang(checked);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </Col>
          <Col xs={24} className="text-left">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ backgroundColor: "#3366cc" }}
                loading={isFetching}
              >
                Lọc
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={isFetching}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        bordered
        size="small"
        scroll={{ x: 1100, y: "calc(100vh - 420px)" }}
        className="table-blue-header"
        loading={isFetching}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: totalItems,
          onChange: (page, limit) => setPagination({ page, limit }),
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} bản ghi`,
        }}
      />
    </div>
  );
};

export default GplxHoanStatusTable;
