import { Link } from "react-router-dom";
import "./errorPage.scss";

export default function ErrorPage() {
  return (
    <div className="error-page">
      <div className="content">
        <h1 className="title">404</h1>
        <p className="text">Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className="link">
          Go back home
        </Link>
      </div>
    </div>
  );
}
