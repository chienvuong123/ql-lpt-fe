import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Col, message, Row, Select, Upload } from "antd";
import { importCheckStudentExcel } from "../../apis/kiemTra";
import { SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { dongBoHocVienSql, dongBoKhoaHocSql, dongBoXeGiaoVienSql } from "../../apis/apiSynch";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import { importHocBuExcel } from "../../apis/apiHocbu";
import { useState } from "react";
import { Input } from "antd";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const ThemDuLieuVaoHeThong = () => {
  const [enrolmentPlanIid, setEnrolmentPlanIid] = useState([]);

  const mutation = useMutation({
    mutationFn: ({ file }) => importCheckStudentExcel(file),
    onSuccess: (res) => {
      const details = res?.details || {};
      message.success(
        `Import thành công: ${details.totalProcessed || 0} bản ghi (Thêm mới: ${details.insertedCount || 0
        }, Cập nhật: ${details.modifiedCount || 0})`,
      );
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import thất bại!");
    },
  });

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["optionLopLyThuyet"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 5,
  });

  const courseOptions = normalizeApiList(dataKhoaHoc).map((item) => ({
    label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
    value: item?.iid,
  }));

  const mutationSyncHocVien = useMutation({
    mutationFn: (iid) => dongBoHocVienSql({ enrolmentPlanIid: iid }),
    onSuccess: () => {
      message.success("Đồng bộ dữ liệu học viên thành công!");
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Đồng bộ học viên thất bại!");
    },
  });

  const mutationSyncKhoaHoc = useMutation({
    mutationFn: () => dongBoKhoaHocSql(),
    onSuccess: () => {
      message.success("Đồng bộ dữ liệu khóa học thành công!");
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Đồng bộ khóa học thất bại!");
    },
  });

  const mutationSyncXeGiaoVien = useMutation({
    mutationFn: ({ file, onProgress }) => dongBoXeGiaoVienSql(file, onProgress),
    onSuccess: () => {
      message.success("Đồng bộ dữ liệu xe & giáo viên thành công!");
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Đồng bộ thất bại!");
    },
  });

  const [importHocBuMeta, setImportHocBuMeta] = useState({ loai: "ly_thuyet", khoa_bu: "" });

  const mutationImportHocBu = useMutation({
    mutationFn: ({ file }) => importHocBuExcel(file, importHocBuMeta),
    onSuccess: (res) => {
      const stats = res?.stats || {};
      message.success(`Đã import học bù: Thành công ${stats.savedSuccess || 0}/${stats.totalUploaded || 0} dòng.`);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import học bù thất bại!");
    }
  });

  const handleCustomRequestHocBu = async ({ file }) => {
    mutationImportHocBu.mutate({ file });
  };

  const handleCustomRequest = async ({ file }) => {
    mutation.mutate({ file });
  };

  const handleCustomRequestSync = async ({ file, onProgress }) => {
    mutationSyncXeGiaoVien.mutate({ file, onProgress });
  };

  return (
    <div>
      <div className="mx-auto mb-5">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Thêm dữ liệu vào hệ thống
        </h1>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="h-full" title="Thêm dữ liệu xe, giáo viên">
            <span className="block mb-4 text-gray-500">
              Nhập dữ liệu từ file Excel vào hệ thống
            </span>
            <Upload
              customRequest={handleCustomRequest}
              showUploadList={false}
              accept=".xlsx, .xls"
              className="!w-full"
            >
              <Button
                icon={<UploadOutlined />}
                loading={mutation.isPending}
                className="!w-full"
                type="primary"
              >
                {mutation.isPending ? "Đang xử lý..." : "Import Excel"}
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Thêm đăng kí xe, giáo viên">
            <span className="block mb-4 text-gray-500">
              Đồng bộ dữ liệu đăng kí xe và giáo viên từ SQL
            </span>
            <Upload
              customRequest={handleCustomRequestSync}
              showUploadList={false}
              accept=".xlsx, .xls"
              className="!w-full"
            >
              <Button
                icon={<UploadOutlined />}
                loading={mutationSyncXeGiaoVien.isPending}
                className="!w-full"
                type="primary"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                {mutationSyncXeGiaoVien.isPending ? "Đang xử lý..." : "Đồng bộ SQL"}
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Đồng bộ dữ liệu học viên">
            <span className="block mb-2 text-gray-500">Chọn khóa học</span>
            <Select
              className="w-full !mb-4"
              placeholder="Chọn khóa học"
              loading={isLoadingKhoaHoc}
              options={courseOptions}
              value={enrolmentPlanIid}
              onChange={(val) => setEnrolmentPlanIid(val)}
              mode="multiple"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
            <Button
              icon={<SyncOutlined />}
              onClick={() => mutationSyncHocVien.mutate(enrolmentPlanIid)}
              loading={mutationSyncHocVien.isPending}
              disabled={!enrolmentPlanIid || enrolmentPlanIid.length === 0}
              className="!w-full"
              type="primary"
            >
              Đồng bộ dữ liệu
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Đồng bộ dữ liệu khóa học">
            <span className="block mb-4 text-gray-500">
              Đồng bộ tất cả dữ liệu khóa học từ hệ thống SQL
            </span>
            <div className="mt-14">
              <Button
                icon={<SyncOutlined />}
                onClick={() => mutationSyncKhoaHoc.mutate()}
                loading={mutationSyncKhoaHoc.isPending}
                className="!w-full"
                type="primary"
              >
                Đồng bộ dữ liệu
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Import học viên học bù">
            <span className="block mb-2 text-gray-500">
              Loại hình học bù
            </span>
            <Select
              value={importHocBuMeta.loai}
              onChange={(v) => setImportHocBuMeta(p => ({ ...p, loai: v }))}
              className="w-full !mb-3"
              options={[
                { value: "ly_thuyet", label: "Lý thuyết" },
                { value: "cabin", label: "Thực hành Cabin" },
                { value: "dat", label: "Thực hành DAT" }
              ]}
            />
            <Upload
              customRequest={handleCustomRequestHocBu}
              showUploadList={false}
              accept=".xlsx, .xls"
              className="!w-full"
            >
              <Button
                icon={<UploadOutlined />}
                loading={mutationImportHocBu.isPending}
                className="!w-full"
                type="primary"
                danger
              >
                {mutationImportHocBu.isPending ? "Đang nhập..." : "Tải file Excel"}
              </Button>
            </Upload>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ThemDuLieuVaoHeThong;
