'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        // 1. Check if there is a 'code' query parameter in the URL (PKCE Flow)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.push('/');
            return;
          } else {
            console.error('Code exchange error:', error);
            router.push('/login?error=code_exchange_failed');
            return;
          }
        }

        // 2. Check if a session already exists (Implicit Flow - hash parsed automatically by SDK)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/');
          return;
        }

        // 3. Set up a listener for auth state changes in case implicit token is being processed
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            router.push('/');
            subscription.unsubscribe();
          }
        });

        // 4. Fallback/Safety timeout
        const timer = setTimeout(() => {
          subscription.unsubscribe();
          router.push('/login?error=oauth_timeout');
        }, 5000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err) {
        console.error('Callback handler exception:', err);
        router.push('/login?error=callback_exception');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Completing secure authentication...</p>
    </div>
  );
}

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080f0a',
    color: '#f3f4f6',
    fontFamily: 'sans-serif',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(16, 185, 129, 0.1)',
    borderTop: '3px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
