import React, { useMemo, useRef, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Row,
  Col,
  Image,
  Spin,
  Card,
  Checkbox,
  message,
} from "antd";
import { useLocation } from "react-router-dom";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import StudentDetailModal from "./StudentDetailModal";
import {
  getHocVienCheck,
  hocVienTheoKhoa,
  updateHocVienCheck,
} from "../../apis/hocVien";
import { lopHocLyThuyet } from "../../apis/khoaHoc";
import { DangNhapLopLyThuyet } from "../../apis/auth";

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const QuanLyHocVienLyThuyet = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [select, setSelected] = useState({});
  const [selectedClassIid, setSelectedClassIid] = useState("");
  const [savingStudentCode, setSavingStudentCode] = useState("");
  const keywordInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [params, setParams] = useState({
    page: 1,
    text: "",
  });

  const location = useLocation();
  const { program_name, program_code, maKhoaHoc } = location?.state || {};

  const { data: loginData } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity,
    select: (data) => data?.result,
  });

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["lopHocLyThuyet", params],
    queryFn: () => lopHocLyThuyet(loginData, params),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const classOptions = useMemo(() => {
    const list = dataKhoaHoc?.result || [];
    return list.map((item) => ({
      label: item?.suffix_name || item?.name || `#${item?.iid}`,
      value: item?.iid,
    }));
  }, [dataKhoaHoc]);

  const activeClassIid = selectedClassIid || classOptions?.[0]?.value || "";

  const selectedClass = useMemo(() => {
    const list = dataKhoaHoc?.result || [];
    return list.find((item) => String(item?.iid) === String(activeClassIid));
  }, [dataKhoaHoc, activeClassIid]);

  const { data: danhSachHocVien = {}, isLoading: isLoadingHocVien } = useQuery({
    queryKey: ["danhSachHocVien", activeClassIid, params],
    queryFn: () => hocVienTheoKhoa(activeClassIid, params),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!activeClassIid,
  });

  const students = useMemo(() => {
    const list = danhSachHocVien?.result;
    return Array.isArray(list) ? list : [];
  }, [danhSachHocVien]);

  const getStudentCode = (record) =>
    String(
      record?.user?.admission_code || record?.user?.code || record?.id || "",
    );

  const isPassBaiHetMon = (record) => {
    const scoreByRubrik = record?.learning_progress?.score_by_rubrik || [];

    return scoreByRubrik.some((item) => {
      const name = normalizeText(item?.name || "");
      return name.includes("het mon") && Number(item?.passed) === 1;
    });
  };

  const studentCheckQueries = useQueries({
    queries: students.map((student) => {
      const studentCode = getStudentCode(student);

      return {
        queryKey: ["hocvien-check-theory", studentCode],
        queryFn: () => getHocVienCheck(studentCode),
        enabled: !!studentCode,
        staleTime: 1000 * 60 * 5,
        retry: false,
      };
    }),
  });

  const studentCheckMap = useMemo(() => {
    const result = {};

    students.forEach((student, index) => {
      const studentCode = getStudentCode(student);
      if (!studentCode) return;
      result[studentCode] = studentCheckQueries[index]?.data?.data || {};
    });

    return result;
  }, [studentCheckQueries, students]);

  const resolveCheckState = (record) => {
    const studentCode = getStudentCode(record);
    const savedData = studentCheckMap?.[studentCode] || {};
    const autoHetMon = isPassBaiHetMon(record);

    const lyThuyetChecked = Boolean(savedData?.ly_thuyet_checked);
    const hetMonChecked =
      savedData?.het_mon_checked === undefined
        ? autoHetMon
        : Boolean(savedData?.het_mon_checked);
    const cabinEligible = lyThuyetChecked && hetMonChecked;

    return {
      lyThuyetChecked,
      hetMonChecked,
      cabinEligible,
      autoHetMon,
    };
  };

  const { mutate: saveStudentCheck } = useMutation({
    mutationFn: ({ studentCode, payload }) => updateHocVienCheck(studentCode, payload),
    onSuccess: (_response, variables) => {
      queryClient.setQueryData(
        ["hocvien-check-theory", variables.studentCode],
        (old) => ({
          ...(old || {}),
          data: {
            ...(old?.data || {}),
            ...(variables?.payload || {}),
          },
        }),
      );
    },
    onError: (error) => {
      message.error(
        `Lưu trạng thái thất bại: ${error?.response?.data?.message || error?.message || "Có lỗi xảy ra"}`,
      );
    },
    onSettled: () => {
      setSavingStudentCode("");
    },
  });

  const handleToggleCheckbox = (record, fieldName, checkedValue) => {
    const studentCode = getStudentCode(record);
    if (!studentCode) {
      message.warning("Không tìm thấy mã học viên để lưu dữ liệu.");
      return;
    }

    const currentState = resolveCheckState(record);

    const nextState =
      fieldName === "ly_thuyet_checked"
        ? {
            ...currentState,
            lyThuyetChecked: checkedValue,
          }
        : {
            ...currentState,
            hetMonChecked: checkedValue,
          };

    const payload = {
      ly_thuyet_checked: nextState.lyThuyetChecked,
      het_mon_checked: nextState.hetMonChecked,
      cabin_eligible: nextState.lyThuyetChecked && nextState.hetMonChecked,
      auto_het_mon_passed: currentState.autoHetMon,
      class_iid: activeClassIid || null,
      student_code: studentCode,
      student_name: record?.user?.name || "",
    };

    setSavingStudentCode(studentCode);
    saveStudentCheck({ studentCode, payload });
  };

  const handleRowClick = (record) => {
    setSelected(record);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleFilter = () => {
    const text = keywordInputRef.current?.input?.value?.trim() || "";
    setParams({
      page: 1,
      text,
    });
  };

  const handleReset = () => {
    if (keywordInputRef.current?.input) {
      keywordInputRef.current.input.value = "";
    }
    setParams({
      page: 1,
      text: "",
    });
  };

  const getCompletionStats = (record) => {
    const scoreByRubrik = record?.learning_progress?.score_by_rubrik || [];

    const monHoc = scoreByRubrik.filter((mon) => {
      const name = normalizeText(mon?.name || "");
      return (
        !name.includes("bang tong hop") &&
        !name.includes("diem kiem tra tong hop") &&
        !name.includes("tong thoi gian hoc")
      );
    });

    const tongSoMon = monHoc.length;
    const soMonDat = monHoc.filter((mon) => Number(mon?.passed) === 1).length;
    const phanTramHoanThanh =
      tongSoMon > 0 ? Math.round((soMonDat / tongSoMon) * 100) : 0;

    return {
      soMonDat,
      tongSoMon,
      phanTramHoanThanh,
    };
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 35,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Học viên",
      dataIndex: "user",
      key: "user",
      width: 260,
      render: (user) => (
        <div className="flex items-center gap-2">
          <Image
            src={user?.avatar || user?.default_avatar}
            className="!h-11 !w-10.5 rounded-lg"
            alt="av"
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-600 text-sm">
              {user?.name || "-"}
            </span>
            <span className="text-xs text-gray-500">
              {user?.admission_code || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "CCCD",
      dataIndex: "user",
      key: "cccd",
      width: 120,
      align: "center",
      render: (user) => <span>{user?.identification_card || "-"}</span>,
    },
    {
      title: "Năm sinh",
      dataIndex: "user",
      key: "birth_year",
      width: 90,
      align: "center",
      render: (user) => <span>{user?.birth_year || "-"}</span>,
    },
    {
      title: "Khóa",
      width: 80,
      key: "khoa",
      align: "center",
      render: () => selectedClass?.name || program_code || "-",
    },
    {
      title: "Điều kiện học Cabin",
      key: "progress",
      width: 180,
      align: "center",
      render: (_, record) =>
        resolveCheckState(record).cabinEligible ? (
          <span className="text-green-600 font-medium">Đủ điều kiện</span>
        ) : (
          <span className="text-red-500 font-medium">Chưa đủ</span>
        ),
    },
    {
      title: "Loại lý thuyết",
      key: "passed_total",
      width: 120,
      align: "center",
      render: (_, record) => {
        const studentCode = getStudentCode(record);
        const checked = resolveCheckState(record).lyThuyetChecked;

        return (
          <Checkbox
            checked={checked}
            disabled={savingStudentCode === studentCode}
            onChange={(e) =>
              handleToggleCheckbox(record, "ly_thuyet_checked", e.target.checked)
            }
          />
        );
      },
    },
    {
      title: "Loại hết môn",
      dataIndex: "__expand",
      key: "last_login",
      width: 150,
      align: "center",
      render: (_, record) => {
        const studentCode = getStudentCode(record);
        const checked = resolveCheckState(record).hetMonChecked;

        return (
          <Checkbox
            checked={checked}
            disabled={savingStudentCode === studentCode}
            onChange={(e) =>
              handleToggleCheckbox(record, "het_mon_checked", e.target.checked)
            }
          />
        );
      },
    },
    {
      title: "Cabin",
      key: "updated_ts",
      width: 130,
      align: "center",
    },
    {
      title: "DAT",
      key: "detail",
      width: 90,
      align: "center",
    },
    {
      title: "Tốt nghiệp",
      key: "detail",
      width: 110,
      align: "center",
    },
    {
      title: "Ghi chú",
      key: "detail",
      width: 90,
      align: "center",
    },
  ];

  return (
    <Spin spinning={isLoadingHocVien || isLoadingKhoaHoc}>
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Quản lý học viên lý thuyết - Khóa: {selectedClass?.name}
        <span className="text-gray-500 italic">
          {" "}
          (#{danhSachHocVien?.total || 0} Thành viên)
        </span>
      </h1>

      <Card className="!mt-5 !mb-4">
        <Row gutter={[12, 12]} align="bottom">
          <Col span={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Khóa Học
            </label>
            <Select
              className="w-full"
              placeholder="--Chon lop--"
              value={activeClassIid || undefined}
              onChange={(value) => {
                setSelectedClassIid(value || "");
                setParams((prev) => ({ ...prev, page: 1 }));
              }}
              options={classOptions}
              loading={isLoadingKhoaHoc}
              showSearch
              optionFilterProp="label"
            />
          </Col>

          <Col span={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Từ khóa
            </label>
            <Input
              aria-label="Tên học viên"
              ref={keywordInputRef}
              placeholder="Ten hoc vien"
              onPressEnter={handleFilter}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                className="!bg-[#3366cc]"
                onClick={handleFilter}
              >
                Lọc
              </Button>
              <Button onClick={handleReset}>Bỏ Lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={students}
        pagination={false}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1200 }}
        className="overflow-hidden table-blue-header"
      />

      <StudentDetailModal
        studentData={select}
        visible={drawerVisible}
        onClose={handleDrawerClose}
        progress={getCompletionStats(select).phanTramHoanThanh}
        passed={getCompletionStats(select).soMonDat}
        total={getCompletionStats(select).tongSoMon}
        program_code={selectedClass?.__expand?.program?.code || program_code}
        program_name={selectedClass?.__expand?.program?.name || program_name}
        maKhoaHoc={
          selectedClass?.suffix_name || selectedClass?.name || maKhoaHoc
        }
      />
    </Spin>
  );
};

export default QuanLyHocVienLyThuyet;
