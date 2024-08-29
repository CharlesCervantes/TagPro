import { AxiosError, AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { AxiosCall } from "@/interfaces";

interface FetchAndLoadResult<T> {
  loading: boolean;
  callEndpoint: (axiosCall: AxiosCall<T>) => Promise<AxiosResponse<T>>;
  cancelEndpoint: () => void;
}

export const useFetch = <T>(): FetchAndLoadResult<T> => {
  const [loading, setLoading] = useState(false);
  let controller: AbortController;

  const callEndpoint = async (
    axiosCall: AxiosCall<T>
  ): Promise<AxiosResponse<T>> => {
    if (axiosCall.controller) controller = axiosCall.controller;
    setLoading(true);
    let result: AxiosResponse<T>;
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      result = await axiosCall.call;
      console.log("inside fetch: ", result.status);
    } catch (error) {
      setLoading(false);
      console.error("Error in callEndpoint: ", error);
      throw error as AxiosError;
    }
    setLoading(false);
    return result;
  };

  const cancelEndpoint = () => {
    setLoading(false);
    controller && controller.abort();
  };

  useEffect(() => {
    return () => {
      cancelEndpoint();
    };
  }, []);

  return { loading, callEndpoint, cancelEndpoint };
};
