import React from "react";
import { Link } from "react-router-dom";
import "./welcome.scss";

export default function Welcome() {
  return (
    <div className="welcome-page">
      <div className="container">
        <h1 className="title">Welcome to the Jira Kanban Board</h1>
        <p className="description">
          This is a simple Kanban board inspired by Jira to help you manage
          tasks effectively.
        </p>
        <div className="buttons">
          <Link to="/login" className="button login" data-testid="login-link">
            Login
          </Link>
          <Link
            to="/register"
            className="button register"
            data-testid="register-link"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
