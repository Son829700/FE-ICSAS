import { useState, useCallback } from "react";
// import { useAuthContext } from "../context/AuthContext";

interface FetchError extends Error {
  status?: number;
  messageFromServer?: string;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const useFetch = <T = unknown>(defaultUrl: string) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<FetchError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // // Nếu không dùng user thì có thể bỏ dòng này
  // const { user } = useAuthContext();

  const request = useCallback(
    async (
      url: string = defaultUrl,
      method: HttpMethod = "GET",
      body: unknown = null,
      headers: Record<string, string> = {}
    ): Promise<T | string | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");

        const options: RequestInit = {
          method,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
        };

        if (body instanceof FormData) {
          options.body = body;
          if (options.headers && "Content-Type" in options.headers) {
            delete (options.headers as Record<string, string>)["Content-Type"];
          }
        } else if (body !== null) {
          options.body = JSON.stringify(body);

          if (
            options.headers &&
            !(options.headers as Record<string, string>)["Content-Type"]
          ) {
            (options.headers as Record<string, string>)["Content-Type"] =
              "application/json";
          }
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          let errorText: string;

          try {
            const json = await response.json();
            errorText = JSON.stringify(json);
          } catch {
            errorText = await response.text();
          }

          const err: FetchError = new Error(
            `Error: ${response.status} - ${errorText}`
          );
          err.status = response.status;

          try {
            const parsed = JSON.parse(errorText);
            if (parsed?.message) {
              err.messageFromServer = parsed.message;
            }
          } catch {
            err.messageFromServer = errorText;
          }

          throw err;
        }

        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const responseData = await response.json();

          if (
            responseData &&
            typeof responseData === "object" &&
            "data" in responseData
          ) {
            setData(responseData.data);
            return responseData.data as T;
          }

          setData(responseData);
          return responseData as T;
        }

        if (contentType?.includes("text/plain")) {
          const responseText = await response.text();
          setData(responseText as unknown as T);
          return responseText;
        }

        return null;
      } catch (err) {
        const fetchError = err as FetchError;
        console.error("Fetch error:", fetchError);
        setError(fetchError);
        throw fetchError;
      } finally {
        setLoading(false);
      }
    },
    [defaultUrl]
  );

  const get = useCallback(
    (url: string = defaultUrl) => request(url, "GET"),
    [request, defaultUrl]
  );

  const post = useCallback(
    (
      body: unknown,
      headers?: Record<string, string>,
      url: string = defaultUrl
    ) => request(url, "POST", body, headers),
    [request, defaultUrl]
  );

  const put = useCallback(
    (
      body: unknown,
      headers?: Record<string, string>,
      url: string = defaultUrl
    ) => request(url, "PUT", body, headers),
    [request, defaultUrl]
  );

  return { data, error, loading, get, post, put };
};

export default useFetch;