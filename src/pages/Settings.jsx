import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../utils/dataService';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  FiUser, 
  FiSettings, 
  FiLock, 
  FiShield, 
  FiDatabase,
  FiMail,
  FiCheck
} from 'react-icons/fi';

const Settings = () => {
  const { profile, updateProfile, resetPassword, role, isDemoMode } = useAuth();
  const isSuperAdmin = role === 'Super Admin';

  const [activeTab, setActiveTab] = useState('profile');
  const [orgLoading, setOrgLoading] = useState(false);

  // Forms
  const { register: regProf, handleSubmit: handleProfSubmit, reset: resetProf, formState: { errors: errorsProf } } = useForm();
  const { register: regPass, handleSubmit: handlePassSubmit, reset: resetPass, formState: { errors: errorsPass }, watch: watchPass } = useForm();
  const { register: regOrg, handleSubmit: handleOrgSubmit, reset: resetOrg } = useForm();

  const newPassword = watchPass('password');

  // Load Profile and Org Details
  const loadOrgDetails = async () => {
    setOrgLoading(true);
    try {
      const { data } = await dataService.getSettings();
      if (data) {
        resetOrg({
          org_name: data.org_name || 'ApexEvents Inc.',
          org_logo_url: data.org_logo_url || '',
          sender_email: data.email_settings?.sender_email || '',
          sender_name: data.email_settings?.sender_name || '',
          default_theme: data.theme_settings?.default_theme || 'dark'
        });
      }
    } catch (e) {
      console.error('Error loading org settings:', e);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      resetProf({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || ''
      });
    }
    loadOrgDetails();
  }, [profile]);

  // Profile Save
  const onSaveProfile = async (data) => {
    try {
      const { error } = await updateProfile(data);
      if (error) throw error;
      toast.success('Profile details updated successfully');
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  // Password Save
  const onSavePassword = async (data) => {
    try {
      const { error } = await resetPassword(data.password);
      if (error) throw error;
      toast.success('Password updated successfully');
      resetPass({ password: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.message || 'Failed to update password');
    }
  };

  // Org Settings Save
  const onSaveOrg = async (data) => {
    if (!isSuperAdmin) return;
    try {
      const settingsInsert = {
        org_name: data.org_name,
        org_logo_url: data.org_logo_url,
        email_settings: {
          sender_email: data.sender_email,
          sender_name: data.sender_name
        },
        theme_settings: {
          default_theme: data.default_theme,
          primary_color: '#3b82f6'
        }
      };

      const { error } = await dataService.updateSettings(settingsInsert);
      if (error) throw error;
      toast.success('Organization configurations saved');
      // Reload page or trigger sidebar reload
      window.location.reload();
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile Details', icon: FiUser },
    { id: 'password', name: 'Change Password', icon: FiLock },
    { id: 'org', name: 'Organization Settings', icon: FiSettings }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display">
          Configurations
        </h1>
        <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
          Adjust SMTP email, brand properties, theme preferences, and user profile parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side: Tabs Selection */}
        <div className="md:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-2xl h-fit space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold rounded-xl text-left transition-all duration-150 ${
                  activeTab === t.id
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-650 dark:text-brand-400 shadow-sm border-l-4 border-brand-650'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Configuration Panels */}
        <div className="md:col-span-3">
          
          {/* PROFILE BOARD */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
                Personal Profile Details
              </h3>
              
              <form onSubmit={handleProfSubmit(onSaveProfile)} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Display Name</label>
                  <input
                    type="text"
                    {...regProf('full_name', { required: 'Name is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                  {errorsProf.full_name && (
                    <span className="text-xs text-red-500 mt-1 block">{errorsProf.full_name.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Avatar Image URL</label>
                  <input
                    type="text"
                    {...regProf('avatar_url')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Account Email</label>
                  <input
                    type="text"
                    value={profile?.email || ''}
                    disabled
                    className="mt-1.5 block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-800 rounded-xl text-sm cursor-not-allowed"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Save Profile Info
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CHANGE PASSWORD BOARD */}
          {activeTab === 'password' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
                Update Account Password
              </h3>

              <form onSubmit={handlePassSubmit(onSavePassword)} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">New Password</label>
                  <input
                    type="password"
                    {...regPass('password', { 
                      required: 'Password is required', 
                      minLength: { value: 6, message: 'Password must have at least 6 characters' }
                    })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                  {errorsPass.password && (
                    <span className="text-xs text-red-500 mt-1 block">{errorsPass.password.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Confirm New Password</label>
                  <input
                    type="password"
                    {...regPass('confirmPassword', { 
                      required: 'Please confirm password', 
                      validate: val => val === newPassword || 'Passwords do not match'
                    })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                  {errorsPass.confirmPassword && (
                    <span className="text-xs text-red-500 mt-1 block">{errorsPass.confirmPassword.message}</span>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* GLOBAL ORG SETTINGS BOARD */}
          {activeTab === 'org' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display">
                  Organization Properties
                </h3>
                {!isSuperAdmin && (
                  <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-650 px-2 py-0.5 rounded dark:bg-red-950/20 dark:text-red-400 font-bold border border-red-200/20">
                    <FiShield className="w-3.5 h-3.5" />
                    <span>READ ONLY (Admin Guard)</span>
                  </span>
                )}
              </div>

              {orgLoading ? (
                <div className="h-64 animate-pulse bg-gray-55/5 rounded-xl border border-gray-100 dark:border-gray-850"></div>
              ) : (
                <form onSubmit={handleOrgSubmit(onSaveOrg)} className="space-y-6 max-w-xl">
                  
                  {/* Org settings grid */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Organization Name</label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        {...regOrg('org_name')}
                        className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Brand Logo URL</label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        {...regOrg('org_logo_url')}
                        className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* SMTP/Email config block */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <FiMail className="w-4 h-4" />
                      <span>SMTP Email Settings</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Sender Email</label>
                        <input
                          type="email"
                          disabled={!isSuperAdmin}
                          {...regOrg('sender_email')}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-xs disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Sender Name</label>
                        <input
                          type="text"
                          disabled={!isSuperAdmin}
                          {...regOrg('sender_name')}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-xs disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme settings config block */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Default Configurations</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-500">Default System Theme</label>
                      <select
                        disabled={!isSuperAdmin}
                        {...regOrg('default_theme')}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-xs disabled:opacity-50"
                      >
                        <option value="dark">Dark Theme (Default)</option>
                        <option value="light">Light Theme</option>
                      </select>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Save Org Settings
                      </button>
                    </div>
                  )}
                </form>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Settings;
