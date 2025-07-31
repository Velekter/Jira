import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.scss";
import { router } from './App';
import { ProjectProvider } from "./context/ProjectContext";

const queryClient = new QueryClient();

const AppWrapper: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    const updateUserId = () => {
      const currentUserId = localStorage.getItem('userId') ?? '';
      setUserId(currentUserId);
    };
    updateUserId();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userId') {
        updateUserId();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateUserId, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  return (
    <ProjectProvider userId={userId}>
      <RouterProvider router={router} />
    </ProjectProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWrapper />
    </QueryClientProvider>
  </React.StrictMode>
);