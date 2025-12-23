
import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle2, Settings, Globe, ShieldCheck, Zap } from 'lucide-react';
import { Theme, Language, User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  theme: Theme;
  language: Language;
  supabaseUrl: string;
  supabaseKey: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, theme, language, supabaseUrl, supabaseKey }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setShowSuccess(false);
    }
  }, [isOpen, isLogin]);

  const isConfigured = supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://');

  const t = {
    en: { 
      title: isLogin ? 'Welcome Back' : 'Join K-Tool', 
      subtitle: isLogin ? 'Enter your credentials to access your workspace.' : 'Create an account to sync your tasks across all devices.',
      email: 'Email Address', 
      password: 'Password', 
      submit: isLogin ? 'Sign In' : 'Create Account', 
      switch: isLogin ? "Don't have an account? Sign Up Free" : 'Already have an account? Sign In', 
      errorFormat: 'Please enter a valid email address.',
      errorConfig: 'Invalid Supabase Config! Ensure URL starts with https://',
      errorTimeout: 'Request timed out. Please check your network or Supabase status.',
      successSignup: 'Success! Please check your email inbox to confirm your account before logging in.',
      autoLogin: 'Welcome! Auto-logging you in...',
      errorGeneric: 'Authentication failed. Check your network or credentials.'
    },
    zh: { 
      title: isLogin ? '欢迎回来' : '开启高效旅程', 
      subtitle: isLogin ? '登录您的账号以同步所有数据' : '创建一个账号，在所有设备上无缝同步任务与知识库',
      email: '电子邮箱地址', 
      password: '访问密码', 
      submit: isLogin ? '立即登录' : '快速注册', 
      switch: isLogin ? '还没有账号？点此立即注册' : '已有账号？点此直接登录', 
      errorFormat: '请输入有效的邮箱地址。',
      errorConfig: '配置有误！URL 必须以 https:// 开头',
      errorTimeout: '请求超时，请检查网络连接或 Supabase 配置是否正确。',
      successSignup: '注册成功！请前往邮箱点击确认链接。',
      autoLogin: '注册成功！正在为您自动登录...',
      errorGeneric: '认证失败：请检查网络、配置项或邮箱是否已注册'
    }
  }[language];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isConfigured) {
      setError(t.errorConfig);
      return;
    }

    if (!email.includes('@')) {
      setError(t.errorFormat);
      return;
    }
    
    if (password.length < 6) {
      setError(language === 'zh' ? '密码长度至少为 6 位' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? 'token?grant_type=password' : 'signup';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: { 
          'apikey': supabaseKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.msg || data.error_description || data.message || t.errorGeneric;
        throw new Error(errorMsg);
      }

      // 关键逻辑：如果响应中包含 access_token，说明无需验证或已登录
      if (data.access_token) {
        if (!isLogin) {
          // 如果是注册模式下直接拿到了 token，说明后台关闭了验证
          setShowSuccess(true); // 短暂显示成功状态
          setTimeout(() => {
            onSuccess({
              id: data.user?.id || data.id,
              email: data.user?.email || data.email,
              token: data.access_token
            });
            onClose();
          }, 1500);
        } else {
          // 正常登录
          onSuccess({
            id: data.user?.id || data.id,
            email: data.user?.email || data.email,
            token: data.access_token
          });
          onClose();
        }
      } else if (!isLogin) {
        // 注册成功但没有 token，说明开启了邮件验证
        setShowSuccess(true);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError(t.errorTimeout);
      } else {
        setError(err.message || t.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className={`w-full max-w-[540px] rounded-[3.5rem] border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-[#181818] border-[#333] shadow-black' : 'bg-white border-gray-100'}`}>
        
        <div className="p-10 sm:p-14 relative">
          <button 
            onClick={onClose} 
            className={`absolute top-10 right-10 p-3 rounded-full transition-all 
              ${theme === 'dark' ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}
          >
            <X size={28} />
          </button>

          <div className="mb-10">
            <h2 className={`text-4xl font-black tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t.title}
            </h2>
            <p className={`text-base font-medium leading-relaxed opacity-60 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {t.subtitle}
            </p>
          </div>

          {!isConfigured && !showSuccess && (
            <div className={`mb-8 p-6 rounded-3xl border flex flex-col gap-4 ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
               <div className="flex items-center gap-3 text-amber-500 font-black text-xs uppercase tracking-widest">
                  <Settings size={16} /> Supabase Check List
               </div>
               <ul className="space-y-2 text-[11px] font-bold opacity-70">
                 <li className="flex items-center gap-2">1. URL 必须以 https:// 开头</li>
                 <li className="flex items-center gap-2">2. 确保侧边栏的 [云端同步] 已开启</li>
                 <li className="flex items-center gap-2">3. 检查 Anon Key 是否完整复制</li>
               </ul>
            </div>
          )}

          {showSuccess ? (
            <div className="py-10 text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                {loading ? <Loader2 size={40} className="animate-spin" /> : <ShieldCheck size={40} />}
              </div>
              <h3 className="text-2xl font-black mb-4">
                {loading ? (language === 'zh' ? '正在登录' : 'Logging In') : (language === 'zh' ? '操作成功' : 'Success')}
              </h3>
              <p className={`text-sm font-medium leading-relaxed mb-10 px-6 opacity-60 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {/* 动态显示：如果还在加载说明是免验证自动登录，否则是提示去检查邮件 */}
                {loading ? t.autoLogin : t.successSignup}
              </p>
              {!loading && (
                <button 
                  onClick={() => setIsLogin(true)}
                  className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  {language === 'zh' ? '前往登录' : 'Back to Login'}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] opacity-40 ml-1">
                  {t.email}
                </label>
                <div className="relative group">
                  <Mail 
                    className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-300
                      ${theme === 'dark' ? 'text-gray-600 group-focus-within:text-blue-500' : 'text-gray-300 group-focus-within:text-blue-500'}`} 
                    size={20} 
                  />
                  <input 
                    type="email" 
                    required 
                    placeholder="name@example.com"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className={`w-full pl-16 pr-8 py-5 rounded-[1.5rem] text-lg outline-none border transition-all duration-300
                      ${theme === 'dark' 
                        ? 'bg-white/[0.03] border-white/5 focus:border-blue-500/50 focus:bg-white/[0.07] text-white' 
                        : 'bg-gray-50 border-gray-100 focus:border-blue-500 focus:bg-white text-gray-900'}`} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] opacity-40 ml-1">
                  {t.password}
                </label>
                <div className="relative group">
                  <Lock 
                    className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-300
                      ${theme === 'dark' ? 'text-gray-600 group-focus-within:text-blue-500' : 'text-gray-300 group-focus-within:text-blue-500'}`} 
                    size={20} 
                  />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className={`w-full pl-16 pr-8 py-5 rounded-[1.5rem] text-lg outline-none border transition-all duration-300
                      ${theme === 'dark' 
                        ? 'bg-white/[0.03] border-white/5 focus:border-blue-500/50 focus:bg-white/[0.07] text-white' 
                        : 'bg-gray-50 border-gray-100 focus:border-blue-500 focus:bg-white text-gray-900'}`} 
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-4 px-6 py-5 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 animate-in slide-in-from-top-2">
                  <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-500 font-black leading-relaxed">{error}</p>
                </div>
              )}

              <button 
                disabled={loading} 
                className="group relative w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                {loading ? <Loader2 size={24} className="animate-spin" /> : (isLogin ? <LogIn size={24} /> : <UserPlus size={24} />)}
                {t.submit}
              </button>

              <div className="pt-4 text-center">
                <button 
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                  className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300
                    ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  {t.switch}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
