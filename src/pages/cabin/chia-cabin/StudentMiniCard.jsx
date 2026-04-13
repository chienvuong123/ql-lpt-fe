import { Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const StudentMiniCard = ({ student, onRemove, onViewDetail, isDragging }) => (
  <div
    className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${isDragging
      ? "opacity-40 border-blue-300 bg-blue-50"
      : "border-gray-100 bg-white hover:border-blue-200"
      }`}
  >
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-gray-800 text-xs truncate">
        {student.ho_ten}
      </div>
      <div className="text-[11px] text-gray-500">Mã: {student.ma_dk}</div>
      <div className="flex gap-1 mt-1 flex-wrap">
        {student.so_bai_hoc !== null && (
          <Tag color="blue" className="!text-[10px] !px-1 !py-0 !m-0">
            Bài {student.so_bai_hoc}
          </Tag>
        )}
        {student.hang_xe && (
          <Tag
            color={student.hang_xe === "B1" ? "magenta" : "geekblue"}
            className="!text-[10px] !px-1 !py-0 !m-0"
          >
            Hạng {student.hang_xe}
          </Tag>
        )}
        {student.khoa_hoc && (
          <Tag color="default" className="!text-[10px] !px-1 !py-0 !m-0">
            {student.khoa_hoc}
          </Tag>
        )}
        {student.phut_cabin !== null && (
          <Tag color="cyan" className="!text-[10px] !px-1 !py-0 !m-0">
            {student.phut_cabin} ph
          </Tag>
        )}
        {student.loai_ly_thuyet && (
          <Tag color="purple" className="!text-[10px] !px-1 !py-0 !m-0">
            LT
          </Tag>
        )}
        {student.loai_het_mon && (
          <Tag color="gold" className="!text-[10px] !px-1 !py-0 !m-0">
            HM
          </Tag>
        )}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 truncate">
        GV: {student.giao_vien}
      </div>
    </div>
    <div className="flex flex-col gap-1 items-end flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail(student);
        }}
        className="text-blue-500 hover:text-blue-700 text-[11px] underline whitespace-nowrap"
      >
        Chi tiết
      </button>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-red-400 hover:text-red-600"
        >
          <DeleteOutlined style={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  </div>
);

export default StudentMiniCard;
