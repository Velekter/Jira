import { registerUser } from "../../lib/firebase";
import "./register.scss";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  password2: string;
}

const Register: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  const { mutate, isPending, isError, error, isSuccess } = useMutation<
    void,
    Error,
    RegisterFormData
  >({
    mutationFn: async (data) => {
      try {
        await registerUser(data.email, data.password, data.fullName);
      } catch (error) {
        console.error("Error registering user:", error);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fd = new FormData(event.currentTarget);
    const data = Object.fromEntries(fd.entries()) as {
      fullName: string;
      email: string;
      password: string;
      password2: string;
    };

    let newErrors: string[] = [];

    if (!data.fullName || data.fullName.trim().length < 3) {
      newErrors.push("Full Name must be at least 3 characters long.");
    }

    if (!data.email || !data.email.includes("@")) {
      newErrors.push("Invalid email address.");
    }

    if (!data.password || data.password.length < 6) {
      newErrors.push("Password must be at least 6 characters long.");
    }

    if (data.password !== data.password2) {
      newErrors.push("Passwords do not match.");
    }

    setErrors(newErrors);

    if (newErrors.length > 0) {
      return;
    }

    mutate(data);

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  }

  return (
    <div className="register-page" data-testid="signup-page">
      <form onSubmit={handleSubmit} className="container">
        <h1 className="title">Create Your Account</h1>
        <p className="description">Enter your details to get started</p>

        <label className="label">Full Name</label>
        <input className="input" type="text" name="fullName" />

        <label className="label">Email Address</label>
        <input className="input" type="email" name="email" />

        <label className="label">Password</label>
        <input className="input" type="password" name="password" />

        <label className="label">Confirm Password</label>
        <input className="input" type="password" name="password2" />

        {errors.length > 0 && (
          <ul className="errorMessage">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}

        {isError && <p className="errorMessage">{(error as Error).message}</p>}
        {isSuccess && (
          <p className="successMessage">User successfully registered!</p>
        )}

        <div className="buttons">
          <button
            type="submit"
            className={`sign ${isPending ? "savingButton" : ""}`}
            disabled={isPending}
          >
            {isPending ? "Saving user data..." : "Sign Up"}
          </button>
          <button >Sign Up With Google</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
