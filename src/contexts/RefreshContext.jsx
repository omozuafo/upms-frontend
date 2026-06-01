import { createContext, useState, useContext, useCallback } from "react";

const RefreshContext = createContext(null);

export const RefreshProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};
