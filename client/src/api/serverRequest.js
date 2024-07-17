import Cookies from "js-cookie";

const AUTH_TOKEN = "apiToken";

export const getAuthToken = () => {
  try {
    return Cookies.get(AUTH_TOKEN);
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  Cookies.set(AUTH_TOKEN, token);
};

export const removeAuthToken = () => {
  Cookies.remove(AUTH_TOKEN);
};

export const RequestTypes = {
  Put: "PUT",
  Delete: "DELETE",
  Post: "POST",
  Get: "GET",
};

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export const dashincubatorRequest = async (
  url,
  method = RequestTypes.Get,
  data = {},
  headers = {},
  useDefaultHeaders = true
) => {
  url = `${process.env.REACT_APP_API_URL}/${url}`;
  if (useDefaultHeaders) {
    headers = { ...headers, ...defaultHeaders };
  }

  const authToken = getAuthToken();
  if (authToken) {
    headers["authorization"] = `Bearer ${authToken}`;

    // debug
    console.log("Sending token:", authToken);
  }

  const request = {
    headers,
    method,
  };
  if (method !== RequestTypes.Get) {
    request.body = JSON.stringify(data);
  }
  return fetch(url, request);
};
