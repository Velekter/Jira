import { createBrowserRouter } from 'react-router-dom';

import LoginPage from './pages/LoginPage.tsx';
import WelcomePage from './pages/WelcomePage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ErrorPage from './pages/Error/ErrorPage.tsx';
import AccountPage from './pages/AccountPage.tsx';
import { checkAuthLoader } from './lib/auth.ts';
import UserProfilePage from './pages/UserProfilePage.tsx';
import FriendPage from './pages/FriendPage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WelcomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/account',
    element: <AccountPage />,
    loader: checkAuthLoader,
  },
  {
    path: '/account/profile',
    element: <UserProfilePage />,
    loader: checkAuthLoader,
  },
  {
    path: '/account/friend',
    element: <FriendPage />,
    loader: checkAuthLoader,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);
