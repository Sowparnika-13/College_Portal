import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    console.log('AuthProvider mounted - checking initial session');
    let mounted = true;
    
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', currentSession ? 'Session found' : 'No session');
      setSession(currentSession);
      if (currentSession?.user && !user) {
        console.log('Fetching initial user profile for:', currentSession.user.id);
        fetchUserProfile(currentSession.user.id);
      } else {
        console.log('No user in session or user already loaded, setting isLoading to false');
        setIsLoading(false);
      }
    }).catch(error => {
      console.error('Error checking initial session:', error);
      if (mounted) setIsLoading(false);
    });

    // Listen to auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', _event, currentSession ? 'Session exists' : 'No session');
      
      // Only update session if it's different
      if (JSON.stringify(currentSession) !== JSON.stringify(session)) {
        setSession(currentSession);
      }
      
      if (currentSession?.user && !user) {
        console.log('Fetching user profile after auth change for:', currentSession.user.id);
        await fetchUserProfile(currentSession.user.id);
      } else if (!currentSession) {
        console.log('No session after auth change, clearing user state');
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [session, user]); // Add dependencies to prevent unnecessary re-runs

  async function fetchUserProfile(auth_id) {
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    console.log('Starting fetchUserProfile for:', auth_id);
    fetchInProgress.current = true;
    
    try {
      setIsLoading(true);
      
      // Add timeout to the fetch operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Increased timeout to 10 seconds
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('auth_id', auth_id)
        .maybeSingle();

      // Race between the fetch and timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
        .catch(error => {
          console.error('Fetch operation failed:', error);
          throw error;
        });

      console.log('Fetch response received:', { data, error });

      if (error) {
        console.error('Supabase error in fetchUserProfile:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No user profile found for auth_id:', auth_id);
        // Check if the user exists in auth but not in profiles
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          console.log('User exists in auth but not in profiles table');
          // Create a basic profile if it doesn't exist
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                auth_id: auth_id,
                email: authUser.user.email,
                first_name: authUser.user.email.split('@')[0], // Default to email username
                last_name: '',
                role: 'student', // Default role
              }
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            throw insertError;
          }

          console.log('Created new user profile:', newProfile);
          setUser(newProfile);
          return;
        }
        throw new Error('User profile not found');
      }

      console.log('Successfully fetched user profile:', data);
      setUser(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(null);
      // Only sign out if there's a session but we can't get the profile
      if (session) {
        console.log('Signing out due to profile fetch error');
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
      }
    } finally {
      console.log('Finished fetchUserProfile, setting isLoading to false');
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }

  async function login(email, password, role) {
    console.log('Starting login process for:', email, 'role:', role);
    try {
      setIsLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        console.error('Auth error during login:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('No user returned from sign in');
        throw new Error('No user returned from sign in');
      }

      console.log('Auth successful, fetching user profile');
      // Fetch user profile immediately after successful login
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .eq('role', role) // Verify the role matches
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error during login:', profileError);
        throw profileError;
      }
      
      if (!userData) {
        console.error('No user profile found or role mismatch');
        throw new Error('User profile not found or role mismatch');
      }

      console.log('Login successful, user profile:', userData);
      setUser(userData);
      setSession(authData.session);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      setSession(null);
      throw error;
    } finally {
      console.log('Login process finished, setting isLoading to false');
      setIsLoading(false);
    }
  }

  async function register({ email, password, firstName, lastName, role }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from sign up');

      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            auth_id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            role,
            email,
          }
        ]);

      if (profileError) throw profileError;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Helpers for role checks
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isStudent, isFaculty }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



