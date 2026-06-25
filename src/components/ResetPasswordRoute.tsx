import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ChangePassword from './ChangePassword';

export default function ResetPasswordRoute() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('E-mail não encontrado.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Ocorreu um erro ao enviar o e-mail. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Se o usuário estiver autenticado, mostramos o componente ChangePassword para trocar a senha diretamente.
  if (user) {
    return <ChangePassword userId={user.uid} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10">
        <div className="relative w-full">
          <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-3xl z-0 pointer-events-none"></div>
          
          <div className="relative bg-white/40 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-xl w-full overflow-hidden z-10">
            <div className="p-8 md:p-12">
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Redefinição de Senha</h1>
              
              {success ? (
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </div>
                  <p className="text-slate-600 mb-8 font-medium">
                    Um e-mail de redefinição de senha foi enviado para <span className="text-slate-800 font-bold">{email}</span>. 
                    Por favor, verifique sua caixa de entrada e siga as instruções para criar uma nova senha.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/Login?skipCheck=true'}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    Já redefini minha senha (Entrar)
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-500 text-center mb-8">
                    Como exigido pelas configurações do sistema, você precisa redefinir sua senha. Enviaremos um link seguro para o seu e-mail.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                          className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400" 
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || !email}
                      className="w-full py-4 mt-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Link de Redefinição'
                      )}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => window.location.href = '/Login?skipCheck=true'}
                      className="w-full py-2 mt-2 text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors cursor-pointer flex justify-center items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Entrar com a nova senha
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center flex flex-col items-center gap-6">
          <p className="text-[10px] font-medium text-slate-400 tracking-wide">
            © Developed by Lucas Cantão Gaspar de Souza
          </p>
        </div>
      </div>
    </div>
  );
}
