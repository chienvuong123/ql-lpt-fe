import React, { useState } from "react";
import {
  Button,
  Card,
  message,
  Row,
  Col,
  Select,
  DatePicker,
  Upload,
  Typography,
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import {
  importHocVienTotNghiep,
  exportExcelTotNghiep,
} from "../../apis/apiTotNghiep";

const KiemTraDuLieuTotNghiep = () => {
  const [filterType, setFilterType] = useState("latest");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ file }) => importHocVienTotNghiep(file),
    onSuccess: async (res) => {
      const details = res?.data || {};
      message.success(`Import thành công: ${details?.inserted || 0} bản ghi`);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import thất bại!");
    },
  });

  const handleCustomRequest = async ({ file }) => {
    mutation.mutate({ file });
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      let params = {};
      if (filterType === "latest") {
        params.filterType = "latest";
      } else if (filterType === "dateRange") {
        if (!fromDate || !toDate) {
          message.warning("Vui lòng chọn khoảng thời gian!");
          return;
        }
        params.filterType = "dateRange";
        params.fromDate = fromDate.format("YYYY-MM-DD");
        params.toDate = toDate.format("YYYY-MM-DD");
      }
      // Nếu "all", params = {} , không truyền gì

      const blob = await exportExcelTotNghiep(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "danh_sach_tot_nghiep.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success("Xuất Excel thành công!");
    } catch {
      message.error("Xuất Excel thất bại!");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Kiểm tra dữ liệu tốt nghiệp
        </h1>
        <Typography.Text type="secondary" className="text-sm">
          Quá trình xuất dữ liệu diễn ra khoảng 20-30 phút
        </Typography.Text>
      </div>
      <Card>
        <Row align="bottom" gutter={[12, 12]}>
          <Col xs={24} sm={12} md={3}>
            <Upload
              customRequest={handleCustomRequest}
              showUploadList={false}
              accept=".xlsx,.xls"
              style={{ width: "100%", display: "block" }}
            >
              <Button
                icon={<UploadOutlined />}
                loading={mutation.isPending}
                className="!w-full"
              >
                {mutation.isPending ? "Đang xử lý..." : "Import Excel"}
              </Button>
            </Upload>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select
              value={filterType}
              onChange={setFilterType}
              className="!w-full"
              options={[
                { value: "latest", label: "Latest" },
                { value: "dateRange", label: "Date Range" },
                { value: "all", label: "All" },
              ]}
            />
          </Col>
          {filterType === "dateRange" && (
            <>
              <Col xs={24} sm={12} md={3}>
                <DatePicker
                  placeholder="Từ ngày"
                  value={fromDate}
                  onChange={setFromDate}
                  className="!w-full"
                />
              </Col>
              <Col xs={24} sm={12} md={3}>
                <DatePicker
                  placeholder="Đến ngày"
                  value={toDate}
                  onChange={setToDate}
                  className="!w-full"
                />
              </Col>
            </>
          )}
          <Col xs={24} sm={12} md={3}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={exportLoading}
              className="!w-full"
            >
              {exportLoading ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default KiemTraDuLieuTotNghiep;
