import {
  Card,
  Row,
  Col,
  Checkbox,
  Input,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
  Flex,
  Spin,
  Image,
  message,
  Form,
  Modal,
  Popover,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { HanhTrinh, hocVienKyDAT, updateHocVienKyDAT } from "../apis/hocVien";
import { LoTringOnline } from "../apis/xeOnline";
import {
  computeSummary as computeSummaryHangLoat,
  evaluate as evaluateHangLoat,
  fmtGio,
  getBienSoTuDong,
  normalizePlate,
  isPlateSimilar,
  getInvalidSessionIndexes,
  getMappedStatus,
  getSessionKeys,
  getMappedEntry,
} from "./checks/DieuKienKiemTra";
import { getAnh } from "../apis/apiAnh";

import TrackingPage from "./map/TrackingPage";
import { getForbiddenZones } from "../apis/forbiddenZone";
import { getCheckConfigs } from "../apis/apiSetting";

import { fetchCheckStudents } from "../apis/kiemTra";
import { getDuLieuCabin } from "../apis/searchPublic";
import { getLichSuDuyetPhienHoc } from "../apis/apiDuyetPhienHoc";
import { formatLocalTime, formatSecondsToTime } from "../util/helper";

const { TextArea } = Input;
const { Title, Text } = Typography;

const today = new Date().toISOString().split("T")[0];

const normalizeStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toUpperCase();
  if (status === "DUYET") return "DUYET";
  if (status === "HUY") return "HUY";
  return null;
};

const toStatusMap = (response) => {
  const root = response?.data ?? response?.Data ?? response ?? [];
  const list = Array.isArray(root)
    ? root
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.Data)
        ? root.Data
        : Array.isArray(root?.phien_hoc_list)
          ? root.phien_hoc_list
          : [];

  return list.reduce((map, item) => {
    const status = item?.phien_hoc_dat_id !== undefined
      ? (item.trang_thai === 1 ? "DUYET" : "HUY")
      : normalizeStatus(item?.trang_thai ?? item?.TrangThai ?? item?.status);

    if (!status) return map;

    const entry = {
      status,
      ly_do: item?.ly_do ?? item?.LyDo ?? item?.ghi_chu ?? item?.GhiChu ?? "",
      nguoi_duyet: item?.nguoi_duyet ?? item?.NguoiDuyet ?? "Admin",
      trang_thai: item?.trang_thai ?? item?.TrangThai ?? 0,
    };

    if (item?.phien_hoc_dat_id !== undefined) {
      map[`id:${String(item.phien_hoc_dat_id)}`] = entry;
      return map;
    }

    getSessionKeys(item).forEach((key) => {
      map[key] = entry;
    });
    return map;
  }, {});
};

const StudentDetail = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [selectedSessionImages, setSelectedSessionImages] = useState([]);
  const [selectedSessionInfo, setSelectedSessionInfo] = useState(null);

  const [isCheckboxLoading, setIsCheckboxLoading] = useState(false);
  const [form] = Form.useForm();

  const queryClient = useQueryClient();
  const queryKey = ["update-hoc-vien-ky-dat", data?.MaDK];

  const { mutate, isPending: isMutating } = useMutation({
    mutationFn: (payload) => updateHocVienKyDAT(data?.MaDK, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        data: { ...(old?.data ?? {}), ...payload },
      }));
      return { previous };
    },

    onError: (err, _payload, ctx) => {
      queryClient.setQueryData(queryKey, ctx.previous);
      message.error(
        "Lưu thất bại: " + (err?.response?.data?.message ?? err.message),
      );
    },

    onSuccess: (res) => {
      queryClient.setQueryData(["hoc-vien-ky-dat", data?.MaDK], res);
      message.success(res?.data?.message ?? "Đã lưu.");
    },

    onSettled: () => {
      setIsCheckboxLoading(false);
      queryClient.invalidateQueries({
        queryKey: ["hoc-vien-ky-dat", data?.MaDK],
      });
    },
  });

  const { data: hocVienCheckData } = useQuery({
    queryKey: ["hoc-vien-ky-dat", data?.MaDK],
    queryFn: () => hocVienKyDAT(data?.MaDK),
    staleTime: 1000 * 60 * 5,
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ["hanhTrinh", data?.MaDK],
    queryFn: () =>
      HanhTrinh({
        ngaybatdau: "2020-01-01",
        ngayketthuc: `${today}T23:59:00`,
        ten: data?.MaDK,
        makhoahoc: data?.ma_khoa,
        limit: 20,
        page: 1,
      }),
    staleTime: Infinity, // Vì là dữ liệu tĩnh dùng chung, để Infinity để không bao giờ call lại
    enabled: !!data?.MaDK, // Chỉ chạy khác học viên
  });

  const { data: loTrinhResults, isLoading: isLoTrinhLoading } = useQuery({
    queryKey: ["loTrinh", data?.MaDK],
    queryFn: () => {
      const today = new Date().toISOString().split("T")[0];
      return LoTringOnline({
        ngaybatdau: "2022-1-1T00:00:00",
        ngayketthuc: `${today}T23:59:00`,
        madk: data?.MaDK,
      });
    },
    enabled: !!data?.MaDK,
    staleTime: Infinity,
  });

  const isOverallLoading = isLoading || isLoTrinhLoading;

  const { data: dataCheckStudent } = useQuery({
    queryKey: ["checkStudent"],
    queryFn: () => fetchCheckStudents(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const cabinKey = String(data?.MaDK || "").trim();
  const { data: dataCabin, isLoading: loadingCabin } = useQuery({
    queryKey: ["cabin", cabinKey],
    queryFn: () => getDuLieuCabin(cabinKey),
    enabled: !!cabinKey,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
    retry: false,
  });

  const { data: apiAnhData } = useQuery({
    queryKey: ["anhHocVien", data?.MaDK],
    queryFn: () => getAnh(data?.MaDK),
    enabled: !!data?.MaDK,
    staleTime: 1000 * 60 * 10,
  });

  const { data: checkConfigsData } = useQuery({
    queryKey: ["checkConfigs"],
    queryFn: async () => {
      const res = await getCheckConfigs();
      return res.data?.data ?? res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: forbiddenZonesData } = useQuery({
    queryKey: ["forbiddenZones"],
    queryFn: async () => {
      const res = await getForbiddenZones();
      return res.data?.data ?? res.data;
    },
    enabled: !!checkConfigsData?.checkKhuVucCam?.enabled,
    staleTime: 1000 * 60 * 10,
  });

  const { data: duyetHistoryData } = useQuery({
    queryKey: ["lichSuDuyetPhien", data?.MaDK],
    queryFn: () => getLichSuDuyetPhienHoc(data?.MaDK),
    enabled: !!data?.MaDK,
    staleTime: 1000 * 60 * 5,
  });

  const statusMap = useMemo(() => {
    return toStatusMap(duyetHistoryData);
  }, [duyetHistoryData]);

  const getImagesForSession = useMemo(() => {
    return (record) => {
      if (!record || !apiAnhData?.data) return [];
      const sessionDate = dayjs(record.ThoiDiemDangNhap).format("DD/MM/YYYY");
      const dayImages = apiAnhData.data[sessionDate] || [];

      const startTime = dayjs(record.ThoiDiemDangNhap);
      const endTime = dayjs(record.ThoiDiemDangXuat);

      if (!startTime.isValid() || !endTime.isValid()) return [];

      return dayImages.filter((img) => {
        if (!img.time) return false;
        const imgTime = dayjs(`${sessionDate} ${img.time}`, "DD/MM/YYYY HH:mm:ss");
        if (!imgTime.isValid()) return false;
        return !imgTime.isBefore(startTime) && !imgTime.isAfter(endTime);
      });
    };
  }, [apiAnhData]);

  const handleShowSessionImages = (record, images) => {
    setSelectedSessionImages(images);
    setSelectedSessionInfo(record);
    setIsImagesModalOpen(true);
  };

  const dataSource = useMemo(() => {
    const list = Array.isArray(results?.data?.Data) ? results.data.Data : [];

    // Lọc trùng theo ID, giữ lại 1 phiên
    const unique = Object.values(
      list.reduce((acc, item) => {
        acc[item.ID] = item;
        return acc;
      }, {})
    );

    return unique.sort(
      (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap)
    );
  }, [results]);

  const dataCheck = useMemo(() => {
    return hocVienCheckData?.data ?? {};
  }, [hocVienCheckData]);

  const studentMap = React.useMemo(() => {
    const list = dataCheckStudent?.data || [];
    const map = new Map();
    list.forEach((s) => {
      if (s.maDangKy) map.set(s.maDangKy.trim(), s);
    });
    return map;
  }, [dataCheckStudent]);

  const cabinDataList = useMemo(() => {
    const list = dataCabin?.data || dataCabin?.Data || [];
    return Array.isArray(list) ? list : [];
  }, [dataCabin]);

  const groupedCabinLessons = useMemo(() => {
    const map = new Map();

    cabinDataList.forEach((item) => {
      const lessonKey = String(
        item?.ID_BaiTap || item?.Name || item?.id || "",
      ).trim();
      if (!lessonKey) return;

      const prev = map.get(lessonKey);
      const seconds = Number(item?.TongThoiGian || 0);

      if (!prev) {
        map.set(lessonKey, {
          lessonKey,
          name: item?.Name || "",
          totalSeconds: Number.isFinite(seconds) ? seconds : 0,
        });
        return;
      }

      map.set(lessonKey, {
        ...prev,
        totalSeconds:
          prev.totalSeconds + (Number.isFinite(seconds) ? seconds : 0),
      });
    });

    return Array.from(map.values());
  }, [cabinDataList]);

  const uniqueCabinLessonCount = groupedCabinLessons.length;

  const totalCabinSeconds = useMemo(
    () =>
      groupedCabinLessons.reduce(
        (sum, item) => sum + Number(item?.totalSeconds || 0),
        0,
      ),
    [groupedCabinLessons],
  );

  const renderValue = (value, suffix = "") => {
    if (value === null || value === undefined || value === "") {
      return <Text style={{ display: "block", textAlign: "center" }}>-</Text>;
    }
    return <Text>{`${value}${suffix}`}</Text>;
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const admissionCode = data?.MaDK ?? "";
  const annualStudentInfo = useMemo(() => {
    const code = String(admissionCode).trim();
    if (!code) return null;
    const baseInfo = studentMap.get(code);
    if (!baseInfo) return null;
    return {
      ...baseInfo,
      hang: data?.HangDaoTao || baseInfo?.hang || baseInfo?.HangDaoTao || "",
    };
  }, [studentMap, admissionCode, data]);

  const teacherName = useMemo(() => {
    if (hocVienCheckData?.data?.gv_dat) {
      return hocVienCheckData.data.gv_dat;
    }
    if (annualStudentInfo?.giaoVien) {
      return annualStudentInfo.giaoVien;
    }
    if (data?.gv_dat) {
      return data.gv_dat;
    }
    if (data?.giao_vien) {
      return data.giao_vien;
    }
    if (data?.giaoVien) {
      return data.giaoVien;
    }
    if (data?.giao_vien_theo_xe?.giao_vien) {
      return data.giao_vien_theo_xe.giao_vien;
    }
    if (dataSource && dataSource.length > 0) {
      const firstSession = dataSource[0];
      if (firstSession?.HoTenGV) {
        return firstSession.HoTenGV;
      }
    }
    return "-";
  }, [hocVienCheckData, annualStudentInfo, data, dataSource]);

  const bienSoTuDong = useMemo(() => {
    return getBienSoTuDong(dataSource, annualStudentInfo);
  }, [dataSource, annualStudentInfo]);

  const columns = [
    {
      title: "#",
      dataIndex: "stt",
      key: "stt",
      align: "center",
      width: 30,
      fixed: "left",
      responsive: ["sm"],
      render: (_text, record, index) => {
        const isTuDong = bienSoTuDong && isPlateSimilar(record.BienSo, bienSoTuDong);
        const hour = dayjs(record.ThoiDiemDangNhap).hour();

        let className = "";
        if (isTuDong) {
          className = "!bg-blue-500 text-white";
        } else if (hour >= 18) {
          className = "!bg-gray-300";
        }

        return {
          props: { className },
          children: index + 1,
        };
      },
    },
    {
      title: "Ngày đào tạo",
      dataIndex: "ThoiDiemDangNhap",
      key: "NgayDaoTao",
      width: 110,
      align: "center",
      render: (v) => renderValue(v ? dayjs(v).format("DD/MM/YYYY") : ""),
    },
    {
      title: "Phiên học",
      key: "PhienHoc",
      width: 130,
      align: "center",
      render: (_, record) => {
        const start = record.ThoiDiemDangNhap
          ? dayjs(record.ThoiDiemDangNhap).format("HH:mm")
          : "-";
        const end = record.ThoiDiemDangXuat
          ? dayjs(record.ThoiDiemDangXuat).format("HH:mm")
          : "-";

        const entry = getMappedEntry(record, statusMap);

        if (entry) {
          const isDuyet = entry.status === "DUYET";
          const color = isDuyet ? "#52c41a" : "#f5222d";
          const content = (
            <div style={{ padding: "4px 0" }}>
              <div style={{ marginBottom: 4 }}>
                <strong>Người duyệt: </strong>
                <span>{entry.nguoi_duyet || "Hệ thống"}</span>
              </div>
              <div>
                <strong>Ghi chú: </strong>
                <span className="text-sm">{entry.ly_do || "Không có ghi chú"}</span>
              </div>
            </div>
          );

          return (
            <Space size={4} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <span>{`${start} - ${end}`}</span>
              <Popover content={content} trigger="click" placement="top">
                <InfoCircleOutlined
                  style={{
                    color,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                />
              </Popover>
            </Space>
          );
        }

        return `${start} - ${end}`;
      },
    },
    {
      title: "Tên giáo viên",
      dataIndex: "HoTenGV",
      key: "HoTenGV",
      width: 150,
      align: "center",
      render: (text) => renderValue(text),
    },
    {
      title: "Ảnh đăng nhập",
      dataIndex: "SrcdnAvatar",
      key: "SrcdnAvatar",
      width: 120,
      render: (url) => <Image src={url} width={110} height={76} preview />,
    },
    {
      title: "Ảnh đăng xuất",
      dataIndex: "SrcdxAvatar",
      key: "SrcdnAvatar",
      width: 120,
      ellipsis: true,
      render: (url) => <Image src={url} width={110} height={76} preview />,
    },
    {
      title: "Số ảnh",
      key: "soAnh",
      width: 80,
      align: "center",
      render: (_, record) => {
        const imgs = getImagesForSession(record);
        const count = imgs.length;

        const gioThuc = (record.TongThoiGian || 0) / 3600;
        const soAnhCanCo = Math.round(gioThuc * 12);
        const soAnhThieu = Math.max(0, soAnhCanCo - count);

        if (count === 0) return renderValue(0);

        return (
          <Button
            type="link"
            size="small"
            className="font-semibold"
            onClick={() => handleShowSessionImages(record, imgs)}
          >
            {soAnhThieu > 0 ? (
              <span>
                {count}
                <span style={{ color: "red", marginLeft: 1 }}>
                  ({soAnhThieu})
                </span>
              </span>
            ) : (
              <span>{count}</span>
            )}
          </Button>
        );
      },
    },
    {
      title: "Thời lượng",
      dataIndex: "TongThoiGian",
      key: "TongThoiGian",
      width: 90,
      align: "center",
      render: (text) => <Text>{formatSecondsToTime(text)}</Text>,
    },
    {
      title: "Quãng đường",
      dataIndex: "TongQD",
      key: "TongQD",
      width: 110,
      align: "center",
      responsive: ["md"],
      render: (text) => renderValue(text),
    },
    {
      title: "Biển số",
      dataIndex: "BienSo",
      key: "BienSo",
      width: 90,
      responsive: ["md"],
      render: (text) => renderValue(text),
    },
    {
      title: "Nhận diện",
      dataIndex: "Tile",
      key: "Tile",
      width: 90,
      align: "center",
      responsive: ["lg"],
      render: (text) => <Text>{Math.floor(text * 10) / 10}%</Text>,
    },
    {
      title: "Hạng",
      dataIndex: "HangDaoTao",
      key: "HangDaoTao",
      width: 60,
      align: "center",
      responsive: ["md"],
      render: (text) => renderValue(text),
    },
    {
      title: "Tốc độ TB",
      key: "avgSpeed",
      width: 100,
      align: "center",
      responsive: ["xl"],
      render: (_, record) => {
        const distance = Number(record.TongQuangDuong);
        const time = Number(record.TongTG);

        if (!distance || !time) return <Text>--</Text>;

        return <Text>{(distance / time).toFixed(1)} km/h</Text>;
      },
    },
  ];

  const hasJourneyData = dataSource.length > 0;

  const zonesToUse = useMemo(() => {
    return checkConfigsData?.checkKhuVucCam?.enabled ? (forbiddenZonesData || []) : [];
  }, [checkConfigsData, forbiddenZonesData]);

  const summaryData = useMemo(
    () =>
      computeSummaryHangLoat(
        dataSource,
        data?.HangDaoTao || "",
        annualStudentInfo,
        loTrinhResults?.data || [],
        zonesToUse,
        statusMap
      ),
    [dataSource, data, annualStudentInfo, loTrinhResults, zonesToUse, statusMap],
  );

  const { invalidIndexes, invalidReasons } = useMemo(() => {
    return getInvalidSessionIndexes(
      dataSource,
      annualStudentInfo,
      loTrinhResults?.data || [],
      zonesToUse,
      statusMap
    );
  }, [dataSource, annualStudentInfo, loTrinhResults, zonesToUse, statusMap]);

  const totalAchievedImagesCount = useMemo(() => {
    let count = 0;
    dataSource.forEach((record, index) => {
      if (!invalidIndexes.has(index)) {
        count += getImagesForSession(record).length;
      }
    });
    return count;
  }, [dataSource, invalidIndexes, getImagesForSession]);

  const evaluationData = useMemo(() => {
    if (!hasJourneyData) {
      return { status: "fail", errors: [], warnings: [] };
    }

    const fullCourseEvaluation = evaluateHangLoat(
      summaryData,
      dataSource,
      loTrinhResults?.data || [],
      annualStudentInfo,
      zonesToUse,
      statusMap
    );

    return {
      status: fullCourseEvaluation.status,
      errors: fullCourseEvaluation.errors || [],
      warnings: fullCourseEvaluation.warnings || [],
    };
  }, [
    dataSource,
    hasJourneyData,
    summaryData,
    loTrinhResults,
    annualStudentInfo,
    zonesToUse,
    statusMap,
  ]);

  const allIssues = [...evaluationData.warnings, ...evaluationData.errors];

  const isPass = evaluationData.status === "pass";

  const formatCabinDuration = (seconds = 0) => {
    const totalMinutes = Math.floor(Number(seconds || 0) / 60);
    const gio = Math.floor(totalMinutes / 60);
    const phut = totalMinutes % 60;
    return `${gio} giờ ${phut} phút`;
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsCheckboxLoading(true);
    mutate(
      {
        ten_hoc_vien: data?.HoTen ?? null,
        ngay_sinh: data?.NgaySinh ?? null,
        khoa_hoc: data?.TenKhoaHoc ?? null,
        ma_khoa: data?.ma_khoa ?? null,
        hang_dao_tao: data?.HangDaoTao ?? null,
        gv_dat: dataSource?.[0]?.HoTenGV ?? null,
        anh: data?.srcAvatar,
        can_cuoc: data?.SoCMT,
        trang_thai: checked ? "da_ky" : "chua_ky",
        ghi_chu_1: form.getFieldValue("ghi_chu_1") ?? "",
        ghi_chu_2: form.getFieldValue("ghi_chu_2") ?? "",
      },
      {
        onSuccess: () => {
          form.setFieldValue("trang_thai", checked);
        },
      },
    );
  };

  const onFinish = (values) => {
    mutate({
      ghi_chu_1: values.ghi_chu_1 ?? "",
      ghi_chu_2: values.ghi_chu_2 ?? "",
      trang_thai: form.getFieldValue("trang_thai") ? "da_ky" : "chua_ky",
      ten_hoc_vien: data?.HoTen ?? null,
      ngay_sinh: data?.NgaySinh ?? null,
      khoa_hoc: data?.TenKhoaHoc ?? null,
      ma_khoa: data?.MaKhoaHoc ?? null,
      hang_dao_tao: data?.HangDaoTao ?? null,
      gv_dat: dataSource?.[0]?.HoTenGV ?? null,
    });
  };

  useEffect(() => {
    if (dataCheck) {
      form.setFieldsValue({
        trang_thai: dataCheck.trang_thai === "da_ky",
        ghi_chu_1: dataCheck.ghi_chu_1 ?? dataCheck.internal_note ?? "",
        ghi_chu_2: dataCheck.ghi_chu_2 ?? dataCheck.public_note ?? "",
      });
    }
  }, [dataCheck, form]);

  return (
    <Spin spinning={isLoading}>
      <div className="student-detail-container">
        <Card className="info-card" bordered={false}>
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Title level={4}>Thông tin học viên</Title>
            </Col>
            <Col xs={24} sm={8} md={6} lg={3}>
              <div style={{ textAlign: "center" }}>
                <img
                  src={data.srcAvatar}
                  alt="Student Avatar"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                  }}
                />
              </div>
            </Col>

            <Col xs={24} sm={16} md={12} lg={12}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Tên học viên:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{data.HoTen}</Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Mã học viên:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong copyable>
                      {data.MaDK}
                    </Text>
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>GV DAT:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{teacherName}</Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Ngày sinh:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>
                      {" "}
                      {data?.NgaySinh
                        ? dayjs(data.NgaySinh).format("DD/MM/YYYY")
                        : ""}
                    </Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Mã khóa học:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{data.TenKhoaHoc}</Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Hạng đào tạo:</Text>
                  </Col>
                  <Col span={16}>
                    <Tag color="blue">{data.HangDaoTao}</Tag>
                  </Col>
                </Row>
              </Space>
            </Col>

            <Col xs={24} md={6} lg={8}>
              <Card
                size="small"
                className="confirmation-box"
                style={{ background: "#fafafa", marginTop: "-14px" }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Form
                    key="hocvien-check-form"
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                  >
                    <Row gutter={[8, 8]} justify="space-between" align="middle">
                      <Text strong className="mt-2">
                        Ký Xác Nhận DAT
                      </Text>
                      <Form.Item
                        name="trang_thai"
                        valuePropName="checked"
                        className="!mb-0"
                      >
                        <Checkbox
                          onChange={handleCheckboxChange}
                          disabled={isCheckboxLoading}
                        >
                          <Spin spinning={isCheckboxLoading} size="small">
                            <Text type="success">Học viên đã ký</Text>
                          </Spin>
                        </Checkbox>
                      </Form.Item>
                    </Row>

                    {/* Đổi tên field thành ghi_chu_1, ghi_chu_2 */}
                    <Form.Item label="Ghi chú nội bộ" name="ghi_chu_1">
                      <TextArea
                        rows={2}
                        placeholder="Ghi chú nội bộ (chỉ Admin thấy) ..."
                      />
                    </Form.Item>

                    <Form.Item label="Ghi chú công khai" name="ghi_chu_2">
                      <TextArea rows={2} placeholder="Ghi chú công khai ..." />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={isMutating && !isCheckboxLoading}
                      >
                        Lưu thông tin
                      </Button>
                    </Form.Item>

                    <Text className="!text-[11px]">
                      Cập nhật cuối:{" "}
                      {dataCheck?.updated_at
                        ? formatLocalTime(dataCheck.updated_at)
                        : "Chưa có dữ liệu"}{" "}
                      (GMT+7)
                    </Text>
                  </Form>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card
          className="training-card"
          bordered={false}
          style={{ marginTop: 16 }}
        >
          <Title level={4}>Thông tin quá trình đào tạo</Title>
          <Row gutter={[12, 12]}>
            <Col span={24} className=" pl-20">
              <Space wrap style={{ marginBottom: 16 }}>
                <Checkbox checked>Ban ngày</Checkbox>
                <Checkbox checked>Ban đêm</Checkbox>
                <Checkbox checked>Trải nghiệm số tự động</Checkbox>
                <Checkbox checked>Nhận diện &lt;75%</Checkbox>
              </Space>
            </Col>
            <Col span={24}>
              <Flex justify="space-between">
                <Space>
                  <Text strong>DỮ LIỆU HỌC CABIN:</Text>

                  {loadingCabin ? (
                    <Text>Đang tải dữ liệu Cabin...</Text>
                  ) : cabinDataList.length > 0 ? (
                    <Text strong className="!text-blue-600">
                      {uniqueCabinLessonCount}/8 bài -{" "}
                      {formatCabinDuration(totalCabinSeconds)}
                    </Text>
                  ) : (
                    <Tag color="error" className="font-medium">
                      Chưa có dữ liệu Cabin
                    </Tag>
                  )}
                </Space>
                {dataSource.length > 0 && (
                  <div className="mt-4">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => showModal()}
                      loading={isLoTrinhLoading}
                    >
                      Giám sát hành trình
                    </Button>
                  </div>
                )}
              </Flex>
            </Col>
            <Col span={24}>
              <Table
                columns={columns}
                dataSource={dataSource || []}
                pagination={false}
                size="small"
                scroll={{ x: 1200 }}
                // className="table-blue-header"
                bordered
                rowClassName={() => ""}
                locale={{
                  emptyText:
                    "Không có phiên đào tạo nào trong khoảng thời gian đã chọn.",
                }}
              />
            </Col>
          </Row>
          {dataSource.length > 0 && (
            <div className="mt-10">
              <Row gutter={[12, 12]}>
                <Title level={4}>Tổng hợp</Title>
                <Col span={24} className="pl-20">
                  <Text>
                    Tổng thời lượng:{" "}
                    <Text strong>{fmtGio(summaryData.tongThoiGianGio)}</Text> ·
                    Tổng quãng đường:{" "}
                    <Text strong>
                      {summaryData?.tongQuangDuong.toFixed(2) || 0.0} km
                    </Text> ·
                    Tổng ảnh:{" "}
                    <Text strong>{totalAchievedImagesCount}</Text>
                  </Text>
                </Col>
              </Row>
              <Spin spinning={isLoTrinhLoading}>
                <Row gutter={[12, 12]}>
                  <Col span={24}>
                    <Card
                      style={{
                        marginTop: 16,
                        borderColor: isPass ? "#52c41a" : "#ff4d4f",
                        backgroundColor: isPass ? "#f6ffed" : "#fff2f0",
                      }}
                    >
                      <Space
                        direction="vertical"
                        size="middle"
                        style={{ width: "100%" }}
                      >
                        {/* Header */}
                        <Space>
                          <Text strong style={{ fontSize: 16 }}>
                            Kết quả đánh giá:
                          </Text>
                          <Tag
                            color={isPass ? "success" : "error"}
                            icon={
                              isPass ? (
                                <CheckCircleOutlined />
                              ) : (
                                <CloseCircleOutlined />
                              )
                            }
                            style={{ fontSize: 14 }}
                          >
                            {isPass ? "Đạt" : "Chưa đạt"}
                          </Tag>
                        </Space>

                        {/* Issues List */}
                        {allIssues.length > 0 && (
                          <div>
                            <Text strong>Lý do:</Text>
                            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                              {allIssues.map((issue, index) => (
                                <li
                                  key={index}
                                  style={{
                                    color:
                                      issue.type === "error"
                                        ? "#990000"
                                        : "#CC9966",
                                    marginBottom: 8,
                                  }}
                                >
                                  {issue.type === "warning" ? (
                                    <WarningOutlined
                                      style={{ color: "#CC9966", marginRight: 4 }}
                                    />
                                  ) : (
                                    <CloseCircleOutlined
                                      style={{ marginRight: 4 }}
                                    />
                                  )}
                                  <span className="font-medium text-[#CC9966]">
                                    {issue.type === "warning" && "Cảnh báo: "}
                                  </span>
                                  <span className="font-medium ">
                                    {issue.message}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Divider style={{ margin: "12px 0" }} />

                        {/* Summary */}
                        <Space direction="vertical" size={4}>
                          <Text className="text-[#888888] font-medium">
                            Ban ngày: {fmtGio(summaryData.thoiGianBanNgayGio)}
                            {" - "}
                            {summaryData.quangDuongBanNgay.toFixed(2)} km
                          </Text>

                          <Text className="text-[#888888] font-medium">
                            Ban đêm: {fmtGio(summaryData.thoiGianBanDemGio)}
                            {" - "}
                            {summaryData.quangDuongBanDem.toFixed(2)} km
                          </Text>

                          {dataSource[0]?.HangDaoTao !== "B1" &&
                            dataSource[0]?.HangDaoTao !== "B11" ? (
                            <Text className="text-[#888888] font-medium">
                              Trải nghiệm hộp số tự động (17h-7h):{" "}
                              {fmtGio(summaryData.thoiGianTuDongGio)}
                              {" - "}
                              {summaryData.quangDuongTuDong.toFixed(2)} km
                              {summaryData.tuDongLoiGio > 0 && (
                                <Text className="!text-orange-500 ml-2">
                                  (đã loại {fmtGio(summaryData.tuDongLoiGio)} /{" "}
                                  {summaryData.tuDongLoiKm.toFixed(2)} km phiên
                                  không hợp lệ - phiên hợp lệ từ sau 4h45 - 6h59
                                  và sau 17h )
                                </Text>
                              )}
                            </Text>
                          ) : null}

                          {/* Tổng phiên không hợp lệ bị loại */}
                          {(summaryData.tongThoiGianLoiGio > 0 ||
                            summaryData.tongQuangDuongLoi > 0) && (
                              <Text className="!text-red-500 font-medium">
                                ⚠ Phiên không hợp lệ bị loại:{" "}
                                {fmtGio(summaryData.tongThoiGianLoiGio)}
                                {" - "}
                                {summaryData.tongQuangDuongLoi.toFixed(2)} km
                              </Text>
                            )}
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Spin>
            </div>
          )}
        </Card>
        <Modal
          title={
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              Ảnh Chi Tiết Phiên Đào Tạo
              {selectedSessionInfo && (
                <span style={{ fontSize: "13px", fontWeight: "normal", color: "#666", marginLeft: "8px" }}>
                  ({dayjs(selectedSessionInfo.ThoiDiemDangNhap).format("DD/MM/YYYY")}{" "}
                  {dayjs(selectedSessionInfo.ThoiDiemDangNhap).format("HH:mm")} -{" "}
                  {dayjs(selectedSessionInfo.ThoiDiemDangXuat).format("HH:mm")})
                </span>
              )}
            </div>
          }
          open={isImagesModalOpen}
          onCancel={() => setIsImagesModalOpen(false)}
          footer={null}
          width={800}
          centered
          destroyOnClose
        >
          <Row gutter={[12, 12]} style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px" }}>
            {selectedSessionImages.length === 0 ? (
              <Col span={24}>
                <Text style={{ display: "block", textAlign: "center", color: "#999", padding: "20px" }}>
                  Không tìm thấy ảnh trong phiên này.
                </Text>
              </Col>
            ) : (
              selectedSessionImages.map((img, idx) => (
                <Col key={idx} xs={12} sm={8} md={6}>
                  <div
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: "8px",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Image
                      src={img.url}
                      alt={img.filename}
                      width="100%"
                      height={100}
                      style={{ objectFit: "cover", borderRadius: "4px" }}
                      fallback="https://placehold.co/300x200?text=No+Image"
                    />
                    <div style={{ marginTop: "8px" }}>
                      <Text strong style={{ fontSize: "12px", color: "#333" }}>
                        {img.time}
                      </Text>
                    </div>
                  </div>
                </Col>
              ))
            )}
          </Row>
        </Modal>

        <Modal
          title=""
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          width="1280px"
          style={{ top: 20 }}
          footer={null}
          destroyOnClose
        >
          <TrackingPage
            duLieuPhienHoc={dataSource}
            summaryData={{
              ...data,
              TongTGFont: fmtGio(summaryData.tongThoiGianGio),
              TongQD: summaryData.tongQuangDuong.toFixed(2),
            }}
            loTrinhData={loTrinhResults?.data}
            loadingLoTrinh={isLoTrinhLoading}
            invalidIndexes={invalidIndexes}
            invalidReasons={invalidReasons}
            forbiddenZones={zonesToUse}
          />
        </Modal>
      </div>
    </Spin>
  );
};

export default StudentDetail;
