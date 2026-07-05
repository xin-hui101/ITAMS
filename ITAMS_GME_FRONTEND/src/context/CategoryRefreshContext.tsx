import { createContext, useContext, useState, useCallback } from 'react';

interface CategoryRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const CategoryRefreshContext = createContext<CategoryRefreshContextType>({
  refreshKey:     0,
  triggerRefresh: () => {},
});

export function CategoryRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Increment key to trigger re-fetch in Sidebar
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <CategoryRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </CategoryRefreshContext.Provider>
  );
}

export function useCategoryRefresh() {
  return useContext(CategoryRefreshContext);
}