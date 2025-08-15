import { createContext, useContext, useCallback, ReactNode } from 'react';

interface DataRefreshContextType {
  refreshAllData: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined);

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};

interface DataRefreshProviderProps {
  children: ReactNode;
  onRefresh: () => void;
}

export const DataRefreshProvider = ({ children, onRefresh }: DataRefreshProviderProps) => {
  const refreshAllData = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <DataRefreshContext.Provider value={{ refreshAllData }}>
      {children}
    </DataRefreshContext.Provider>
  );
};