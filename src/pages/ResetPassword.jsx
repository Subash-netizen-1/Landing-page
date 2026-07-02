import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiLock, FiArrowLeft, FiCheck } from 'react-icons/fi';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const newPassword = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    const { error } = await resetPassword(data.password);
    setSubmitting(false);

    if (error) {
      toast.error(error.message || 'Error updating password.');
    } else {
      toast.success('Password updated successfully! Please login with your new password.');
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
            Create New Password
          </h2>
          <p className="mt-2 text-sm text-gray-550 dark:text-gray-400">
            Please enter your new strong password. Make sure it has at least 6 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                New Password
              </label>
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
                  <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: val => val === newPassword || 'Passwords do not match'
                  })}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl transition-all shadow-md shadow-brand-500/10 active:scale-98 disabled:opacity-50 gap-2 items-center"
            >
              {submitting ? 'Updating...' : 'Reset Password'}
              <FiCheck className="w-4 h-4" />
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

export default ResetPassword;
