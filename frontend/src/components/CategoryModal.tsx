import React, { useState } from 'react';
import { Folder, Plus, Trash2, X, Check, Lock, Sparkles } from 'lucide-react';
import { Category } from '../types';
import { api } from '../services/api';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
}

const PRESET_COLORS = [
  '#0A84FF', '#30D158', '#BF5AF2', '#FF375F', '#FF9F0A',
  '#64D2FF', '#5E5CE6', '#FFD60A', '#32D74B', '#AC8E68'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onRefreshCategories
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newCatName.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    setError('');
    try {
      await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        color: selectedColor
      });
      setNewCatName('');
      setNewCatDesc('');
      onRefreshCategories();
    } catch (e: any) {
      setError(e.message || 'Failed to create category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.is_system) {
      alert('System categories cannot be deleted.');
      return;
    }
    if (confirm(`Delete category "${cat.name}"? Notes will be moved to Uncategorized.`)) {
      try {
        await api.deleteCategory(cat.id);
        onRefreshCategories();
      } catch (e: any) {
        alert(e.message || 'Failed to delete category');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border mac-acrylic mac-window-shadow overflow-hidden text-left mac-inset-highlight animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-card)'
        }}
      >
        {/* macOS Sheet Header */}
        <div
          className="p-4 px-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Category Manager</h3>
              <p className="text-[11px] text-gray-400">Organize and tag your offline workspace notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] mac-btn transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Create New Category Card */}
          <div
            className="p-3.5 rounded-xl border space-y-2.5 bg-black/25"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h4 className="text-xs font-semibold text-white">New Category</h4>
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name (e.g. Distributed Systems)..."
              className="w-full bg-black/30 border rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/60 transition"
              style={{ borderColor: 'var(--border-card)' }}
            />
            <input
              type="text"
              value={newCatDesc}
              onChange={e => setNewCatDesc(e.target.value)}
              placeholder="Short description (optional)..."
              className="w-full bg-black/30 border rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/60 transition"
              style={{ borderColor: 'var(--border-card)' }}
            />

            {/* macOS Apple Color Swatches */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400 font-medium">Color:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs relative"
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && (
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}

            <button
              onClick={handleCreate}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs mac-btn transition active:scale-95"
            >
              Add Category
            </button>
          </div>

          {/* Existing Categories List */}
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Configured Categories ({categories.length})
            </h4>
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 px-3 rounded-xl hover:bg-white/[0.04] text-xs transition border border-transparent hover:border-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-white">{cat.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">({cat.notes_count || 0})</span>
                </div>

                <div>
                  {cat.is_system ? (
                    <span title="Protected System Category" className="text-gray-500">
                      <Lock className="w-3 h-3" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

