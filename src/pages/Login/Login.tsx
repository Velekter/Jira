import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../lib/firebase";
import classes from "./Login.module.scss";
import buttonImg from "./img/button.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const user = await loginUser(email, password);
      const token = await user.getIdToken();

      localStorage.setItem("token", token);
    } catch (err) {
      setError("Invalid email or password.");
    }

    return navigate("/");
  };

  return (
    <div className={classes.page} data-testid="login-page">
      <div className={classes.container}>
        <h1 className={classes.title}>Sign In To Your Account.</h1>
        <p className={classes.description}>Enter your details to continue</p>

        <label className={classes.label}>Email Address</label>
        <input
          className={`${classes.input} ${classes.email}`}
          placeholder="email@gmail.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className={classes.label}>Password</label>
        <input
          className={`${classes.input} ${classes.password}`}
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className={classes.errorMessage}>{error}</p>}

        <div className={classes.buttons}>
          <button className={classes.sing} onClick={handleLogin}>
            Sign In
            <img src={buttonImg} alt="icon" />
          </button>
          <button>Sign In With Google</button>
        </div>
      </div>
    </div>
  );
}
