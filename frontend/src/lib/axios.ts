import axios from "axios";

type StoredAuth = {
  token?: string;
};

const AUTH_STORAGE_KEY = "taskflow_auth";

const api = axios.create({
  baseURL: "http://localhost:5007",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return config;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);

      const path = window.location.pathname;
      if (path !== "/login" && path !== "/signup") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { AUTH_STORAGE_KEY };
export default api;
