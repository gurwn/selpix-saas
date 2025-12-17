import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const defaultAxiosInstance = axios.create();

const createPostMethod = (instance: AxiosInstance) => {
  return async <T, D = Record<string, unknown>>(
    url: string,
    data: D,
    options?: AxiosRequestConfig<D>
  ): Promise<T> => {
    const response: AxiosResponse<T> = await instance.post(url, data, options);
    return response.data;
  };
};

export const api = {
  post: createPostMethod(defaultAxiosInstance),

  createClient: (baseURL: string, headers: Record<string, string>) => {
    const clientInstance = axios.create({
      baseURL,
      headers,
    });

    return {
      post: createPostMethod(clientInstance),
    };
  },
};

export { isAxiosError } from "axios";
