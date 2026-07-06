import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';

const Login = () => {
  const { login, signup, resendVerification, isDemoMode, toggleDemoMode } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [demoSignupData, setDemoSignupData] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    if (isRegistering) {
      const { error } = await signup(data.email, data.password, data.full_name, data.role || 'Staff');
      setSubmitting(false);
      if (error) {
        toast.error(error.message || 'Registration failed.');
      } else {
        toast.success('Registration successful! Verification email sent.');
        setVerificationEmail(data.email);
        if (isDemoMode) {
          setDemoSignupData({
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            role: data.role || 'Staff'
          });
        }
      }
    } else {
      const { data: res, error } = await login(data.email, data.password);
      setSubmitting(false);

      if (error) {
        toast.error(error.message || 'Login failed. Please check credentials.');
      } else {
        toast.success(`Welcome back, ${res.user.full_name || res.user.email}!`);
        navigate('/');
      }
    }
  };

  const handleResendEmail = async () => {
    if (!verificationEmail || resendCooldown > 0) return;
    setResending(true);
    const { error } = await resendVerification(verificationEmail);
    setResending(false);
    if (error) {
      toast.error(error.message || 'Failed to resend verification email.');
    } else {
      toast.success('Verification email resent successfully!');
      setResendCooldown(60);
    }
  };

  const handleSimulateVerification = async () => {
    if (!demoSignupData) return;
    setSubmitting(true);
    const { data: res, error } = await login(demoSignupData.email, demoSignupData.password);
    setSubmitting(false);
    if (error) {
      toast.error(error.message || 'Verification simulation failed.');
    } else {
      toast.success(`Demo account verified! Welcome, ${res.user.full_name || res.user.email}!`);
      setVerificationEmail('');
      setDemoSignupData(null);
      navigate('/');
    }
  };

  // Quick login helper for demo mode
  const handleQuickLogin = (email, password) => {
    setValue('email', email);
    setValue('password', password);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Left side: Form */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          {verificationEmail ? (
            <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-850 shadow-xl">
              {/* Mail animation icon */}
              <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-3xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100/50 dark:border-brand-900/30">
                <FiMail className="w-10 h-10 animate-bounce" />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-500 rounded-full animate-ping"></div>
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-500 rounded-full"></div>
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight mb-2">
                Verify your email
              </h2>
              <p className="text-sm text-gray-550 dark:text-gray-400 mb-5 leading-normal">
                We've sent a verification link to:
              </p>
              
              <div className="inline-block px-4 py-2 mb-6 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-850 text-xs font-bold text-gray-800 dark:text-gray-200 font-mono select-all">
                {verificationEmail}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed mb-8">
                Please check your inbox and spam folder. Click the link inside the email to verify and activate your account.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resending || resendCooldown > 0}
                  className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-555 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-60 disabled:scale-100 gap-2 items-center cursor-pointer disabled:cursor-not-allowed"
                >
                  {resending 
                    ? 'Sending...' 
                    : resendCooldown > 0 
                      ? `Resend Email (${resendCooldown}s)` 
                      : 'Resend Verification Email'
                  }
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationEmail('');
                    setIsRegistering(false);
                    reset();
                  }}
                  className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-55/50 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-850 rounded-xl transition-all focus:outline-none cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>

              {/* Demo Mode helper */}
              {isDemoMode && demoSignupData && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-left">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-850 dark:text-amber-350 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiShield className="w-4 h-4 text-amber-500 animate-pulse" />
                      Demo Sandbox Mode
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-450 leading-relaxed mb-3.5">
                      Since this is running in Local Demo Mode, no real verification email was sent. Simulate verification to log in instantly.
                    </p>
                    <button
                      onClick={handleSimulateVerification}
                      disabled={submitting}
                      className="w-full py-2.5 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {submitting ? 'Verifying...' : 'Simulate Verification & Sign In'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-2xl mb-6 shadow-md shadow-brand-500/20">
                  A
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
                  {isRegistering ? 'Create Account' : 'ApexEvents'}
                </h2>
                <p className="mt-2 text-sm text-gray-555 dark:text-gray-400">
                  {isRegistering 
                    ? 'Join our enterprise events system'
                    : 'Manage your corporate events and conferences with ease.'
                  }
                </p>
              </div>

              <div className="mt-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...register('full_name', { required: 'Full name is required' })}
                        className="block w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Alex Administrator"
                      />
                      {errors.full_name && (
                        <span className="text-xs text-red-500 mt-1 block text-left">{errors.full_name.message}</span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                      Email Address
                    </label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                        <FiMail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        {...register('email', { required: 'Email is required' })}
                        className={`block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border ${
                          errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm`}
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <span className="text-xs text-red-500 mt-1 block text-left">{errors.email.message}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                        Password
                      </label>
                      {!isRegistering && (
                        <Link
                          to="/forgot-password"
                          className="text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
                        >
                          Forgot your password?
                        </Link>
                      )}
                    </div>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        {...register('password', { 
                          required: 'Password is required', 
                          minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                        })}
                        className={`block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border ${
                          errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm`}
                        placeholder="••••••••"
                      />
                      {errors.password && (
                        <span className="text-xs text-red-500 mt-1 block text-left">{errors.password.message}</span>
                      )}
                    </div>
                  </div>

                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                        Role Registration
                      </label>
                      <select
                        {...register('role')}
                        className="block w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="Super Admin">Super Admin (Full Access)</option>
                        <option value="Event Manager">Event Manager</option>
                        <option value="Staff">Staff member</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 gap-2 items-center cursor-pointer"
                    >
                      {submitting 
                        ? (isRegistering ? 'Registering...' : 'Signing in...') 
                        : (isRegistering ? 'Create Account' : 'Sign In')
                      }
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400 cursor-pointer"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                  </button>
                </div>

                {/* Quick Login Shortcuts in Demo Mode */}
                {isDemoMode && (
                  <div className="mt-8 pt-6 border-t border-gray-150 dark:border-gray-850">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-250 dark:border-amber-900/50 mb-4">
                      <FiShield className="w-4 h-4 text-amber-500" />
                      <span>Demo Mode: Click to Quick Login</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleQuickLogin('admin@apexevents.com', 'password123')}
                        className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-55/60 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Super Admin (Full Access)</span>
                        <span className="text-[10px] text-brand-655 dark:text-brand-400 font-mono">admin@apexevents.com</span>
                      </button>
                      <button
                        onClick={() => handleQuickLogin('manager@apexevents.com', 'password123')}
                        className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-55/60 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Event Manager (Events/Reports)</span>
                        <span className="text-[10px] text-brand-655 dark:text-brand-400 font-mono">manager@apexevents.com</span>
                      </button>
                      <button
                        onClick={() => handleQuickLogin('staff@apexevents.com', 'password123')}
                        className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-55/60 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Staff (Check-ins/Registrations)</span>
                        <span className="text-[10px] text-brand-655 dark:text-brand-400 font-mono">staff@apexevents.com</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode Swapper (Only if env variables are available, allow toggling demo mode) */}
                {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => toggleDemoMode(!isDemoMode)}
                      className="text-xs font-semibold text-gray-555 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 underline decoration-dotted cursor-pointer"
                    >
                      {isDemoMode ? 'Switch to Supabase Cloud Database' : 'Switch back to Local Demo Mode'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side: Modern Visual Graphic */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-brand-650 h-full w-full object-cover">
          {/* A beautiful dark gradient background pattern */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-900 via-brand-800 to-indigo-950 opacity-95"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-between p-16 text-white z-10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-wide uppercase font-display">ApexEvents Platform</span>
            </div>
            
            <div className="space-y-6 text-left">
              <h1 className="text-4xl font-extrabold font-display leading-tight tracking-tight text-white m-0 max-w-lg text-left">
                The all-in-one platform for professional enterprise event operations.
              </h1>
              <p className="text-gray-350 text-base max-w-md text-left">
                Seamless attendee check-in systems, live QR scanners, comprehensive billing tracking, and role-based staff permission guards.
              </p>
            </div>

            <div className="text-xs text-gray-450 text-left">
              © 2026 ApexEvents Inc. All rights reserved.
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-500 rounded-full filter blur-3xl opacity-10 translate-x-20 translate-y-20 animate-pulse-slow"></div>
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl opacity-10 animate-pulse-slow"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
