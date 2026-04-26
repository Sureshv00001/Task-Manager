import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-outfit">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      <div className="absolute top-[40%] right-[10%] w-24 h-24 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-20 h-20 bg-secondary rounded-2xl shadow-xl flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 border border-border-color/50">
              <span className="text-4xl font-black bg-gradient-to-br from-primary-600 to-blue-500 bg-clip-text text-transparent">T</span>
            </div>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-text-primary tracking-tight">
            Welcome back
          </h2>
          <p className="text-text-secondary font-medium px-4">
            Access your workspace to manage tasks efficiently
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel backdrop-blur-xl bg-secondary/30 border border-border-color/50 py-10 px-6 sm:rounded-3xl sm:px-12 shadow-2xl shadow-primary-900/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-text-secondary ml-1 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-secondary group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary placeholder:text-text-secondary/30 transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between ml-1 mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-text-secondary">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-primary-500 hover:text-primary-400 transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary placeholder:text-text-secondary/30 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 bg-background border-border-color rounded text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-text-secondary cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  Sign in to Dashboard
                </div>
              )}
            </button>
          </form>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-color/50"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                <span className="bg-secondary px-4 py-1 rounded-full border border-border-color/50 backdrop-blur-md">Secure Access</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center space-y-4">
              <div className="flex items-center text-[10px] font-bold text-text-secondary bg-primary-500/5 px-4 py-2 rounded-full border border-primary-500/10">
                <ShieldCheck className="h-3 w-3 mr-1.5 text-primary-500" />
                End-to-end encrypted session management
              </div>
              
              <div className="text-[10px] text-text-secondary/50 font-medium">
                Demo Admin: <span className="text-text-secondary/80">admin@taskmanager.com</span> / <span className="text-text-secondary/80">admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center relative z-10">
        <p className="text-xs font-bold text-text-secondary/40 tracking-widest uppercase">
          &copy; 2026 TaskManager Enterprise &bull; All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default Login;

