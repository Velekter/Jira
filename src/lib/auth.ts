import { redirect } from "react-router-dom";

export function getAuthToken(): string | null {
  const token = localStorage.getItem("token");
  return token ?? null;
}

export function checkAuthLoader() {
  const token = getAuthToken();

  if (!token) {
    return redirect("/login");
  }
  return null;
}
