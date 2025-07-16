import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../lib/auth';
import './register.scss';
import Back from '../Back/Back';
import eyeShow from '../Login/img/show.svg';
import eyeHide from '../Login/img/hide.svg';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
}

const Register: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [showPasswordFirst, setShowPasswordFirst] = useState<boolean>(false);
  const [showPasswordSecond, setShowPasswordSecond] = useState<boolean>(false);
  const navigate = useNavigate();

  const { mutate, isPending, isError, error, isSuccess } = useMutation<
    { user: any; token: string },
    Error,
    RegisterFormData
  >({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/account');
    },
    onError: (error: Error) => {
      setErrors([error.message]);
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    let newErrors: string[] = [];

    if (!data.fullName || data.fullName.trim().length < 3) {
      newErrors.push('Full Name must be at least 3 characters long.');
    }

    if (!data.email || !data.email.includes('@')) {
      newErrors.push('Invalid email address.');
    }

    if (!data.password || data.password.length < 6) {
      newErrors.push('Password must be at least 6 characters long.');
    }

    if (data.password !== data.password2) {
      newErrors.push('Passwords do not match.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);

    mutate({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
    });
  }

  return (
    <div className="register-page" data-testid="signup-page">
      <form onSubmit={handleSubmit} className="container" noValidate>
        <Back page={'/'} />
        <h1 className="title">Create Your Account</h1>
        <p className="description">Enter your details to get started</p>

        <label htmlFor="fullName" className="label">
          Full Name
        </label>
        <input id="fullName" className="input" type="text" name="fullName" />

        <label htmlFor="email" className="label">
          Email Address
        </label>
        <input id="email" className="input" type="email" name="email" />

        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="input-wrapper">
          <input
            id="password"
            className="input password"
            type={showPasswordFirst ? 'text' : 'password'}
            name="password"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPasswordFirst(prev => !prev)}
            aria-label="Toggle password visibility"
            data-testid="submit-input"
          >
            <img src={showPasswordFirst ? eyeHide : eyeShow} alt="Toggle password" />
          </button>
        </div >
        <label htmlFor="password2" className="label">
          Confirm Password
        </label>
        <div className="input-wrapper">
          <input
            id="password2"
            className="input password"
            type={showPasswordSecond ? 'text' : 'password'}
            name="password2"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPasswordSecond(prev => !prev)}
            aria-label="Toggle password visibility"
            data-testid="submit-input"
          >
            <img src={showPasswordSecond ? eyeHide : eyeShow} alt="Toggle password" />
          </button>
        </div>

        {errors.length > 0 && (
          <ul className="errorMessage">
            {errors.map((errorMsg, index) => (
              <li key={index}>{errorMsg}</li>
            ))}
          </ul>
        )}

        {isError && <p className="errorMessage">{error?.message || 'Registration error'}</p>}

        {isSuccess && <p className="successMessage">User successfully registered!</p>}

        <div className="buttons">
          <button
            type="submit"
            className={`sign ${isPending ? 'savingButton' : ''}`}
            disabled={isPending}
          >
            {isPending ? 'Saving user data...' : 'Sign Up'}
          </button>
          {/*           <button type="button">Sign Up With Google</button> */}
        </div>
      </form>
    </div>
  );
};

export default Register;
