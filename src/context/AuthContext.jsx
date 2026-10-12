import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const demo = localStorage.getItem('multihazard_demo_user');
      return demo ? JSON.parse(demo) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;
    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      }).catch((err) => {
        console.warn('Supabase auth session check failed:', err);
        setLoading(false);
      });

      // Listen for auth changes
      const authListener = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          if (session?.user) {
            setUser(session.user);
          }
          setLoading(false);
        }
      );
      subscription = authListener?.data?.subscription;
    } catch (err) {
      console.warn('Supabase init warning:', err);
      setLoading(false);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loginAsDemo = () => {
    const demoUser = {
      id: 'demo-guest-user',
      email: 'guest@multihazard.ai',
      user_metadata: { full_name: 'Guest Researcher' }
    };
    try {
      localStorage.setItem('multihazard_demo_user', JSON.stringify(demoUser));
    } catch {}
    setUser(demoUser);
    setLoading(false);
    return demoUser;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('multihazard_demo_user');
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const value = { user, session, loading, signUp, signIn, signOut, loginAsDemo };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
