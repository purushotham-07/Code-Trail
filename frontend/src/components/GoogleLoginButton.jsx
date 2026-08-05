import { useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext.jsx';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton({ text = 'Sign in with Google' }) {
  const { login } = useAuth();
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !CLIENT_ID) return;

    const init = () => {
      if (initializedRef.current || !window.google) return;
      initializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            await login(response.credential);
          } catch (_error) {
            // Handle login failure gracefully.
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        width: 260,
      });
    };

    if (window.google) {
      init();
    } else {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = init;
        document.body.appendChild(script);
      } else {
        existing.addEventListener('load', init);
      }
    }
  }, [login]);

  return (
    <div>
      <div ref={buttonRef} />
      {!CLIENT_ID && (
        <p className="text-sm text-slate-400">
          Set VITE_GOOGLE_CLIENT_ID in your frontend .env to enable Google Sign-In.
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
}