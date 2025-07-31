import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.scss";
import { router } from './App';
import { ProjectProvider } from "./context/ProjectContext";

const queryClient = new QueryClient();

// Компонент-обгортка для динамічного оновлення userId
const AppWrapper: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    // Функція для оновлення userId
    const updateUserId = () => {
      const currentUserId = localStorage.getItem('userId') ?? '';
      console.log('AppWrapper: Updating userId to:', currentUserId);
      setUserId(currentUserId);
    };

    // Оновлюємо userId при першому завантаженні
    updateUserId();

    // Слухаємо зміни в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userId') {
        console.log('AppWrapper: localStorage userId changed:', e.newValue);
        updateUserId();
      }
    };

    // Слухаємо зміни в localStorage (для інших вкладок)
    window.addEventListener('storage', handleStorageChange);

    // Також оновлюємо userId кожні 100мс для надійності
    const interval = setInterval(updateUserId, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  console.log('AppWrapper: Rendering with userId:', userId);
  
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