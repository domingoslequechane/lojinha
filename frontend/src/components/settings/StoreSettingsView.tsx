import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  User,
  Globe,
  Lock,
  Camera,
  Check,
  Share2,
  ExternalLink,
  Move,
  X,
  LogOut,
  Smartphone,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { StoreSettings } from '../../types';

interface StoreSettingsViewProps {
  store: StoreSettings;
  onSaveStore: (updated: StoreSettings) => void;
}

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  store,
  onSaveStore,
}) => {
  const navigate = useNavigate();
  const { logout, update2FASettings } = useAuth();
  const [formData, setFormData] = useState<StoreSettings>({ ...store });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerContainerRef = useRef<HTMLDivElement>(null);

  // Banner reposition state
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [repositionOrigin, setRepositionOrigin] = useState({ x: 50, y: 50 });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

  // Sync when parent store changes
  useEffect(() => {
    setFormData((prev) => ({
      ...store,
      products: prev.products ?? store.products,
      paymentSettings: prev.paymentSettings ?? store.paymentSettings,
      shippingSettings: prev.shippingSettings ?? store.shippingSettings,
    }));
  }, [store]);

  const handleBannerDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: formData.bannerPositionX ?? 50,
      posY: formData.bannerPositionY ?? 50,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current || !bannerContainerRef.current) return;
      const rect = bannerContainerRef.current.getBoundingClientRect();
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      const newX = Math.min(100, Math.max(0, dragStartRef.current.posX - (dx / rect.width) * 100));
      const newY = Math.min(100, Math.max(0, dragStartRef.current.posY - (dy / rect.height) * 100));
      setFormData((prev) => ({ ...prev, bannerPositionX: newX, bannerPositionY: newY }));
    };

    const onUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleBannerTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      posX: formData.bannerPositionX ?? 50,
      posY: formData.bannerPositionY ?? 50,
    };

    const onMove = (ev: TouchEvent) => {
      if (!dragStartRef.current || !bannerContainerRef.current) return;
      const t = ev.touches[0];
      const rect = bannerContainerRef.current.getBoundingClientRect();
      const dx = t.clientX - dragStartRef.current.mouseX;
      const dy = t.clientY - dragStartRef.current.mouseY;
      const newX = Math.min(100, Math.max(0, dragStartRef.current.posX - (dx / rect.width) * 100));
      const newY = Math.min(100, Math.max(0, dragStartRef.current.posY - (dy / rect.height) * 100));
      setFormData((prev) => ({ ...prev, bannerPositionX: newX, bannerPositionY: newY }));
    };

    const onEnd = () => {
      dragStartRef.current = null;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleSaveReposition = () => {
    setIsRepositioning(false);
    onSaveStore(formData);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleCancelReposition = () => {
    setFormData((prev) => ({ ...prev, bannerPositionX: repositionOrigin.x, bannerPositionY: repositionOrigin.y }));
    setIsRepositioning(false);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'bannerUrl' | 'logoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFormData((prev) => ({ ...prev, [field]: dataUrl }));
      if (field === 'bannerUrl') setBannerError(false);
      if (field === 'logoUrl') setLogoError(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('A nova senha e a confirmação de senha não coincidem.');
      return;
    }

    onSaveStore(formData);
    setShowSuccessToast(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-[#091E19] space-y-6 select-none font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FDFEF8] flex items-center gap-2">
            <User className="w-6 h-6 text-[#C1F76B]" />
            Minha Conta
          </h2>
          <p className="text-xs text-[#95BDB0] mt-1">
            Gerencie o perfil e a identidade visual da sua loja
          </p>
        </div>

        <div className="flex items-center gap-3">
          {errorMessage && (
            <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <span>{errorMessage}</span>
            </div>
          )}
          {showSuccessToast && (
            <div className="px-4 py-2 rounded-xl bg-[#C1F76B] text-[#0F2D26] text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-[#C1F76B]/20 animate-in fade-in zoom-in-95">
              <Check className="w-4 h-4" />
              <span>Perfil salvo com sucesso!</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
        {/* Hidden file inputs */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e, 'bannerUrl')}
        />
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e, 'logoUrl')}
        />

        {/* Banner & Logo Visual Identity Card */}
        <div className="rounded-3xl bg-[#0F2D26] border border-[#235447] overflow-hidden">
          <div
            ref={bannerContainerRef}
            className={`relative h-52 w-full bg-[#14382F] overflow-hidden ${isRepositioning ? 'cursor-grab active:cursor-grabbing select-none' : 'group'}`}
            onMouseDown={isRepositioning ? handleBannerDragStart : undefined}
            onTouchStart={isRepositioning ? handleBannerTouchStart : undefined}
          >
            {formData.bannerUrl && !bannerError ? (
              <img
                src={formData.bannerUrl}
                alt="Banner da Loja"
                draggable={false}
                onError={() => setBannerError(true)}
                className={`w-full h-full object-cover pointer-events-none ${!isRepositioning ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}
                style={{ objectPosition: `${formData.bannerPositionX ?? 50}% ${formData.bannerPositionY ?? 50}%` }}
              />
            ) : (
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer bg-gradient-to-b from-[#14382F] to-[#0F2D26] hover:from-[#184339] hover:to-[#14382F] transition-colors border-2 border-dashed border-[#235447] hover:border-[#C1F76B]/40"
              >
                <div className="w-10 h-10 rounded-xl bg-[#091E19] flex items-center justify-center text-[#C1F76B] shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#FDFEF8]">Clique para enviar o Banner da Loja</span>
                <span className="text-[10px] text-[#95BDB0]">Recomendado: 1200 x 400 px</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F2D26] via-transparent to-black/40 pointer-events-none" />

            {isRepositioning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-white/20">
                  <Move className="w-4 h-4 text-[#FDFEF8] animate-pulse" />
                  <span className="text-[#FDFEF8] text-xs font-bold">Arraste para ajustar a posição</span>
                </div>
              </div>
            )}

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              {isRepositioning ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelReposition}
                    className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 backdrop-blur-xs text-[#FDFEF8] text-xs font-medium cursor-pointer flex items-center gap-1.5 border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReposition}
                    className="px-3.5 py-1.5 rounded-xl bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#C1F76B]/30 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Posição</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRepositionOrigin({ x: formData.bannerPositionX ?? 50, y: formData.bannerPositionY ?? 50 });
                      setIsRepositioning(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 hover:border-[#C1F76B]/50 backdrop-blur-xs text-[#FDFEF8] text-xs font-medium cursor-pointer flex items-center gap-1.5 border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Move className="w-3.5 h-3.5 text-[#C1F76B]" />
                    <span>Ajustar Posição</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 hover:border-[#C1F76B]/50 backdrop-blur-xs text-[#FDFEF8] text-xs font-medium cursor-pointer flex items-center gap-1.5 border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#C1F76B]" />
                    <span>Trocar Banner</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Logo & Store Info */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14">
            <div className="flex items-end gap-4">
              <div
                className="relative group cursor-pointer transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-[#C1F76B] rounded-2xl"
                onClick={() => logoInputRef.current?.click()}
              >
                {formData.logoUrl && !logoError ? (
                  <img
                    src={formData.logoUrl}
                    alt={formData.storeName}
                    onError={() => setLogoError(true)}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-[#0F2D26] shadow-2xl bg-[#14382F]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-[#0F2D26] shadow-2xl bg-[#14382F] hover:bg-[#184339] flex flex-col items-center justify-center text-[#95BDB0] hover:text-[#C1F76B] transition-colors gap-1 border-dashed border-[#235447]">
                    <Upload className="w-6 h-6 text-[#C1F76B]" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#FDFEF8]">Upload Logo</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[#FDFEF8] transition-all duration-200 border-4 border-[#0F2D26] gap-1">
                  <Camera className="w-5 h-5 text-[#C1F76B]" />
                  <span className="text-[10px] font-bold">Trocar Logo</span>
                </div>
              </div>

              <div className="mb-1">
                <h3 className="text-lg font-bold text-[#FDFEF8] flex items-center gap-2">
                  {formData.storeName}
                  <span className="text-[10px] uppercase font-extrabold text-[#C1F76B] bg-[#C1F76B]/15 border border-[#C1F76B]/30 px-2 py-0.5 rounded-md">
                    Verificada
                  </span>
                </h3>
                <p className="text-xs text-[#95BDB0]">{formData.slogan}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] hover:border-[#C1F76B]/50 text-[#FDFEF8] text-xs font-semibold flex items-center gap-1.5 border border-[#2D6B5A] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#C1F76B]" />
                <span>Trocar Logo</span>
              </button>
              <a
                href={formData.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] hover:border-[#C1F76B]/50 text-[#FDFEF8] text-xs font-semibold flex items-center gap-1.5 border border-[#2D6B5A] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C1F76B]" />
                <span>Ver Loja Online</span>
              </a>
            </div>
          </div>
        </div>

        {/* Section: Store & Login Info */}
        <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
          <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2 border-b border-[#235447] pb-3">
            <Store className="w-4 h-4 text-[#C1F76B]" />
            Dados da Loja & Acesso
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">Nome da Loja *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">Slogan / Descrição Curta</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">Nome de Usuário / Administrador *</label>
              <input
                type="text"
                required
                value={formData.loginName}
                onChange={(e) => setFormData({ ...formData, loginName: e.target.value })}
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">E-mail de Login *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section: Social Media Links */}
        <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
          <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2 border-b border-[#235447] pb-3">
            <Share2 className="w-4 h-4 text-blue-400" />
            Páginas & Redes Sociais
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#95BDB0] flex items-center gap-1.5 mb-1.5">
                <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Página no Facebook
              </label>
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#95BDB0] flex items-center gap-1.5 mb-1.5">
                <svg className="w-3.5 h-3.5 text-pink-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#95BDB0] flex items-center gap-1.5 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-[#C1F76B]" />
                TikTok
              </label>
              <input
                type="url"
                value={formData.tiktokUrl}
                onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                placeholder="https://tiktok.com/@..."
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section: Security & Password */}
        <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
          <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2 border-b border-[#235447] pb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            Segurança & Senha de Acesso
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* WhatsApp 2FA Configuration */}
          <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3 mt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
                    Autenticação de Dois Fatores (2FA) via WhatsApp
                    <span className="text-[10px] text-[#95BDB0] font-normal">(Opcional)</span>
                  </h4>
                  <p className="text-[11px] text-[#95BDB0]">
                    Exigir um código de 6 dígitos enviado por WhatsApp a cada início de sessão
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newVal = !formData.twoFactorWhatsAppEnabled;
                  setFormData({ ...formData, twoFactorWhatsAppEnabled: newVal });
                  update2FASettings(newVal, formData.twoFactorPhone || formData.phone);
                }}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.twoFactorWhatsAppEnabled ? 'bg-[#C1F76B]' : 'bg-[#2D6B5A]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    formData.twoFactorWhatsAppEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.twoFactorWhatsAppEnabled && (
              <div className="pt-2 border-t border-[#235447] animate-in fade-in duration-150">
                <label className="text-xs font-semibold text-[#95BDB0] block mb-1">
                  Número de WhatsApp para envio do código de segurança:
                </label>
                <input
                  type="tel"
                  value={formData.twoFactorPhone || formData.phone || '+258 84 000 0000'}
                  onChange={(e) => {
                    setFormData({ ...formData, twoFactorPhone: e.target.value });
                    update2FASettings(true, e.target.value);
                  }}
                  placeholder="+258 84 000 0000"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save and Logout Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-8 border-t border-[#235447]/60 mt-4">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão / Trocar de Conta</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-bold shadow-lg shadow-[#C1F76B]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[#C1F76B]/40 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Dados do Perfil</span>
          </button>
        </div>
      </form>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Encerrar Sessão"
        message="Tem certeza que deseja sair da sua conta no Lojinha PRO?"
        confirmText="Sair da Conta"
        cancelText="Cancelar"
        confirmVariant="danger"
        iconType="logout"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/login');
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

