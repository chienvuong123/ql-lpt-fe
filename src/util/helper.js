export const renderImage = (imageData) => {
  if (!imageData) {
    return "/default-avatar.png";
  }

  if (imageData.startsWith("http") || imageData.startsWith("/")) {
    return imageData;
  }

  return `data:image/jp2;base64,${imageData}`;
};

export const buildParams = (extra = {}) => {
  const base = {
    "status[]": ["created", "approved", "ready_to_execute", "executed"],
    "organizations[]": ["22197961"],
    "_sand_expand[]": [
      "organizations",
      "academic_categories",
      "training_plan_iid",
      "program",
      "learning_stats",
    ],
    include_sub_organizations: 1,
    include_items_from_ancestor_organizations: 1,
    submit: 1,
    items_per_page: 200,
    page: 1,
    _sand_ajax: 1,
    _sand_platform: 3,
    _sand_readmin: 1,
    _sand_is_wan: false,
    _sand_ga_sessionToken: "",
    _sand_ga_browserToken: "",
    _sand_domain: "lapphuongthanh",
    _sand_masked: "",
    _sand_use_internal_network: 0,
    allow_cache_api_cdn: 1,
    _sand_user_agent: navigator.userAgent,
    _sand_get_total: 0,
    ...extra, // ghi đè hoặc thêm params tìm kiếm
  };

  const params = new URLSearchParams();
  Object.entries(base).forEach(([key, value]) => {
    [].concat(value).forEach((v) => params.append(key, v));
  });

  return params.toString();
};

export const getEndOfToday = () => {
  const now = new Date();

  // Lấy Năm-Tháng-Ngày
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Nối chuỗi với giờ cuối ngày
  return `${year}-${month}-${day} 23:59:59`;
};

import dayjs from "dayjs";

/**
 * Hàm format ngày giờ chuyên dụng cho dữ liệu từ SQL Server (DATETIME2)
 * @param {string} dateString - Chuỗi ngày tháng từ API (vd: 2026-03-09T13:41:54.000Z)
 * @param {string} formatStr - Định dạng mong muốn (mặc định là DD/MM/YYYY HH:mm)
 * @returns {string} - Chuỗi đã format, giữ nguyên giờ gốc
 */
export const formatLocalTime = (dateString, formatStr = "DD/MM/YYYY HH:mm") => {
  if (!dateString) return "-";
  const cleanDate = dateString.toString().replace("Z", "").split(".")[0];

  return dayjs(cleanDate).format(formatStr);
};

export const getFirstDayOfMonthEnd = () => {
  return dayjs().startOf("month").format("YYYY-MM-DD 23:59:59");
};
