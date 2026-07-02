import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    const { error } = await forgotPassword(data.email);
    setSubmitting(false);

    if (error) {
      toast.error(error.message || 'Error requesting reset email.');
    } else {
      toast.success('Password reset instructions sent. Please check your inbox!');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-semibold text-2xl mx-auto mb-4">
            A
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-550 dark:text-gray-400">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl transition-all shadow-md shadow-brand-500/10 active:scale-98 disabled:opacity-50 gap-2 items-center"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
              <FiSend className="w-4 h-4" />
            </button>

            <Link
              to="/login"
              className="flex justify-center items-center gap-1.5 w-full py-2.5 text-sm font-semibold text-gray-550 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white rounded-xl transition-all"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
