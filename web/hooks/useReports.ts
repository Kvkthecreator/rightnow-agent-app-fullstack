import useSWR from "swr";
import type { Report } from "@/lib/types";
import { apiGet } from "@/lib/api";

/**
 * Fetches the list of reports for the current user.
 */
export const useReports = () => {
  const { data, error, isLoading } = useSWR<Report[]>(
    "/reports",
    apiGet
  );
  return { reports: data, isLoading, isError: !!error };
};