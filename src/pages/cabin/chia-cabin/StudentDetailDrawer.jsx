import { Drawer } from "antd";

const StudentDetailDrawer = ({ studentDetail, setStudentDetail }) => {
  return (
    <Drawer
      title="Thông tin học viên"
      placement="right"
      onClose={() => setStudentDetail(null)}
      open={!!studentDetail}
    >
      {studentDetail && (
        <div className="space-y-6">
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Mã học viên</label>
                <p className="text-2xl font-bold text-blue-600">
                  {studentDetail.code}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Tên học viên</label>
                <p className="text-xl font-semibold">{studentDetail.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-600">Khóa học</label>
                  <p>{studentDetail.course}</p>
                </div>

                <div>
                  <label className="text-gray-600">Giảng viên</label>
                  <p>{studentDetail.instructor}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default StudentDetailDrawer;
