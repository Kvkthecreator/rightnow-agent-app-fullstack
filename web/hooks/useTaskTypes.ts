import useSWR from "swr";

export interface TaskType {
  id: string;
  title: string;
  description: string;
  output_type: string;
  /** dynamic inputs the form must render */
  input_fields: {
    name: string;
    label: string;
    type: string;         // "string" | "url" | "number" | "list" …
  }[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const useTaskTypes = () => {
  const { data, error } = useSWR<TaskType[]>("/api/task-types", fetcher);
  return {
    taskTypes: data,
    isLoading: !error && !data,
    isError: error,
  };
};