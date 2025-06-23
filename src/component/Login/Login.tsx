import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../lib/firebase';

import './login.scss';
import buttonImg from './img/button.png';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    try {
      await loginUser(email, password);
      navigate('/account');
    } catch (err) {
      console.error('Login error:', err);
      setError((err as Error).message || 'Invalid email or password.');
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
          onChange={e => setEmail(e.target.value)}
        />

        <div>
          <label className="label">Password</label>
          <input
            className="input password"
            placeholder="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button>
            <img src=''/>
          </button>
        </div>

        {error && <p className="errorMessage">{error}</p>}

        <div className="buttons">
          <button className="sign" onClick={handleSubmit}>
            Sign In
            <img src={buttonImg} alt="icon" />
          </button>
          <button>Sign In With Google</button>
        </div>
      </div>
    </div>
  );
}
