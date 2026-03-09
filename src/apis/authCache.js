import { DangNhapLopLyThuyet } from "./auth";

let loginPromise = null;
let loginData = null;
let loginExpireAt = 0;

export const getCachedLogin = async () => {
  const now = Date.now();

  if (loginData && now < loginExpireAt) return loginData;

  if (loginPromise) return loginPromise;

  loginPromise = DangNhapLopLyThuyet()
    .then((res) => {
      loginData = res?.result;
      loginExpireAt = Date.now() + 1000 * 60 * 30; // cache 30 phút
      loginPromise = null;
      return loginData;
    })
    .catch((err) => {
      loginPromise = null;
      throw err;
    });

  return loginPromise;
};

export const invalidateCachedLogin = () => {
  loginData = null;
  loginExpireAt = 0;
  loginPromise = null;
};
