import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Check, Trash2, Clock, Sun, Moon } from 'lucide-react';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
      });
      return () => socket.off('notification');
    }
  }, [socket]);

  const handleMarkAsRead = async () => {
    try {
      await api.put('/notifications/mark-read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-secondary/80 backdrop-blur-md shadow-sm border-b border-border-color sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="p-2 mr-4 text-text-secondary rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl mr-2">T</div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent hidden sm:block">TaskManager</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
                if (!showNotifications && unreadCount > 0) handleMarkAsRead();
              }}
              className="p-2 text-text-secondary hover:text-text-primary relative transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-secondary rounded-xl shadow-xl border border-border-color overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border-color bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={32} className="mx-auto text-text-secondary opacity-20 mb-2" />
                      <p className="text-sm text-text-secondary">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={`px-4 py-3 border-b border-border-color hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notification.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                      >
                        <p className="text-sm text-text-primary leading-tight mb-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center text-[10px] text-text-secondary opacity-60">
                          <Clock size={10} className="mr-1" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-primary-300 flex items-center justify-center text-white font-medium shadow-md shadow-primary-500/30 transition-transform hover:scale-105">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-secondary rounded-full"></span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-secondary rounded-xl shadow-lg border border-border-color py-1 z-50">
                <div className="px-4 py-2 border-b border-border-color block md:hidden">
                  <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
                </div>
                <button 
                  onClick={() => {
                    navigate('/profile');
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center transition-colors"
                >
                  <User size={16} className="mr-2" />
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
