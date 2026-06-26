import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Modal,
  Table,
  Input,
  Button,
  Collapse,
  Row,
  Col,
  Spin,
  Empty
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import { getTienDoChiTietDaoTao } from "../../apis/apiTienDoDaoTao";
import HocVienInfo from "../../components/HocVienInfor";

const { Panel } = Collapse;

const SearchPanel = React.memo(({ onSearch, onReset }) => {
  const [searchText, setSearchText] = useState("");
  const [teacherSearchText, setSearchTeacherText] = useState("");

  const handleSearch = () => {
    onSearch({ student: searchText.trim(), teacher: teacherSearchText.trim() });
  };

  const handleReset = () => {
    setSearchText("");
    setSearchTeacherText("");
    onReset();
  };

  return (
    <Row gutter={[12, 12]} className="mb-6">
      <Col xs={24} sm={10}>
        <Input
          placeholder="Tìm tên học viên, mã hoặc CCCD..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          className="w-full"
        />
      </Col>
      <Col xs={24} sm={9}>
        <Input
          placeholder="Tìm tên giáo viên..."
          value={teacherSearchText}
          onChange={(e) => setSearchTeacherText(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          className="w-full"
        />
      </Col>
      <Col xs={24} sm={5} className="flex gap-2">
        <Button type="primary" onClick={handleSearch} className="!bg-[#3366cc] w-[46%] !mr-3">
          Tìm kiếm
        </Button>
        <Button onClick={handleReset} className="w-[46%]">Bỏ lọc</Button>
      </Col>
    </Row>
  );
});

export default function ModalChiTietDaoTao({ visible, record, onCancel }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Reset search query and page when modal is closed
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setTeacherSearchQuery("");
      setPage(1);
    }
  }, [visible]);

  // React Query to fetch all training progress details of the course (limit 9999)
  const { data: resData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["tienDoChiTietDaoTao", record, searchQuery, teacherSearchQuery],
    queryFn: () => getTienDoChiTietDaoTao({
      ma_khoa: record?.ma_khoa,
      page: 1,
      limit: 9999,
      search: searchQuery,
      giao_vien: teacherSearchQuery,
    }),
    enabled: visible && !!record,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true
  });

  const rawData = useMemo(() => {
    if (!resData) return [];
    return resData.data || resData.result || [];
  }, [resData]);

  // Filter teacher groups on Front End by teacher name
  const filteredData = useMemo(() => {
    if (!teacherSearchQuery) return rawData;
    const searchLower = teacherSearchQuery.toLowerCase().trim();
    return rawData.filter((item) =>
      (item.giao_vien || "").toLowerCase().includes(searchLower)
    );
  }, [rawData, teacherSearchQuery]);

  // Paginate filtered teacher groups on Front End
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, limit]);

  const totalTeachers = filteredData.length;

  const totalStudentsCount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.hoc_vien || []).length, 0);
  }, [filteredData]);

  const columns = useMemo(() => [
    {
      title: "Học viên",
      key: "hoc_vien",
      render: (_, student) => <HocVienInfo record={student} />,
      width: 320
    },
    {
      title: "Hạng",
      key: "hang",
      render: (_, student) => <span>{student.hang}</span>,
      width: 60,
      align: "center"
    },
    {
      title: "Xe",
      key: "hang_xe",
      render: (_, student) => {
        const isB1Only = (hang) => {
          if (!hang) return false;
          const normalized = hang.toString().trim().toUpperCase().replace(/[\s\.]/g, '');
          return normalized === 'B1' || normalized === 'B01';
        };

        const plates = [];
        if (isB1Only(student.hang)) {
          if (student.xe_b1) plates.push(student.xe_b1);
        } else {
          if (student.xe_b1) plates.push(student.xe_b1);
          if (student.xe_b2) plates.push(student.xe_b2);
        }

        return (
          <div>
            {plates.length > 0 ? (
              <span>
                {plates.join(" / ")}
              </span>
            ) : (
              <span className="text-gray-400 italic">Chưa đăng ký</span>
            )}
          </div>
        );
      },
      width: 80,
      align: "center"
    },
    {
      title: "Lý thuyết",
      key: "ly_thuyet",
      render: (_, student) => {
        const lt = student.tien_do?.ly_thuyet || {};
        return lt.dat ? (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "18px" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
        );
      },
      width: 80,
      align: "center"
    },
    {
      title: "Cabin",
      key: "cabin",
      render: (_, student) => {
        const cb = student.tien_do?.cabin || {};
        return cb.dat ? (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "18px" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
        );
      },
      width: 80,
      align: "center"
    },
    {
      title: "Tổng km",
      key: "dat_km",
      render: (_, student) => {
        const dat = student.tien_do?.dat || {};
        return <span>{dat.tong_km || 0} km</span>;
      },
      width: 90,
      align: "center"
    },
    {
      title: "Tổng thời gian",
      key: "dat_time",
      render: (_, student) => {
        const dat = student.tien_do?.dat || {};
        return <span className="text-gray-700">{dat.tong_thoi_gian || "0h 00'"}</span>;
      },
      width: 90,
      align: "center"
    },
  ], []);

  return (
    <Modal
      title={
        <div className="text-lg font-bold text-gray-800 border-b pb-3 mr-6">
          Chi Tiết Tiến Độ Đào Tạo - Khóa <span >{record?.ten_khoa}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel} className="!bg-[#3366cc]">
          Đóng
        </Button>
      ]}
      width="60vw"
      style={{ top: 30 }}
      bodyStyle={{ height: "calc(100vh - 220px)", overflowY: "auto", padding: "12px 24px" }}
    >
      <Spin spinning={isLoading || isFetching} tip="Đang tải dữ liệu tiến độ chi tiết...">
        {/* Statistics and Filter Panel */}
        <SearchPanel
          key={record?.ma_khoa || "search"}
          onSearch={({ student, teacher }) => {
            setSearchQuery(student);
            setTeacherSearchQuery(teacher);
            setPage(1);
          }}
          onReset={() => {
            setSearchQuery("");
            setTeacherSearchQuery("");
            setPage(1);
          }}
        />

        {/* Details Accordion grouped by Teacher */}
        {paginatedData.length > 0 ? (
          <Collapse
            defaultActiveKey={paginatedData.map((_, i) => String(i))}
            expandIconPosition="right"
          >
            {paginatedData.map((teacherData, index) => {
              const teacherName = teacherData.giao_vien || "Chưa phân công";
              const students = teacherData.hoc_vien || [];
              const datCount = students.filter(
                (st) =>
                  st.tien_do?.ly_thuyet?.dat &&
                  st.tien_do?.cabin?.dat &&
                  st.tien_do?.dat?.dat
              ).length;

              return (
                <Panel
                  key={String(index)}
                  header={
                    <div className="flex items-center justify-between w-[97%] py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-base">
                          Giáo viên: {teacherName}
                        </span>
                      </div>
                    </div>
                  }
                  className="bg-white border-b border-gray-100 last:border-b-0"
                >
                  <Table
                    dataSource={students}
                    columns={columns}
                    rowKey="ma_dk"
                    pagination={false}
                    bordered
                    size="small"
                    className="table-blue-header"
                    scroll={{ x: 1000 }}
                  />
                </Panel>
              );
            })}
          </Collapse>
        ) : (
          <Empty description="Không tìm thấy thông tin tiến độ đào tạo chi tiết của khóa" className="py-10" />
        )}

        {/* Modal Pagination */}
        {rawData.length > 0 && (
          <div className="flex justify-end mt-4 items-center">
            <span className="text-gray-500 mr-4 text-sm">
              Tổng số học viên: <strong>{totalStudentsCount}</strong> | Giáo viên: <strong>{totalTeachers}</strong>
            </span>
            {totalTeachers > limit && (
              <div className="inline-flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  size="small"
                >
                  Trước
                </Button>
                <span className="px-3 py-1 bg-gray-100 border rounded text-xs font-semibold">
                  Trang {page} / {Math.ceil(totalTeachers / limit)}
                </span>
                <Button
                  disabled={page >= Math.ceil(totalTeachers / limit)}
                  onClick={() => setPage((p) => p + 1)}
                  size="small"
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        )}
      </Spin>
    </Modal>
  );
}
