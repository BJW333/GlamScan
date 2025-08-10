import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Camera } from 'lucide-react';
import { PasswordLoginForm } from '../components/PasswordLoginForm';
import { OAuthButtonGroup } from '../components/OAuthButtonGroup';
import { PasswordRegisterForm } from '../components/PasswordRegisterForm';
import { useAuth } from '../helpers/useAuth';
import { AuthLoadingState } from '../components/AuthLoadingState';
import styles from './login.module.css';

function LoginPage() {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialAction = searchParams.get('action') === 'register' ? 'register' : 'login';
  const [formType, setFormType] = useState<'login' | 'register'>(initialAction);

  useEffect(() => {
    if (authState.type === 'authenticated') {
      // Get redirect path from URL params or location state
      const redirectTo = searchParams.get('redirect') || 
                        (location.state as any)?.from?.pathname || 
                        '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [authState, navigate, searchParams, location.state]);

  const toggleForm = () => {
    setFormType(prev => (prev === 'login' ? 'register' : 'login'));
  };

  if (authState.type === 'loading') {
    return <AuthLoadingState title="Checking authentication..." />;
  }

  return (
    <>
      <Helmet>
        <title>{formType === 'login' ? 'Login' : 'Sign Up'} | GlamScan</title>
        <meta name="description" content={`Access your GlamScan account or create a new one to get personalized style recommendations.`} />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Link to="/" className={styles.logoLink}>
              <Camera className={styles.logoIcon} />
              <h1 className={styles.appName}>GlamScan</h1>
            </Link>
            <h2 className={styles.title}>
              {formType === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className={styles.subtitle}>
              {formType === 'login'
                ? 'Log in to continue your style journey.'
                : 'Sign up to discover your perfect look.'}
            </p>
          </div>

          <div className={styles.formContainer}>
            {formType === 'login' ? <PasswordLoginForm /> : <PasswordRegisterForm />}
          </div>

          <div className={styles.separator}>
            <span>OR</span>
          </div>

          <OAuthButtonGroup />

          <div className={styles.footer}>
            <p>
              {formType === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={toggleForm} className={styles.toggleButton}>
                {formType === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;