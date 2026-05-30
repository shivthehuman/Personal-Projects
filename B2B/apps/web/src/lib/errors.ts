import axios from "axios";

export function getHttpErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as { error?: string } | undefined;
    if (typeof apiError?.error === "string" && apiError.error.trim().length > 0) {
      return apiError.error;
    }

    const message = typeof error.message === "string" ? error.message : "";
    if (message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
