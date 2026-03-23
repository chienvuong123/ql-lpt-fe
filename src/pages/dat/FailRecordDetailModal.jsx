import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { AiOutlineSelect } from "react-icons/ai";
import { formatHoursToHM } from "../../util/helper";
import { getPhienHocDAT, HanhTrinh } from "../../apis/hocVien";
import { fetchCheckStudents } from "../../apis/kiemTra";
import { HANG_DAO_TAO_CONFIG } from "../checks/DieuKienKiemTraPublic";
import TruyVetModal from "./TruyVetModal";

const { Text } = Typography;

const normalizeApproveFlag = (value) =>
  value === true || value === 1 || String(value || "").toLowerCase() === "true";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizePlate = (plate) =>
  String(plate || "")
    .replace(/[-.\s]/g, "")
    .toUpperCase()
    .trim();

const buildPhienHocStatusMap = (list = []) => {
  const map = {};
  list.forEach((item) => {
    const key = `${item.ngay}|${item.gio_vao}|${item.gio_ra}`;
    map[key] = item.trang_thai;
  });
  return map;
};

const getSessionKey = (session) => {
  if (!session?.thoiDiemDangNhap || !session?.thoiDiemDangXuat) return null;
  const vao = dayjs(session.thoiDiemDangNhap);
  const ra = dayjs(session.thoiDiemDangXuat);
  if (!vao.isValid() || !ra.isValid()) return null;
  return `${vao.format("YYYY-MM-DD")}|${vao.format("HH:mm:ss")}|${ra.format("HH:mm:ss")}`;
};

const getAutoPlateFromRows = (rows = []) => {
  const count = rows.reduce((acc, item) => {
    const plate = normalizePlate(item?.bienSo);
    if (!plate) return acc;
    acc[plate] = (acc[plate] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(count);
  if (entries.length <= 1) return null;
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min))[0];
};

const isNightSession = (session) => {
  const demGiay = toNumber(session?.thoiGianBanDemGiay);
  const demKm = toNumber(session?.quangDuongBanDemKm);
  if (demGiay > 0 || demKm > 0) return true;
  if (!session?.thoiDiemDangNhap) return false;
  const hour = new Date(session.thoiDiemDangNhap).getHours();
  return hour >= 18 || hour < 5;
};

const buildMissingIssue = (label, actualValue, requiredValue, unit) => {
  if (actualValue >= requiredValue) return null;
  const missing = requiredValue - actualValue;
  return {
    label,
    message:
      unit === "hours"
        ? `Thiếu ${formatHoursToHM(missing)} (thực tế ${formatHoursToHM(actualValue)}, yêu cầu ${formatHoursToHM(requiredValue)}).`
        : `Thiếu ${missing.toFixed(2)} km (thực tế ${actualValue.toFixed(2)} km, yêu cầu ${requiredValue.toFixed(2)} km).`,
  };
};

const FailRecordDetailModal = ({ open, record, onCancel, onUpdated }) => {
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const currentRecord = record || null;

  const maDK = currentRecord?.maDK || "";
  const maKhoaHoc =
    currentRecord?.studentInfo?.maKhoaHoc || currentRecord?.maKhoaHoc || "";

  const { data: phienHocStatusData, refetch: refetchPhienHocStatus } = useQuery(
    {
      queryKey: ["failRecordPhienHocStatus", maDK],
      queryFn: () => getPhienHocDAT(maDK),
      enabled: open && !!maDK,
      staleTime: 0,
      retry: false,
    },
  );

  const { data: dataDat, isLoading: loadingDat } = useQuery({
    queryKey: ["hanhTrinhFailRecord", maDK, maKhoaHoc],
    queryFn: () =>
      HanhTrinh({
        ngaybatdau: "2020-01-01",
        ngayketthuc: "2026-12-31",
        ten: maDK,
        makhoahoc: maKhoaHoc,
        limit: 20,
        page: 1,
      }),
    enabled: isTraceModalOpen && !!maDK,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataCheckStudents = {} } = useQuery({
    queryKey: ["checkStudentFailRecord", maDK],
    queryFn: () => fetchCheckStudents(),
    enabled: isTraceModalOpen && !!maDK,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const datJourneyRows = useMemo(() => {
    const apiList = dataDat?.data?.Data || dataDat?.data || [];
    if (Array.isArray(apiList) && apiList.length > 0) return apiList;

    if (!Array.isArray(currentRecord?.sessions)) return [];
    return currentRecord.sessions.map((session, index) => ({
      ID: session?.ID || session?.id || index + 1,
      BienSo: session?.bienSo || session?.BienSo || "",
      TongQuangDuong: session?.tongQuangDuongKm ?? session?.TongQuangDuong ?? 0,
      TongThoiGian: session?.tongThoiGianGiay ?? session?.TongThoiGian ?? 0,
      ThoiDiemDangNhap:
        session?.thoiDiemDangNhap || session?.ThoiDiemDangNhap || null,
      ThoiDiemDangXuat:
        session?.thoiDiemDangXuat || session?.ThoiDiemDangXuat || null,
      ThoiGianBanDem:
        session?.thoiGianBanDemGiay ?? session?.ThoiGianBanDem ?? 0,
      QuangDuongBanDem:
        session?.quangDuongBanDemKm ?? session?.QuangDuongBanDem ?? 0,
      GiaoVien:
        session?.giaoVien ||
        session?.GiaoVien ||
        currentRecord?.studentInfo?.giaoVien ||
        "",
      HangDaoTao:
        session?.hangDaoTao || session?.HangDaoTao || currentRecord?.hangDaoTao,
    }));
  }, [currentRecord, dataDat]);

  const studentCheckInfo = useMemo(() => {
    const list = dataCheckStudents?.data || [];
    if (!Array.isArray(list) || !maDK) return null;
    const code = String(maDK).trim();
    return (
      list.find((item) => String(item?.maDangKy || "").trim() === code) || null
    );
  }, [dataCheckStudents, maDK]);

  const traceStudent = useMemo(() => {
    if (!currentRecord) return null;
    return {
      user: {
        name: currentRecord?.hoTen || "",
        admission_code: currentRecord?.maDK || "",
        birth_year: currentRecord?.namSinh || null,
        avatar: currentRecord?.avatar || "",
      },
    };
  }, [currentRecord]);

  const sortedSessions = useMemo(
    () =>
      [...(currentRecord?.sessions || [])].sort(
        (a, b) => new Date(a.thoiDiemDangNhap) - new Date(b.thoiDiemDangNhap),
      ),
    [currentRecord?.sessions],
  );

  const phienHocStatusMap = useMemo(() => {
    const list =
      phienHocStatusData?.data?.phien_hoc_list ||
      phienHocStatusData?.phien_hoc_list ||
      phienHocStatusData?.data ||
      [];
    return Array.isArray(list) ? buildPhienHocStatusMap(list) : {};
  }, [phienHocStatusData]);

  const sessionTableRows = useMemo(() => {
    return sortedSessions.map((session, index) => {
      const sessionKey = getSessionKey(session);
      const trangThai = sessionKey ? phienHocStatusMap[sessionKey] : undefined;
      const invalid = session?.isValid === false;
      const isApproved = trangThai
        ? trangThai === "DUYET"
        : normalizeApproveFlag(session?.duyet) || !invalid;

      return {
        ...session,
        key: session?.ID || session?.id || `${maDK}-${index}`,
        displayIndex: index + 1,
        resolvedApproved: isApproved,
        countedInSummary: isApproved,
      };
    });
  }, [maDK, phienHocStatusMap, sortedSessions]);

  const summaryInfo = useMemo(() => {
    const countedRows = sessionTableRows.filter(
      (item) => item.countedInSummary,
    );
    const excludedRows = sessionTableRows.filter(
      (item) => !item.countedInSummary,
    );
    const autoPlate = getAutoPlateFromRows(countedRows);

    const totals = countedRows.reduce(
      (acc, item) => {
        const tongGiay = toNumber(item?.tongThoiGianGiay);
        const tongKm = toNumber(item?.tongQuangDuongKm);

        acc.totalSeconds += tongGiay;
        acc.totalDistance += tongKm;

        if (isNightSession(item)) {
          acc.nightSeconds += toNumber(item?.thoiGianBanDemGiay) || tongGiay;
          acc.nightDistance += toNumber(item?.quangDuongBanDemKm) || tongKm;
        }

        if (autoPlate && normalizePlate(item?.bienSo) === autoPlate) {
          acc.autoSeconds += tongGiay;
          acc.autoDistance += tongKm;
        }

        return acc;
      },
      {
        totalSeconds: 0,
        totalDistance: 0,
        nightSeconds: 0,
        nightDistance: 0,
        autoSeconds: 0,
        autoDistance: 0,
      },
    );

    return {
      ...totals,
      countedRows,
      excludedRows,
      autoPlate,
      countedSessionCount: countedRows.length,
      totalSessionCount: sessionTableRows.length,
      totalHours: totals.totalSeconds / 3600,
    };
  }, [sessionTableRows]);

  const derivedIssues = useMemo(() => {
    const hangDaoTao = currentRecord?.hangDaoTao || "B1";
    const rule = HANG_DAO_TAO_CONFIG[hangDaoTao] || HANG_DAO_TAO_CONFIG.B1;
    const errors = [];
    const warnings = [];

    [
      buildMissingIssue(
        "Tổng thời lượng",
        summaryInfo.totalSeconds / 3600,
        toNumber(rule?.thoiGian?.tong),
        "hours",
      ),
      buildMissingIssue(
        "Tổng quãng đường",
        summaryInfo.totalDistance,
        toNumber(rule?.quangDuong?.tong),
        "km",
      ),
      buildMissingIssue(
        "Thời gian ban đêm",
        summaryInfo.nightSeconds / 3600,
        toNumber(rule?.thoiGian?.banDem),
        "hours",
      ),
      buildMissingIssue(
        "Quãng đường ban đêm",
        summaryInfo.nightDistance,
        toNumber(rule?.quangDuong?.banDem),
        "km",
      ),
      buildMissingIssue(
        "Thời gian số tự động",
        summaryInfo.autoSeconds / 3600,
        toNumber(rule?.thoiGian?.tuDong),
        "hours",
      ),
      buildMissingIssue(
        "Quãng đường số tự động",
        summaryInfo.autoDistance,
        toNumber(rule?.quangDuong?.tuDong),
        "km",
      ),
    ]
      .filter(Boolean)
      .forEach((item) => errors.push(item));

    if (summaryInfo.excludedRows.length > 0) {
      warnings.push({
        label: "Phiên bị loại",
        message: `Còn ${summaryInfo.excludedRows.length} phiên chưa được tính vào tổng.`,
      });
    }

    if (summaryInfo.autoSeconds / 3600 > 2 + 10 / 60) {
      warnings.push({
        label: "Thời gian số tự động vượt mức",
        message: `Đã vượt ${formatHoursToHM(summaryInfo.autoSeconds / 3600 - (2 + 10 / 60))} so với mức tối đa 2h10'.`,
      });
    }

    summaryInfo.excludedRows.forEach((session) => {
      (session?.sessionErrors || []).forEach((item) => {
        warnings.push({
          label: `Phiên ${session?.displayIndex || "-"}`,
          message: item?.message || "-",
        });
      });
    });

    return { errors, warnings };
  }, [currentRecord?.hangDaoTao, summaryInfo]);

  const handleTraceModalClose = useCallback(async () => {
    setIsTraceModalOpen(false);
    if (maDK) {
      await refetchPhienHocStatus();
    }
    onUpdated?.();
  }, [maDK, onUpdated, refetchPhienHocStatus]);

  const tabItems = [
    {
      key: "errors",
      label: (
        <Badge count={derivedIssues.errors.length} offset={[15, 0]}>
          <span>Lỗi</span>
        </Badge>
      ),
      children: (
        <Space direction="vertical" className="w-full" size="small">
          {derivedIssues.errors.length > 0 ? (
            derivedIssues.errors.map((item, index) => (
              <div
                key={`${item?.label}-${index}`}
                className="flex items-start justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2"
              >
                <div className="flex gap-1">
                  <Text strong>{item?.label || "Lỗi"}:</Text>
                  <Text>{item?.message || "-"}</Text>
                </div>
              </div>
            ))
          ) : (
            <Text type="secondary">Không có lỗi.</Text>
          )}
        </Space>
      ),
    },
    {
      key: "warnings",
      label: (
        <Badge
          count={derivedIssues.warnings.length}
          offset={[15, 0]}
          color="#faad14"
        >
          <span>Cảnh báo</span>
        </Badge>
      ),
      children: (
        <Space direction="vertical" className="w-full" size="small">
          {derivedIssues.warnings.length > 0 ? (
            derivedIssues.warnings.map((item, index) => (
              <div
                key={`${item?.label}-${index}`}
                className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2"
              >
                <Text strong>{item?.label || "Cảnh báo"}: </Text>
                <Text>{item?.message || "-"}</Text>
              </div>
            ))
          ) : (
            <Text type="secondary">Không có cảnh báo.</Text>
          )}
        </Space>
      ),
    },
  ];

  const sessionColumns = [
    {
      title: "#",
      dataIndex: "stt",
      key: "stt",
      width: 30,
      align: "center",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "Thời gian",
      key: "thoiGian",
      width: 110,
      align: "center",
      render: (_, session) => (
        <span>
          {session.thoiDiemDangNhap
            ? new Date(session.thoiDiemDangNhap).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 95,
      align: "center",
      render: (_, session) => {
        const invalid = session?.isValid === false;
        const isApproved = session?.resolvedApproved;

        let statusColor = "default";
        let statusText = "-";

        if (!invalid) {
          statusColor = isApproved ? "success" : "warning";
          statusText = isApproved ? "Hợp lệ" : "Đã hủy";
        } else {
          statusColor = isApproved ? "processing" : "error";
          statusText = isApproved ? "Đã duyệt" : "Bị loại";
        }

        return (
          <Tag variant="outlined" color={statusColor}>
            {statusText}
          </Tag>
        );
      },
    },
    {
      title: "Biển số",
      key: "bienSo",
      width: 90,
      align: "center",
      render: (value) => value?.bienSo,
    },
    {
      title: "Tổng km",
      key: "tongKm",
      width: 90,
      align: "center",
      render: (value) => `${toNumber(value?.tongQuangDuongKm).toFixed(2)} km`,
    },
    {
      title: "Tổng giờ",
      key: "tongGio",
      width: 90,
      align: "center",
      render: (value) => {
        const total = toNumber(value?.tongThoiGianGiay);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        return `${h ? `${h}h ` : ""}${m}'`;
      },
    },
    {
      title: "Chi tiết lỗi",
      key: "chiTiet",
      render: (_, session) =>
        session?.sessionErrors?.length > 0 ? (
          <Space size={4} direction="vertical">
            {session.sessionErrors.map((e, i) => (
              <Text key={i} className="block text-xs" type="danger">
                {e?.message}
              </Text>
            ))}
          </Space>
        ) : (
          <span className="flex w-full items-center justify-center">-</span>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center",
      render: () => (
        <Space>
          <Button
            type="primary"
            className="!w-10"
            size="small"
            onClick={() => setIsTraceModalOpen(true)}
          >
            <AiOutlineSelect />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title="Chi tiết học viên"
        open={open}
        onClose={onCancel}
        footer={null}
        width={1200}
      >
        {currentRecord ? (
          <Space direction="vertical" className="w-full" size="large">
            <Card size="small">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <Text strong>Học viên: </Text>
                  <Text>{currentRecord?.hoTen || "-"}</Text>
                </div>
                <div>
                  <Text strong>Mã học viên: </Text>
                  <Text copyable>{currentRecord?.maDK || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tên khóa học: </Text>
                  <Text>{currentRecord?.studentInfo?.khoaHoc || "-"}</Text>
                </div>
                <div>
                  <Text strong>Hạng đào tạo: </Text>
                  <Text>{currentRecord?.hangDaoTao || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tổng phiên tính vào tổng: </Text>
                  <Text>
                    {summaryInfo.countedSessionCount}/
                    {summaryInfo.totalSessionCount}
                  </Text>
                </div>
                <div>
                  <Text strong>Giáo viên: </Text>
                  <Text>{currentRecord?.studentInfo?.giaoVien || "-"}</Text>
                </div>
                <div>
                  <Text strong>Xe B1: </Text>
                  <Text>{currentRecord?.studentInfo?.xeB1 || "-"}</Text>
                </div>
                <div>
                  <Text strong>Xe B2: </Text>
                  <Text>{currentRecord?.studentInfo?.xeB2 || "-"}</Text>
                </div>
                <div>
                  <Text strong>Tổng quãng đường: </Text>
                  <Text>{summaryInfo.totalDistance.toFixed(2)} km</Text>
                </div>
                <div>
                  <Text strong>Tổng thời gian: </Text>
                  <Text>{formatHoursToHM(summaryInfo.totalHours)}</Text>
                </div>
              </div>
            </Card>

            <Card size="small" className="!mb-0">
              <Tabs defaultActiveKey="errors" size="small" items={tabItems} />
            </Card>

            <Card size="small" title="Các phiên học" className="!mb-0">
              <Table
                columns={sessionColumns}
                dataSource={sessionTableRows}
                rowKey="key"
                pagination={false}
                bordered
                size="small"
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <TruyVetModal
        open={isTraceModalOpen}
        onCancel={handleTraceModalClose}
        loading={loadingDat}
        student={traceStudent}
        courseLabel={currentRecord?.studentInfo?.khoaHoc || ""}
        studentCheckInfo={studentCheckInfo}
        rows={datJourneyRows}
      />
    </>
  );
};

export default FailRecordDetailModal;
