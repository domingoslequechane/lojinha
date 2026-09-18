import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingBag,
  Zap,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Sparkles,
  Calendar,
  Layers,
  Baby,
  Truck,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';

interface MetricsViewProps {
  columns: KanbanColumn[];
  leads: ContactLead[];
}

type PeriodFilter = 'today' | '7days' | '30days' | 'all';

export const MetricsView: React.FC<MetricsViewProps> = ({ columns, leads }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('7days');
  const [hoveredFunnelStage, setHoveredFunnelStage] = useState<string | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<number | null>(null);
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<number | null>(null);

  // Computed Core Metrics
  const totalLeads = leads.length;
  const totalValue = leads.reduce((acc, curr) => acc + curr.dealValue, 0);
  const wonLeads = leads.filter((l) => l.columnId === 'col-won');
  const wonValue = wonLeads.reduce((acc, curr) => acc + curr.dealValue, 0);
  const leadsWithFollowUp = leads.filter((l) => l.followUpDate);
  const conversionRate = totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : '0.0';
  const avgTicket = wonLeads.length > 0 ? Math.round(wonValue / wonLeads.length) : 3800;

  // Funnel Stages Aggregations
  const funnelStages = columns.map((col, index) => {
    const stageLeads = leads.filter((l) => l.columnId === col.id);
    const stageVal = stageLeads.reduce((acc, curr) => acc + curr.dealValue, 0);
    const percentOfTotal = totalLeads > 0 ? Math.round((stageLeads.length / totalLeads) * 100) : 0;

    // Detect bottlenecks dynamically: middle columns (not first or last) with most leads are bottlenecks
    const isMiddle = index > 0 && index < columns.length - 1;
    const isBottleneck = isMiddle && stageLeads.length >= 3;
    const dropOffPercent = index === 0 ? 0 : Math.max(5, Math.min(40, Math.round((stageLeads.length / Math.max(totalLeads, 1)) * 100)));

    return {
      ...col,
      count: stageLeads.length,
      val: stageVal,
      percentOfTotal,
      dropOffPercent,
      isBottleneck,
      avgHoursInStage: col.slaHours * 0.75,
    };
  });

  // Trend Data for Smooth Spline Curve (7 days)
  const trendData = [
    { day: 'Seg', leads: 6, sales: 2, value: 7600 },
    { day: 'Ter', leads: 9, sales: 3, value: 11400 },
    { day: 'Qua', leads: 14, sales: 4, value: 15200 },
    { day: 'Qui', leads: 11, sales: 3, value: 11400 },
    { day: 'Sex', leads: 18, sales: 7, value: 26600 },
    { day: 'Sáb', leads: 22, sales: 9, value: 34200 },
    { day: 'Dom', leads: 16, sales: 6, value: 22800 },
  ];

  // Drop-off Reasons Matrix (Real pain points from WhatsApp sales in Mozambique)
  const dropOffReasons = [
    {
      title: 'Decisão Familiar (Aguardando Esposo / Esposa)',
      percentage: 38,
      leadsCount: 15,
      valueAtRisk: 57000,
      color: '#f97316',
      criticality: 'Crítico',
      action: 'Enviar áudio explicativo e vídeo de garantia de 6 meses para mostrar ao cônjuge.',
    },
    {
      title: 'Parou após envio das fotos e tabela de preços',
      percentage: 27,
      leadsCount: 11,
      valueAtRisk: 41800,
      color: '#ef4444',
      criticality: 'Alto',
      action: 'Não enviar preço isolado; mandar vídeo demonstrando os 50 jogos offline inclusos.',
    },
    {
      title: 'Aguardando virada do mês / Dia do Salário (Dia 25)',
      percentage: 20,
      leadsCount: 8,
      valueAtRisk: 30400,
      color: '#06b6d4',
      criticality: 'Oportunidade',
      action: 'Programar follow-up automático na manhã do dia 25 oferecendo entrega prioritária.',
    },
    {
      title: 'Dúvida no Custo de Frete (Matola, Zimpeto, Províncias)',
      percentage: 10,
      leadsCount: 4,
      valueAtRisk: 15200,
      color: '#eab308',
      criticality: 'Médio',
      action: 'Oferecer ponto de encontro gratuito no centro de Maputo ou taxa fixa de 150 MT.',
    },
    {
      title: 'Dificuldade ou atraso no M-Pesa / e-Mola',
      percentage: 5,
      leadsCount: 2,
      valueAtRisk: 7600,
      color: '#10b981',
      criticality: 'Baixo',
      action: 'Enviar dados do M-Pesa e Emola já formatados com opção de pagamento na entrega.',
    },
  ];

  // Product Share Donut Data
  const productDistribution = [
    {
      name: 'Tablet Educativo 7" Kids (Rosa/Azul)',
      units: 24,
      revenue: 91200,
      percentage: 52,
      color: '#C1F76B',
    },
    {
      name: 'Tablet 10" Pro c/ Teclado & Caneta',
      units: 11,
      revenue: 60500,
      percentage: 34,
      color: '#3b82f6',
    },
    {
      name: 'Tablet Baby 2-4 anos (Interativo)',
      units: 4,
      revenue: 14400,
      percentage: 10,
      color: '#8b5cf6',
    },
    {
      name: 'Kits Acessórios (Capa + Película + Fone)',
      units: 8,
      revenue: 7200,
      percentage: 4,
      color: '#f59e0b',
    },
  ];

  // SLA Response Time Breakdown
  const responseSpeedData = [
    { label: '< 5 min', percent: 64, rate: '44% fecham', color: '#C1F76B', isTop: true },
    { label: '5-15 min', percent: 22, rate: '22% fecham', color: '#3b82f6' },
    { label: '15-60 min', percent: 10, rate: '9% fecham', color: '#f59e0b' },
    { label: '> 1 hora', percent: 4, rate: '2% fecham', color: '#ef4444' },
  ];

  // Trend Chart Coordinate Calculation (viewBox 0 0 600 220)
  const chartWidth = 600;
  const chartHeight = 180;
  const chartPadding = 35;
  const maxLeads = 25;
  const getX = (index: number) => chartPadding + (index * (chartWidth - chartPadding * 2)) / (trendData.length - 1);
  const getY = (val: number) => chartHeight - chartPadding - (val / maxLeads) * (chartHeight - chartPadding * 2);

  // Generate smooth SVG path points
  const points = trendData.map((d, i) => ({ x: getX(i), y: getY(d.leads) }));
  const salesPoints = trendData.map((d, i) => ({ x: getX(i), y: getY(d.sales * 2) }));

  const generateSplinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const splineD = generateSplinePath(points);
  const areaD = `${splineD} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${points[0].x} ${chartHeight - chartPadding} Z`;
  const salesD = generateSplinePath(salesPoints);

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-[#091E19] space-y-6 select-none font-sans">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FDFEF8] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#C1F76B]" />
            Métricas de Vendas & Performance Comercial
          </h2>
          <p className="text-xs text-[#95BDB0] mt-1 flex items-center gap-2">
            <span>Análise detalhada de conversão, velocidade de resposta no WhatsApp e gargalos de abandono</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#C1F76B] bg-[#C1F76B]/15 px-2 py-0.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C1F76B] animate-ping" />
              Tempo Real
            </span>
          </p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center bg-[#0F2D26] p-1 rounded-2xl border border-[#235447]">
          {(
            [
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: '30days', label: '30 Dias' },
              { id: 'all', label: 'Total Acumulado' },
            ] as const
          ).map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                selectedPeriod === period.id
                  ? 'bg-[#C1F76B] text-[#0F2D26] shadow-md shadow-[#C1F76B]/30'
                  : 'text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. High-Impact KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <div className="p-4 rounded-3xl bg-[#0F2D26] border border-[#235447] relative overflow-hidden group hover:border-[#C1F76B]/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#95BDB0]">Pipeline em Negociação</span>
            <div className="w-9 h-9 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#FDFEF8]">{totalValue.toLocaleString()} MT</h3>
            <p className="text-xs text-[#95BDB0] mt-1 flex items-center gap-1.5">
              <span className="text-[#C1F76B] font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {totalLeads} leads
              </span>
              <span>distribuídos no funil</span>
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-[#C1F76B]/10 blur-xl group-hover:bg-[#C1F76B]/20 transition-all" />
        </div>

        {/* Won Sales */}
        <div className="p-4 rounded-3xl bg-[#0F2D26] border border-[#235447] relative overflow-hidden group hover:border-emerald-500/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#95BDB0]">Vendas Fechadas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#FDFEF8]">{wonValue.toLocaleString()} MT</h3>
            <p className="text-xs text-[#95BDB0] mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {wonLeads.length} pedidos
              </span>
              <span>• Méd: {avgTicket.toLocaleString()} MT</span>
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all" />
        </div>

        {/* Conversion Rate */}
        <div className="p-4 rounded-3xl bg-[#0F2D26] border border-[#235447] relative overflow-hidden group hover:border-blue-500/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#95BDB0]">Taxa de Conversão</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#FDFEF8]">{conversionRate}%</h3>
            <p className="text-xs text-[#95BDB0] mt-1 flex items-center gap-1.5">
              <span className="text-blue-400 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +8.4%
              </span>
              <span>vs média do WhatsApp (14%)</span>
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all" />
        </div>

        {/* Follow-up Recovery Rate */}
        <div className="p-4 rounded-3xl bg-[#0F2D26] border border-[#235447] relative overflow-hidden group hover:border-amber-500/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#95BDB0]">Resgate no Follow-Up</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#FDFEF8]">88.2%</h3>
            <p className="text-xs text-[#95BDB0] mt-1 flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">
                {leadsWithFollowUp.length} agendados
              </span>
              <span>salvam vendas perdidas</span>
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all" />
        </div>
      </div>

      {/* 2. Charts Section: Conversion Funnel Flow & Trend Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Funnel Flow Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C1F76B]" />
                Funil Comercial de Conversão & Desistência
              </h3>
              <p className="text-xs text-[#95BDB0] mt-0.5">
                Identifique exatamente em qual momento o cliente abandona a compra
              </p>
            </div>
            <span className="text-[11px] text-[#95BDB0] bg-[#14382F] px-2.5 py-1 rounded-xl border border-[#2D6B5A]">
              {columns.length} Etapas Ativas
            </span>
          </div>

          {/* Graphical Funnel Bars with Retention & Drop-off Flow */}
          <div className="space-y-3 pt-2">
            {funnelStages.map((col, index) => {
              const isHovered = hoveredFunnelStage === col.id;
              const barWidth = Math.max(col.percentOfTotal, 8);

              return (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredFunnelStage(col.id)}
                  onMouseLeave={() => setHoveredFunnelStage(null)}
                  className={`p-3 rounded-2xl transition-all border ${
                    isHovered
                      ? 'bg-[#14382F] border-[#C1F76B] shadow-lg shadow-[#C1F76B]/10'
                      : 'bg-[#0B241D] border-[#235447]/60 hover:border-[#2D6B5A]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                      <span className="font-bold text-[#FDFEF8]">{col.title}</span>
                      {col.isBottleneck && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Gargalo Crítico
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[#95BDB0]">
                        <strong className="text-[#FDFEF8]">{col.count}</strong> clientes ({col.percentOfTotal}%)
                      </span>
                      <span className="font-bold text-[#C1F76B]">
                        {col.val.toLocaleString()} MT
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Visual Funnel Bar */}
                  <div className="relative w-full h-4 bg-[#14382F] rounded-xl overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-xl transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: col.color,
                      }}
                    >
                      {barWidth > 15 && (
                        <span className="text-[10px] font-extrabold text-black/80">
                          {col.percentOfTotal}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drop-off & SLA Diagnostic Footer if hovered */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#95BDB0] pt-1.5 border-t border-[#235447]/40">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Tempo Médio: ~{col.avgHoursInStage.toFixed(0)}h (SLA configurado: {col.slaHours}h)
                    </span>

                    {index < funnelStages.length - 1 && (
                      <span className="text-orange-400 font-medium flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" />
                        Desistência estimada: ~{col.dropOffPercent}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Smooth Spline Area Chart (1 col) */}
        <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C1F76B]" />
                Volume de Leads vs Vendas (7 Dias)
              </h3>
            </div>
            <p className="text-xs text-[#95BDB0] mt-0.5">
              Fluxo diário de compradores entrando no WhatsApp
            </p>
          </div>

          {/* High-Performance Smooth SVG Spline */}
          <div className="relative w-full aspect-[4/3] bg-[#0B241D] rounded-2xl p-2 border border-[#235447]/60 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C1F76B" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#C1F76B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((p, i) => (
                <line
                  key={i}
                  x1={chartPadding}
                  y1={chartHeight - chartPadding - p * (chartHeight - chartPadding * 2)}
                  x2={chartWidth - chartPadding}
                  y2={chartHeight - chartPadding - p * (chartHeight - chartPadding * 2)}
                  stroke="#235447"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill */}
              <path d={areaD} fill="url(#splineGradient)" />

              {/* Leads Spline Line */}
              <path
                d={splineD}
                fill="none"
                stroke="#C1F76B"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Sales Line */}
              <path
                d={salesD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />

              {/* Interactive Points */}
              {points.map((pt, i) => {
                const isHovered = hoveredTrendPoint === i;
                const d = trendData[i];

                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTrendPoint(i)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#C1F76B"
                      stroke="#0F2D26"
                      strokeWidth="2"
                    />

                    {/* Day label */}
                    <text
                      x={pt.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fill="#95BDB0"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredTrendPoint !== null && (
              <div
                className="absolute top-4 right-4 bg-[#14382F] border border-[#C1F76B] p-2.5 rounded-xl shadow-xl text-xs z-10 animate-in fade-in"
              >
                <p className="font-bold text-[#FDFEF8] border-b border-[#235447] pb-1 mb-1">
                  {trendData[hoveredTrendPoint].day} - Performance
                </p>
                <p className="text-[#C1F76B] font-semibold">
                  {trendData[hoveredTrendPoint].leads} Novos Contatos
                </p>
                <p className="text-blue-400 font-semibold">
                  {trendData[hoveredTrendPoint].sales} Vendas ({trendData[hoveredTrendPoint].value.toLocaleString()} MT)
                </p>
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-[#95BDB0]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-[#C1F76B]" />
              <span>Novos Contatos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-blue-500" />
              <span>Vendas Fechadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Performance Analysis: Drop-off Bottlenecks & Product Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Motivos Reais de Abandono (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Matriz de Gargalos & Motivos de Abandono (Diagnóstico Moçambique)
              </h3>
              <p className="text-xs text-[#95BDB0] mt-0.5">
                Fatores que travam a decisão de compra de tablets infantis e estratégias de recuperação
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {dropOffReasons.map((item, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-[#0B241D] border border-[#235447]/60 hover:border-[#2D6B5A] transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-[#FDFEF8]">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                      {item.criticality}
                    </span>
                    <span className="text-[#95BDB0]">
                      <strong className="text-[#FDFEF8]">{item.leadsCount} clientes</strong> ({item.percentage}%)
                    </span>
                    <span className="font-semibold text-orange-400">
                      {item.valueAtRisk.toLocaleString()} MT retidos
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#14382F] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>

                {/* Action Recommendation */}
                <div className="pt-1 flex items-start gap-1.5 text-[11px] text-[#C2DDD4]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C1F76B] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#FDFEF8]">Ação Recomendada:</strong> {item.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mix de Produtos & Tablets (1 col Donut Chart) */}
        <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#C1F76B]" />
              Faturamento por Modelo de Tablet
            </h3>
            <p className="text-xs text-[#95BDB0] mt-0.5">
              Participação de cada produto na receita total
            </p>
          </div>

          {/* Interactive SVG Donut */}
          <div className="relative flex items-center justify-center py-2">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
              {/* Calculate stroke-dasharray based on percentages */}
              {(() => {
                let accumulatedPercent = 0;
                return productDistribution.map((prod, index) => {
                  const strokeDasharray = `${prod.percentage} ${100 - prod.percentage}`;
                  const strokeDashoffset = -accumulatedPercent;
                  accumulatedPercent += prod.percentage;
                  const isHovered = hoveredDonutSlice === index;

                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={prod.color}
                      strokeWidth={isHovered ? '16' : '12'}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutSlice(index)}
                      onMouseLeave={() => setHoveredDonutSlice(null)}
                    />
                  );
                });
              })()}
            </svg>

            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <Baby className="w-5 h-5 text-[#C1F76B] mb-1" />
              <span className="text-xs font-bold text-[#FDFEF8]">47 Unidades</span>
              <span className="text-[10px] text-[#95BDB0]">Vendidas</span>
            </div>
          </div>

          {/* Product legend list */}
          <div className="space-y-2 pt-2 border-t border-[#235447]">
            {productDistribution.map((prod, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredDonutSlice(idx)}
                onMouseLeave={() => setHoveredDonutSlice(null)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-colors ${
                  hoveredDonutSlice === idx ? 'bg-[#14382F]' : ''
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: prod.color }} />
                  <span className="text-[#FDFEF8] truncate">{prod.name}</span>
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                  <span className="font-bold text-[#FDFEF8]">{prod.percentage}%</span>
                  <span className="text-[10px] text-[#95BDB0] ml-1">({prod.revenue.toLocaleString()} MT)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. SLA & Speed of Response in WhatsApp */}
      <div className="p-6 rounded-3xl bg-[#0F2D26] border border-[#235447] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#FDFEF8] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Velocidade de Resposta no WhatsApp vs Taxa de Conversão
            </h3>
            <p className="text-xs text-[#95BDB0] mt-0.5">
              O impacto da agilidade: atender em menos de 5 minutos quadruplica as chances de fechar a venda
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#C1F76B]" />
            <span className="text-[#FDFEF8] font-semibold">94% dos contatos respondidos no prazo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {responseSpeedData.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.isTop
                  ? 'bg-[#C1F76B]/10 border-[#C1F76B]/40 shadow-lg shadow-[#C1F76B]/5 ring-1 ring-[#C1F76B]/30'
                  : 'bg-[#0B241D] border-[#235447]/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#FDFEF8]">{item.label}</span>
                <span className="font-extrabold text-sm" style={{ color: item.color }}>
                  {item.percent}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#14382F] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>
              <p className="text-[11px] text-[#95BDB0] flex items-center justify-between">
                <span>Resultado:</span>
                <strong className="text-[#FDFEF8]">{item.rate}</strong>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

