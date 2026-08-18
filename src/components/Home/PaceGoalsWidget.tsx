import React, { useState } from 'react';
import { VO2TestRecord, UserProfile } from '../../types';
import {
  calculatePaceZones,
  calculateRacePaceTargets,
  getVAMFromTest,
  calculateTanakaMaxHR,
  TrainingPaceZone,
  RacePaceTarget,
} from '../../calculations/paceCalculator';
import {
  Target,
  Heart,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Activity,
  X,
  Sparkles,
} from 'lucide-react';

interface PaceGoalsWidgetProps {
  test: VO2TestRecord | null | undefined;
  profile: UserProfile;
  onOpenTestHub: () => void;
}

export const PaceGoalsWidget: React.FC<PaceGoalsWidgetProps> = ({
  test,
  profile,
  onOpenTestHub,
}) => {
  const [activeTab, setActiveTab] = useState<'zones' | 'races'>('zones');
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  const vam = getVAMFromTest(test);
  const maxHR = calculateTanakaMaxHR(profile.age);
  const paceZones = calculatePaceZones(test, profile.age);
  const raceTargets = calculateRacePaceTargets(test);

  const hasTest = !!test && test.vo2max > 0;

  const toggleZone = (zoneKey: string) => {
    setExpandedZone(expandedZone === zoneKey ? null : zoneKey);
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] border border-[#2c2c2c] flex items-center justify-center text-[#FF5500]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">METAS DE PACE</h3>
            <p className="text-xs text-[#888888]">Ritmos calculados para seus treinos</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#181818] p-1 rounded-xl border border-[#262626] text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'zones'
                ? 'bg-[#FF5500] text-black font-extrabold shadow'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            Zonas (Z1 a Z5)
          </button>
          <button
            onClick={() => setActiveTab('races')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'races'
                ? 'bg-[#FF5500] text-black font-extrabold shadow'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            Provas (5k, 10k, 21k)
          </button>
        </div>
      </div>

      {/* Quick Summary Strip (VAM & FC Max) */}
      <div className="flex items-center justify-between p-3 bg-[#161616] rounded-2xl border border-[#242424] text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
          <span className="text-[#888888]">Vel. Aeróbia Máxima (VAM):</span>
          <strong className="text-white font-mono">{vam.toFixed(1)} km/h</strong>
        </div>

        <div className="flex items-center space-x-1.5 text-rose-400 font-mono">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span className="text-white font-bold">{maxHR} bpm max</span>
        </div>
      </div>

      {!hasTest && (
        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ritmos estimados. Faça o teste de VO₂ para calibrar.</span>
          </div>
          <button
            onClick={onOpenTestHub}
            className="text-[#FF5500] font-bold underline text-xs shrink-0 ml-2"
          >
            Fazer teste
          </button>
        </div>
      )}

      {/* TAB 1: ZONAS DE RITMO (Z1 A Z5) */}
      {activeTab === 'zones' && (
        <div className="space-y-2.5">
          <div className="text-[11px] text-[#777777] flex items-center justify-between px-1 uppercase tracking-wider font-semibold">
            <span>Zona & Intensidade</span>
            <span>Pace Recomendado</span>
          </div>

          <div className="space-y-2">
            {paceZones.map((z) => {
              const isExpanded = expandedZone === z.zone;

              return (
                <div
                  key={z.zone}
                  onClick={() => toggleZone(z.zone)}
                  className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    isExpanded
                      ? 'bg-[#181818] border-[#FF5500]/80 shadow-lg'
                      : 'bg-[#141414] hover:bg-[#191919] border-[#252525]'
                  }`}
                >
                  {/* Main Zone Row */}
                  <div className="p-3.5 flex items-center justify-between">
                    {/* Left: Badge + Name */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl font-black text-xs font-mono flex items-center justify-center text-white shrink-0 shadow"
                        style={{ backgroundColor: z.color }}
                      >
                        {z.zone}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-black text-white truncate">
                            {z.shortName}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${z.bgBadgeColor} hidden sm:inline-block`}>
                            {z.hrPercentClean}
                          </span>
                        </div>
                        <p className="text-xs text-[#888888] truncate mt-0.5">
                          {z.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Right: Pace + Range */}
                    <div className="text-right shrink-0 pl-3">
                      <div className="text-base font-black text-[#FF5500] font-mono leading-none">
                        {z.targetPaceFormatted}
                      </div>
                      <div className="text-[11px] text-[#777777] font-mono mt-1 whitespace-nowrap">
                        {z.paceRangeClean}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#262626] bg-[#121212] space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 bg-[#191919] rounded-xl border border-[#282828]">
                          <span className="text-[#777777] block uppercase font-bold text-[9px]">
                            Frequência Cardíaca
                          </span>
                          <span className="text-white font-mono font-bold">
                            {z.hrRangeClean} ({z.heartRatePercent})
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#191919] rounded-xl border border-[#282828]">
                          <span className="text-[#777777] block uppercase font-bold text-[9px]">
                            Velocidade na Esteira
                          </span>
                          <span className="text-white font-mono font-bold">
                            {z.speedRangeKmH}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#191919] rounded-xl border border-[#282828] space-y-1">
                        <span className="text-[#FF5500] font-bold uppercase text-[10px] block">
                          Como você deve se sentir:
                        </span>
                        <p className="text-[#CCCCCC] leading-relaxed">
                          {z.description}
                        </p>
                      </div>

                      <div className="text-[11px] text-[#888888]">
                        <strong className="text-white">Objetivo do treino: </strong>
                        {z.purpose}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-1">
            <span className="text-[11px] text-[#666666]">
              * Toque em qualquer zona para ver detalhes de esteira, FC e sensação.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: PROVAS & METAS (5K, 10K, 21K, 42K) */}
      {activeTab === 'races' && (
        <div className="space-y-2.5">
          <div className="text-[11px] text-[#777777] flex items-center justify-between px-1 uppercase tracking-wider font-semibold">
            <span>Distância</span>
            <span>Tempo Estimado & Pace</span>
          </div>

          <div className="space-y-2">
            {raceTargets.map((rt) => {
              const isUserDistance =
                (profile.targetDistance === '5km' && rt.distanceKm === 5) ||
                (profile.targetDistance === '10km' && rt.distanceKm === 10) ||
                (profile.targetDistance === '21km' && rt.distanceKm === 21.0975) ||
                (profile.targetDistance === '42km' && rt.distanceKm === 42.195);

              return (
                <div
                  key={rt.distanceLabel}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isUserDistance
                      ? 'bg-[#1c140d] border-[#FF5500] shadow-md'
                      : 'bg-[#141414] border-[#252525]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-white">{rt.distanceLabel}</span>
                        {isUserDistance && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FF5500] text-black font-black text-[9px] uppercase tracking-wider">
                            Sua Meta
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#888888]">{rt.effortDescription}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-[#FF5500] font-mono">
                        {rt.estimatedTimeFormatted}
                      </div>
                      <div className="text-xs text-[#AAAAAA] font-mono font-bold mt-0.5">
                        Pace {rt.targetPaceMinPerKm}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#151515] rounded-xl border border-[#222222] text-[11px] text-[#777777] leading-relaxed">
            * Predições baseadas na capacidade aeróbica atual e na equação de Peter Riegel.
          </div>
        </div>
      )}
    </div>
  );
};
