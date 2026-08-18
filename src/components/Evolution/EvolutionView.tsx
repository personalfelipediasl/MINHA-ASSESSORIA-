import React, { useState } from 'react';
import { VO2TestRecord, WorkoutLog } from '../../types';
import { calculateCooperPace } from '../../calculations/vo2Calculator';
import {
  TrendingUp,
  Activity,
  Calendar,
  Gauge,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  Flame,
  ChevronLeft,
  Zap,
} from 'lucide-react';

interface EvolutionViewProps {
  tests: VO2TestRecord[];
  logs: WorkoutLog[];
  onOpenTestHub: () => void;
  onGoBack?: () => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  tests,
  logs,
  onOpenTestHub,
  onGoBack,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latestTest = sortedTests.length > 0 ? sortedTests[sortedTests.length - 1] : null;

  // Chart 1: VO2max Line Calculation
  const vo2Values = sortedTests.map((t) => t.vo2max);
  const minVo2 = vo2Values.length > 0 ? Math.max(10, Math.floor(Math.min(...vo2Values) - 3)) : 20;
  const maxVo2 = vo2Values.length > 0 ? Math.ceil(Math.max(...vo2Values) + 4) : 60;
  const vo2Range = maxVo2 - minVo2 || 1;

  // Chart dimensions
  const svgWidth = 340;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 25;

  const points = sortedTests.map((t, idx) => {
    const x =
      sortedTests.length === 1
        ? svgWidth / 2
        : paddingX + (idx / (sortedTests.length - 1)) * (svgWidth - paddingX * 2);
    const y =
      svgHeight -
      paddingY -
      ((t.vo2max - minVo2) / vo2Range) * (svgHeight - paddingY * 2);
    return { x, y, test: t, index: idx };
  });

  const pathD = points.length > 1
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  // Incremental Speeds
  const incrementalTests = sortedTests.filter((t) => t.protocol === 'incremental' && t.incrementalMaxSpeedKmH);

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Top Back Navigation */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
          <span>VOLTAR</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
            HISTÓRICO FISIOLÓGICO
          </span>
          <h1 className="text-2xl font-black text-white mt-1">MINHA EVOLUÇÃO</h1>
          <p className="text-xs text-[#AFAFAF] mt-1">
            Progressão do seu VO₂max e capacidade de trabalho ao longo do tempo.
          </p>
        </div>

        <button
          onClick={onOpenTestHub}
          className="py-2.5 px-3 bg-[#FF5500] hover:bg-[#FF6600] text-black rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-[#FF5500]/20 transition-transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NOVO TESTE</span>
        </button>
      </div>

      {/* Main Chart 1: VO2max Evolution */}
      <div className="bg-[#111111] border border-[#222222] rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Evolução do VO₂max (ml/kg/min)
            </div>
            <div className="text-[11px] text-[#777777]">
              {sortedTests.length} {sortedTests.length === 1 ? 'avaliação registrada' : 'avaliações registradas'}
            </div>
          </div>

          {latestTest && (
            <div className="text-right">
              <span className="text-xl font-black text-[#FF5500] font-mono">
                {latestTest.vo2max.toFixed(2)}
              </span>
              <span className="block text-[10px] text-[#888888] font-bold">ATUAL</span>
            </div>
          )}
        </div>

        {/* SVG Chart */}
        {sortedTests.length > 0 ? (
          <div className="relative bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl p-2 pt-4">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#222222"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={svgHeight / 2}
                x2={svgWidth - paddingX}
                y2={svgHeight / 2}
                stroke="#222222"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="#222222"
                strokeDasharray="3 3"
              />

              {/* Y Axis Labels */}
              <text x="8" y={paddingY + 4} fill="#666666" fontSize="9" fontFamily="monospace">
                {maxVo2}
              </text>
              <text x="8" y={svgHeight / 2 + 3} fill="#666666" fontSize="9" fontFamily="monospace">
                {Math.round((maxVo2 + minVo2) / 2)}
              </text>
              <text x="8" y={svgHeight - paddingY + 4} fill="#666666" fontSize="9" fontFamily="monospace">
                {minVo2}
              </text>

              {/* Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FF5500"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points */}
              {points.map((p) => {
                const isSelected = selectedPointIndex === p.index;
                return (
                  <g key={p.test.id} className="cursor-pointer" onClick={() => setSelectedPointIndex(p.index)}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 7 : 5}
                      fill="#000000"
                      stroke="#FF5500"
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {p.test.vo2max.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Point Tooltip Modal/Card */}
            {selectedPointIndex !== null && points[selectedPointIndex] && (
              <div className="mt-3 p-3 bg-[#171717] border border-[#2c2c2c] rounded-xl text-xs flex items-center justify-between animate-fadeIn">
                <div>
                  <div className="font-bold text-white">
                    {new Date(points[selectedPointIndex].test.date).toLocaleDateString('pt-BR')} —{' '}
                    {points[selectedPointIndex].test.protocol === 'incremental' ? 'Esteira' : 'Cooper'}
                  </div>
                  <div className="text-[11px] text-[#AFAFAF]">
                    Classificação: <strong className="text-[#FF5500]">{points[selectedPointIndex].test.classification}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPointIndex(null)}
                  className="text-xs text-[#777777] hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0c0c0c] rounded-2xl border border-[#1e1e1e] space-y-3">
            <p className="text-xs text-[#777777]">
              Você ainda não registrou nenhum teste de VO₂max.
            </p>
            <button
              onClick={onOpenTestHub}
              className="py-2.5 px-4 bg-[#FF5500] text-black font-extrabold text-xs rounded-xl"
            >
              Fazer Primeiro Teste
            </button>
          </div>
        )}
      </div>

      {/* Chart 2: Incremental Max Speed over time (Section 22) */}
      {incrementalTests.length > 0 && (
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Velocidade Final no Teste Incremental (km/h)
            </div>
            <Gauge className="w-4 h-4 text-[#FF5500]" />
          </div>

          <div className="space-y-2">
            {incrementalTests.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-[#171717] rounded-xl border border-[#252525] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-[#777777]">
                    Estágio final completo: {t.incrementalMaxSpeedKmH} km/h
                  </div>
                </div>
                <div className="text-sm font-black text-[#FF5500] font-mono">
                  {t.incrementalMaxSpeedKmH} km/h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Re-test Recommendation (Section 23) */}
      <div className="p-5 bg-[#141414] border border-[#262626] rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
          <span>RECOMENDAÇÃO DE RETESTE MENSAL</span>
        </div>
        <p className="text-xs text-[#AFAFAF] leading-relaxed">
          O ideal é repetir o teste aproximadamente uma vez por mês e seguir os treinos programados durante esse período. Assim você consegue comparar os resultados e acompanhar sua evolução com base em dados reais.
        </p>
      </div>

      {/* Test History List (Section 21) */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
          Histórico Completo de Testes ({sortedTests.length})
        </div>

        {sortedTests.map((test, index) => (
          <div
            key={test.id}
            className="p-4 bg-[#111111] border border-[#222222] rounded-2xl space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-[#1c1c1c] text-[#FF5500] text-xs font-bold font-mono flex items-center justify-center">
                  #{sortedTests.length - index}
                </span>
                <span className="text-xs font-extrabold text-white">
                  {test.protocol === 'incremental' ? 'Teste Incremental (Esteira)' : 'Teste de Cooper (12 Min)'}
                </span>
              </div>
              <span className="text-[11px] text-[#777777] font-mono">
                {new Date(test.date).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="bg-[#171717] p-2 rounded-xl">
                <div className="text-[10px] text-[#777777]">VO₂max</div>
                <div className="font-black text-[#FF5500] font-mono">{test.vo2max.toFixed(2)}</div>
              </div>
              <div className="bg-[#171717] p-2 rounded-xl">
                <div className="text-[10px] text-[#777777]">
                  {test.protocol === 'cooper' ? 'Pace Médio' : 'Nível'}
                </div>
                <div className="font-bold text-white font-mono truncate">
                  {test.protocol === 'cooper'
                    ? (test.cooperPaceMinPerKm || calculateCooperPace(test.cooperDistanceMeters || 0))
                    : test.classification}
                </div>
              </div>
              <div className="bg-[#171717] p-2 rounded-xl">
                <div className="text-[10px] text-[#777777]">
                  {test.protocol === 'incremental' ? 'Velocidade' : 'Distância'}
                </div>
                <div className="font-bold text-white">
                  {test.protocol === 'incremental'
                    ? `${test.incrementalMaxSpeedKmH} km/h`
                    : `${test.cooperDistanceMeters} m`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
