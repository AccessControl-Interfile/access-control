import React from 'react';
import { motion } from 'framer-motion';
import { ref, set, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Track, User, Analyst } from '../../types';

interface TrackModalProps {
  isAddingTrack: boolean;
  editingTrack: Track | null;
  onClose: () => void;
  user: User | null;
  analysts: Analyst[];
  getAnalystTrack: (analyst: Analyst) => string;
  logAction: (userEmail: string, action: string, details: string, module: string, previousData?: any, newData?: any) => Promise<void>;
}

export const TrackModal: React.FC<TrackModalProps> = ({
  isAddingTrack,
  editingTrack,
  onClose,
  user,
  analysts,
  getAnalystTrack,
  logAction,
}) => {
  if (!isAddingTrack && !editingTrack) return null;

  const handleSaveTrack = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    if (editingTrack) {
      const oldName = editingTrack.name;
      const newData = { name };
      update(ref(db, `tracks/${editingTrack.id}`), newData);
      if (user?.email) {
        logAction(
          user.email, 
          'EDIT_TRACK', 
          `Editou a esteira: ${oldName} para ${name}`, 
          'Configurações',
          editingTrack,
          { ...editingTrack, ...newData }
        );
      }
      // Update analysts track name
      analysts.forEach(a => {
        if (getAnalystTrack(a) === oldName) {
          // Find the actual key used for track
          const trackKey = Object.keys(a).find(k => 
            k.toLowerCase() === 'track' || 
            k.toLowerCase() === 'esteira' ||
            k.toLowerCase().includes('esteira')
          ) || 'track';
          update(ref(db, `analysts/${a.id}`), { [trackKey]: name });
        }
      });
    } else {
      const id = crypto.randomUUID();
      set(ref(db, `tracks/${id}`), { id, name });
      if (user?.email) {
        logAction(user.email, 'CREATE_TRACK', `Criou a esteira: ${name}`, 'Configurações');
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingTrack ? 'Editar Esteira' : 'Nova Esteira'}</h2>
          <p className="text-slate-500 text-sm mb-6">{editingTrack ? 'Atualize o nome da esteira.' : 'Adicione uma nova esteira operacional.'}</p>
          
          <form key={editingTrack?.id || 'new_track'} onSubmit={handleSaveTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome da Esteira</label>
              <input 
                name="name" 
                defaultValue={editingTrack?.name} 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                placeholder="Ex: Vendas" 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
