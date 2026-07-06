import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const AuthContext = createContext();

// Seed default users for Demo Mode
const DEMO_USERS = [
  { id: 'd1', email: 'admin@apexevents.com', phone: '+15555551234', password: 'password123', full_name: 'Alex Administrator', role: 'Super Admin', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { id: 'd2', email: 'manager@apexevents.com', phone: '+15555555678', password: 'password123', full_name: 'Morgan Manager', role: 'Event Manager', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'd3', email: 'staff@apexevents.com', phone: '+15555559012', password: 'password123', full_name: 'Sam Staff', role: 'Staff', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  // Initialize demo accounts in localStorage if not exists
  useEffect(() => {
    if (isDemoMode) {
      if (!localStorage.getItem('demo_users')) {
        localStorage.setItem('demo_users', JSON.stringify(DEMO_USERS));
      }
      
      // Check for saved demo session
      const savedSession = localStorage.getItem('demo_session');
      if (savedSession) {
        const currentUser = JSON.parse(savedSession);
        setUser(currentUser);
        setProfile(currentUser);
        setRole(currentUser.role);
      }
      setLoading(false);
    }
  }, [isDemoMode]);

  // Supabase Auth Listener
  useEffect(() => {
    if (!isDemoMode && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isDemoMode]);

  // Fetch Supabase profile and role
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setRole(data.role);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      // Fallback: If profile table is not ready or failed, set default role
      setRole('Staff');
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const found = users.find(u => u.email === email && u.password === password);
      if (found) {
        setUser({ id: found.id, email: found.email });
        setProfile(found);
        setRole(found.role);
        localStorage.setItem('demo_session', JSON.stringify(found));
        setLoading(false);
        return { data: { user: found }, error: null };
      } else {
        setLoading(false);
        return { data: null, error: new Error('Invalid email or password.') };
      }
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        setLoading(false);
        return { data: null, error: err };
      }
    }
  };

  // Signup
  const signup = async (email, password, fullName, roleSelection = 'Staff') => {
    setLoading(true);
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      if (users.some(u => u.email === email)) {
        setLoading(false);
        return { data: null, error: new Error('Email already registered.') };
      }
      const newUser = {
        id: 'd' + (users.length + 1),
        email,
        password,
        full_name: fullName,
        role: roleSelection,
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`
      };
      users.push(newUser);
      localStorage.setItem('demo_users', JSON.stringify(users));
      setLoading(false);
      return { data: { user: newUser }, error: null };
    } else {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              full_name: fullName,
              role: roleSelection,
            }
          }
        });
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        setLoading(false);
        return { data: null, error: err };
      }
    }
  };

  // Resend Email Verification
  const resendVerification = async (email) => {
    if (isDemoMode) {
      return { error: null };
    } else {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}`
          }
        });
        if (error) throw error;
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    }
  };

  // Sign In / Sign Up with OTP (Email/Phone)
  const signInWithOtp = async ({ email, phone, fullName, roleSelection = 'Staff', isSigningUp = false }) => {
    setLoading(true);
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      if (isSigningUp) {
        if (email && users.some(u => u.email === email)) {
          setLoading(false);
          return { error: new Error('Email already registered.') };
        }
        if (phone && users.some(u => u.phone === phone)) {
          setLoading(false);
          return { error: new Error('Phone number already registered.') };
        }
      } else {
        const found = users.find(u => (email && u.email === email) || (phone && u.phone === phone));
        if (!found) {
          setLoading(false);
          return { error: new Error('User account not found for local demo. Please register first.') };
        }
      }
      setLoading(false);
      return { error: null };
    } else {
      try {
        const options = {};
        if (isSigningUp) {
          options.data = {
            full_name: fullName,
            role: roleSelection,
          };
        }
        
        const payload = {};
        if (email) {
          payload.email = email;
          options.redirectTo = `${window.location.origin}`;
        } else if (phone) {
          payload.phone = phone;
        }
        payload.options = options;

        const { data, error } = await supabase.auth.signInWithOtp(payload);
        setLoading(false);
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        setLoading(false);
        return { data: null, error: err };
      }
    }
  };

  // Verify OTP Code
  const verifyOtp = async ({ email, phone, token, fullName, roleSelection = 'Staff', isSigningUp = false }) => {
    setLoading(true);
    if (isDemoMode) {
      if (token !== '123456') {
        setLoading(false);
        return { error: new Error('Invalid OTP code. For demo mode, please use 123456.') };
      }

      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      let currentUser;

      if (isSigningUp) {
        currentUser = {
          id: 'd' + (users.length + 1),
          email: email || null,
          phone: phone || null,
          full_name: fullName,
          role: roleSelection,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`
        };
        users.push(currentUser);
        localStorage.setItem('demo_users', JSON.stringify(users));
      } else {
        currentUser = users.find(u => (email && u.email === email) || (phone && u.phone === phone));
      }

      setUser({ id: currentUser.id, email: currentUser.email, phone: currentUser.phone });
      setProfile(currentUser);
      setRole(currentUser.role);
      localStorage.setItem('demo_session', JSON.stringify(currentUser));
      setLoading(false);
      return { data: { user: currentUser }, error: null };
    } else {
      try {
        const payload = {
          token,
          type: email ? 'email' : 'sms',
        };
        if (email) {
          payload.email = email;
        } else if (phone) {
          payload.phone = phone;
        }

        const { data, error } = await supabase.auth.verifyOtp(payload);
        if (error) throw error;

        setUser(data.user);
        setLoading(false);
        return { data, error: null };
      } catch (err) {
        setLoading(false);
        return { data: null, error: err };
      }
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    if (isDemoMode) {
      setUser(null);
      setProfile(null);
      setRole(null);
      localStorage.removeItem('demo_session');
      setLoading(false);
      return { error: null };
    } else {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setProfile(null);
        setRole(null);
        return { error: null };
      } catch (err) {
        setLoading(false);
        return { error: err };
      }
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    if (isDemoMode) {
      // Mock successful email sending
      return { data: {}, error: null };
    } else {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    }
  };

  // Reset Password (and Change Password)
  const resetPassword = async (newPassword) => {
    if (isDemoMode) {
      if (user) {
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const updatedUsers = users.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
        localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
        // Update current profile session cache
        const updatedProfile = { ...profile, password: newPassword };
        setProfile(updatedProfile);
        localStorage.setItem('demo_session', JSON.stringify(updatedProfile));
      }
      return { data: {}, error: null };
    } else {
      return await supabase.auth.updateUser({ password: newPassword });
    }
  };

  // Update Profile Info
  const updateProfile = async ({ full_name, avatar_url }) => {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const updatedUsers = users.map(u => u.id === user.id ? { ...u, full_name, avatar_url } : u);
      localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
      const updatedProfile = { ...profile, full_name, avatar_url };
      setProfile(updatedProfile);
      localStorage.setItem('demo_session', JSON.stringify(updatedProfile));
      return { error: null };
    } else {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
        await fetchProfile(user.id);
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    }
  };

  // Toggle demo mode manually (so users can switch to Supabase once configured)
  const toggleDemoMode = (enable) => {
    setIsDemoMode(enable);
    setUser(null);
    setProfile(null);
    setRole(null);
    localStorage.removeItem('demo_session');
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      loading,
      login,
      signup,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      resendVerification,
      signInWithOtp,
      verifyOtp,
      isDemoMode,
      toggleDemoMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
