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
} from "antd";
import {
  DownloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { courseOptions } from "../../apis/khoaHoc";

const { Title, Text } = Typography;

const KiemTraHangLoat = () => {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState(""); // Lưu ID hoặc MaKhoaHoc được chọn

  const abortControllerRef = useRef(null);
  const resultsRef = useRef(null);

  const datCount = results.filter((r) => r.status === "Đạt").length;
  const chuaDatCount = results.filter((r) => r.status === "Chưa đạt").length;

  // Lấy danh sách khóa học từ API
  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["khoahocOptions"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5, // 5 phút
    keepPreviousData: true,
  });

  // Chuẩn bị options cho Select: value = ID (hoặc MaKhoaHoc), label = Ten (tên khóa học)
  const khoaHocOptions = useMemo(() => {
    const options = dataKhoaHoc?.data?.Data || [];

    return [
      { label: "Tất cả khóa học", value: "" },
      ...options.map((kh) => ({
        label: kh.Ten || kh.MaKhoaHoc || "Không có tên", // Ưu tiên Ten, fallback MaKhoaHoc
        value: kh.ID || kh.MaKhoaHoc || kh.MaCSDT || "", // Ưu tiên ID nếu có
      })),
    ];
  }, [dataKhoaHoc]);

  // Giả lập API kiểm tra (thay bằng API thật, có thể truyền selectedKhoaHoc nếu cần lọc theo khóa)
  const checkCode = async (code, signal) => {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 500 + Math.random() * 800);
      signal.addEventListener("abort", () => clearTimeout(timer));
    });

    if (signal.aborted) throw new Error("Đã dừng");

    // Ví dụ API thật (bạn thay thế):
    // const res = await fetch(`/api/kiem-tra-hoc-vien?code=${code}&khoahoc=${selectedKhoaHoc}`, { signal });
    // ...

    const isDat = Math.random() > 0.35;
    return { code, status: isDat ? "Đạt" : "Chưa đạt" };
  };

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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newResults = [];

    try {
      for (let i = 0; i < codes.length; i++) {
        if (controller.signal.aborted) break;

        const code = codes[i];
        try {
          const result = await checkCode(code, controller.signal);
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
          message.error(`Lỗi kiểm tra mã ${code}: ${err.message}`);
        }
      }

      if (!controller.signal.aborted) {
        message.success(
          `Hoàn tất! Đạt: ${datCount} | Chưa đạt: ${chuaDatCount}`,
        );
      }
    } catch (err) {
      message.error("Quá trình bị gián đoạn");
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [inputText, datCount, chuaDatCount]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      message.info("Đã dừng kiểm tra");
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

  return (
    <Card className="max-w-5xl !mx-auto shadow-2xl rounded-2xl overflow-hidden border-0">
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Kiểm tra học viên toàn khóa
      </h1>
      <p className="text-[#64748b] text-sm">
        Đồng bộ và theo dõi tiến độ học viên theo lớp.
      </p>

      <Row gutter={[18, 18]} className="mt-8" align="bottom">
        <Col xs={24} sm={12} md={8} lg={6}>
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
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="mt-6 sm:mt-0">
            <Button
              type="primary"
              icon={isRunning ? <StopOutlined /> : <PlayCircleOutlined />}
              size="middle"
              onClick={isRunning ? handleStop : handleRun}
              danger={isRunning}
              loading={isRunning && !abortControllerRef.current?.signal.aborted}
              disabled={!isRunning && !inputText.trim()}
              block
            >
              {isRunning ? "DỪNG KIỂM TRA" : "BẮT ĐẦU KIỂM TRA"}
            </Button>
          </div>
        </Col>
      </Row>

      <div className="mt-2 pb-4">
        <Progress
          percent={progress}
          status="active"
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#1890ff",
          }}
          showInfo={false}
        />
      </div>

      <Divider />

      {/* Kết quả */}
      <div className="px-0 pb-8">
        {results.length === 0 ? (
          <div className="text-center py-16 text-gray-500 italic">
            {isRunning ? "Đang xử lý..." : "Chưa bắt đầu kiểm tra."}
          </div>
        ) : (
          <div
            ref={resultsRef}
            className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl divide-y bg-white shadow-inner"
          >
            {results.map((item, idx) => (
              <div
                key={idx}
                className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <Text code className="text-base font-medium">
                  {item.code}
                </Text>
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${
                    item.status === "Đạt"
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-red-50 text-red-700 border-red-300"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 bg-green-50/60 p-6 rounded-2xl border border-green-200 text-center">
            <div className="text-xl font-bold mb-5 space-x-10">
              <span className="text-green-700">Đạt: {datCount}</span>
              <span className="text-gray-400">•</span>
              <span className="text-red-700">Chưa đạt: {chuaDatCount}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                type="default"
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
                type="default"
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
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KiemTraHangLoat;
