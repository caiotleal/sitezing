import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, pass: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(email, password);
      setEmail('');
      setPassword('');
      // O App.tsx fecha o modal automaticamente ao detectar o login
    } catch (err: any) {
      setError('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose(); // Fecha o modal, o App.tsx reconhece o usuário na hora
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao conectar com o Google.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setSocialLoading('apple');
    setError('');
    const provider = new OAuthProvider('apple.com');
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao conectar com a Apple.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0c0c0e] border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">SiteCraft</h2>
          <p className="text-sm text-zinc-500 mt-1">Acesse ou crie sua conta em segundos</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* BOTÕES SOCIAIS */}
        <div className="space-y-3 mb-6">
          <button 
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null}
            className="w-full bg-white hover:bg-zinc-200 text-zinc-900 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {socialLoading === 'google' ? <Loader2 size={18} className="animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Entrar com Google
          </button>

          <button 
            onClick={handleAppleLogin}
            disabled={socialLoading !== null}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {socialLoading === 'apple' ? <Loader2 size={18} className="animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.365 21.435c-1.378.932-2.766.973-4.108.04-1.304-.905-2.588-.865-4.002.04-1.448.932-2.813 1.053-4.108.04-2.516-1.89-6.303-8.155-4.042-12.016 1.12-1.92 3.124-3.15 5.328-3.19 1.407-.04 2.766.932 3.651.932.886 0 2.502-1.135 4.19-1.014 1.83.04 3.489.865 4.455 2.245-3.834 2.204-3.205 7.506.771 9.129-1.014 2.556-2.645 5.518-2.135 3.833zm-4.331-15.01c.751-.933 1.258-2.232 1.116-3.53-1.116.04-2.495.73-3.286 1.664-.69.811-1.299 2.15-1.116 3.45 1.238.121 2.515-.65 3.286-1.584z"/>
              </svg>
            )}
            Entrar com Apple
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 opacity-60">
          <div className="h-px bg-zinc-700 flex-1"></div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">ou use seu e-mail</span>
          <div className="h-px bg-zinc-700 flex-1"></div>
        </div>

        {/* FORMULÁRIO DE EMAIL E SENHA */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail size={16} />
              </div>
              <input 
                type="email" 
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors" 
                placeholder="Seu e-mail" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock size={16} />
              </div>
              <input 
                type="password" 
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors" 
                placeholder="Sua senha" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar ou Criar Conta'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
