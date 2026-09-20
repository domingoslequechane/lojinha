import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  LayoutDashboard, 
  Smartphone, 
  Clock, 
  TrendingUp, 
  Store, 
  ShieldCheck, 
  ChevronDown, 
  MessageSquare, 
  Plus, 
  Search, 
  Star,
  Users,
  Layers,
  Award,
  BarChart3,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BellRing
} from 'lucide-react';
import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const metrics = [
    { value: '3×', label: 'Mais Vendas Fechadas', desc: 'No WhatsApp em média' },
    { value: '15h+', label: 'Horas Economizadas', desc: 'Por semana em atendimento' },
    { value: '100%', label: 'Controle do Funil', desc: 'Sem perder nenhum cliente' },
    { value: '+100k', label: 'Mensagens & Leads', desc: 'Gerenciados com segurança' },
  ];

  const partners = [
    'Onix Agence',
    'MEG Gráfica',
    'TechMoz Store',
    'Moda & Estilo',
    'SuperDoces',
    'Glow Cosméticos',
    'Nexus Digital',
  ];

  const painPoints = [
    {
      emoji: '⏳',
      title: 'Mensagens Esquecidas',
      desc: 'Clientes pedem informações no WhatsApp e ficam sem resposta quando o movimento aperta, comprando no concorrente.',
    },
    {
      emoji: '🌀',
      title: 'Funil no Caos',
      desc: 'Não saber quem já pagou, quem está esperando entrega e quem só pediu orçamento. Tudo misturado no chat padrão.',
    },
    {
      emoji: '📅',
      title: 'Follow-ups Esquecidos',
      desc: 'Prometer ligar ou mandar novidades para um cliente no dia seguinte e esquecer completamente por falta de lembrete.',
    },
    {
      emoji: '😩',
      title: 'Atendimento Lento',
      desc: 'Ter que digitar o mesmo preço, foto de produto e conta bancária centenas de vezes todos os dias.',
    },
  ];

  const features = [
    {
      id: 'kanban',
      tag: 'Cockpit & Pipeline',
      title: 'Feche muito mais vendas com o Funil Kanban visual',
      description: 'Tenha uma visão panorâmica de todos os seus clientes em etapas claras: Novos Leads, Negociação, Aguardando Pagamento e Venda Concluída. Arraste e solte com total fluidez no computador e no celular.',
      benefits: [
        'Organização imediata de clientes por colunas personalizáveis',
        'Valor total em Meticais (MT) acumulado por cada fase do funil',
        'Pesquisa instantânea por nome, telefone, tags ou interesse de produto',
        'Visualização ultra rápida e fluida sem recarregar a página',
      ],
      icon: LayoutDashboard,
      badgeColor: '#C1F76B',
    },
    {
      id: 'whatsapp',
      tag: 'WhatsApp Multi-Atendimento',
      title: 'Conecte seu WhatsApp e atenda com velocidade máxima',
      description: 'Integração direta com o WhatsApp via QR Code em segundos. Envie e receba mensagens de texto, fotos de produtos, notas de voz e documentos com confirmação de entrega em tempo real.',
      benefits: [
        'Conexão estável e rápida com reconexão automática',
        'Notificações instantâneas de novas mensagens recebidas',
        'Histórico completo de conversa sincronizado na nuvem',
        'Multi-instâncias de WhatsApp para diferentes vendedores ou lojas',
      ],
      icon: Smartphone,
      badgeColor: '#27AE60',
    },
    {
      id: 'followup',
      tag: 'Follow-up Inteligente & Alarmes',
      title: 'Nunca mais esqueça de cobrar ou fechar com um cliente',
      description: 'Agende retornos com data e hora exatas. O Loginha alerta sua equipe com alertas sonoros e indicadores visuais para que nenhuma oportunidade esfrie.',
      benefits: [
        'Agendamento rápido de data e observação de contato',
        'Contador e badge de alertas pendentes no topo do sistema',
        'Alarme sonoro para lembrar o momento exato de enviar mensagem',
        'Aumento comprovado de até 35% na recuperação de orçamentos',
      ],
      icon: Clock,
      badgeColor: '#F59E0B',
    },
    {
      id: 'catalog',
      tag: 'Respostas Rápidas & Catálogo',
      title: 'Envie preços, kits e produtos em apenas 1 clique',
      description: 'Crie modelos pré-definidos de respostas para as dúvidas mais comuns da sua loja. Envie informações de pagamento (M-Pesa, E-Mola, Conta) e fotos de catálogo instantaneamente.',
      benefits: [
        'Biblioteca de respostas com atalhos categorizados',
        'Catálogo de produtos com fotos, descrição e estoque',
        'Disparo em 1 toque sem erros de digitação',
        'Economia de até 3 horas de digitação diária da sua equipe',
      ],
      icon: Zap,
      badgeColor: '#38BDF8',
    },
    {
      id: 'metrics',
      tag: 'Métricas & Relatórios',
      title: 'Saiba exatamente de onde vem o seu faturamento',
      description: 'Acompanhe em tempo real o volume de receita em negociação, taxa de conversão entre etapas, desempenho de vendedores e crescimento da sua loja.',
      benefits: [
        'Dashboard com gráficos claros e objetivos de faturamento',
        'Taxa de conversão de clientes por etapa do funil',
        'Exportação e importação de contatos e leads via CSV',
        'Varredura inteligente e limpeza de contatos duplicados',
      ],
      icon: TrendingUp,
      badgeColor: '#A78BFA',
    },
  ];

  const testimonials = [
    {
      name: 'Domingos Lequechane',
      role: 'Diretor & Fundador, Onix Agence',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      comment: 'Antes do Loginha, perdíamos dezenas de leads por dia no WhatsApp por falta de organização. Hoje temos 100% de clareza do funil e a nossa eficiência operacional subiu mais de 40%.',
      metric: '📈 +40% de eficiência operacional',
    },
    {
      name: 'Domingos Malaige',
      role: 'CEO, MEG Gráfica',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      comment: 'O follow-up com alarme sonoro e o funil visual transformaram o nosso setor comercial. Fechamos 3 novos contratos de grande porte logo na primeira semana de uso.',
      metric: '🔥 3 grandes contratos no 1º mês',
    },
    {
      name: 'Amina Patel',
      role: 'Proprietária, Moda & Glow Moçambique',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      comment: 'As respostas rápidas com os dados do M-Pesa e as fotos dos produtos nos economizam horas todos os dias. Nossas clientes adoram a velocidade do atendimento!',
      metric: '⚡ 3h economizadas por dia',
    },
  ];

  const plans = [
    {
      name: 'Inicial',
      subtitle: 'Para lojas individuais e negócios que estão a começar.',
      price: '990',
      currency: 'MT',
      period: '/mês',
      popular: false,
      buttonText: 'Começar Grátis',
      features: [
        '1 Número de WhatsApp Conectado',
        'Funil Kanban Visual Ilimitado',
        'Até 500 Leads Ativos',
        'Respostas Rápidas Básicas',
        'Follow-ups com Notificações',
        'Suporte por E-mail e WhatsApp',
      ],
    },
    {
      name: 'Profissional',
      subtitle: 'O plano mais escolhido por lojas que buscam escalar vendas.',
      price: '1.990',
      currency: 'MT',
      period: '/mês',
      popular: true,
      buttonText: 'Criar Loja Grátis',
      features: [
        'Tudo do Plano Inicial',
        '3 Números de WhatsApp Conectados',
        'Leads e Contatos ILIMITADOS',
        'Follow-ups com Alerta Sonoro Ativo',
        'Catálogo de Produtos & Minha Loja',
        'Importação e Exportação em CSV',
        'Varredura de Contatos Duplicados',
        'Suporte VIP Prioritário no WhatsApp',
      ],
    },
    {
      name: 'Empresarial',
      subtitle: 'Para marcas consolidadas, franquias e agências com equipe.',
      price: '3.990',
      currency: 'MT',
      period: '/mês',
      popular: false,
      buttonText: 'Falar com Especialista',
      features: [
        'Tudo do Plano Profissional',
        'Números de WhatsApp Ilimitados',
        'Multi-Usuários e Vendedores',
        'Relatórios Avançados de Faturamento',
        'Onboarding VIP com nossa equipe',
        'Treinamento ao vivo para a equipe',
        'Gerente de Conta Dedicado',
      ],
    },
  ];

  const faqs = [
    {
      question: 'Como funciona a criação de conta no Loginha?',
      answer: 'Você pode criar sua conta no Loginha em menos de 2 minutos e começar a usar o Cockpit imediatamente para organizar suas vendas. Não exigimos burocracias para começar.',
    },
    {
      question: 'Como conecto o meu WhatsApp à plataforma?',
      answer: 'A conexão é idêntica ao WhatsApp Web: basta abrir o Loginha no menu "Conectar WhatsApp", apontar a câmera do seu celular para o QR Code gerado na tela e pronto! Em poucos segundos todos os seus contatos e conversas estarão sincronizados.',
    },
    {
      question: 'O Loginha funciona no celular e no computador?',
      answer: 'Sim! O Loginha foi desenhado do zero com arquitetura responsiva e tecnologia PWA. Você pode utilizá-lo no navegador do seu smartphone, instalá-lo como aplicativo na tela inicial do celular ou operá-lo no computador como um cockpit profissional.',
    },
    {
      question: 'Quais formas de pagamento são aceitas para a assinatura?',
      answer: 'Aceitamos pagamentos locais em Moçambique via M-Pesa, E-Mola, transferência bancária (BIM, BCI, Standard Bank) e cartões de débito/crédito internacionais (Visa e Mastercard).',
    },
    {
      question: 'O que acontece se eu precisar de ajuda ou suporte?',
      answer: 'Nossa equipe de suporte técnico e atendimento comercial está disponível diretamente no WhatsApp e por e-mail para ajudar você em qualquer dúvida, desde a conexão do número até a personalização do seu funil de vendas.',
    },
    {
      question: 'Posso cancelar minha assinatura a qualquer momento?',
      answer: 'Sim, você tem total liberdade. Não há contratos de fidelidade nem multas de cancelamento. Você pode cancelar ou alterar seu plano quando desejar.',
    },
  ];

  return (
    <div className="w-full min-h-full bg-[#091E19] text-[#FDFEF8] font-sans relative overflow-x-hidden selection:bg-[#C1F76B]/30 selection:text-[#FDFEF8]">
      {/* 1. Header Flutuante */}
      <LandingNavbar />

      <main className="w-full relative">
        {/* ── 2. HERO SECTION ── */}
        <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden border-b border-[#235447]/40">
          {/* Ambient Glows */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#C1F76B]/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-96 -left-32 w-80 h-80 bg-[#27AE60]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-96 -right-32 w-80 h-80 bg-[#38BDF8]/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto text-center relative z-10">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14382F] border border-[#C1F76B]/30 text-xs font-semibold text-[#FDFEF8] mb-8 shadow-sm hover:border-[#C1F76B]/60 transition-colors animate-in fade-in duration-300">
              <span className="w-2 h-2 rounded-full bg-[#C1F76B] animate-ping" />
              <span className="text-[#C1F76B] font-bold">Novo:</span>
              <span>O Cockpit de Vendas no WhatsApp nº 1 para Lojistas</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
              Transforme conversas no WhatsApp em{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1F76B] via-[#E2FF9E] to-[#27AE60]">
                vendas reais e automáticas.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-[#95BDB0] max-w-2xl mx-auto leading-relaxed mb-8">
              Pare de perder clientes no atendimento. Organize seu funil comercial, agende follow-ups sonoros, envie respostas rápidas e feche mais negócios todos os dias.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10 max-w-md mx-auto sm:max-w-none">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 shadow-xl shadow-[#C1F76B]/25 hover:shadow-[#C1F76B]/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Criar Minha Loja Grátis</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl text-base font-semibold text-[#FDFEF8] bg-[#14382F]/80 hover:bg-[#14382F] border border-[#235447] hover:border-[#C1F76B]/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver Cockpit Demo</span>
              </Link>
            </div>

            {/* Guarantees Checklist */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#95BDB0] font-medium mb-12">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#C1F76B] stroke-[3]" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#C1F76B] stroke-[3]" />
                Sem taxa de adesão
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#C1F76B] stroke-[3]" />
                Setup em 2 minutos
              </span>
            </div>

            {/* Stars Rating */}
            <div className="flex items-center justify-center gap-2.5 mb-14">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#D1EAE0]">
                Avaliado <strong>4.9 / 5</strong> por mais de 100+ lojistas ativos
              </span>
            </div>

            {/* ── Visual Cockpit UI Mockup (Interactive Realistic Preview) ── */}
            <div className="relative mx-auto max-w-5xl rounded-2xl sm:rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-[#235447]/60 to-[#0F2D26]/40 border border-[#235447] shadow-2xl shadow-black/80">
              <div className="rounded-xl sm:rounded-2xl bg-[#0F2D26] border border-[#235447] overflow-hidden text-left shadow-inner">
                {/* Mockup Window Top Bar */}
                <div className="h-10 sm:h-12 bg-[#0B241D] border-b border-[#235447] px-3 sm:px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-xs font-mono text-[#95BDB0] hidden sm:inline">
                      app.loginha.com/cockpit
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C1F76B] animate-ping" />
                      WhatsApp Conectado
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold hidden sm:inline-flex items-center gap-1">
                      <BellRing className="w-2.5 h-2.5" /> 3 Follow-ups Hoje
                    </span>
                  </div>
                </div>

                {/* Mockup Kanban Preview Grid */}
                <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 bg-[#091E19]/80">
                  {/* Column 1: Novos Leads */}
                  <div className="bg-[#14382F]/70 border border-[#235447] rounded-2xl p-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[#235447]/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <span className="text-xs font-bold text-[#FDFEF8]">Novos Contatos</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F2D26] text-[#95BDB0] font-bold">
                        3
                      </span>
                    </div>

                    {/* Card 1 */}
                    <div className="bg-[#184339] p-2.5 rounded-xl border border-[#235447] space-y-1.5 hover:border-[#C1F76B]/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#FDFEF8]">Marta Cossa</p>
                        <span className="text-[10px] font-bold text-[#C1F76B]">2.500 MT</span>
                      </div>
                      <p className="text-[11px] text-[#95BDB0] truncate">"Olá! Quero o Vestido Floral Tamanho M..."</p>
                      <div className="flex items-center justify-between text-[10px] text-[#578577] pt-1 border-t border-[#235447]/50">
                        <span>Há 2 min</span>
                        <span className="text-blue-300 bg-blue-500/10 px-1.5 py-0.2 rounded font-semibold">Novo</span>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#184339] p-2.5 rounded-xl border border-[#235447] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#FDFEF8]">Celso Matola</p>
                        <span className="text-[10px] font-bold text-[#C1F76B]">4.200 MT</span>
                      </div>
                      <p className="text-[11px] text-[#95BDB0] truncate">"Têm entrega para a Sommerschield?"</p>
                      <div className="flex items-center justify-between text-[10px] text-[#578577] pt-1 border-t border-[#235447]/50">
                        <span>Há 15 min</span>
                        <span className="text-blue-300 bg-blue-500/10 px-1.5 py-0.2 rounded font-semibold">Novo</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Em Negociação & Follow-up */}
                  <div className="bg-[#14382F]/70 border border-[#235447] rounded-2xl p-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[#235447]/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-xs font-bold text-[#FDFEF8]">Em Negociação</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F2D26] text-[#95BDB0] font-bold">
                        2
                      </span>
                    </div>

                    {/* Card with Follow-up Alert Active */}
                    <div className="bg-[#184339] p-2.5 rounded-xl border border-amber-500/50 space-y-1.5 shadow-md shadow-amber-500/10 relative">
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.2 bg-amber-400 text-[#0F2D26] font-extrabold text-[9px] rounded-full flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Follow-up Hoje
                      </span>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#FDFEF8]">Carlos Bila</p>
                        <span className="text-[10px] font-bold text-[#C1F76B]">8.900 MT</span>
                      </div>
                      <p className="text-[11px] text-[#95BDB0] truncate">"Enviado orçamento via M-Pesa"</p>
                      <div className="flex items-center justify-between text-[10px] text-amber-300 pt-1 border-t border-[#235447]/50">
                        <span className="flex items-center gap-1">⏰ Ligar às 14:30</span>
                        <span className="text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded font-semibold">Orçamento</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Venda Fechada (Sucesso) */}
                  <div className="bg-[#14382F]/70 border border-[#235447] rounded-2xl p-3 flex flex-col gap-2.5 hidden md:flex">
                    <div className="flex items-center justify-between pb-1 border-b border-[#235447]/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C1F76B]" />
                        <span className="text-xs font-bold text-[#FDFEF8]">Vendido 🎉</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C1F76B]/20 text-[#C1F76B] font-bold">
                        5 Fechados
                      </span>
                    </div>

                    <div className="bg-[#184339] p-2.5 rounded-xl border border-[#27AE60]/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#FDFEF8]">Sheila Manhiça</p>
                        <span className="text-[10px] font-bold text-[#C1F76B]">12.500 MT</span>
                      </div>
                      <p className="text-[11px] text-[#95BDB0] truncate">"Pagamento confirmado via E-Mola ✅"</p>
                      <div className="flex items-center justify-between text-[10px] text-[#C1F76B] pt-1 border-t border-[#235447]/50">
                        <span>Pago Hoje</span>
                        <span className="bg-[#27AE60]/20 text-[#C1F76B] px-1.5 py-0.2 rounded font-bold">Concluído</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── 3. STRIP DE MÉTRICAS (IMPACT NUMBERS) ── */}
        <section className="py-12 bg-[#0F2D26]/70 border-b border-[#235447]/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              {metrics.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-3xl sm:text-5xl font-black text-[#C1F76B] tracking-tight">{item.value}</p>
                  <p className="text-xs sm:text-sm font-bold text-[#FDFEF8]">{item.label}</p>
                  <p className="text-[11px] sm:text-xs text-[#95BDB0]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 4. CLIENTES & MARCAS (TRUSTED BY) ── */}
        <section className="py-10 bg-[#091E19] border-b border-[#235447]/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#95BDB0] mb-6">
              Usado e aprovado por marcas e lojistas em crescimento
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              {partners.map((partner, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0F2D26]/60 border border-[#235447]/40 text-xs sm:text-sm font-semibold text-[#D1EAE0]"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 5. IDENTIFICAÇÃO DE DORES (PAIN POINTS) ── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-[#235447]/40 bg-[#0A221C]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                Reconhece esta realidade?
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-4 mb-4 tracking-tight">
                Vender no WhatsApp sem um sistema organizado custa <span className="text-red-400">muito dinheiro.</span>
              </h2>
              <p className="text-sm sm:text-base text-[#95BDB0]">
                O problema não é falta de clientes interessados. É a perda de vendas por falta de acompanhamento e processos manuais lentos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {painPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#0F2D26] border border-[#235447] hover:border-red-500/40 transition-all duration-200 space-y-3"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <h3 className="text-base font-bold text-[#FDFEF8]">{item.title}</h3>
                  <p className="text-xs text-[#95BDB0] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Quote Strip */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#14382F] to-[#0F2D26] border border-[#235447] text-center max-w-3xl mx-auto shadow-xl">
              <p className="text-sm sm:text-base font-semibold text-[#FDFEF8] leading-relaxed">
                "As lojas que mais faturam não trabalham no desespero —{' '}
                <span className="text-[#C1F76B] font-extrabold">operam com um Cockpit estruturado e automático."</span>
              </p>
            </div>
          </div>
        </section>


        {/* ── 6. COMPARATIVO ANTES VS DEPOIS ── */}
        <section id="como-funciona" className="py-20 sm:py-28 px-4 sm:px-6 border-b border-[#235447]/40 bg-[#091E19]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C1F76B]">
                Transformação Direta
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-2 mb-4 tracking-tight">
                A diferença entre perder clientes e bater metas todos os meses
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Coluna 1: Sem o Loginha */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0F2D26]/40 border border-red-500/20 space-y-5">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <XCircle className="w-5 h-5" />
                  <span>Sem o Loginha (WhatsApp Padrão)</span>
                </div>
                <h3 className="text-xl font-bold text-[#FDFEF8]">Atendimento Caótico & Perdas</h3>
                <ul className="space-y-3 text-xs sm:text-sm text-[#95BDB0]">
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Mensagens acumuladas sem saber quem comprou e quem está em dúvida.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Orçamentos esquecidos sem cobrança ou lembrete de follow-up.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Digitação manual repetitiva de dados do M-Pesa e fotos de catálogo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Zero relatórios de faturamento e clientes perdidos no histórico.</span>
                  </li>
                </ul>
              </div>

              {/* Coluna 2: Com o Loginha */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0F2D26] border-2 border-[#C1F76B]/40 shadow-2xl shadow-[#C1F76B]/10 space-y-5 relative">
                <span className="absolute -top-3 right-6 px-3 py-0.5 bg-[#C1F76B] text-[#0F2D26] font-extrabold text-[10px] rounded-full uppercase tracking-wide">
                  ✦ A Solução Inteligente
                </span>

                <div className="flex items-center gap-2 text-[#C1F76B] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Com o Loginha PRO</span>
                </div>
                <h3 className="text-xl font-bold text-[#FDFEF8]">Cockpit Organizado & Lucrativo</h3>
                <ul className="space-y-3 text-xs sm:text-sm text-[#FDFEF8]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#C1F76B] stroke-[3] flex-shrink-0 mt-0.5" />
                    <span>Funil visual Kanban com arrastar e soltar de leads por etapas.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#C1F76B] stroke-[3] flex-shrink-0 mt-0.5" />
                    <span>Alarmes sonoros de follow-up para nunca esquecer de fechar negócios.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#C1F76B] stroke-[3] flex-shrink-0 mt-0.5" />
                    <span>Respostas rápidas e catálogo digital enviados em apenas 1 clique.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#C1F76B] stroke-[3] flex-shrink-0 mt-0.5" />
                    <span>Métricas em tempo real de faturamento em Meticais (MT).</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C1F76B] text-[#0F2D26] text-xs font-bold hover:bg-[#C1F76B]/90 transition-all shadow-md shadow-[#C1F76B]/20"
                  >
                    <span>Experimentar Esta Realidade</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── 7. MÓDULOS E FUNCIONALIDADES (#recursos) ── */}
        <section id="recursos" className="py-20 sm:py-28 px-4 sm:px-6 border-b border-[#235447]/40 bg-[#0B241D]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C1F76B]">
                5 Módulos Poderosos
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-2 mb-4 tracking-tight">
                Tudo o que sua loja precisa em um único lugar
              </h2>
              <p className="text-sm sm:text-base text-[#95BDB0]">
                Elimine planilhas confusas e cadernos de papel. O Loginha centraliza sua operação comercial completa.
              </p>
            </div>

            <div className="space-y-16 sm:space-y-24">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                const isEven = idx % 2 === 1;

                return (
                  <div
                    key={feature.id}
                    className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                      isEven ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Feature Details */}
                    <div className={`space-y-4 ${isEven ? 'lg:order-2' : ''}`}>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#14382F] border border-[#235447] text-xs font-bold text-[#C1F76B]">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{feature.tag}</span>
                      </div>

                      <h3 className="text-2xl sm:text-4xl font-bold text-[#FDFEF8] leading-tight">
                        {feature.title}
                      </h3>

                      <p className="text-sm sm:text-base text-[#95BDB0] leading-relaxed">
                        {feature.description}
                      </p>

                      <ul className="space-y-2.5 pt-2">
                        {feature.benefits.map((benefit, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#D1EAE0]">
                            <Check className="w-4 h-4 text-[#C1F76B] stroke-[3] flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-3">
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-2 text-xs font-bold text-[#C1F76B] hover:text-[#C1F76B]/80 transition-colors group"
                        >
                          <span>Começar com {feature.tag}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Feature Card Preview Box */}
                    <div className={`${isEven ? 'lg:order-1' : ''}`}>
                      <div className="p-6 sm:p-8 rounded-3xl bg-[#0F2D26] border border-[#235447] shadow-xl space-y-4 hover:border-[#C1F76B]/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-[#14382F] border border-[#235447] flex items-center justify-center text-[#C1F76B] shadow-inner">
                          <Icon className="w-6 h-6 stroke-[2]" />
                        </div>
                        <h4 className="text-lg font-bold text-[#FDFEF8]">{feature.tag}</h4>
                        <p className="text-xs sm:text-sm text-[#95BDB0]">
                          Tecnologia desenvolvida para responder com 0ms de atraso e sincronização instantânea em tempo real com o banco de dados Supabase e WhatsApp Web.
                        </p>
                        <div className="p-3 rounded-xl bg-[#14382F]/70 border border-[#235447]/60 flex items-center justify-between text-xs text-[#C1F76B]">
                          <span className="font-semibold">Status do Módulo</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#27AE60]/20 text-[#C1F76B] font-bold">Ativo & 100% Sincronizado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ── 8. DEPOIMENTOS DE LOJISTAS (#depoimentos) ── */}
        <section id="depoimentos" className="py-20 sm:py-28 px-4 sm:px-6 border-b border-[#235447]/40 bg-[#091E19]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C1F76B]">
                Resultados Comprovados
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-2 mb-4 tracking-tight">
                O que dizem os lojistas que já usam o Loginha
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {testimonials.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl bg-[#0F2D26] border border-[#235447] flex flex-col justify-between space-y-6 hover:border-[#C1F76B]/40 transition-all shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#D1EAE0] leading-relaxed italic">
                      "{item.comment}"
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#235447]/60">
                    <div className="px-3 py-1 rounded-xl bg-[#14382F] border border-[#235447] text-xs font-bold text-[#C1F76B] inline-block">
                      {item.metric}
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#C1F76B]/40"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#FDFEF8]">{item.name}</p>
                        <p className="text-[11px] text-[#95BDB0]">{item.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 9. TABELA DE PLANOS E PREÇOS (#planos) ── */}
        <section id="planos" className="py-20 sm:py-28 px-4 sm:px-6 border-b border-[#235447]/40 bg-[#0A221C]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C1F76B]">
                Investimento Acessível
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-2 mb-4 tracking-tight">
                Preços simples, transparentes e sem pegadinhas
              </h2>
              <p className="text-sm sm:text-base text-[#95BDB0]">
                Escolha o plano que melhor atende ao tamanho da sua loja. Planos flexíveis sem fidelidade.
              </p>
            </div>

            {/* Garantia Risco Zero Pill */}
            <div className="flex justify-center mb-14">
              <div className="px-5 py-2.5 rounded-full bg-[#14382F] border border-[#235447] text-xs sm:text-sm font-semibold text-[#FDFEF8] flex items-center gap-2 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#C1F76B]" />
                <span>Satisfação garantida — suporte dedicado e ativação imediata.</span>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {plans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                    plan.popular
                      ? 'bg-[#0F2D26] border-2 border-[#C1F76B] shadow-2xl shadow-[#C1F76B]/15 md:-translate-y-2'
                      : 'bg-[#0F2D26]/70 border border-[#235447] hover:border-[#235447]/90'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#C1F76B] text-[#0F2D26] text-xs font-extrabold shadow-md uppercase tracking-wider">
                      ⚡ Mais Escolhido
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#FDFEF8]">{plan.name}</h3>
                      <p className="text-xs text-[#95BDB0] mt-1">{plan.subtitle}</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-2">
                      <span className="text-4xl sm:text-5xl font-black text-[#FDFEF8]">{plan.price}</span>
                      <span className="text-sm font-bold text-[#C1F76B]">{plan.currency}</span>
                      <span className="text-xs text-[#95BDB0]">{plan.period}</span>
                    </div>

                    <ul className="space-y-3 pt-3 border-t border-[#235447]/60">
                      {plan.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-[#D1EAE0]">
                          <Check className="w-4 h-4 text-[#C1F76B] stroke-[3] flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Link
                      to="/register"
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        plan.popular
                          ? 'bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 shadow-md shadow-[#C1F76B]/20 hover:scale-105 active:scale-95'
                          : 'bg-[#14382F] text-[#FDFEF8] hover:bg-[#184339] border border-[#235447]'
                      }`}
                    >
                      <span>{plan.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 10. PERGUNTAS FREQUENTES (#faq) ── */}
        <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 border-b border-[#235447]/40 bg-[#091E19]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C1F76B]">
                Tire suas dúvidas
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-2 mb-4 tracking-tight">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#0F2D26] border border-[#235447] overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#FDFEF8] cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#95BDB0] transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? 'rotate-180 text-[#C1F76B]' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#95BDB0] leading-relaxed border-t border-[#235447]/50 pt-3 animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ── 11. CTA FINAL ── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#091E19]">
          <div className="max-w-5xl mx-auto text-center">
            <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#14382F] to-[#0F2D26] border-2 border-[#C1F76B]/40 shadow-2xl shadow-black relative overflow-hidden space-y-8">
              {/* Background Accent */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#C1F76B]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#27AE60]/15 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-black text-[#FDFEF8] tracking-tight relative z-10 max-w-2xl mx-auto">
                Pronto para multiplicar as vendas da sua loja?
              </h2>

              <p className="text-sm sm:text-base text-[#95BDB0] max-w-xl mx-auto relative z-10 leading-relaxed">
                Junte-se a dezenas de lojistas que pararam de perder orçamentos e transformaram o WhatsApp no maior canal de vendas do negócio.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 relative z-10">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 shadow-xl shadow-[#C1F76B]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Criar Minha Loja Grátis</span>
                </Link>

                <a
                  href="#planos"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm sm:text-base font-semibold text-[#FDFEF8] bg-[#14382F] hover:bg-[#184339] border border-[#235447] transition-all cursor-pointer"
                >
                  <span>Ver Planos & Preços</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#95BDB0] relative z-10 pt-2 font-medium">
                <span>✓ Sem compromisso</span>
                <span>✓ Cancele a qualquer hora</span>
                <span>✓ Ativação imediata</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 12. Rodapé Institucional & Scroll to Top */}
      <LandingFooter />
    </div>
  );
};
