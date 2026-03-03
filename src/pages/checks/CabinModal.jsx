import React from "react";
import { Card, Col, Empty, Modal, Row, Space, Typography } from "antd";

const { Paragraph, Text } = Typography;

const CabinModal = ({ open, onCancel, loading, cabinGroupedByRule }) => {
  return (
    <Modal
      title="Thông tin bài thi CABIN đã học"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={430}
    >
      {loading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : cabinGroupedByRule.some((item) => item.learnedMinutes > 0) ? (
        <Space direction="vertical" className="!w-full" size={8}>
          {cabinGroupedByRule.map((item) => {
            const learnedMinutes = Math.round(item.learnedMinutes);
            const isPass = learnedMinutes >= item.passMinutes;

            return (
              <Card
                key={item.key}
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
                      {item.label}
                    </Text>
                    <Text className="!text-xs !text-slate-400 !mt-0.5 block">
                      ⏱ {learnedMinutes} phút học
                    </Text>
                  </Col>
                  <Col flex="none">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${
                          isPass
                            ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                            : "bg-red-100 text-red-600 ring-1 ring-red-200"
                        }
                      `}
                    >
                      {isPass ? "✓ Đạt" : "✗ Chưa đạt"}
                    </span>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      ) : (
        <Empty description="Không có dữ liệu CABIN" />
      )}
    </Modal>
  );
};

export default CabinModal;
