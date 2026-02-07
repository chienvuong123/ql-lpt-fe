import { Card, Button, Row, Col, Typography } from "antd";
import {
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  ApiOutlined,
  FileTextOutlined,
  TeamOutlined,
  CarOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const name = sessionStorage.getItem("name");

  const quickActions = [
    {
      title: "Mở báo cáo quá trình",
      icon: "📊",
      primary: true,
      navigate: "/tim-hoc-vien",
    },
    { title: "Báo cáo nhiều HV", icon: "📚", primary: false },
    { title: "Báo cáo A1", icon: "🚗", primary: false },
  ];

  const managementFeatures = [
    {
      icon: <UserOutlined className="text-xs" />,
      title: "Quản lý người dùng",
      description: "Thêm, sửa, xóa, đổi mật khẩu, phân quyền và ép đăng xuất.",
      bgColor: "bg-gray-800",
      textColor: "text-white",
    },
    // {
    //   icon: <BookOutlined className="text-xs" />,
    //   title: "Lớp lý thuyết",
    //   description: "Đóng bỏ và quản lý danh sách lớp học lý thuyết.",
    //   bgColor: "bg-rose-500",
    //   textColor: "text-white",
    // },
    // {
    //   icon: <TeamOutlined className="text-xs" />,
    //   title: "Thành viên lớp LT",
    //   description: "Xem và tra cứu tình trạng tiến độ học lý thuyết.",
    //   bgColor: "bg-amber-500",
    //   textColor: "text-white",
    // },
    {
      icon: <BarChartOutlined className="text-xs" />,
      title: "Báo cáo quá trình",
      description: "Xem tiến độ đào tạo theo học viên, thời gian, tiêu chí.",
      bgColor: "bg-blue-500",
      textColor: "text-white",
      navigate: "/tim-hoc-vien",
    },
    // {
    //   icon: <FileTextOutlined className="text-xs" />,
    //   title: "Báo cáo nhiều học viên",
    //   description: "Đánh giá/báo cáo hàng loạt đã tiết kiệm thời gian.",
    //   bgColor: "bg-emerald-500",
    //   textColor: "text-white",
    // },
    // {
    //   icon: <CheckSquareOutlined className="text-xs" />,
    //   title: "Học viên đã ký DAT",
    //   description: "Danh sách tổng hợp trạng thái ký, ghi chú & CABIN.",
    //   bgColor: "bg-gray-100",
    //   textColor: "text-gray-700",
    // },
    // {
    //   icon: <CarOutlined className="text-xs" />,
    //   title: "Báo cáo A1",
    //   description:
    //     "Tổng hợp kết quả kỳ sát hạch A1 (LT/TH, Đô/Trượt, ảnh dự thi).",
    //   bgColor: "bg-rose-500",
    //   textColor: "text-white",
    // },
    {
      icon: "🚗",
      title: "Đồng bộ GV ↔ Xe",
      description: "Gán giáo viên hướng dẫn vào phương tiện đào tạo",
      bgColor: "bg-gray-200",
      textColor: "text-white",
      navigate: "/dong-bo-giao-vien-ve-xe",
    },
    {
      icon: "🎓",
      title: "Đồng bộ HV ↔ Xe",
      description: "Gán nhiều học viên (hoặc cả lớp) vào 1 xe.",
      bgColor: "bg-gray-300",
      textColor: "text-white",
      navigate: "/dong-bo-hoc-vien-ve-xe",
    },
  ];

  const quickLinks = [
    {
      title: "Đăng xuất",
      icon: <LogoutOutlined />,
      color: "border-rose-200 bg-rose-50 hover:bg-rose-100",
    },
    {
      title: "Người dùng",
      icon: "💎",
      color: "border-gray-200 bg-white hover:bg-gray-50",
    },
    // {
    //   title: "Lớp LT",
    //   icon: "🏫",
    //   color: "border-gray-200 bg-white hover:bg-gray-50",
    // },
    // {
    //   title: "Thành viên LT",
    //   icon: "🎓",
    //   color: "border-amber-200 bg-amber-50 hover:bg-amber-100",
    // },
    {
      title: "Báo cáo",
      icon: "💡",
      color: "border-gray-200 bg-white hover:bg-gray-50",
    },
    // {
    //   title: "Đã ký DAT",
    //   icon: "📋",
    //   color: "border-gray-200 bg-white hover:bg-gray-50",
    // },
    // {
    //   title: "1 Báo cáo A1",
    //   icon: "🆎",
    //   color: "border-rose-200 bg-rose-50 hover:bg-rose-100",
    // },
    // {
    //   title: "CABIN thiếu",
    //   icon: "🕐",
    //   color: "border-gray-200 bg-white hover:bg-gray-50",
    // },
    // {
    //   title: "Lịch CABIN",
    //   icon: "📅",
    //   color: "border-rose-200 bg-rose-50 hover:bg-rose-100",
    // },
    {
      title: "GV → Xe",
      icon: "🚗",
      color: "border-gray-200 bg-white hover:bg-gray-50",
    },
    {
      title: "HV → Xe",
      icon: "😊🎓",
      color: "border-gray-200 bg-white hover:bg-gray-50",
    },
  ];

  return (
    <div className="min-h-screen via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16} className="!space-y-4">
            <Card className="shadow-lg border-0 !rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Xin chào, {name}
                </h1>
                <span className="text-3xl">👋</span>
              </div>
              <p className="text-gray-600 mb-6">
                Chúc bạn một ngày làm việc hiệu quả.
              </p>

              <div className="flex flex-wrap gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    size="large"
                    className={`${
                      action.primary
                        ? "!bg-blue-500 !text-white  border-0"
                        : "bg-gray-50 hover:!bg-gray-100 text-gray-700 border-gray-200"
                    } h-auto py-3 px-5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200`}
                    onClick={() => navigate(action?.navigate)}
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span className="hidden sm:inline">{action.title}</span>
                  </Button>
                ))}
              </div>
            </Card>
            <Card className="shadow-lg border-0 !rounded-2xl ">
              <Title level={4} className="!mb-5">
                Tính năng quản trị
              </Title>
              <Row gutter={[16, 16]}>
                {managementFeatures.map((feature, index) => (
                  <Col
                    xs={24}
                    sm={8}
                    key={index}
                    onClick={() => navigate(feature?.navigate)}
                  >
                    <div className="group h-full hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 rounded-xl hover:-translate-y-1 bg-white p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`${feature.bgColor} ${feature.textColor} w-7 h-7 rounded-lg flex items-center justify-center shrink-0`}
                        >
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">
                            {feature.title}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-3">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
          <Col xs={0} lg={8}>
            <Card className="shadow-lg border-0 !rounded-2xl bg-white/90 backdrop-blur-sm h-full">
              <span className="text-xl font-medium">Tác vụ nhanh</span> <br />
              <span className="text-gray-500">
                Truy cập nhanh các thao tác phổ biến
              </span>
              <div className="grid grid-cols-2 gap-3 mt-7">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    className={`flex space-x-2 px-2 items-center border-1 border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left group`}
                  >
                    <div className="text-md md:text-lg mb-2">{link.icon}</div>
                    <div className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {link.title}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;
