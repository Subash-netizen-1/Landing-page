import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiShield, FiPhone, FiKey } from 'react-icons/fi';

const Login = () => {
  const { signInWithOtp, verifyOtp, isDemoMode, toggleDemoMode } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // OTP Auth States
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [otpTarget, setOtpTarget] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [signupMeta, setSignupMeta] = useState(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const onSendOtp = async (data) => {
    setSubmitting(true);
    const targetVal = authMethod === 'email' ? data.email : data.phone;
    setOtpTarget(targetVal);
    
    const payload = {
      isSigningUp: isRegistering,
      fullName: data.full_name,
      roleSelection: data.role || 'Staff'
    };
    if (authMethod === 'email') {
      payload.email = targetVal;
    } else {
      payload.phone = targetVal;
    }

    const { error } = await signInWithOtp(payload);
    setSubmitting(false);
    
    if (error) {
      toast.error(error.message || 'Failed to send verification code.');
    } else {
      toast.success(`Verification code sent to ${targetVal}!`);
      setOtpSent(true);
      setOtpCooldown(60);
      if (isRegistering) {
        setSignupMeta({
          fullName: data.full_name,
          role: data.role || 'Staff'
        });
      }
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpToken || otpToken.length < 6) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }

    setSubmitting(true);
    const payload = {
      token: otpToken,
      isSigningUp: isRegistering,
      fullName: signupMeta?.fullName,
      roleSelection: signupMeta?.role
    };
    if (authMethod === 'email') {
      payload.email = otpTarget;
    } else {
      payload.phone = otpTarget;
    }

    const { data: res, error } = await verifyOtp(payload);
    setSubmitting(false);
    
    if (error) {
      toast.error(error.message || 'Verification failed. Please try again.');
    } else {
      toast.success(`Successfully authenticated! Welcome back.`);
      navigate('/');
    }
  };

  const handleResendOtp = async () => {
    if (!otpTarget || otpCooldown > 0) return;
    setResending(true);
    
    const payload = {
      isSigningUp: isRegistering,
      fullName: signupMeta?.fullName,
      roleSelection: signupMeta?.role
    };
    if (authMethod === 'email') {
      payload.email = otpTarget;
    } else {
      payload.phone = otpTarget;
    }

    const { error } = await signInWithOtp(payload);
    setResending(false);
    
    if (error) {
      toast.error(error.message || 'Failed to resend code.');
    } else {
      toast.success('A new code has been sent!');
      setOtpCooldown(60);
    }
  };

  // Quick login helper for demo mode
  const handleQuickLogin = async (email, phone = null) => {
    setSubmitting(true);
    setAuthMethod(email ? 'email' : 'phone');
    setOtpTarget(email || phone);
    
    const payload = {
      token: '123456',
      isSigningUp: false
    };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    const { error } = await verifyOtp(payload);
    setSubmitting(false);
    
    if (error) {
      toast.error(error.message || 'Quick login failed.');
    } else {
      toast.success('Logged in successfully via quick login!');
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Left side: Form */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          {otpSent ? (
            <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-850 shadow-xl">
              {/* Lock/Verification animation icon */}
              <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-3xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100/50 dark:border-brand-900/30">
                <FiKey className="w-10 h-10 animate-pulse text-brand-600 dark:text-brand-450" />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-500 rounded-full animate-ping"></div>
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-500 rounded-full"></div>
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight mb-2">
                Verify OTP Code
              </h2>
              <p className="text-sm text-gray-550 dark:text-gray-400 mb-5 leading-normal">
                We've sent a 6-digit code to:
              </p>
              
              <div className="inline-block px-4 py-2 mb-6 rounded-xl bg-gray-50 dark:bg-gray-955 border border-gray-150 dark:border-gray-850 text-xs font-bold text-gray-800 dark:text-gray-200 font-mono select-all">
                {otpTarget}
              </div>

              <form onSubmit={onVerifyOtp} className="space-y-5">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="block w-full text-center px-4 py-3 tracking-[0.7em] text-lg font-bold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpToken.length < 6}
                  className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer items-center gap-1.5"
                >
                  {submitting ? 'Verifying...' : 'Verify & Sign In'}
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-3 mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || otpCooldown > 0}
                  className="flex justify-center w-full px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl transition-all border border-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending 
                    ? 'Resending...' 
                    : otpCooldown > 0 
                      ? `Resend Code (${otpCooldown}s)` 
                      : 'Resend Verification Code'
                  }
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpToken('');
                    reset();
                  }}
                  className="flex justify-center w-full px-4 py-2.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  Back to Sign In / Register
                </button>
              </div>

              {/* Demo Mode helper */}
              {isDemoMode && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-left">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-850 dark:text-amber-350 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiShield className="w-4 h-4 text-amber-500" />
                      Demo Sandbox Code
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-450 leading-relaxed mb-3">
                      Use the test code <span className="font-bold underline text-amber-900 dark:text-amber-200 select-all">123456</span> to verify the account instantly.
                    </p>
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
                    : 'Passwordless OTP Sign In.'
                  }
                </p>
              </div>

              {/* Tab Bar to choose Email or Phone */}
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    reset();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMethod === 'email'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FiMail className="w-4 h-4" />
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('phone');
                    reset();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMethod === 'phone'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FiPhone className="w-4 h-4" />
                  Phone OTP
                </button>
              </div>

              <div className="mt-6">
                <form onSubmit={handleSubmit(onSendOtp)} className="space-y-5">
                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...register('full_name', { required: 'Full name is required' })}
                        className="block w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Alex Administrator"
                      />
                      {errors.full_name && (
                        <span className="text-xs text-red-500 mt-1 block text-left">{errors.full_name.message}</span>
                      )}
                    </div>
                  )}

                  {authMethod === 'email' ? (
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
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                        Phone Number
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                          <FiPhone className="w-5 h-5" />
                        </div>
                        <input
                          type="tel"
                          {...register('phone', { 
                            required: 'Phone number is required',
                            pattern: {
                              value: /^\+[1-9]\d{1,14}$/,
                              message: 'Format: +[CountryCode][Number] (e.g. +15555551234)'
                            }
                          })}
                          className={`block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-650 border ${
                            errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm`}
                          placeholder="+15555551234"
                        />
                        {errors.phone && (
                          <span className="text-xs text-red-500 mt-1 block text-left">{errors.phone.message}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-left">
                        Role Registration
                      </label>
                      <select
                        {...register('role')}
                        className="block w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
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
                      {submitting ? 'Sending code...' : 'Send Verification Code'}
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
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-955/40 p-2.5 rounded-xl border border-amber-250 dark:border-amber-900/50 mb-4">
                      <FiShield className="w-4 h-4 text-amber-500" />
                      <span>Demo Mode: Click to Quick Login</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleQuickLogin('admin@apexevents.com')}
                        className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-55/60 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Super Admin (Email)</span>
                        <span className="text-[10px] text-brand-655 dark:text-brand-400 font-mono">admin@apexevents.com</span>
                      </button>
                      <button
                        onClick={() => handleQuickLogin(null, '+15555551234')}
                        className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-55/60 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Super Admin (Phone OTP)</span>
                        <span className="text-[10px] text-brand-655 dark:text-brand-400 font-mono">+1 555-555-1234</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode Swapper */}
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
