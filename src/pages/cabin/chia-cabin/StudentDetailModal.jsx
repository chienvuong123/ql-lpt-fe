import React from "react";
import { Card, Col, Empty, Modal, Row, Space, Typography } from "antd";
import { GoClock } from "react-icons/go";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

const StudentDetailModal = ({ studentDetail, setStudentDetail }) => {
  if (!studentDetail) return null;

  return (
    <Modal
      title="Thông tin chi tiết học viên"
      open={!!studentDetail}
      onCancel={() => setStudentDetail(null)}
      footer={null}
      width={450}
    >
      <div className="space-y-4 mb-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Row gutter={[8, 4]}>
            <Col span={24}>
              <Text className="text-sm text-gray-500">Họ và tên:</Text>
              <Text strong className="ml-2 text-base text-blue-700 uppercase">
                {studentDetail.ho_ten}
              </Text>
            </Col>
            <Col span={24}>
              <Text className="text-sm text-gray-500">Mã ĐK:</Text>
              <Text strong className="ml-2">
                {studentDetail.ma_dk}
              </Text>
            </Col>
            <Col span={24}>
              <Text className="text-sm text-gray-500">Giáo viên:</Text>
              <Text strong className="ml-2">
                {studentDetail.giao_vien || studentDetail.instructor || "Chưa phân công"}
              </Text>
            </Col>
            <Col span={24}>
              <Text className="text-sm text-gray-500">Khóa:</Text>
              <Text strong className="ml-2">
                {studentDetail.khoa_hoc || "Chưa phân công"}
              </Text>
            </Col>
            <Col span={12}>
              <Text className="text-sm text-gray-500">Số bài: <Text strong>
                {studentDetail.bai_cabin || 0} bài
              </Text>

              </Text>
            </Col>
            <Col span={12}>
              <Text className="text-sm text-gray-500">Thời gian học: <Text strong>
                {studentDetail.phut_cabin || 0} phút
              </Text>
              </Text>
            </Col>
          </Row>
        </div>
      </div>

      <Text strong className="block mb-2">Chi tiết bài học CABIN</Text>

      {studentDetail.bai_hoc && studentDetail.bai_hoc.length > 0 ? (
        <Space direction="vertical" className="!w-full" size={8}>
          {[...studentDetail.bai_hoc]
            .sort((a, b) => {
              const getRank = (name = "") => {
                const n = name.toLowerCase();
                if (n.includes("đô thị")) return 1;
                if (n.includes("cao tốc")) return 2;
                if (n.includes("đồi núi")) return 3;
                if (n.includes("phà")) return 4;
                if (n.includes("lầy")) return 5;
                if (n.includes("ương mù") || n.includes("sương") || n.includes("xương")) return 6;
                if (n.includes("ngầm") || n.includes("nước ngập")) return 7;
                if (n.includes("tổng hợp")) return 8;
                return 99;
              };
              return getRank(a.ten_bai) - getRank(b.ten_bai);
            })
            .map((item, idx) => {
            const name = item.ten_bai || `Bài ${idx + 1}`;
            const time = item.tong_phut || 0;
            const isCaoToc = (name || "").toLowerCase().includes("cao tốc") || (name || "").toLowerCase().includes("cao toc");
            const passFlag = item.dat ?? item.isPass ?? item.dat_cabin ?? true;
            const isPass = isCaoToc ? (time >= 35 && passFlag) : passFlag;
            return (
              <Card
                key={idx}
                size="small"
                className="!rounded-xl !border-0 !shadow-sm hover:!shadow-md transition-shadow duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Row align="middle" justify="space-between" wrap={false}>
                  <Col flex="auto">
                    <Text
                      strong
                      className="!text-sm !text-slate-800 block leading-tight"
                    >
                      {name}
                    </Text>
                    <Text className="!text-xs !text-slate-400 !mt-0.5 flex items-center">
                      <GoClock className="mr-1 text-sm" /> {time} phút học
                    </Text>
                  </Col>
                  <Col flex="none">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${isPass
                          ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                          : "bg-red-100 text-red-600 ring-1 ring-red-200"
                        }
                      `}
                    >
                      {isPass ? (
                        <>
                          <CheckCircleFilled className="!text-green-600 !mr-1" />{" "}
                          Đạt
                        </>
                      ) : (
                        <>
                          <CloseCircleFilled className="!text-red-600 !mr-1" />{" "}
                          Chưa đạt
                        </>
                      )}
                    </span>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      ) : (
        <Empty description="Không có dữ liệu bài học CABIN" />
      )}
    </Modal>
  );
};

export default StudentDetailModal;
