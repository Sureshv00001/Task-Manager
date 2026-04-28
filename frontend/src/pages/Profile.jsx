import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Camera, Lock, Save, Phone, Briefcase, Info, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', formData);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File too large. Max 5MB');
    }

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setAvatarLoading(true);
    try {
      const { data } = await api.post('/users/upload-avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setFormData(prev => ({ ...prev, avatar: data.avatar }));
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await api.put('/users/update-password', passwordData);
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Account Settings</h1>
          <p className="text-text-secondary mt-1">Manage your professional identity and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 relative z-10">
              <div className="relative group/avatar">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white text-5xl font-bold shadow-2xl overflow-hidden border-4 border-secondary transition-transform group-hover/avatar:scale-105">
                  {avatarLoading ? (
                    <Loader2 className="w-10 h-10 animate-spin opacity-50" />
                  ) : formData.avatar ? (
                    <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    formData.name.charAt(0).toUpperCase()
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current.click()}
                  disabled={avatarLoading}
                  className="absolute -bottom-2 -right-2 p-2.5 bg-primary-600 text-white rounded-2xl shadow-xl hover:bg-primary-700 transition-all active:scale-90 border-4 border-secondary disabled:opacity-50"
                >
                  <Camera size={18} />
                </button>
              </div>
              <div className="text-center md:text-left pt-2">
                <h2 className="text-2xl font-bold text-text-primary mb-1">{formData.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  <span className="inline-flex items-center px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold uppercase tracking-widest border border-primary-500/20">
                    <Shield size={12} className="mr-1.5" />
                    {user?.role}
                  </span>
                  {formData.department && (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/20">
                      <Briefcase size={12} className="mr-1.5" />
                      {formData.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-50" size={18} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all shadow-sm"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Email (Primary)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-50" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-border-color rounded-2xl text-text-secondary cursor-not-allowed outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-50" size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all shadow-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Department</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-50" size={18} />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all shadow-sm"
                      placeholder="e.g. Engineering, Sales"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1 flex items-center">
                  Professional Bio
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-[9px] rounded text-text-secondary">Optional</span>
                </label>
                <div className="relative">
                  <Info className="absolute left-4 top-4 text-text-secondary opacity-50" size={18} />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all shadow-sm resize-none"
                    placeholder="Brief description of your role and expertise..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex items-center px-10 py-3.5 bg-primary-600 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:bg-primary-700 hover:shadow-primary-500/40 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Save size={20} className="mr-2 relative z-10" />
                  <span className="relative z-10">{loading ? 'Updating...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security / Sidebar */}
        <div className="space-y-8">
          <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
            
            <div className="flex items-center space-x-3 mb-8 relative z-10">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl">
                <Lock size={22} />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Security</h3>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-5 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-5 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-5 py-3 bg-background border border-border-color rounded-2xl text-text-primary dark:text-white font-medium focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-500/25 hover:bg-orange-700 hover:shadow-orange-500/40 transition-all active:scale-95 disabled:opacity-50 mt-4"
              >
                Change Password
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-primary-500/5 rounded-3xl border border-primary-500/10">
            <h4 className="text-xs font-bold text-text-primary uppercase mb-3 flex items-center">
              <Shield size={14} className="mr-2 text-primary-500" />
              Privacy Note
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your profile data is visible to Admins and Managers for team coordination. Your password is encrypted and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

