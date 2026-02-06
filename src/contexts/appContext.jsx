/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [globalData, setGlobalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppContext.Provider
      value={{ globalData, setGlobalData, isLoading, setIsLoading }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
