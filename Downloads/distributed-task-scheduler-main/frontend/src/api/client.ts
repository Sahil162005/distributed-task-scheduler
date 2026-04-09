import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:5007",
  withCredentials: true,
});

axios.defaults.withCredentials = true;
