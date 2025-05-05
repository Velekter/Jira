import React from "react";
import { Link } from "react-router-dom";
import classes from "./Welcome.module.scss";

const WelcomePage: React.FC = () => {
  return (
    <div className={classes.page}>
      <div className={classes.container}>
        <h1 className={classes.title}>Welcome to the Jira Kanban Board</h1>
        <p className={classes.description}>
          This is a simple Kanban board inspired by Jira to help you manage
          tasks effectively.
        </p>
        <div className={classes.buttons}>
          <Link to="/login" className={`${classes.button} ${classes.login}`} data-testid='login-link'>
            Login
          </Link>
          <Link
            to="/register"
            className={`${classes.button} ${classes.register}`}
            data-testid='register-link'
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
