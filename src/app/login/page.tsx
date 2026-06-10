'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated and loading has finished, redirect to dashboard
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user && data.session === null) {
          setAuthSuccess('Registration successful! Please check your email to verify your account.');
        } else {
          setAuthSuccess('Welcome! Logged in successfully.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading Jharkhand Tourism Portal...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Graphic elements */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>

      <div style={styles.card} className="glass-panel">
        <div style={styles.header}>
          <h1 style={styles.title}>Jharkhand Tourism</h1>
          <p style={styles.subtitle}>Discover the Land of Forests and Waterfalls</p>
        </div>

        {authError && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div style={styles.successAlert}>
            <CheckCircle2 size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span>{authSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
            {isSubmitting ? (
              <span style={styles.spinnerSmall}></span>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} style={{ marginRight: '8px' }} />
                Create Account
              </>
            ) : (
              <>
                <LogIn size={18} style={{ marginRight: '8px' }} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or continue with</span>
        </div>

        <button onClick={signInWithGoogle} style={styles.googleBtn}>
          <svg style={{ marginRight: '10px' }} width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google Account
        </button>

        <div style={styles.toggleFooter}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              style={styles.toggleBtn}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
    zIndex: 1,
    filter: 'blur(40px)',
  },
  bgBlob2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
    zIndex: 1,
    filter: 'blur(40px)',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '40px',
    borderRadius: 'var(--radius-lg)',
    zIndex: 2,
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-primary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    paddingLeft: '48px',
  },
  submitBtn: {
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    marginTop: '8px',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '24px 0',
  },
  dividerText: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '0 12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    position: 'relative',
    zIndex: 2,
    borderRadius: '4px',
  },
  googleBtn: {
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  toggleFooter: {
    textAlign: 'center',
    marginTop: '28px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    padding: 0,
    fontSize: '0.9rem',
    textDecoration: 'underline',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: '#f87171',
    padding: '12px',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: '#34d399',
    padding: '12px',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(16, 185, 129, 0.1)',
    borderTop: '3px solid var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  spinnerSmall: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
