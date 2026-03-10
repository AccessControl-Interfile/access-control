import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import Footer from './Footer';

export default function ChangePassword({ userId }: { userId: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const specialChars = (newPassword.match(/[!@#$%^&*(),.?":{}|<>_]/g) || []).length;
  const uppercase = (newPassword.match(/[A-Z]/g) || []).length;
  const lowercase = (newPassword.match(/[a-z]/g) || []).length;
  const numbers = (newPassword.match(/[0-9]/g) || []).length;

  const reqLength = newPassword.length >= 8;
  const reqUppercase = uppercase >= 2;
  const reqLowercase = lowercase >= 2;
  const reqNumbers = numbers >= 2;
  const reqSpecial = specialChars >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (!reqLength || !reqUppercase || !reqLowercase || !reqNumbers || !reqSpecial) {
      setError('A senha não atende a todos os requisitos.');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        await update(ref(db, `users/${userId}`), { mustChangePassword: false });
        // No need to redirect, the parent component will re-render and show the dashboard
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar senha. Tente novamente. ' + err.message);
    } finally {
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
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Redefinição de Senha</h1>
            <p className="text-slate-500 text-center mb-6">Sua senha temporária expirou. Por favor, defina uma nova senha para continuar.</p>

            <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Requisitos da Senha:</h3>
              <ul className="space-y-2">
                <li className={`flex items-center gap-2 text-xs transition-colors ${reqLength ? 'text-emerald-600' : 'text-indigo-500'}`}>
                  {reqLength ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Pelo menos 8 caracteres
                </li>
                <li className={`flex items-center gap-2 text-xs transition-colors ${reqUppercase ? 'text-emerald-600' : 'text-indigo-500'}`}>
                  {reqUppercase ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Pelo menos 2 letras maiúsculas
                </li>
                <li className={`flex items-center gap-2 text-xs transition-colors ${reqLowercase ? 'text-emerald-600' : 'text-indigo-500'}`}>
                  {reqLowercase ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Pelo menos 2 letras minúsculas
                </li>
                <li className={`flex items-center gap-2 text-xs transition-colors ${reqNumbers ? 'text-emerald-600' : 'text-indigo-500'}`}>
                  {reqNumbers ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Pelo menos 2 números
                </li>
                <li className={`flex items-center gap-2 text-xs transition-colors ${reqSpecial ? 'text-emerald-600' : 'text-indigo-500'}`}>
                  {reqSpecial ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Pelo menos 2 caracteres especiais (!@#$%^&*...)
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-center gap-2">
                  <span className="font-bold">Erro:</span> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nova Senha</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    className="w-full pl-12 pr-12 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400" 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    className="w-full pl-12 pr-12 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400" 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 mt-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Senha'
                )}
              </button>
            </form>
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
