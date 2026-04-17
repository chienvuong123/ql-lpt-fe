import React, { useMemo } from "react";
import { Modal, Table, Card, Row, Col, Image, Tag, Typography, Space, Flex } from "antd";
import { CheckCircleFilled, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRankCabinLesson } from "../../util/helper";

const { Text, Title } = Typography;

const CabinDetailModal = ({ visible, onClose, data }) => {
  const student = data?.student;
  const cabinSessions = data?.cabinDetails || [];

  const columns = [
    {
      title: "Tên bài học",
      dataIndex: "ten_bai",
      key: "ten_bai",
      width: "55%",
      render: (text) => <Text className="!text-sm">{text || "-"}</Text>,
    },
    {
      title: "Số phút",
      dataIndex: "tong_phut",
      key: "tong_phut",
      align: "center",
      width: "20%",
      render: (val) => <span >{val || 0} phút</span>,
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center",
      width: "25%",
      render: (_, record) => (
        record.tong_phut > 0 ? (
          <Space>
            <CheckCircleFilled className="!text-green-600" />
            <span className="text-green-600 text-xs font-semibold">Đạt</span>
          </Space>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )
      ),
    },
  ];

  const dataSource = useMemo(() => {
    const sortedSessions = [...cabinSessions].sort((a, b) => {
      return getRankCabinLesson(a.ten_bai) - getRankCabinLesson(b.ten_bai);
    });

    return sortedSessions.map((item, index) => ({
      ...item,
      key: item.SessionId || index,
    }));
  }, [cabinSessions]);
  console.log(data);

  return (
    <Modal
      title="Chi tiết học Cabin"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      closeIcon={<CloseOutlined />}
      centered
    >
      <Card className="!mt-4 !shadow-none !border-none" bodyStyle={{ padding: 0 }}>
        <Row gutter={[24, 24]}>
          {/* Sidebar Trái: Thông tin học viên và thống kê */}
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
              <Row>
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
                    <span> Ngày sinh: <Text strong className="!text-sm">{dayjs(student?.ngay_sinh).format("DD/MM/YYYY") || "-"}</Text></span>
                  </Flex>
                </Col>
              </Row>

              <div className="!space-y-3">
                <div className="!grid !grid-cols-2 !gap-3 !pt-2">
                  <div className="!bg-white !p-3 !rounded-lg !border !border-gray-100 !text-center">
                    <Text className="block text-gray-400 text-[10px] uppercase">Tổng phút</Text>
                    <Text strong className="text-lg text-orange-500">{data?.tong_thoi_gian || 0}</Text>
                  </div>
                  <div className="!bg-white !p-3 !rounded-lg !border !border-gray-100 !text-center">
                    <Text className="block text-gray-400 text-[10px] uppercase">Số bài học</Text>
                    <Text strong className="text-lg text-blue-500">{data?.tong_bai || 0}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Nội dung Phải: Danh sách bài học */}
          <Col span={15}>
            <Title level={5} className="!mb-4 !text-[#3366cc]">Danh sách bài học Cabin</Title>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              size="small"
              bordered
              className="table-blue-header"
              scroll={false}
            />
          </Col>
        </Row>
      </Card>

      <div className="text-center text-xs text-gray-400 pb-2 mt-6">
        (c) 2026 Lap Phuong Thanh. Source Technology Department.
      </div>
    </Modal>
  );
};

export default CabinDetailModal;
