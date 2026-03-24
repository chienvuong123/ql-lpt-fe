import { useMutation } from "@tanstack/react-query";
import { Button, Card, Col, message, Row, Upload } from "antd";
import { importCheckStudentExcel } from "../../apis/kiemTra";
import { UploadOutlined } from "@ant-design/icons";

const ThemDuLieuVaoHeThong = () => {
  const mutation = useMutation({
    mutationFn: ({ file }) => importCheckStudentExcel(file),

    onSuccess: (res) => {
      const details = res?.details || {};

      message.success(
        `Import thành công: ${details.totalProcessed || 0} bản ghi (Thêm mới: ${
          details.insertedCount || 0
        }, Cập nhật: ${details.modifiedCount || 0})`,
      );
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import thất bại!");
    },
  });
  const handleCustomRequest = async ({ file }) => {
    mutation.mutate({ file });
  };
  return (
    <div>
      <div className="mx-auto mb-5">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Thêm dữ liệu vào hệ thống
        </h1>
      </div>
      <Card>
        <Row align="bottom">
          <Col span={12}>
            <Col xs={24} sm={12} md={12}>
              <span className="mr-4">Thêm dữ liệu đăng ký xe, giáo viên</span>
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
                >
                  {mutation.isPending ? "Đang xử lý..." : "Import Excel"}
                </Button>
              </Upload>
            </Col>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ThemDuLieuVaoHeThong;
