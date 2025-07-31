import { Link } from 'react-router-dom';
import './back.scss';

function Back({ page }: { page: string }) {
  return (
    <Link to={page} className="back-button">
      ← Back
    </Link>
  );
}

export default Back;
