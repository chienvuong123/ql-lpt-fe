// KiemTraHangLoat.jsx
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Button,
  Progress,
  Typography,
  Card,
  Divider,
  message,
  Row,
  Col,
  Select,
  Input,
  Tag,
  Collapse,
  Badge,
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
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { courseOptions } from "../../apis/khoaHoc";
import { HanhTrinh } from "../../apis/hocVien";
import { computeSummary, evaluate } from "./DieuKienKiemTra";

const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

// ─── Gọi API và đánh giá một mã học viên ─────────────────────────────────────
async function checkOneCode(code, selectedKhoaHoc, signal) {
  if (signal.aborted) throw new DOMException("Đã dừng", "AbortError");

  // Gọi API lấy hành trình
  const response = await HanhTrinh({
    ngaybatdau: "2020-01-01",
    ngayketthuc: "2026-12-31",
    ten: code,
    makhoahoc: selectedKhoaHoc,
    limit: 20, // lấy đủ toàn bộ phiên
    page: 1,
  });

  if (signal.aborted) throw new DOMException("Đã dừng", "AbortError");

  // Tuỳ cấu trúc API của bạn, điều chỉnh đường dẫn data ở đây
  const dataSource =
    response?.data?.Data || response?.data?.data || response?.Data || [];
  const hangDaoTao = response?.data?.HangDaoTao || "";

  const summary = computeSummary(dataSource, hangDaoTao);
  const evaluation = evaluate(summary, dataSource);

  return {
    code,
    status: evaluation.status === "pass" ? "Đạt" : "Chưa đạt",
    errors: evaluation.errors,
    warnings: evaluation.warnings,
    summary,
  };
}

// ─── Component chính ──────────────────────────────────────────────────────────
const KiemTraHangLoat = () => {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);

  const abortControllerRef = useRef(null);
  const resultsRef = useRef(null);

  const datCount = results.filter((r) => r.status === "Đạt").length;
  const chuaDatCount = results.filter((r) => r.status === "Chưa đạt").length;

  // ── Lấy danh sách khóa học ──
  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["khoahocOptions"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const khoaHocOptions = useMemo(() => {
    const options = dataKhoaHoc?.data?.Data || [];
    return [
      { label: "Tất cả khóa học", value: "" },
      ...options.map((kh) => ({
        label: kh.Ten || kh.MaKhoaHoc || "Không có tên",
        value: kh.MaKhoaHoc || kh.MaKhoaHoc || kh.MaCSDT || "",
      })),
    ];
  }, [dataKhoaHoc]);

  // ── Bắt đầu kiểm tra ──
  const handleRun = useCallback(async () => {
    const codes = inputText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      message.warning("Vui lòng dán ít nhất một mã học viên!");
      return;
    }

    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setExpandedKeys([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newResults = [];

    try {
      for (let i = 0; i < codes.length; i++) {
        if (controller.signal.aborted) break;

        const code = codes[i];
        try {
          const result = await checkOneCode(
            code,
            selectedKhoaHoc,
            controller.signal,
          );
          newResults.push(result);
          setResults([...newResults]);
          setProgress(Math.round(((i + 1) / codes.length) * 100));

          resultsRef.current?.scrollTo({
            top: resultsRef.current.scrollHeight,
            behavior: "smooth",
          });
        } catch (err) {
          if (err.name === "AbortError") break;
          console.error(err);
          // Nếu lỗi API thì ghi nhận là lỗi
          newResults.push({
            code,
            status: "Lỗi",
            errors: [{ type: "error", label: "Lỗi API", message: err.message }],
            warnings: [],
            summary: null,
          });
          setResults([...newResults]);
          setProgress(Math.round(((i + 1) / codes.length) * 100));
        }
      }

      if (!controller.signal.aborted) {
        const finalDat = newResults.filter((r) => r.status === "Đạt").length;
        const finalChuaDat = newResults.filter(
          (r) => r.status === "Chưa đạt",
        ).length;
        message.success(
          `Hoàn tất! Đạt: ${finalDat} | Chưa đạt: ${finalChuaDat}`,
        );
      }
    } catch (err) {
      message.error("Quá trình bị gián đoạn: " + err.message);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [inputText, selectedKhoaHoc]);

  // ── Dừng ──
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      message.info("Đã dừng kiểm tra");
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

  // ── Xuất CSV chi tiết (kèm lý do chưa đạt) ──
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

  return (
    <div>
      <div className="mx-20 mb-6">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Đồng bộ giáo viên vào xe
        </h1>
        <p className="text-[#64748b] text-sm">
          Chọn giáo viên, chọn xe rồi bấm Đồng bộ.
        </p>
      </div>
      <Row gutter={[12, 12]} className="!mx-20">
        <Col xs={24} sm={12} md={10}>
          <Card>
            <h2 className="text-2xl !font-bold text-gray-900 !mb-1">
              Thông tin kiểm tra
            </h2>
            <p className="text-[#64748b] text-sm">
              Dán danh sách mã học viên cần kiểm tra, bạn nên chọn khóa để kiểm
              tra nhanh hơn.
            </p>
            <Row gutter={[18, 18]} className="mt-8" align="bottom">
              <Col xs={24} sm={12} md={7}>
                <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
                  Khóa học
                </label>
                <Select
                  className="w-full"
                  placeholder="-- Chọn khóa học --"
                  loading={loadingKhoaHoc}
                  value={selectedKhoaHoc}
                  onChange={(value) => setSelectedKhoaHoc(value)}
                  options={khoaHocOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Col>

              <Col xs={24} sm={12} md={5}>
                <div className="mt-6 sm:mt-0">
                  <Button
                    type="primary"
                    icon={isRunning ? <StopOutlined /> : <PlayCircleOutlined />}
                    size="middle"
                    onClick={isRunning ? handleStop : handleRun}
                    danger={isRunning}
                    loading={
                      isRunning && !abortControllerRef.current?.signal.aborted
                    }
                    disabled={!isRunning && !inputText.trim()}
                    block
                  >
                    {isRunning ? "DỪNG" : "KIỂM TRA"}
                  </Button>
                </div>
              </Col>
            </Row>

            <Row className="mt-4">
              <TextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Dán danh sách mã học viên (mỗi dòng 1 mã)\nVí dụ:\nn30004-20250620145059557\nn30004-20250620145059558\n...`}
                className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isRunning}
                rows={8}
              />
            </Row>

            {/* ── Progress ── */}
            <Row className="mt-3 pb-2">
              <Progress
                percent={progress}
                status={
                  isRunning ? "active" : progress === 100 ? "success" : "normal"
                }
                strokeColor={{ "0%": "#108ee9", "100%": "#1890ff" }}
              />
            </Row>
          </Card>
          <Card className="!mt-2">
            <div className="flex flex-wraps justify-center gap-3">
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
              >
                Xuất danh sách đạt
              </Button>
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
              >
                Xuất danh sách chưa đạt
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportDetailedCSV}
              >
                Xuất chi tiết điều kiện sai
              </Button>
            </div>
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
                  Danh sách kết quả kiểm tra sẽ hiển thị ở đây. Bạn có thể xem
                  chi tiết
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
                <>
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
                              {/* Số thứ tự */}
                              <span className="text-xs text-gray-400 w-6 text-right">
                                {idx + 1}
                              </span>
                              <Text code className="text-sm font-medium">
                                {item.code}
                              </Text>
                              {/* Badge số lỗi */}
                              {item.errors.length > 0 && (
                                <Badge
                                  count={item.errors.length}
                                  style={{ backgroundColor: "#ef4444" }}
                                  title={`${item.errors.length} điều kiện không đạt`}
                                />
                              )}
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
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KiemTraHangLoat;
