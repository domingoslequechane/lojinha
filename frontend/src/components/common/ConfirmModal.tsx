import React from 'react';
import { AlertTriangle, Trash2, LogOut, Power } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  iconType?: 'trash' | 'logout' | 'alert' | 'power';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'danger',
  iconType = 'alert',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (iconType) {
      case 'trash':
        return <Trash2 className="w-6 h-6 text-red-400" />;
      case 'logout':
        return <LogOut className="w-6 h-6 text-red-400" />;
      case 'power':
        return <Power className="w-6 h-6 text-amber-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
    }
  };

  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 font-bold';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20';
      case 'primary':
      default:
        return 'bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] font-bold shadow-lg shadow-[#C1F76B]/25';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150 space-y-4">
        {/* Icon Circle */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#14382F] border border-[#2D6B5A] flex items-center justify-center shadow-inner">
          {renderIcon()}
        </div>

        {/* Title and Message */}
        <div>
          <h3 className="text-base font-bold text-[#FDFEF8] mb-1.5 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-[#95BDB0] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#95BDB0] hover:text-[#FDFEF8] bg-[#14382F] hover:bg-[#184339] border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer hover:brightness-110 ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
