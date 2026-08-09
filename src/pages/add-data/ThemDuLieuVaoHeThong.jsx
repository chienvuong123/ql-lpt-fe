import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Col, message, Modal, Row, Select, Upload } from "antd";
import { importCheckStudentExcel } from "../../apis/kiemTra";
import { SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { dongBoHocVienSql, dongBoKhoaHocSql, dongBoMaDkHocVienTH, dongBoXeGiaoVienSql, importXML } from "../../apis/apiSynch";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import { importHocBuExcel } from "../../apis/apiHocbu";
import { importExcelGoogleSheetA1 } from "../../apis/apiGoogleSheetA1";
import { importExcelGoogleSheetData } from "../../apis/apiGoogleSheetData";
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

  const mutationImportXML = useMutation({
    mutationFn: ({ file, onProgress }) => {
      const username = sessionStorage.getItem("username") || sessionStorage.getItem("name") || "admin";
      return importXML(file, onProgress, username, username);
    },
    onSuccess: (res) => {
      const data = res?.data || {};
      message.success(data.message || "Import file XML thành công!");
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import file XML thất bại!");
    },
  });

  const handleCustomRequestXML = async ({ file, onProgress }) => {
    mutationImportXML.mutate({ file, onProgress });
  };

  // Mặc định lọc theo năm 2024 sẵn — người dùng không cần tự gõ, chỉ đổi khi muốn import năm khác.
  const DEFAULT_IMPORT_META = { sheetName: "", year: "2024" };

  const [importA1Meta, setImportA1Meta] = useState(DEFAULT_IMPORT_META);

  const mutationImportGoogleSheetA1 = useMutation({
    mutationFn: ({ file, onProgress }) => importExcelGoogleSheetA1(file, onProgress, importA1Meta),
    onSuccess: (res) => {
      const { total, inserted, updated, skipped, duplicateMaPhieuInFile } = res?.data?.data || {};
      let msg = `Import danh sách A1 thành công! Hợp lệ: ${total ?? 0} (thêm mới: ${inserted ?? 0}, cập nhật: ${updated ?? 0})`;
      if (skipped) msg += `, bỏ qua ${skipped} dòng thiếu thông tin`;
      if (duplicateMaPhieuInFile) msg += `, ${duplicateMaPhieuInFile} dòng trùng mã phiếu trong file`;
      message.success(msg);
      setImportA1Meta(DEFAULT_IMPORT_META);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import danh sách A1 thất bại!");
      setImportA1Meta(DEFAULT_IMPORT_META);
    },
  });

  const handleCustomRequestGoogleSheetA1 = async ({ file, onProgress }) => {
    mutationImportGoogleSheetA1.mutate({ file, onProgress });
  };

  const [importOtoMeta, setImportOtoMeta] = useState(DEFAULT_IMPORT_META);

  const mutationImportGoogleSheetData = useMutation({
    mutationFn: ({ file, onProgress }) => importExcelGoogleSheetData(file, onProgress, importOtoMeta),
    onSuccess: (res) => {
      const count = res?.data?.count ?? 0;
      message.success(`Import danh sách học viên (ô tô) thành công! ${count} bản ghi.`);
      setImportOtoMeta(DEFAULT_IMPORT_META);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import danh sách học viên (ô tô) thất bại!");
      setImportOtoMeta(DEFAULT_IMPORT_META);
    },
  });

  const handleCustomRequestGoogleSheetData = async ({ file, onProgress }) => {
    mutationImportGoogleSheetData.mutate({ file, onProgress });
  };

  const mutationSyncMaDkTH = useMutation({
    mutationFn: () => dongBoMaDkHocVienTH(),
    onSuccess: (res) => {
      const applied = res?.applied ?? 0;
      const total = res?.totalChanges ?? 0;
      const failed = res?.failed ?? 0;
      message.success(
        `Đồng bộ mã ĐK học viên TH thành công: ${applied}/${total} học viên` +
        (failed ? `, ${failed} lỗi` : "")
      );
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Đồng bộ mã ĐK học viên TH thất bại!");
    },
  });

  const handleSyncMaDkTH = () => {
    Modal.confirm({
      title: "Xác nhận đồng bộ mã ĐK học viên TH",
      content:
        "Hệ thống sẽ đối chiếu CCCD + khóa học với dữ liệu từ hệ TH rồi cập nhật mã ĐK mới cho học viên trên toàn bộ hệ thống. Thao tác không thể hoàn tác, bạn có chắc chắn muốn tiếp tục?",
      okText: "Đồng bộ",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => mutationSyncMaDkTH.mutate(),
    });
  };

  return (
    <div>
      <div className="mx-auto mb-5">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Thêm dữ liệu vào hệ thống
        </h1>
      </div>
      <Row gutter={[16, 16]}>
        {/* <Col xs={24} md={6}>
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
        </Col> */}

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
                className="!w-full !mt-10"
                type="primary"
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

        <Col xs={24} md={6}>
          <Card className="h-full" title="Import XML học viên">
            <span className="block mb-4 text-gray-500">
              Nhập dữ liệu học viên từ file XML vào hệ thống
            </span>
            <div className="mt-14">
              <Upload
                customRequest={handleCustomRequestXML}
                showUploadList={false}
                accept=".xml"
                className="!w-full"
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={mutationImportXML.isPending}
                  className="!w-full"
                  type="primary"
                >
                  {mutationImportXML.isPending ? "Đang import..." : "Import XML"}
                </Button>
              </Upload>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Import danh sách A1">
            <span className="block mb-2 text-gray-500">
              Nhập danh sách học viên đăng ký A1 từ file Excel vào bảng riêng
            </span>
            <Input
              placeholder="Tên sheet (bỏ trống = đọc hết các sheet)"
              value={importA1Meta.sheetName}
              onChange={(e) => setImportA1Meta((p) => ({ ...p, sheetName: e.target.value }))}
              className="!mb-2"
            />
            <Input
              placeholder="Chỉ lấy năm (mặc định 2024, bỏ trống = lấy hết)"
              value={importA1Meta.year}
              onChange={(e) => setImportA1Meta((p) => ({ ...p, year: e.target.value }))}
              className="!mb-3"
            />
            <Upload
              customRequest={handleCustomRequestGoogleSheetA1}
              showUploadList={false}
              accept=".xlsx, .xls"
              className="!w-full"
            >
              <Button
                icon={<UploadOutlined />}
                loading={mutationImportGoogleSheetA1.isPending}
                className="!w-full"
                type="primary"
              >
                {mutationImportGoogleSheetA1.isPending ? "Đang import..." : "Import Excel"}
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Import danh sách học viên (ô tô)">
            <span className="block mb-2 text-gray-500">
              Nhập danh sách học viên từ file Excel vào bảng google_sheet_data
            </span>
            <Input
              placeholder="Tên sheet (bỏ trống = đọc hết các sheet)"
              value={importOtoMeta.sheetName}
              onChange={(e) => setImportOtoMeta((p) => ({ ...p, sheetName: e.target.value }))}
              className="!mb-2"
            />
            <Input
              placeholder="Chỉ lấy năm (mặc định 2024, bỏ trống = lấy hết)"
              value={importOtoMeta.year}
              onChange={(e) => setImportOtoMeta((p) => ({ ...p, year: e.target.value }))}
              className="!mb-3"
            />
            <Upload
              customRequest={handleCustomRequestGoogleSheetData}
              showUploadList={false}
              accept=".xlsx, .xls"
              className="!w-full"
            >
              <Button
                icon={<UploadOutlined />}
                loading={mutationImportGoogleSheetData.isPending}
                className="!w-full"
                type="primary"
              >
                {mutationImportGoogleSheetData.isPending ? "Đang import..." : "Import Excel"}
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="h-full" title="Đồng bộ mã ĐK học viên TH">
            <span className="block mb-4 text-gray-500">
              Đối chiếu CCCD + khóa học với hệ TH (tài khoản mới) và cập nhật mã ĐK mới cho học viên trên toàn hệ thống.
            </span>
            <div className="mt-14">
              <Button
                icon={<SyncOutlined />}
                onClick={handleSyncMaDkTH}
                loading={mutationSyncMaDkTH.isPending}
                className="!w-full"
                type="primary"
                danger
              >
                {mutationSyncMaDkTH.isPending ? "Đang đồng bộ..." : "Đồng bộ"}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ThemDuLieuVaoHeThong;
