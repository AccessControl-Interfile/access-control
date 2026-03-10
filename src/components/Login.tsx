import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { logAction } from '../lib/auditLogger';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const cleanEmail = email.trim();

    try {
      // Tenta logar com a senha padrão para verificar se é primeiro acesso
      await signInWithEmailAndPassword(auth, cleanEmail, 'InterFile123$$');
      // Se der certo, o onAuthStateChanged no App.tsx vai capturar e redirecionar
      await logAction(cleanEmail, 'LOGIN_FIRST_ACCESS', 'Realizou login de primeiro acesso (senha padrão)', 'Autenticação');
    } catch (err: any) {
      // Se a senha estiver errada (auth/wrong-password) OU se der credencial inválida (auth/invalid-credential),
      // assumimos que o usuário existe (ou pode existir) e pedimos a senha dele.
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setShowPasswordInput(true);
        setLoading(false);
      } else if (err.code === 'auth/user-not-found') {
        setError('E-mail não encontrado.');
        setLoading(false);
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
        setLoading(false);
      } else {
        console.error(err);
        setError('Ocorreu um erro. Tente novamente.');
        setLoading(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      // Login bem-sucedido no Authentication.
      // O App.tsx observará a mudança de estado e renderizará o Dashboard.
      await logAction(cleanEmail, 'LOGIN_SUCCESS', 'Realizou login no sistema', 'Autenticação');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas falhas. Tente novamente mais tarde.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow for better glassmorphism visibility */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10">
        <div className="relative w-full">
          {/* Card glow */}
          <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-3xl z-0 pointer-events-none"></div>
          
          <div className="relative bg-white/40 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-xl w-full overflow-hidden z-10">
            <div className="p-8 md:p-12">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Bem-vindo</h1>
            <p className="text-slate-500 text-center mb-8">
              {showPasswordInput ? 'Digite sua senha para continuar.' : 'Informe seu e-mail para acessar.'}
            </p>

            <form onSubmit={showPasswordInput ? handleLogin : handleEmailSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-center gap-2">
                  <span className="font-bold">Erro:</span> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={showPasswordInput}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-60 text-slate-900 placeholder-slate-400" 
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {showPasswordInput && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Senha</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400" 
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 mt-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  showPasswordInput ? 'Entrar' : (
                    <>
                      Continuar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )
                )}
              </button>
              
              {showPasswordInput && (
                <button 
                  type="button"
                  onClick={() => { setShowPasswordInput(false); setError(''); }}
                  className="w-full py-2 mt-2 text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors cursor-pointer"
                >
                  Voltar e alterar e-mail
                </button>
              )}
            </form>
          </div>
        </div>
        </div>
        
        <div className="mt-10 text-center flex flex-col items-center gap-6">
          <p className="text-sm font-medium text-slate-500">
            Não tem uma conta? Solicite acesso ao administrador.
          </p>
          <p className="text-[10px] font-medium text-slate-400 tracking-wide">
            © Developed by Lucas Cantão Gaspar de Souza
          </p>
        </div>
      </div>
    </div>
  );
}
