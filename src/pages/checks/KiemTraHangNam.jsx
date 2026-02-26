import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Button,
  Progress,
  Typography,
  Card,
  message,
  Row,
  Col,
  Input,
  Badge,
  Upload,
} from "antd";
import {
  DownloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  PlusCircleOutlined,
  UploadOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HanhTrinh } from "../../apis/hocVien";
import { computeSummary, evaluate } from "./DieuKienKiemTraNam";
import {
  fetchCheckStudents,
  importCheckStudentExcel,
} from "../../apis/kiemTra";
import { courseOptions } from "../../apis/khoaHoc";

const { TextArea } = Input;
const { Text } = Typography;

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 0;

// ─── Gọi API và kiểm tra một mã học viên ─────────────────────────────────────
async function checkOneCode(code, signal, studentInfo, maKh) {
  if (signal.aborted) throw new DOMException("Đã dừng", "AbortError");

  const response = await HanhTrinh({
    ngaybatdau: "2020-01-01",
    ngayketthuc: "2026-12-31",
    ten: code,
    makhoahoc: maKh,
    limit: 20,
    page: 1,
  });

  if (signal.aborted) throw new DOMException("Đã dừng", "AbortError");

  const dataSource = response?.data?.Data || [];

  if (dataSource.length === 0) {
    return {
      code,
      status: "Chưa đạt",
      errors: [
        {
          type: "error",
          label: "Chưa có phiên học",
          message: "Không tìm thấy dữ liệu phiên học của học viên này.",
        },
      ],
      warnings: [],
      summary: null,
    };
  }

  const summary = computeSummary(dataSource);
  const evaluation = evaluate(summary, dataSource, studentInfo);

  return {
    code,
    status: evaluation.status === "pass" ? "Đạt" : "Chưa đạt",
    errors: evaluation.errors,
    warnings: evaluation.warnings,
    summary,
  };
}

// ─── Component chính ──────────────────────────────────────────────────────────
const KiemTraHangNam = () => {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState([]);
  // Lưu trữ kết quả đã xử lý để hỗ trợ resume
  const [canResume, setCanResume] = useState(false);

  const abortControllerRef = useRef(null);
  const resultsRef = useRef(null);
  // Ref lưu resultMap và codes hiện tại để resume
  const savedResultMapRef = useRef(new Map());
  const savedCodesRef = useRef([]);

  const queryClient = useQueryClient();

  const datCount = results.filter((r) => r.status === "Đạt").length;
  const chuaDatCount = results.filter((r) => r.status === "Chưa đạt").length;

  const extractCodes = useCallback((data) => {
    const list = data?.data || [];
    return list
      .map((s) => s.maDangKy)
      .filter(Boolean)
      .join("\n");
  }, []);

  const mutation = useMutation({
    mutationFn: ({ file }) => importCheckStudentExcel(file),
    onSuccess: async () => {
      message.success("Nhập dữ liệu thành công!");
      const freshData = await queryClient.fetchQuery({
        queryKey: ["checkStudent"],
        queryFn: () => fetchCheckStudents(),
        staleTime: 0,
      });
      const codes = extractCodes(freshData);
      if (codes) setInputText(codes);
      // Reset resume state khi import mới
      setCanResume(false);
      savedResultMapRef.current = new Map();
      savedCodesRef.current = [];
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Import thất bại!");
    },
  });

  const handleCustomRequest = async ({ file }) => {
    mutation.mutate({ file });
  };

  const { data: dataCheck } = useQuery({
    queryKey: ["checkStudent"],
    queryFn: () => fetchCheckStudents(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const { data: dataKhoaHoc } = useQuery({
    queryKey: ["khoahocOptions"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!dataCheck) return;
    const codes = extractCodes(dataCheck);
    if (codes && !inputText) setInputText(codes);
  }, [dataCheck]); // eslint-disable-line

  const studentMap = React.useMemo(() => {
    const list = dataCheck?.data || [];
    const map = new Map();
    list.forEach((s) => {
      if (s.maDangKy) map.set(s.maDangKy.trim(), s);
    });
    return map;
  }, [dataCheck]);

  const khoaHoc = React.useMemo(() => {
    return dataKhoaHoc?.data?.Data || [];
  }, [dataKhoaHoc]);

  // ── Hàm core chạy kiểm tra (dùng chung cho Run và Resume) ──
  const runCheck = useCallback(
    async (codes, initialResultMap) => {
      setIsRunning(true);
      setProgress(0);
      setExpandedKeys([]);
      setCanResume(false);

      // Lưu codes hiện tại để dùng khi resume
      savedCodesRef.current = codes;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const resultMap = new Map(initialResultMap);
      let completedCount = resultMap.size; // Tính cả kết quả đã có từ trước

      const flushResults = () => {
        const ordered = [];
        for (let i = 0; i < codes.length; i++) {
          if (resultMap.has(i)) ordered.push(resultMap.get(i));
          else break;
        }
        setResults([...ordered]);
      };

      // Hiển thị ngay kết quả cũ (nếu resume)
      if (completedCount > 0) {
        flushResults();
        setProgress(Math.round((completedCount / codes.length) * 100));
      }

      try {
        // Lọc ra các index chưa có kết quả
        const pendingItems = [];
        for (let i = 0; i < codes.length; i++) {
          if (!resultMap.has(i)) {
            pendingItems.push({ code: codes[i], originalIndex: i });
          }
        }

        const batches = [];
        for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
          batches.push(pendingItems.slice(i, i + BATCH_SIZE));
        }

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
          if (controller.signal.aborted) break;

          const batch = batches[batchIdx];

          await Promise.all(
            batch.map(async ({ code, originalIndex }) => {
              if (controller.signal.aborted) return;

              const studentInfo = studentMap.get(code) || null;
              const maKhoaHoc =
                khoaHoc.find((kh) => kh?.Ten === studentInfo?.khoaHoc)
                  ?.MaKhoaHoc || "";

              try {
                const result = await checkOneCode(
                  code,
                  controller.signal,
                  studentInfo,
                  maKhoaHoc,
                );
                resultMap.set(originalIndex, result);
              } catch (err) {
                if (err.name === "AbortError") return;
                console.error(err);
                resultMap.set(originalIndex, {
                  code,
                  status: "Lỗi",
                  errors: [
                    { type: "error", label: "Lỗi API", message: err.message },
                  ],
                  warnings: [],
                  summary: null,
                });
              } finally {
                completedCount++;
                setProgress(Math.round((completedCount / codes.length) * 100));
                flushResults();
                resultsRef.current?.scrollTo({
                  top: resultsRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }
            }),
          );

          if (batchIdx < batches.length - 1 && !controller.signal.aborted) {
            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_BATCHES),
            );
          }
        }

        if (!controller.signal.aborted) {
          const allResults = [...resultMap.values()];
          const finalDat = allResults.filter((r) => r.status === "Đạt").length;
          const finalChuaDat = allResults.filter(
            (r) => r.status === "Chưa đạt",
          ).length;
          message.success(
            `Hoàn tất! Đạt: ${finalDat} | Chưa đạt: ${finalChuaDat}`,
          );
          // Hoàn tất → không cần resume nữa
          savedResultMapRef.current = new Map();
          setCanResume(false);
        } else {
          // Bị dừng → lưu lại để resume
          savedResultMapRef.current = new Map(resultMap);
          setCanResume(true);
        }
      } catch (err) {
        message.error("Quá trình bị gián đoạn: " + err.message);
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [studentMap, khoaHoc],
  );

  // ── Chạy mới hoàn toàn ──
  const handleRun = useCallback(async () => {
    const codes = inputText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      message.warning("Vui lòng dán ít nhất một mã học viên!");
      return;
    }

    // Reset toàn bộ kết quả cũ
    setResults([]);
    savedResultMapRef.current = new Map();
    setCanResume(false);

    await runCheck(codes, new Map());
  }, [inputText, runCheck]);

  // ── Tiếp tục từ chỗ dừng ──
  const handleResume = useCallback(async () => {
    const codes = savedCodesRef.current;
    if (codes.length === 0) {
      message.warning("Không có dữ liệu để tiếp tục!");
      return;
    }
    await runCheck(codes, savedResultMapRef.current);
  }, [runCheck]);

  // ── Dừng ──
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      message.info("Đang dừng... vui lòng chờ batch hiện tại hoàn thành.");
    }
  };

  // ── Xuất CSV ──
  const exportCSV = (list, filename) => {
    if (list.length === 0) {
      message.warning("Danh sách rỗng!");
      return;
    }
    const csv = "Mã học viên\n" + list.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Xuất CSV chi tiết ──
  const exportDetailedCSV = () => {
    const failed = results.filter((r) => r.status === "Chưa đạt");
    if (failed.length === 0) {
      message.warning("Không có học viên chưa đạt!");
      return;
    }
    const rows = [["Mã học viên", "Điều kiện sai", "Chi tiết"]];
    failed.forEach((item) => {
      item.errors.forEach((err) => {
        rows.push([item.code, err.label, err.message]);
      });
    });
    const csv = rows
      .map((r) => r.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "danh-sach-chua-dat-chitiet.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Render badge trạng thái ──
  const StatusBadge = ({ status }) => {
    if (status === "Đạt")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-300">
          <CheckCircleOutlined /> Đạt
        </span>
      );
    if (status === "Lỗi")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
          <ExclamationCircleOutlined /> Lỗi
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-300">
        <CloseCircleOutlined /> Chưa đạt
      </span>
    );
  };

  // Số học viên còn lại chưa kiểm tra
  const remainingCount = canResume
    ? savedCodesRef.current.length - savedResultMapRef.current.size
    : 0;

  return (
    <div>
      <div className="mx-20 mb-6">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Kiểm tra dữ liệu từng năm
        </h1>
        <p className="text-[#64748b] text-sm">
          Kiểm tra dữ liệu học viên, giáo viên theo năm
        </p>
      </div>
      <Row gutter={[12, 12]} className="!mx-20">
        <Col xs={24} sm={12} md={10}>
          <Card>
            <h2 className="text-2xl !font-bold text-gray-900 !mb-1">
              Thông tin kiểm tra
            </h2>
            <p className="text-[#64748b] text-sm">
              Import danh sách học viên trước, sau đó dán mã đăng ký để kiểm
              tra.
            </p>
            <Row gutter={[18, 18]} className="mt-8" align="bottom">
              <Col xs={24} sm={12} md={6}>
                <Upload
                  customRequest={handleCustomRequest}
                  showUploadList={false}
                  accept=".xlsx, .xls"
                  className="!w-full"
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={mutation.isPending}
                    className="!w-full"
                  >
                    {mutation.isPending ? "Đang xử lý..." : "Import Excel"}
                  </Button>
                </Upload>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  size="middle"
                  onClick={handleRun}
                  loading={
                    isRunning && !abortControllerRef.current?.signal.aborted
                  }
                  disabled={isRunning || !inputText.trim()}
                  block
                >
                  KIỂM TRA
                </Button>
              </Col>

              {canResume && !isRunning && (
                <Col xs={24} sm={12} md={7}>
                  <Button
                    type="default"
                    icon={<RedoOutlined />}
                    size="middle"
                    onClick={handleResume}
                    className="!w-full border-blue-400 text-blue-600 hover:border-blue-500 hover:text-blue-700"
                    block
                  >
                    TIẾP TỤC ({remainingCount})
                  </Button>
                </Col>
              )}

              {isRunning && (
                <Col xs={24} sm={12} md={5}>
                  <Button
                    type="primary"
                    icon={<StopOutlined />}
                    size="middle"
                    onClick={handleStop}
                    danger
                    block
                  >
                    DỪNG
                  </Button>
                </Col>
              )}
            </Row>

            <Row className="mt-4">
              <TextArea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  // Nếu người dùng thay đổi input thì reset resume
                  if (canResume) {
                    setCanResume(false);
                    savedResultMapRef.current = new Map();
                    savedCodesRef.current = [];
                  }
                }}
                placeholder={`Dán danh sách mã đăng ký (mỗi dòng 1 mã)\nVí dụ:\n30004-20250219101911410\n30004-20250219101911411\n...`}
                className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isRunning}
                rows={8}
              />
            </Row>

            <Row className="mt-3 pb-2">
              <Progress
                percent={progress}
                status={
                  isRunning
                    ? "active"
                    : progress === 100
                      ? "success"
                      : canResume
                        ? "exception"
                        : "normal"
                }
                strokeColor={{ "0%": "#108ee9", "100%": "#1890ff" }}
              />
            </Row>
          </Card>

          <Card className="!mt-2">
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    exportCSV(
                      results
                        .filter((r) => r.status === "Đạt")
                        .map((r) => r.code),
                      "danh-sach-dat.csv",
                    )
                  }
                  className="w-full"
                >
                  Xuất danh sách đạt
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    exportCSV(
                      results
                        .filter((r) => r.status === "Chưa đạt")
                        .map((r) => r.code),
                      "danh-sach-chua-dat.csv",
                    )
                  }
                  className="w-full"
                >
                  Xuất danh sách chưa đạt
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportDetailedCSV}
                  className="w-full"
                >
                  Xuất chi tiết điều kiện sai
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={14}>
          <Card>
            <Row align="bottom" className="mb-7">
              <Col>
                <h2 className="text-2xl !font-bold text-gray-900 !mb-1">
                  Kết quả kiểm tra
                </h2>
                <p className="text-[#64748b] text-sm">
                  Danh sách kết quả kiểm tra sẽ hiển thị ở đây.
                </p>
              </Col>
              <Col flex="1" className="flex justify-end">
                <div className="text-base font-bold mb-5 flex justify-center gap-4 flex-wrap">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <PlusCircleOutlined /> Tổng: {results.length}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-green-700 flex items-center gap-1.5">
                    <CheckCircleOutlined /> Đạt: {datCount}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-red-700 flex items-center gap-1.5">
                    <CloseCircleOutlined /> Chưa đạt: {chuaDatCount}
                  </span>
                  {results.filter((r) => r.status === "Lỗi").length > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <ExclamationCircleOutlined /> Lỗi:{" "}
                        {results.filter((r) => r.status === "Lỗi").length}
                      </span>
                    </>
                  )}
                </div>
              </Col>
            </Row>

            <div className="px-0 pb-8">
              {results.length === 0 ? (
                <div className="text-center py-16 text-gray-500 italic">
                  {isRunning ? "Đang xử lý..." : "Chưa có thông tin kiểm tra."}
                </div>
              ) : (
                <div
                  ref={resultsRef}
                  className="max-h-[520px] overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner"
                >
                  {results.map((item, idx) => {
                    const hasIssues =
                      item.errors.length > 0 || item.warnings.length > 0;
                    const isExpanded = expandedKeys.includes(idx);

                    return (
                      <div
                        key={idx}
                        className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                          item.status !== "Đạt" ? "bg-red-50/30" : ""
                        }`}
                      >
                        {/* Hàng chính */}
                        <div
                          className={`px-5 py-3.5 flex justify-between items-center ${
                            hasIssues ? "cursor-pointer hover:bg-gray-50" : ""
                          }`}
                          onClick={() => {
                            if (!hasIssues) return;
                            setExpandedKeys((prev) =>
                              prev.includes(idx)
                                ? prev.filter((k) => k !== idx)
                                : [...prev, idx],
                            );
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-6 text-right">
                              {idx + 1}
                            </span>
                            <Text code copyable className="text-sm font-medium">
                              {item.code}
                            </Text>
                            {item.errors.length > 0 &&
                              (item.errors[0]?.label === "Chưa có phiên học" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-300">
                                  Chưa có phiên học
                                </span>
                              ) : (
                                <Badge
                                  count={item.errors.length}
                                  style={{ backgroundColor: "#ef4444" }}
                                  title={`${item.errors.length} điều kiện không đạt`}
                                />
                              ))}
                            {item.warnings.length > 0 && (
                              <Badge
                                count={item.warnings.length}
                                style={{ backgroundColor: "#f59e0b" }}
                                title={`${item.warnings.length} cảnh báo`}
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <StatusBadge status={item.status} />
                            {hasIssues && (
                              <span className="text-xs text-gray-400">
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chi tiết lỗi khi expand */}
                        {isExpanded && hasIssues && (
                          <div className="px-4 pb-4 space-y-1.5">
                            {item.errors.map((err, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5"
                              >
                                <CloseCircleOutlined className="mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold">
                                    [{err.label}]
                                  </span>{" "}
                                  {err.message}
                                </div>
                              </div>
                            ))}
                            {item.warnings.map((warn, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5"
                              >
                                <WarningOutlined className="mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold">
                                    [{warn.label}]
                                  </span>{" "}
                                  {warn.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KiemTraHangNam;
