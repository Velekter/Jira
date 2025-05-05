import { Link } from "react-router-dom";
import classes from "./ErrorPage.module.scss";

export default function ErrorPage() {
  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h1 className={classes.title}>404</h1>
        <p className={classes.text}>Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className={classes.link}>
          Go back home
        </Link>
      </div>
    </div>
  );
}
