import React, { useMemo } from "react";
import { Modal, Table, Card, Row, Col, Image, Tag, Typography, Space, Flex, Spin } from "antd";
import { CheckCircleFilled, CloseCircleFilled, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuLyThuyetDetail } from "../../apis/apiHocbu";

const { Text, Title } = Typography;

const TheoryDetailModal = ({ visible, onClose, ma_dk }) => {
  const { data: detailData, isLoading } = useQuery({
    queryKey: ["hocVienHocBuLyThuyetDetail", ma_dk],
    queryFn: () => getDanhSachHocVienHocBuLyThuyetDetail({ ma_dk }),
    enabled: !!visible && !!ma_dk,
  });

  const student = detailData?.data?.student || detailData?.student;
  const scoreByRubrik = detailData?.data?.scoreByRubrik || detailData?.scoreByRubrik || [];

  const columns = [
    {
      title: "Tên bài học",
      dataIndex: "name",
      key: "name",
      width: "60%",
      render: (text) => <Text className="!text-sm">{text || "-"}</Text>,
    },
    {
      title: "Điểm",
      dataIndex: "score",
      key: "score",
      align: "center",
      width: "20%",
      render: (val) => <span className="font-bold text-blue-600">{val ?? 0}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "passed",
      key: "passed",
      align: "center",
      width: "20%",
      render: (passed) => (
        passed ? (
          <Space>
            <CheckCircleFilled className="!text-green-600 text-lg" />
            <Text className="text-green-600 !text-xs !font-medium">Đạt</Text>
          </Space>
        ) : (
          <Space>
            <CloseCircleFilled className="!text-red-500 text-lg" />
            <Text className="text-red-500 !text-xs !font-medium">Trượt</Text>
          </Space>
        )
      ),
    },
  ];

  const dataSource = useMemo(() => {
    return scoreByRubrik
      .filter((item) => !String(item?.name || "").includes("Pháp luật GTĐB"))
      .map((item, index) => ({
        ...item,
        key: item.iid || index,
      }));
  }, [scoreByRubrik]);

  return (
    <Modal
      title="Chi tiết học Lý thuyết"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      closeIcon={<CloseOutlined />}
      centered
    >
      <Spin spinning={isLoading}>
        <Card className="!mt-4 !shadow-none !border-none" bodyStyle={{ padding: 0 }}>
          <Row gutter={[24, 24]}>
            {/* Sidebar Trái: Thông tin học viên */}
            <Col span={9}>
              <Title level={5} className="!mb-4 !text-[#3366cc]">
                Thông tin học viên{" "}
                <Typography.Text
                  italic
                  className="!text-gray-400"
                  copyable={{ text: student?.ma_dk }}
                >
                  (#{student?.ma_dk})
                </Typography.Text>
              </Title>
              <div className="!bg-gray-50 !p-4 !rounded-xl !border !border-gray-100">
                <Row gutter={16}>
                  <Col span={9}>
                    <Image
                      src={student?.anh}
                      className="!rounded-lg !border-2 !border-white !shadow-md"
                      width={130}
                      height={150}
                      fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
                    />
                  </Col>
                  <Col span={15}>
                    <Flex vertical gap={4}>
                      <span> Họ tên: <Text strong className="!text-sm">{student?.ho_ten || "-"}</Text></span>
                      <span> Tên khóa: <Text strong className="!text-sm">{student?.ten_khoa || "-"}</Text></span>
                      <span> Hạng: <Text strong className="!text-sm">{student?.hang || "-"}</Text></span>
                      <span> Giáo viên: <Text strong className="!text-sm">{student?.thay_giao || "-"}</Text></span>
                      <span> CCCD: <Text strong className="!text-sm">{student?.cccd || "-"}</Text></span>
                      <span> Ngày sinh: <Text strong className="!text-sm">{student?.ngay_sinh ? dayjs(student.ngay_sinh).format("DD/MM/YYYY") : "-"}</Text></span>
                    </Flex>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Nội dung Phải: Điểm số các môn */}
            <Col span={15}>
              <Title level={5} className="!mb-4 !text-[#3366cc]">Kết quả học tập Lý thuyết</Title>
              <Table
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                size="small"
                bordered
                className="table-blue-header"
                scroll={{ y: 500 }}
              />
            </Col>
          </Row>
        </Card>
      </Spin>

      <div className="text-center text-xs text-gray-400 pb-2 mt-6">
        (c) 2026 Lap Phuong Thanh. Source Technology Department.
      </div>
    </Modal>
  );
};

export default TheoryDetailModal;
