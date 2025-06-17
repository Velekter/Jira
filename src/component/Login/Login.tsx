import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../lib/firebase";

import "./login.scss";
import buttonImg from "./img/button.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      await loginUser(email, password);
      navigate("/");
      console.log('Welcome1')
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="login-page" data-testid="login-page">
      <div className="container">
        <h1 className="title">Sign In To Your Account.</h1>
        <p className="description">Enter your details to continue</p>

        <label className="label">Email Address</label>
        <input
          className="input email"
          placeholder="email@gmail.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="label">Password</label>
        <input
          className="input password"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="errorMessage">{error}</p>}

        <div className="buttons">
          <button className="sign" onClick={handleLogin}>
            Sign In
            <img src={buttonImg} alt="icon" />
          </button>
          <button>Sign In With Google</button>
        </div>
      </div>
    </div>
  );
}
