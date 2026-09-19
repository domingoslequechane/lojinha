import React, { useState, useRef, useEffect } from 'react';
import { 
  Store, 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  Check, 
  CheckCheck, 
  Upload, 
  Copy, 
  Sparkles, 
  X,
  Video,
  Play,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { StoreSettings, StoreProduct, PaymentSettings, ShippingSettings } from '../../types';

interface MyStoreViewProps {
  store: StoreSettings;
  onSaveStore: (updated: StoreSettings) => void;
  initialTab?: 'catalog' | 'payments' | 'shipping';
}

type StoreSubTab = 'catalog' | 'payments' | 'shipping';

const ProductCardImage: React.FC<{ item: StoreProduct }> = ({ item }) => {
  const [hasError, setHasError] = useState(false);
  const isVideo = item.mediaType === 'video' || (item.imageUrl && item.imageUrl.startsWith('data:video')) || !!item.videoUrl || (item.imageUrl && /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(item.imageUrl));
  const mediaUrl = item.videoUrl || item.imageUrl;

  return (
    <div className="relative h-44 w-full bg-[#14382F] overflow-hidden flex items-center justify-center">
      {mediaUrl && !hasError ? (
        isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/40 group">
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onError={() => setHasError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#C1F76B] text-[#0F2D26] flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
              <Video className="w-3 h-3 text-[#C1F76B]" />
              Vídeo
            </span>
          </div>
        ) : (
          <img
            src={mediaUrl}
            alt={item.title}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-[#578577] bg-[#14382F] gap-2 p-4 text-center">
          <Package className="w-10 h-10 text-[#578577]" />
          <span className="text-[11px] text-[#95BDB0]">Sem mídia</span>
        </div>
      )}
      {item.price && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-[#C1F76B] font-extrabold text-xs border border-white/10">
          {item.price}
        </div>
      )}
    </div>
  );
};

export const MyStoreView: React.FC<MyStoreViewProps> = ({
  store,
  onSaveStore,
  initialTab = 'catalog',
}) => {
  const [formData, setFormData] = useState<StoreSettings>({
    ...store,
    products: store.products ?? [],
    paymentSettings: store.paymentSettings ?? {
      mpesaNumber: '',
      mpesaName: '',
      emolaNumber: '',
      emolaName: '',
      bankName: '',
      bankAccount: '',
      customInstructions: '',
    },
    shippingSettings: store.shippingSettings ?? {
      maputoFee: '',
      matolaFee: '',
      provincesFee: '',
      pickupAddress: '',
      shippingNotes: '',
    },
  });

  const [activeSubTab, setActiveSubTab] = useState<StoreSubTab>(initialTab);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState<string | null>(null);

  // Product Add / Edit State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<StoreProduct>({
    id: '',
    title: '',
    price: '',
    caption: '',
    imageUrl: '',
    videoUrl: '',
    mediaType: 'image',
  });

  const productImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...store,
      products: store.products ?? prev.products,
      paymentSettings: store.paymentSettings ?? prev.paymentSettings,
      shippingSettings: store.shippingSettings ?? prev.shippingSettings,
    }));
  }, [store]);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const handlePaymentChange = (field: keyof PaymentSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentSettings: {
        ...(prev.paymentSettings || {
          mpesaNumber: '',
          mpesaName: '',
          emolaNumber: '',
          emolaName: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleShippingChange = (field: keyof ShippingSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      shippingSettings: {
        ...(prev.shippingSettings || {
          maputoFee: '',
          matolaFee: '',
          provincesFee: '',
          pickupAddress: '',
        }),
        [field]: value,
      },
    }));
  };

  // Product actions
  const handleOpenAddProduct = () => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    setProductForm({
      id: newId,
      title: '',
      price: '',
      caption: '',
      imageUrl: '',
      videoUrl: '',
      mediaType: 'image',
    });
    setEditingProductId(null);
    setIsAddingProduct(true);
  };

  const handleOpenEditProduct = (p: StoreProduct) => {
    const isVideo = p.mediaType === 'video' || (p.imageUrl && p.imageUrl.startsWith('data:video')) || !!p.videoUrl || (p.imageUrl && /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(p.imageUrl));
    setProductForm({ 
      ...p,
      mediaType: isVideo ? 'video' : 'image',
      videoUrl: p.videoUrl || (isVideo ? p.imageUrl : ''),
    });
    setEditingProductId(p.id);
    setIsAddingProduct(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title.trim() || !productForm.price.trim()) {
      setErrorMessage('Título e Preço do produto são obrigatórios.');
      return;
    }

    const currentList = [...(formData.products || [])];
    if (editingProductId) {
      const idx = currentList.findIndex((p) => p.id === editingProductId);
      if (idx >= 0) {
        currentList[idx] = productForm;
      }
    } else {
      currentList.push(productForm);
    }

    const updated = { ...formData, products: currentList };
    setFormData(updated);
    onSaveStore(updated);
    setIsAddingProduct(false);
    setEditingProductId(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedList = (formData.products || []).filter((p) => p.id !== productId);
    const updated = { ...formData, products: updatedList };
    setFormData(updated);
    onSaveStore(updated);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleProductMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setErrorMessage('Por favor, selecione uma imagem válida (JPG, PNG, WebP) ou vídeo (MP4, WebM, MOV).');
      return;
    }

    const maxSize = isVideo ? 35 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(`O arquivo de ${isVideo ? 'vídeo' : 'imagem'} excede o limite (${isVideo ? '35 MB' : '10 MB'}).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProductForm((prev) => ({ 
        ...prev, 
        imageUrl: dataUrl,
        mediaType: isVideo ? 'video' : 'image',
        videoUrl: isVideo ? dataUrl : undefined,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPreview(label);
    setTimeout(() => setCopiedPreview(null), 2000);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    onSaveStore(formData);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Payment preview text
  const paymentPreviewParts: string[] = ['💳 *DADOS PARA PAGAMENTO / RESERVA:*'];
  if (formData.paymentSettings?.mpesaNumber) {
    paymentPreviewParts.push(`📱 *M-Pesa / Pagamento Móvel 1:* ${formData.paymentSettings.mpesaNumber}${formData.paymentSettings.mpesaName ? ` (Nome: ${formData.paymentSettings.mpesaName})` : ''}`);
  }
  if (formData.paymentSettings?.emolaNumber) {
    paymentPreviewParts.push(`📱 *e-Mola / Pagamento Móvel 2:* ${formData.paymentSettings.emolaNumber}${formData.paymentSettings.emolaName ? ` (Nome: ${formData.paymentSettings.emolaName})` : ''}`);
  }
  if (formData.paymentSettings?.bankName && formData.paymentSettings?.bankAccount) {
    paymentPreviewParts.push(`🏦 *${formData.paymentSettings.bankName}:* ${formData.paymentSettings.bankAccount}`);
  }
  if (formData.paymentSettings?.customInstructions) {
    paymentPreviewParts.push(`\n${formData.paymentSettings.customInstructions}`);
  }
  const paymentPreviewText = paymentPreviewParts.length > 1
    ? paymentPreviewParts.join('\n')
    : '💳 *DADOS PARA PAGAMENTO / RESERVA:*\n(Configure os dados de pagamento acima)';

  // Shipping preview text
  const shippingPreviewText = `📍 *INFORMAÇÕES DE ENTREGA & FRETE:*

• *Entrega Local:* ${formData.shippingSettings?.maputoFee || 'A combinar'}
• *Envio Regional:* ${formData.shippingSettings?.matolaFee || 'A combinar'}
• *Envio Nacional / Longa Distância:* ${formData.shippingSettings?.provincesFee || 'A combinar'}
• *Ponto de Retirada:* ${formData.shippingSettings?.pickupAddress || 'A combinar'}${formData.shippingSettings?.shippingNotes ? `\n\nℹ️ *Observação:* ${formData.shippingSettings.shippingNotes}` : ''}`.trim();

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-6 bg-[#091E19] space-y-4 sm:space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FDFEF8] flex items-center gap-2">
            <Store className="w-6 h-6 text-[#C1F76B]" />
            Minha Loja
          </h2>
          <p className="text-xs text-[#95BDB0] mt-1">
            Gerencie o catálogo de produtos dos tablets, contas de pagamento e taxas de frete para o WhatsApp
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
              <span>Configurações da loja salvas com sucesso!</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#235447]">
        <button
          type="button"
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
            activeSubTab === 'catalog'
              ? 'bg-[#C1F76B] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20'
              : 'bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
          }`}
        >
          <Package className={`w-4 h-4 ${activeSubTab === 'catalog' ? 'text-[#0F2D26]' : 'text-pink-400'}`} />
          <span>Catálogo do Produto</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20">
            {formData.products?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
            activeSubTab === 'payments'
              ? 'bg-[#C1F76B] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20'
              : 'bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeSubTab === 'payments' ? 'text-[#0F2D26]' : 'text-emerald-400'}`} />
          <span>Formas de Pagamento</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('shipping')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
            activeSubTab === 'shipping'
              ? 'bg-[#C1F76B] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20'
              : 'bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
          }`}
        >
          <Truck className={`w-4 h-4 ${activeSubTab === 'shipping' ? 'text-[#0F2D26]' : 'text-amber-400'}`} />
          <span>Frete e Localização</span>
        </button>
      </div>

      {/* Hidden file input for product images and videos */}
      <input
        ref={productImageInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleProductMediaUpload}
      />

      {/* ===================== ABA 1: CATÁLOGO DO PRODUTO ===================== */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#FDFEF8] flex items-center gap-2">
                <Package className="w-5 h-5 text-pink-400" />
                Catálogo de Produtos & Serviços ({formData.products?.length || 0})
              </h3>
              <p className="text-xs text-[#95BDB0] mt-1 leading-relaxed">
                Estes produtos aparecem no botão de anexo <strong className="text-[#FDFEF8]">"Catálogo de Produtos"</strong> dentro do Chat WhatsApp. Ao clicar neles no atendimento, a foto ou vídeo demonstrativo e a legenda com o preço configurado são enviados instantaneamente ao cliente.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="px-4 py-2.5 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-bold shadow-lg shadow-[#C1F76B]/25 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>

          {/* Add / Edit Product Modal */}
          {isAddingProduct && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C1F76B]" />
                    <h4 className="font-bold text-sm text-[#FDFEF8]">
                      {editingProductId ? 'Editar Produto do Catálogo' : 'Cadastrar Novo Produto'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProductId(null);
                    }}
                    className="p-1 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {/* Media (Photo or Video) Preview & Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#95BDB0]">
                        Mídia do Produto (Foto ou Vídeo) *
                      </label>
                      <div className="flex items-center gap-1 bg-[#14382F] p-0.5 rounded-lg border border-[#2D6B5A]">
                        <button
                          type="button"
                          onClick={() => setProductForm((prev) => ({ ...prev, mediaType: 'image' }))}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            productForm.mediaType !== 'video'
                              ? 'bg-[#C1F76B] text-[#0F2D26]'
                              : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductForm((prev) => ({ ...prev, mediaType: 'video' }))}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            productForm.mediaType === 'video'
                              ? 'bg-[#C1F76B] text-[#0F2D26]'
                              : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                          }`}
                        >
                          <Video className="w-3 h-3" />
                          <span>Vídeo</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="relative w-28 h-28 rounded-2xl bg-[#14382F] border border-[#2D6B5A] overflow-hidden flex-shrink-0 group flex items-center justify-center">
                        {productForm.imageUrl ? (
                          productForm.mediaType === 'video' || productForm.imageUrl.startsWith('data:video') || (productForm.videoUrl && productForm.videoUrl.length > 0) || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(productForm.imageUrl) ? (
                            <div className="relative w-full h-full bg-black/50 flex items-center justify-center">
                              <video
                                src={productForm.videoUrl || productForm.imageUrl}
                                className="w-full h-full object-cover"
                                controls
                                playsInline
                              />
                            </div>
                          ) : (
                            <img
                              src={productForm.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#95BDB0] gap-1 p-2 text-center">
                            {productForm.mediaType === 'video' ? (
                              <Video className="w-7 h-7 text-[#C1F76B]" />
                            ) : (
                              <Package className="w-7 h-7" />
                            )}
                            <span className="text-[9px] text-[#95BDB0]">
                              {productForm.mediaType === 'video' ? 'Sem vídeo' : 'Sem foto'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => productImageInputRef.current?.click()}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] text-[#FDFEF8] text-xs font-semibold flex items-center justify-center gap-2 border border-[#2D6B5A] transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-[#C1F76B]" />
                          <span>Fazer Upload de Foto ou Vídeo</span>
                        </button>
                        <p className="text-[10px] text-[#95BDB0] leading-tight">
                          Suporta fotos (JPG, PNG, WebP) e vídeos MP4/WebM/MOV (até 35 MB).
                        </p>
                        <input
                          type="url"
                          value={productForm.imageUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isVid = /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(val);
                            setProductForm((prev) => ({
                              ...prev,
                              imageUrl: val,
                              mediaType: isVid ? 'video' : prev.mediaType,
                              videoUrl: isVid ? val : prev.videoUrl,
                            }));
                          }}
                          placeholder="Ou cole a URL direta (ex: https://.../video.mp4 ou foto.jpg)"
                          className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                        Nome / Modelo do Produto *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                        placeholder="Ex: Tablet 7'' Kids Rosa Antichoque"
                        className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                        Preço *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="Ex: 1500"
                        className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-bold text-[#C1F76B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                      Legenda enviada no WhatsApp com a mídia *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={productForm.caption}
                      onChange={(e) => setProductForm({ ...productForm, caption: e.target.value })}
                      placeholder="🌸 *Tablet Educativo 7'' Kids Rosa*&#10;Com capa antichoque, 50 jogos educativos offline..."
                      className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-[#95BDB0] mt-1">
                      Dica: Use asteriscos *texto* para negrito no WhatsApp.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#235447]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProductId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] text-[#95BDB0] hover:text-[#FDFEF8] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] text-xs font-bold shadow-md shadow-[#C1F76B]/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products Grid or Empty State */}
          {(!formData.products || formData.products.length === 0) ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0F2D26] border border-[#235447] rounded-3xl text-center space-y-3 animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-2xl bg-[#14382F] border border-[#235447] flex items-center justify-center text-[#C1F76B]">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#FDFEF8]">Nenhum produto cadastrado</h4>
              <p className="text-xs text-[#95BDB0] max-w-sm leading-relaxed">
                O catálogo da sua loja está vazio. Cadastre os produtos para enviar fotos e preços em um clique aos clientes no WhatsApp.
              </p>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="mt-2 px-4 py-2.5 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-[#C1F76B]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Produto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#0F2D26] border border-[#235447] rounded-3xl overflow-hidden hover:border-[#C1F76B]/50 transition-all duration-200 flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <ProductCardImage
                      item={product}
                    />

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-[#FDFEF8] leading-snug">
                        {product.title}
                      </h4>
                      <p className="text-xs text-[#95BDB0] line-clamp-3 whitespace-pre-line leading-relaxed bg-[#14382F] p-2.5 rounded-xl border border-[#235447]">
                        {product.caption}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2 border-t border-[#235447]/50 mt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(product)}
                      className="flex-1 py-2 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] text-[#FDFEF8] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#C1F76B]" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 rounded-xl bg-[#14382F] hover:bg-red-500/20 hover:text-red-400 text-[#95BDB0] transition-colors cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== ABA 2: CONTAS DE PAGAMENTO ===================== */}
      {activeSubTab === 'payments' && (
        <form onSubmit={handleSaveAll} className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#235447] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Formas de Pagamento & Transferência
                </h3>
                <p className="text-xs text-[#95BDB0] mt-0.5">
                  Estes dados são enviados instantaneamente quando o atendente clica em <strong className="text-[#FDFEF8]">"Dados de Pagamento"</strong> no Chat.
                </p>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Pagamentos</span>
              </button>
            </div>

            {/* M-Pesa & e-Mola Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* M-Pesa */}
              <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>M-Pesa / Pagamento Móvel 1</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Número ou Chave do Pagamento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.mpesaNumber || ''}
                    onChange={(e) => handlePaymentChange('mpesaNumber', e.target.value)}
                    placeholder="Ex: 84 555 1234"
                    className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Nome do Titular da Conta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.mpesaName || ''}
                    onChange={(e) => handlePaymentChange('mpesaName', e.target.value)}
                    placeholder="Ex: Nome da Empresa ou Titular"
                    className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>

              {/* e-Mola */}
              <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>e-Mola / Pagamento Móvel 2</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Número ou Chave do Pagamento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.emolaNumber || ''}
                    onChange={(e) => handlePaymentChange('emolaNumber', e.target.value)}
                    placeholder="Ex: 86 555 1234"
                    className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Nome do Titular da Conta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.emolaName || ''}
                    onChange={(e) => handlePaymentChange('emolaName', e.target.value)}
                    placeholder="Ex: Nome da Empresa ou Titular"
                    className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Transfer (Optional) */}
              <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3 sm:col-span-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Transferência Bancária / Pix / IBAN (Opcional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                      Nome do Banco ou Instituição
                    </label>
                    <input
                      type="text"
                      value={formData.paymentSettings?.bankName || ''}
                      onChange={(e) => handlePaymentChange('bankName', e.target.value)}
                      placeholder="Ex: Banco ou Instituição Financeira"
                      className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                      Número de Conta / Pix / IBAN
                    </label>
                    <input
                      type="text"
                      value={formData.paymentSettings?.bankAccount || ''}
                      onChange={(e) => handlePaymentChange('bankAccount', e.target.value)}
                      placeholder="Ex: 123456789 ou chave Pix / IBAN"
                      className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Instrução de Confirmação para o Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.customInstructions || ''}
                    onChange={(e) => handlePaymentChange('customInstructions', e.target.value)}
                    placeholder="Ao realizar o pagamento, envie o comprovativo por aqui para darmos andamento ao pedido! 🚀"
                    className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live WhatsApp Message Preview */}
            <div className="mt-4 pt-4 border-t border-[#235447] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#C1F76B]" />
                  Prévia ao vivo da mensagem enviada no WhatsApp:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(paymentPreviewText, 'payment')}
                  className="text-[11px] text-[#C1F76B] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPreview === 'payment' ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div className="max-w-xl bg-[#005c4b] text-[#FDFEF8] text-xs p-4 rounded-2xl rounded-tr-none shadow-md font-sans whitespace-pre-line leading-relaxed">
                {paymentPreviewText}
                <div className="text-[10px] text-emerald-200/70 text-right mt-2 flex items-center justify-end gap-1 font-mono">
                  <span>14:30</span>
                  <CheckCheck className="w-3 h-3 text-[#C1F76B]" />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ===================== ABA 3: FRETE E LOCALIZAÇÃO ===================== */}
      {activeSubTab === 'shipping' && (
        <form onSubmit={handleSaveAll} className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#235447] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  Taxas de Frete, Entregas & Ponto de Retirada
                </h3>
                <p className="text-xs text-[#95BDB0] mt-0.5">
                  Estes dados são enviados instantaneamente quando o atendente clica em <strong className="text-[#FDFEF8]">"Informações de Frete"</strong> no Chat.
                </p>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Fretes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup Address */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                  Endereço Físico / Ponto de Retirada da Loja (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.shippingSettings?.pickupAddress || ''}
                  onChange={(e) => handleShippingChange('pickupAddress', e.target.value)}
                  placeholder="Ex: Rua Central, 100 ou Ponto de Coleta"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
              </div>

              {/* Local Delivery Fee */}
              <div>
                <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                  Taxa de Entrega Local (Mesma Cidade / Bairro)
                </label>
                <input
                  type="text"
                  value={formData.shippingSettings?.maputoFee || ''}
                  onChange={(e) => handleShippingChange('maputoFee', e.target.value)}
                  placeholder="Ex: Grátis no centro ou valor fixo"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
              </div>

              {/* Regional Delivery Fee */}
              <div>
                <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                  Taxa de Envio Regional (Cidades Próximas / Região Metropolitana)
                </label>
                <input
                  type="text"
                  value={formData.shippingSettings?.matolaFee || ''}
                  onChange={(e) => handleShippingChange('matolaFee', e.target.value)}
                  placeholder="Ex: Envio expresso ou taxa padrão"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
              </div>

              {/* Long Distance / National Fee */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                  Taxa de Envio Nacional / Longa Distância
                </label>
                <input
                  type="text"
                  value={formData.shippingSettings?.provincesFee || ''}
                  onChange={(e) => handleShippingChange('provincesFee', e.target.value)}
                  placeholder="Ex: Envio por transportadora ou correios"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#95BDB0] block mb-1.5">
                  Prazos & Observações de Entrega
                </label>
                <textarea
                  rows={3}
                  value={formData.shippingSettings?.shippingNotes || ''}
                  onChange={(e) => handleShippingChange('shippingNotes', e.target.value)}
                  placeholder="Ex: Pedidos confirmados até às 14h são despachados no mesmo dia."
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Live WhatsApp Message Preview */}
            <div className="mt-4 pt-4 border-t border-[#235447] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#C1F76B]" />
                  Prévia ao vivo da mensagem enviada no WhatsApp:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(shippingPreviewText, 'shipping')}
                  className="text-[11px] text-[#C1F76B] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPreview === 'shipping' ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div className="max-w-xl bg-[#005c4b] text-[#FDFEF8] text-xs p-4 rounded-2xl rounded-tr-none shadow-md font-sans whitespace-pre-line leading-relaxed">
                {shippingPreviewText}
                <div className="text-[10px] text-emerald-200/70 text-right mt-2 flex items-center justify-end gap-1 font-mono">
                  <span>14:30</span>
                  <CheckCheck className="w-3 h-3 text-[#C1F76B]" />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

