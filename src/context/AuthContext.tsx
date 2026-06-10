'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export interface Profile {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferences: string[] | null;
  location_enabled: boolean | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  onboarding_completed: boolean | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, return null so we can create it
          return null;
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Failed to load profile:', err);
      return null;
    }
  };

  const createInitialProfile = async (currentUser: User): Promise<Profile | null> => {
    const newProfile: Profile = {
      name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Explorer',
      email: currentUser.email || null,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      preferences: [],
      location_enabled: false,
      location_label: '',
      latitude: null,
      longitude: null,
      onboarding_completed: false,
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: currentUser.id,
          ...newProfile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating initial profile:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Failed to create profile:', err);
      return null;
    }
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!user) return null;
    const prof = await fetchProfile(user.id);
    if (prof) {
      setProfile(prof);
    }
    return prof;
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google Sign In Error:', err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Sync auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (isMounted) setUser(session.user);
        
        let prof = await fetchProfile(session.user.id);
        if (!prof && isMounted) {
          prof = await createInitialProfile(session.user);
        }
        
        if (isMounted) {
          setProfile(prof);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setLoading(true);
        if (session?.user) {
          setUser(session.user);
          let prof = await fetchProfile(session.user.id);
          if (!prof) {
            prof = await createInitialProfile(session.user);
          }
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle routing based on onboarding status
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/auth/callback'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    if (!user) {
      if (!isPublicPath) {
        router.push('/login');
      }
    } else {
      if (profile) {
        if (!profile.onboarding_completed && pathname !== '/onboarding') {
          router.push('/onboarding');
        } else if (profile.onboarding_completed && (pathname === '/login' || pathname === '/onboarding')) {
          router.push('/');
        }
      }
    }
  }, [user, profile, loading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
