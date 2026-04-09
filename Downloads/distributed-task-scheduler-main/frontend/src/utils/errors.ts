import type { AxiosError } from "axios";

type ErrorResponse = {
  message?: string;
};

export const getApiErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<ErrorResponse>;
  const status = axiosError.response?.status;
  const message = axiosError.response?.data?.message;

  if (status === 401) {
    return "Unauthorized";
  }

  if (status === 403) {
    return "You don't have permission";
  }

  if (status === 500) {
    return "Something went wrong, please try again";
  }

  if (message && message.length > 0) {
    return message;
  }

  return "Something went wrong, please try again";
};
