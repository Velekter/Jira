import React from "react";
import { useUserData } from "../../hooks/useUserData";

const Account: React.FC = () => {
  const userId = localStorage.getItem("userId") ?? "";
  const { data, isLoading, isError, error } = useUserData(userId);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <div>
      <h1>Welcome, {data?.fullName}</h1>
      <p>Email: {data?.email}</p>
    </div>
  );
};

export default Account;
