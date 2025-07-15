import { Link } from 'react-router-dom';
import './back.scss'

function Back() {
  return (
    <Link to="/account" className="back-button">
      ← Back
    </Link>
  );
}

export default Back;
