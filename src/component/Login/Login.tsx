import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../lib/firebase';

import './login.scss';
import buttonImg from './img/button.png';
import eyeShow from './img/show.svg';
import eyeHide from './img/hide.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        <label className="label">Password</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            className="input password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label="Toggle password visibility"
          >
            <img src={showPassword ? eyeHide : eyeShow} alt="Toggle password" />
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
