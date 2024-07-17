import React, { createContext, useContext, useReducer } from "react";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import { getAuthToken } from "./api/serverRequest";

const GlobalStateContext = createContext();

const AUTH_TOKEN = getAuthToken();

const initialState = {
  loggedInUser: AUTH_TOKEN ? jwtDecode(AUTH_TOKEN) : null,
  loading: false,
};

// debug
console.log("Initial state:", initialState);

const GlobalStateReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOGGED_IN_USER":
      return {
        ...state,
        loggedInUser: action.loggedInUser,
      };
    case "SIGN_OUT":
      Cookies.remove("apiToken");
      return {
        ...state,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.loading,
      };
    default:
      return state;
  }
};

export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(GlobalStateReducer, initialState);

  return (
    <GlobalStateContext.Provider value={[state, dispatch]}>
      {children}
    </GlobalStateContext.Provider>
  );
};

const useGlobalState = () => {
  const [state, dispatch] = useContext(GlobalStateContext);

  const setLoggedInUser = (loggedInUser) => {
    dispatch({ type: "SET_LOGGED_IN_USER", loggedInUser });
  };
  const setLoading = (loading) => {
    dispatch({ type: "SET_LOADING", loading });
  };
  const signOut = () => {
    dispatch({ type: "SIGN_OUT" });
  };

  return {
    setLoggedInUser,
    setLoading,
    signOut,
    loading: state.loading,
    loggedInUser: state.loggedInUser,
  };
};

export default useGlobalState;
