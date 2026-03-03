import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { Lock, Loader2 } from 'lucide-react';
import Footer from './Footer';

export default function ChangePassword({ userId }: { userId: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    const specialChars = (newPassword.match(/[!@#$%^&*(),.?":{}|<>_]/g) || []).length;
    const uppercase = (newPassword.match(/[A-Z]/g) || []).length;
    const lowercase = (newPassword.match(/[a-z]/g) || []).length;
    const numbers = (newPassword.match(/[0-9]/g) || []).length;

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      setLoading(false);
      return;
    }

    if (uppercase < 2) {
      setError('A senha deve conter pelo menos 2 letras maiúsculas.');
      setLoading(false);
      return;
    }

    if (lowercase < 2) {
      setError('A senha deve conter pelo menos 2 letras minúsculas.');
      setLoading(false);
      return;
    }

    if (numbers < 2) {
      setError('A senha deve conter pelo menos 2 números.');
      setLoading(false);
      return;
    }

    if (specialChars < 2) {
      setError('A senha deve conter pelo menos 2 caracteres especiais.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
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
                <li className="flex items-center gap-2 text-xs text-indigo-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Pelo menos 8 caracteres
                </li>
                <li className="flex items-center gap-2 text-xs text-indigo-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Pelo menos 2 letras maiúsculas
                </li>
                <li className="flex items-center gap-2 text-xs text-indigo-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Pelo menos 2 letras minúsculas
                </li>
                <li className="flex items-center gap-2 text-xs text-indigo-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Pelo menos 2 números
                </li>
                <li className="flex items-center gap-2 text-xs text-indigo-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
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
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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
      <Footer />
    </div>
  );
}
