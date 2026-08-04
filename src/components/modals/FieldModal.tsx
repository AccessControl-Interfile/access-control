import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ref, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { FieldDefinition, User, AppModule, AccessLevel } from '../../types';
import { cn } from '../../lib/utils';

interface OptionItem {
  id: string;
  value: string;
}

interface FieldModalProps {
  isAddingField: { type: 'analyst' | 'system' } | null;
  editingField: { type: 'analyst' | 'system', field: FieldDefinition } | null;
  onClose: () => void;
  analystFields: FieldDefinition[];
  systemFields: FieldDefinition[];
  hasPermission: (module: AppModule, level: AccessLevel) => boolean;
  user: User | null;
  logAction: (userEmail: string, action: string, details: string, module: string, previousData?: any, newData?: any) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FieldModal: React.FC<FieldModalProps> = ({
  isAddingField,
  editingField,
  onClose,
  analystFields,
  systemFields,
  hasPermission,
  user,
  logAction,
  showToast,
}) => {
  const [hasOptions, setHasOptions] = useState(false);
  const [options, setOptions] = useState<OptionItem[]>([{ id: Math.random().toString(36).substr(2, 9), value: '' }]);
  const [textCase, setTextCase] = useState<'uppercase' | 'lowercase' | 'any'>('any');
  
  // Validation settings for Analyst fields
  const [typeRestriction, setTypeRestriction] = useState<'all' | 'letters_only' | 'numbers_only'>('all');
  const [allowAccents, setAllowAccents] = useState(true);
  const [allowSpecialChars, setAllowSpecialChars] = useState(true);
  const [allowSpecialLetters, setAllowCedilla] = useState(true);

  useEffect(() => {
    if (editingField) {
      setHasOptions(!!editingField.field.options);
      setTextCase(editingField.field.textCase || 'any');
      setTypeRestriction(editingField.field.typeRestriction || 'all');
      setAllowAccents(editingField.field.allowAccents ?? true);
      setAllowSpecialChars(editingField.field.allowSpecialChars ?? true);
      setAllowCedilla(editingField.field.allowSpecialLetters ?? true);
      if (editingField.field.options) {
        setOptions(editingField.field.options.map(opt => ({ id: Math.random().toString(36).substr(2, 9), value: opt })));
      } else {
        setOptions([{ id: Math.random().toString(36).substr(2, 9), value: '' }]);
      }
    } else {
      setHasOptions(false);
      setTextCase('any');
      setTypeRestriction('all');
      setAllowAccents(true);
      setAllowSpecialChars(true);
      setAllowCedilla(true);
      setOptions([{ id: Math.random().toString(36).substr(2, 9), value: '' }]);
    }
  }, [editingField, isAddingField]);

  if (!isAddingField && !editingField) return null;

  const handleAddOption = () => {
    setOptions([...options, { id: Math.random().toString(36).substr(2, 9), value: '' }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 1) {
      setOptions(options.filter(opt => opt.id !== id));
    } else {
      setOptions([{ id: Math.random().toString(36).substr(2, 9), value: '' }]);
    }
  };

  const handleUpdateOption = (id: string, value: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, value } : opt));
  };

  const handleAddField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isAddingField?.type === 'analyst' && !hasPermission('settings_analyst_fields')) return;
    if (isAddingField?.type === 'system' && !hasPermission('settings_system_fields')) return;

    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;
    
    let fieldOptions: string[] | undefined = undefined;
    if (hasOptions) {
      fieldOptions = options.map(o => o.value.trim()).filter(o => o !== '');
      if (fieldOptions.length === 0) {
        showToast("Adicione pelo menos uma opção.", "error");
        return;
      }
    }

    const reservedAnalystIds = ['id', 'name', 'email', 'track', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'];
    const reservedSystemIds = ['id', 'name', 'description'];

    if (isAddingField?.type === 'analyst' && reservedAnalystIds.includes(id)) {
      showToast("Este ID é reservado pelo sistema. Escolha outro.", "error");
      return;
    }
    if (isAddingField?.type === 'system' && reservedSystemIds.includes(id)) {
      showToast("Este ID é reservado pelo sistema. Escolha outro.", "error");
      return;
    }

    if (isAddingField?.type === 'analyst' && analystFields.some(f => f.id === id)) {
      showToast("Já existe um campo com este ID.", "error");
      return;
    }
    if (isAddingField?.type === 'system' && systemFields.some(f => f.id === id)) {
      showToast("Já existe um campo com este ID.", "error");
      return;
    }

    if (isAddingField?.type === 'analyst') {
      const fieldData: FieldDefinition = { 
        id, label, description, textCase,
        typeRestriction, allowAccents, allowSpecialChars, allowSpecialLetters
      };
      if (fieldOptions) fieldData.options = fieldOptions;
      const newFields = [...analystFields, fieldData];
      set(ref(db, 'config/analystFields'), newFields);
      if (user?.email) {
        logAction(user.email, 'ADD_ANALYST_FIELD', `Adicionou campo de analista: ${label}`, 'Configurações');
      }
    } else if (isAddingField?.type === 'system') {
      const fieldData: FieldDefinition = { id, label, description, textCase };
      if (fieldOptions) fieldData.options = fieldOptions;
      const newFields = [...systemFields, fieldData];
      set(ref(db, 'config/systemFields'), newFields);
      if (user?.email) {
        logAction(user.email, 'ADD_SYSTEM_FIELD', `Adicionou campo de sistema: ${label}`, 'Configurações');
      }
    }
    onClose();
  };

  const handleEditField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingField) return;
    
    const formData = new FormData(e.currentTarget);
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;

    let fieldOptions: string[] | undefined = undefined;
    if (hasOptions) {
      fieldOptions = options.map(o => o.value.trim()).filter(o => o !== '');
      if (fieldOptions.length === 0) {
        showToast("Adicione pelo menos uma opção.", "error");
        return;
      }
    }
    
    if (editingField.type === 'analyst') {
      const updated = analystFields.map(f => {
        if (f.id === editingField.field.id) {
          const fieldData: FieldDefinition = { 
            ...f, label, description, textCase,
            typeRestriction, allowAccents, allowSpecialChars, allowSpecialLetters
          };
          if (fieldOptions) {
            fieldData.options = fieldOptions;
          } else {
            delete fieldData.options;
          }
          return fieldData;
        }
        return f;
      });
      set(ref(db, 'config/analystFields'), updated);
    } else {
      const updated = systemFields.map(f => {
        if (f.id === editingField.field.id) {
          const fieldData: FieldDefinition = { ...f, label, description, textCase };
          if (fieldOptions) {
            fieldData.options = fieldOptions;
          } else {
            delete fieldData.options;
          }
          return fieldData;
        }
        return f;
      });
      set(ref(db, 'config/systemFields'), updated);
    }
    onClose();
  };

  if (isAddingField) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Novo Campo</h2>
            <p className="text-slate-500 text-sm mb-6">Adicione um novo campo personalizado.</p>
            
            <form key={isAddingField.type || 'new_field'} onSubmit={handleAddField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ID do Campo</label>
                <input 
                  name="id" 
                  required 
                  pattern="[a-z0-9_]+" 
                  onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toLowerCase(); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                  placeholder="ex: data_nascimento (apenas letras minúsculas e _)" 
                />
                <p className="text-[10px] text-slate-400 mt-1">Usado internamente. Não pode ser alterado depois.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rótulo (Label)</label>
                <input 
                  name="label" 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                  placeholder="Ex: Data de Nascimento" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                <input 
                  name="description" 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                  placeholder="Ex: Data de nascimento do colaborador" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Formatação de Texto</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTextCase('uppercase')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      textCase === 'uppercase' 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    MAIÚSCULAS
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextCase('lowercase')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      textCase === 'lowercase' 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    minúsculas
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextCase('any')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      textCase === 'any' 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Qualquer Uma
                  </button>
                </div>
              </div>

              {isAddingField.type === 'analyst' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Restrição de Caracteres</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setTypeRestriction('all')} className={cn("flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all", typeRestriction === 'all' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>Ambos</button>
                      <button type="button" onClick={() => setTypeRestriction('letters_only')} className={cn("flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all", typeRestriction === 'letters_only' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>Letras</button>
                      <button type="button" onClick={() => setTypeRestriction('numbers_only')} className={cn("flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all", typeRestriction === 'numbers_only' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>Números</button>
                    </div>
                  </div>
                  
                  {typeRestriction !== 'numbers_only' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowAccents} onChange={(e) => setAllowAccents(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Permitir Acentos</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowSpecialLetters} onChange={(e) => setAllowCedilla(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Permitir Letras Especiais</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowSpecialChars} onChange={(e) => setAllowSpecialChars(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Caracteres Especiais</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="hasOptionsAdd" 
                  checked={hasOptions} 
                  onChange={(e) => setHasOptions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="hasOptionsAdd" className="text-sm font-bold text-slate-600 cursor-pointer">Opções (Dropdown)</label>
              </div>
              {hasOptions && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Lista de Opções</label>
                  <div className="space-y-2">
                    <Reorder.Group axis="y" values={options} onReorder={setOptions} className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {options.map((option, index) => (
                          <Reorder.Item 
                            key={option.id}
                            value={option}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex gap-2 items-center"
                          >
                            <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-400 transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <input 
                              value={option.value}
                              onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                              required
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                              placeholder={`Opção ${index + 1}`} 
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveOption(option.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors py-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Opção
                  </button>
                </motion.div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (editingField) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Editar Campo</h2>
            <p className="text-slate-500 text-sm mb-6">Altere o rótulo e a descrição do campo.</p>
            
            <form key={editingField.field.id || 'edit_field'} onSubmit={handleEditField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rótulo (Label)</label>
                <input 
                  name="label" 
                  defaultValue={editingField.field.label} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                <input 
                  name="description" 
                  defaultValue={editingField.field.description} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Formatação de Texto</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTextCase('uppercase')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      textCase === 'uppercase' 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    MAIÚSCULAS
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextCase('lowercase')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      textCase === 'lowercase' 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    minúsculas
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextCase('any')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      textCase === 'any' 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Qualquer Uma
                  </button>
                </div>
              </div>

              {editingField.type === 'analyst' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Restrição de Caracteres</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setTypeRestriction('all')} className={cn("flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all", typeRestriction === 'all' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>Ambos</button>
                      <button type="button" onClick={() => setTypeRestriction('letters_only')} className={cn("flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all", typeRestriction === 'letters_only' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>Letras</button>
                      <button type="button" onClick={() => setTypeRestriction('numbers_only')} className={cn("flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all", typeRestriction === 'numbers_only' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>Números</button>
                    </div>
                  </div>
                  
                  {typeRestriction !== 'numbers_only' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowAccents} onChange={(e) => setAllowAccents(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Permitir Acentos</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowSpecialLetters} onChange={(e) => setAllowCedilla(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Permitir Letras Especiais</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowSpecialChars} onChange={(e) => setAllowSpecialChars(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Caracteres Especiais</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="hasOptionsEdit" 
                  checked={hasOptions} 
                  onChange={(e) => setHasOptions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="hasOptionsEdit" className="text-sm font-bold text-slate-600 cursor-pointer">Opções (Dropdown)</label>
              </div>
              {hasOptions && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Lista de Opções</label>
                  <div className="space-y-2">
                    <Reorder.Group axis="y" values={options} onReorder={setOptions} className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {options.map((option, index) => (
                          <Reorder.Item 
                            key={option.id}
                            value={option}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex gap-2 items-center"
                          >
                            <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-400 transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <input 
                              value={option.value}
                              onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                              required
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                              placeholder={`Opção ${index + 1}`} 
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveOption(option.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors py-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Opção
                  </button>
                </motion.div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};
