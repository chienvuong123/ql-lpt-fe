import axios from "axios";
import { apiClient } from "./clientApi";

export const DanhSachHocVien = async (params) => {
  return apiClient({
    method: "get",
    url: "/HocVienTH",
    params,
  });
};

export const DanhSachKhoaHoc = async () => {
  return apiClient({
    method: "get",
    url: "/course",
  });
};

export const HanhTrinh = async (params) => {
  return apiClient({
    method: "get",
    url: "/HanhTrinh",
    params,
  });
};

export const getHocVienCheck = async (maHocVien) => {
  const response = await axios.get(
    `http://localhost:3000/api/hoc-vien/${maHocVien}/check`,
  );

  return response.data;
};

export const updateHocVienCheck = async (maHocVien, payload) => {
  const response = await axios.put(
    `http://localhost:3000/api/hoc-vien/${maHocVien}/check`,
    payload,
  );

  return response.data;
};

export const hocVienTheoKhoa = async (enrolment_plan_iid) => {
  const userInfoString = sessionStorage.getItem("user_info");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

  const data = new URLSearchParams();

  // single fields
  data.append("_sand_get_total", 0);
  data.append("user_organizations[0]", "22197961");
  data.append("include_sub_organizations", 1);
  data.append("include_items_that_not_under_of_organization", 0);
  data.append("show_items_that_not_under_of_organization", 0);
  data.append("include_items_that_not_in_any_organization", 0);
  data.append("statuses[0]", "activated");
  data.append("requireOrganization", 1);
  data.append("includeRootOrganizations", 1);
  data.append("getOnlyOrganizationWhereUserHasPermission", 1);
  data.append("enrolment_plan_iid", enrolment_plan_iid);
  data.append("rubric_iid", "28113712");
  data.append("get_note", 1);
  data.append("submit", 1);
  data.append("page", 1);
  data.append("items_per_page", 150);

  // _sand_expand
  [
    "user.positions",
    "last_login_info",
    "today_gained_kpi_time",
    "user.phongbans",
    "relations_with_groups.relations.r",
  ].forEach((v, i) => data.append(`_sand_expand[${i}]`, v));

  // sand fields
  data.append("_sand_ajax", 1);
  data.append("_sand_platform", 3);
  data.append("_sand_readmin", 1);
  data.append("_sand_is_wan", false);
  data.append("_sand_ga_sessionToken", "");
  data.append("_sand_ga_browserToken", "");
  data.append("_sand_domain", "lapphuongthanh");
  data.append("_sand_masked", "");
  data.append(
    "_sand_web_url",
    `https://lapphuongthanh.huelms.com/admin/enrolment-plan/${enrolment_plan_iid}/members`,
  );
  data.append("_sand_device_uuid", "56a5c298-9e07-4674-8ed1-052225b3f806");
  data.append("_sand_session_id", userInfo?.session_id);
  data.append("_sand_use_internal_network", 0);
  data.append("allow_cache_api_cdn", 1);
  data.append("_sand_token", userInfo?.token);
  data.append("_sand_uiid", userInfo?.iid);
  data.append("_sand_uid", userInfo?.id);
  data.append("_sand_user_agent", navigator.userAgent);

  const response = await axios.post(
    "https://staging-api.lotuslms.com/api/v2/enrolment-plan/search-members",
    data,
  );

  return response.data;
};
