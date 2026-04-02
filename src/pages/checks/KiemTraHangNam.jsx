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
  Flex,
} from "antd";
import XLSX from "xlsx-js-style";
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
import dayjs from "dayjs";

// ✅ Bỏ hoàn toàn import react-window

const { TextArea } = Input;
const { Text } = Typography;

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 0;
const UI_UPDATE_INTERVAL = 500;

// Virtual scroll constants
const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 10;

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

  const khoaHoc =
    studentInfo?.khoaHoc ||
    studentInfo?.MaKhoaHoc ||
    studentInfo?.maKhoaHoc ||
    "";

  if (dataSource.length === 0) {
    return {
      code,
      tenHV: studentInfo?.hoVaTen,
      ngaySinh: dayjs(studentInfo?.ngaySinh).format("DD/MM/YYYY"),
      khoaHoc,
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
    tenHV: studentInfo?.hoVaTen,
    ngaySinh: dayjs(studentInfo?.ngaySinh).format("DD/MM/YYYY"),
    khoaHoc,
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
  const [canResume, setCanResume] = useState(false);

  // ✅ State cho virtual scroll
  const [scrollTop, setScrollTop] = useState(0);

  const abortControllerRef = useRef(null);
  const resultsRef = useRef(null);
  const savedResultMapRef = useRef(new Map());
  const savedCodesRef = useRef([]);

  const queryClient = useQueryClient();

  const datCount = results.filter((r) => r.status === "Đạt").length;
  const chuaDatCount = results.filter((r) => r.status === "Chưa đạt").length;

  // ✅ Tính toán virtual scroll
  const totalHeight = results.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const endIndex = Math.min(results.length - 1, startIndex + VISIBLE_COUNT + 4);
  const visibleResults = results.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * ITEM_HEIGHT;

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

  // ── Hàm core chạy kiểm tra ──
  const runCheck = useCallback(
    async (codes, initialResultMap) => {
      setIsRunning(true);
      setProgress(0);
      setExpandedKeys([]);
      setCanResume(false);
      setScrollTop(0);

      savedCodesRef.current = codes;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const resultMap = new Map(initialResultMap);
      let completedCount = resultMap.size;

      let pendingFlush = false;

      const flushResults = () => {
        if (pendingFlush) return;
        pendingFlush = true;
        requestAnimationFrame(() => {
          const ordered = [];
          for (let i = 0; i < codes.length; i++) {
            if (resultMap.has(i)) ordered.push(resultMap.get(i));
            else break;
          }
          setResults([...ordered]);
          setProgress(Math.round((completedCount / codes.length) * 100));
          pendingFlush = false;
        });
      };

      const flushInterval = setInterval(flushResults, UI_UPDATE_INTERVAL);

      if (completedCount > 0) {
        flushResults();
      }

      try {
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
              }
            }),
          );

          if (batchIdx < batches.length - 1 && !controller.signal.aborted) {
            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_BATCHES),
            );
          }
        }

        clearInterval(flushInterval);

        // Force final flush
        const ordered = [];
        for (let i = 0; i < codes.length; i++) {
          if (resultMap.has(i)) ordered.push(resultMap.get(i));
          else break;
        }
        setResults([...ordered]);
        setProgress(Math.round((completedCount / codes.length) * 100));

        if (!controller.signal.aborted) {
          const allResults = [...resultMap.values()];
          const finalDat = allResults.filter((r) => r.status === "Đạt").length;
          const finalChuaDat = allResults.filter(
            (r) => r.status === "Chưa đạt",
          ).length;
          message.success(
            `Hoàn tất! Đạt: ${finalDat} | Chưa đạt: ${finalChuaDat}`,
          );
          savedResultMapRef.current = new Map();
          setCanResume(false);
        } else {
          savedResultMapRef.current = new Map(resultMap);
          setCanResume(true);
        }
      } catch (err) {
        clearInterval(flushInterval);
        message.error("Quá trình bị gián đoạn: " + err.message);
      } finally {
        clearInterval(flushInterval);
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [studentMap, khoaHoc],
  );

  const handleRun = useCallback(async () => {
    const codes = inputText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      message.warning("Vui lòng dán ít nhất một mã học viên!");
      return;
    }

    setResults([]);
    savedResultMapRef.current = new Map();
    setCanResume(false);

    await runCheck(codes, new Map());
  }, [inputText, runCheck]);

  const handleResume = useCallback(async () => {
    const codes = savedCodesRef.current;
    if (codes.length === 0) {
      message.warning("Không có dữ liệu để tiếp tục!");
      return;
    }
    await runCheck(codes, savedResultMapRef.current);
  }, [runCheck]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      message.info("Đang dừng... vui lòng chờ batch hiện tại hoàn thành.");
    }
  };

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

  const exportDetailedExcel = () => {
    const failed = results.filter((r) => r.status === "Chưa đạt");
    const filtered = failed.filter(
      (item) =>
        !item.errors.some((err) => err.label === "Chưa có phiên học") &&
        item.errors.some((err) => err.type === "error"),
    );
    if (!filtered.length)
      return message.warning("Không có dữ liệu chưa đạt phù hợp để xuất!");

    const hStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
    };

    const data = [
      [
        "STT",
        "Mã học viên",
        "Họ và tên",
        "Ngày sinh",
        "Khóa",
        "Lỗi sai",
        "Ghi chú",
      ].map((h) => ({ v: h, s: hStyle })),
    ];

    let stt = 1;
    filtered.forEach((item) => {
      console.log(item);

      const joinedLabels = item.errors
        .filter((err) => err.type === "error")
        .map((err) => err.label)
        .join(", ");

      data.push(
        [
          stt++,
          item.code,
          item.tenHV,
          item.ngaySinh,
          item.khoaHoc || "",
          joinedLabels,
          "",
        ].map((v) => ({ v: v || "" })),
      );
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
      { wch: 110 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi tiết");
    XLSX.writeFile(wb, "Ket_Qua_Kiem_Tra.xlsx");
  };

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

  const remainingCount = canResume
    ? savedCodesRef.current.length - savedResultMapRef.current.size
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Kiểm tra dữ liệu từng năm
        </h1>
      </div>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={24}>
          <Card>
            <Row align="bottom">
              <Col span={12}>
                <Flex gap={8}>
                  <Col xs={24} sm={12} md={4}>
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

                  <Col xs={24} sm={12} md={4}>
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
                    <Col xs={24} sm={12} md={5}>
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
                    <Col xs={24} sm={12} md={4}>
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
                </Flex>
              </Col>
              <Col span={12} className="!flex !flex justify-end gap-2">
                <Col span={6}>
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
                <Col span={7}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={exportDetailedExcel}
                    className="w-full"
                  >
                    Xuất chi tiết điều kiện sai
                  </Button>
                </Col>
              </Col>
            </Row>

            <Row className="mt-4">
              <TextArea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (canResume) {
                    setCanResume(false);
                    savedResultMapRef.current = new Map();
                    savedCodesRef.current = [];
                  }
                }}
                placeholder={`Dán danh sách mã đăng ký (mỗi dòng 1 mã)\nVí dụ:\n30004-20250219101911410\n30004-20250219101911411\n...`}
                className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isRunning}
                rows={5}
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
        </Col>

        <Col xs={24} sm={12} md={24}>
          <Card>
            <Row align="bottom" className="mb-5">
              <Col>
                <h2 className="text-xl !font-bold text-gray-900 !mb-1">
                  Kết quả kiểm tra
                </h2>
                <p className="text-[#64748b] text-[13px]">
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

            <div className="px-0 ">
              {results.length === 0 ? (
                // ── Empty state ──
                <div className="text-center py-16 text-gray-500 italic border border-gray-200 rounded-xl">
                  {isRunning ? "Đang xử lý..." : "Chưa có thông tin kiểm tra."}
                </div>
              ) : (
                <>
                  <div
                    ref={resultsRef}
                    className="border border-gray-200 rounded-xl bg-white shadow-inner overflow-y-auto"
                    style={{ height: 380 }}
                    onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                  >
                    <div style={{ height: totalHeight, position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          top: offsetY,
                          width: "100%",
                        }}
                      >
                        {visibleResults.map((item, i) => {
                          const idx = startIndex + i;
                          const hasIssues =
                            item.errors.length > 0 || item.warnings.length > 0;
                          const isExpanded = expandedKeys.includes(idx);

                          return (
                            <div
                              key={idx}
                              style={{ minHeight: ITEM_HEIGHT }}
                              className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                                item.status !== "Đạt" ? "bg-red-50/30" : ""
                              }`}
                            >
                              <div
                                className={`px-5 py-3.5 flex justify-between items-center ${
                                  hasIssues
                                    ? "cursor-pointer hover:bg-gray-50"
                                    : ""
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
                                  <Text
                                    code
                                    copyable
                                    className="text-sm font-medium"
                                  >
                                    {item.code}
                                  </Text>
                                  {item.errors.length > 0 &&
                                    (item.errors[0]?.label ===
                                    "Chưa có phiên học" ? (
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

                              {/* Chi tiết lỗi inline khi expand */}
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
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KiemTraHangNam;
