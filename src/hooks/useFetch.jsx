import { useState, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';

const useFetch = (defaultUrl) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  

  const request = useCallback(async (url = defaultUrl, method = 'GET', body = null, headers = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const options = {
        method,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...headers, // Merge custom headers
        },
      };

      if (body instanceof FormData) {
        options.body = body;
        if (options.headers['Content-Type']) {
          delete options.headers['Content-Type'];
        }
      } else if (body !== null) {
        // For non-FormData bodies (e.g., JSON), stringify them
        options.body = JSON.stringify(body);
        // Ensure Content-Type is application/json for JSON bodies
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        let errorText;
        try {
          // Try to parse as JSON first, then fall back to text
          errorText = await response.json();
          errorText = JSON.stringify(errorText);
        } catch (jsonError) {
          errorText = await response.text();
        }
        // throw new Error(`Error: ${response.status} - ${errorText}`);
        const err = new Error(`Error: ${response.status} - ${errorText}`);
        err.status = response.status;

        // Try to extract message if response is JSON
        try {
          const parsed = JSON.parse(errorText);
          if (parsed && parsed.message) {
            err.messageFromServer = parsed.message;
          }
        } catch (e) {
          // fallback: plain string
          err.messageFromServer = errorText;
        }
        throw err;
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          setData(responseData.data);
          return responseData.data;
        }
        setData(responseData);
        return responseData;
      } else if (contentType && contentType.includes('text/plain')) {
        const responseText = await response.text();
        setData(responseText);
        return responseText;
      } else {
        return null;
      }

    } catch (error) {
      console.error('Fetch error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [defaultUrl]);

  const get = useCallback((url = defaultUrl) => request(url, 'GET'), [request, defaultUrl]);
  const post = useCallback((body, headers, url = defaultUrl) => request(url, 'POST', body, headers), [request, defaultUrl]);
  const put = useCallback((body, headers, url = defaultUrl) => request(url, 'PUT', body, headers), [request, defaultUrl]);
  return { data, error, loading, get, post, put };
};

export default useFetch;

