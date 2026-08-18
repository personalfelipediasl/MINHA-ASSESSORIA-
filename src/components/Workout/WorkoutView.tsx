import React, { useState } from 'react';
import {
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  VO2TestRecord,
  WorkoutLog,
} from '../../types';
import { COMPLEMENTARY_ROUTINES } from '../../data/trainingModels';
import { generateTrainingPlanPDF } from '../../services/pdfGenerator';
import {
  Calendar,
  Download,
  Play,
  RotateCcw,
  Shield,
  Dumbbell,
  Compass,
  Zap,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  Award,
  Layers,
  Gauge,
  Timer,
} from 'lucide-react';

interface WorkoutViewProps {
  profile: UserProfile;
  plan: TrainingPlan;
  latestTest?: VO2TestRecord | null;
  allTests?: VO2TestRecord[];
  workoutLogs?: WorkoutLog[];
  onStartSession: (session: WorkoutSession, weekNumber: number) => void;
  onUpdatePlan: (plan: TrainingPlan) => void;
  onOpenTestHub?: () => void;
  onGoBack?: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  profile,
  plan,
  latestTest,
  allTests = [],
  workoutLogs = [],
  onStartSession,
  onUpdatePlan,
  onOpenTestHub,
  onGoBack,
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(plan.currentWeekIndex || 0);
  const [selectedSessionModal, setSelectedSessionModal] = useState<WorkoutSession | null>(null);
  const [activeComplementaryTab, setActiveComplementaryTab] = useState<'none' | 'forca' | 'mobilidade' | 'educativos'>('none');
  const [showMissedWorkoutAlert, setShowMissedWorkoutAlert] = useState<boolean>(false);

  const currentWeek = plan.weeks[selectedWeekIndex] || plan.weeks[0];
  const hasVO2Test = !!latestTest && latestTest.vo2max > 0;

  const handleDownloadPDF = () => {
    generateTrainingPlanPDF(profile, plan, latestTest, allTests);
  };

  const handleReorganizeMissedWorkout = () => {
    setShowMissedWorkoutAlert(true);
  };

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
            PERIODIZAÇÃO DE TREINAMENTO & MOTOR MATEMÁTICO
          </span>
          <h1 className="text-2xl font-black text-white mt-1">PLANILHA & MICROCICLOS</h1>
          <p className="text-xs text-[#AFAFAF] mt-1">
            {plan.totalWeeks} semanas para o objetivo de {profile.targetDistance.toUpperCase()} • Simulado ao{' '}
            {profile.simuladoDayOfWeek === 0
              ? 'Domingo'
              : profile.simuladoDayOfWeek === 6
              ? 'Sábado'
              : profile.simuladoDayOfWeek === 5
              ? 'Sexta-feira'
              : `Dia ${profile.simuladoDayOfWeek}`}
          </p>
        </div>

        <button
          id="download-pdf-btn"
          onClick={handleDownloadPDF}
          className="py-2.5 px-3 bg-[#171717] hover:bg-[#222222] border border-[#2a2a2a] text-[#FF5500] hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          title="Baixar PDF da planilha completa"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">BAIXAR PDF</span>
        </button>
      </div>

      {/* VO2 Warning Banner if not calibrated */}
      {!hasVO2Test && (
        <div className="p-4 bg-[#1a120c] border border-[#FF5500]/40 rounded-2xl space-y-3">
          <div className="flex items-start space-x-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-[#FF5500] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white text-sm">Planilha com Parâmetros Provisórios</span>
              <p className="text-[11px] text-[#CCCCCC] leading-relaxed">
                Seus treinos e ritmos estão usando estimativas genéricas. Sem realizar o teste de VO2, não é possível calibrar as intensidades individuais e zonas de frequência do seu organismo com precisão.
              </p>
            </div>
          </div>
          {onOpenTestHub && (
            <button
              onClick={onOpenTestHub}
              className="w-full py-2.5 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-[#FF5500]/20"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Realizar Teste de VO₂ e Calibrar Planilha</span>
            </button>
          )}
        </div>
      )}

      {/* Week Selector Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {plan.weeks.map((w, idx) => (
          <button
            key={w.weekNumber}
            onClick={() => setSelectedWeekIndex(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              idx === selectedWeekIndex
                ? 'bg-[#FF5500] text-black font-extrabold shadow-md shadow-[#FF5500]/20'
                : 'bg-[#141414] text-[#888888] border border-[#222222] hover:text-white'
            }`}
          >
            Semana {w.weekNumber} ({w.phaseName})
          </button>
        ))}
      </div>

      {/* Week Overview Banner */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Semana {currentWeek.weekNumber} — {currentWeek.phaseName}
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-[#1a1a1a] rounded-lg text-[#FF5500] border border-[#2a2a2a]">
            {currentWeek.focus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#171717] p-3 rounded-xl border border-[#222222]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Volume Real da Semana</div>
            <div className="text-base font-black text-white font-mono">{currentWeek.targetVolumeKm} km</div>
          </div>
          <div className="bg-[#171717] p-3 rounded-xl border border-[#222222]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Tempo Total Programado</div>
            <div className="text-base font-black text-white font-mono">{currentWeek.targetDurationMin} min</div>
          </div>
        </div>
      </div>

      {/* 7 Days Session List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider flex items-center justify-between">
          <span>Estrutura dos 7 Dias</span>
          <span className="text-[10px] text-[#666666] font-normal">Clique no card para ver o detalhamento dos blocos</span>
        </div>

        {currentWeek.sessions.map((session) => {
          const isRest = session.isRestDay;
          const isLogged = workoutLogs.some((l) => l.workoutId === session.id);
          const isSimulado = session.isSimulado;

          return (
            <div
              key={session.id}
              onClick={() => setSelectedSessionModal(session)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] group ${
                isSimulado
                  ? 'bg-gradient-to-r from-[#1c140c] to-[#141414] border-[#FF5500]/60 shadow-lg shadow-[#FF5500]/5'
                  : isRest
                  ? 'bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#2a2a2a]'
                  : 'bg-[#141414] border-[#242424] hover:border-[#FF5500]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isSimulado
                        ? 'bg-[#FF5500] text-black shadow-md shadow-[#FF5500]/30 font-black'
                        : isRest
                        ? 'bg-[#141414] text-[#666666]'
                        : isLogged
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                        : 'bg-[#1f1f1f] text-[#FF5500] border border-[#2e2e2e]'
                    }`}
                  >
                    {isLogged ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isSimulado ? (
                      'SIM'
                    ) : (
                      session.dayName.substring(0, 3)
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4
                        className={`text-sm font-extrabold flex items-center space-x-1.5 ${
                          isSimulado
                            ? 'text-[#FF7700]'
                            : isRest
                            ? 'text-[#888888]'
                            : 'text-white group-hover:text-[#FF5500] transition-colors'
                        }`}
                      >
                        <span>{session.title}</span>
                      </h4>
                      {isLogged && (
                        <span className="text-[10px] text-emerald-400 font-mono">CONCLUÍDO</span>
                      )}
                    </div>
                    <p className="text-xs text-[#777777] mt-0.5">
                      {isRest
                        ? 'Descanso / Recuperação Passiva'
                        : `${session.estimatedDistanceKm} km • ${
                            session.breakdown?.totalDurationFormatted
                              ? `${session.breakdown.totalDurationFormatted} min`
                              : `${session.estimatedDurationMin} min`
                          } • ${session.intensityLabel}`}
                    </p>
                  </div>
                </div>

                {!isRest && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSession(session, currentWeek.weekNumber);
                    }}
                    className="p-2.5 bg-[#FF5500] hover:bg-[#FF6600] text-black rounded-xl font-bold transition-transform active:scale-95 shadow-md shadow-[#FF5500]/20"
                    title="Iniciar treino agora"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Missed Session Helper */}
      <div className="p-4 bg-[#111111] border border-[#222222] rounded-2xl flex items-start justify-between space-x-3">
        <div className="space-y-1">
          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
            <RotateCcw className="w-4 h-4 text-[#FF5500]" />
            <span>Perdeu um treino nesta semana?</span>
          </div>
          <p className="text-[11px] text-[#777777] leading-relaxed">
            Nunca tente compensar dobrando a distância na sessão seguinte. O descanso faz parte do treino.
          </p>
        </div>
        <button
          onClick={handleReorganizeMissedWorkout}
          className="px-3 py-2 bg-[#1c1c1c] hover:bg-[#262626] border border-[#333333] text-xs font-bold text-white rounded-xl whitespace-nowrap"
        >
          Orientação
        </button>
      </div>

      {showMissedWorkoutAlert && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-xs text-amber-200 space-y-2">
          <div className="font-bold uppercase tracking-wider text-amber-400">
            Regra da Assessoria para Treino Perdido:
          </div>
          <p>
            1. <strong>Não dobre a carga</strong> no dia seguinte — isso acumula fadiga sem adaptação fisiológica.
            <br />
            2. Se você perdeu uma sessão leve, siga o plano normalmente no próximo dia programado.
            <br />
            3. Se você perdeu o treino principal de qualidade (intervalado), substitua a próxima rodagem leve por ele, mantendo pelo menos um dia de intervalo até o Simulado.
          </p>
          <button
            onClick={() => setShowMissedWorkoutAlert(false)}
            className="text-[11px] text-amber-400 underline font-bold"
          >
            Entendido, fechar aviso
          </button>
        </div>
      )}

      {/* Complementary Modules */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
          Treinamento Complementar
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'forca', label: 'Força & Core', icon: Dumbbell },
            { id: 'mobilidade', label: 'Mobilidade', icon: Compass },
            { id: 'educativos', label: 'Educativos', icon: Zap },
          ].map((c) => {
            const Icon = c.icon;
            const isSelected = activeComplementaryTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveComplementaryTab(isSelected ? 'none' : (c.id as any))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-[#1c1c1c] border-[#FF5500] text-white shadow-md'
                    : 'bg-[#141414] border-[#222222] text-[#888888] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-[#FF5500]' : 'text-[#666666]'}`} />
                <div className="text-xs font-bold">{c.label}</div>
              </button>
            );
          })}
        </div>

        {activeComplementaryTab !== 'none' && (
          <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 space-y-4">
            {activeComplementaryTab === 'forca' && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-1">
                  {COMPLEMENTARY_ROUTINES.forca.title}
                </h4>
                <p className="text-xs text-[#777777] mb-3">
                  Poucos exercícios focados em membros inferiores e core para estabilidade da pelve.
                </p>
                <div className="space-y-2">
                  {COMPLEMENTARY_ROUTINES.forca.exercises.map((ex, i) => (
                    <div key={i} className="p-2.5 bg-[#171717] rounded-xl text-xs space-y-0.5">
                      <div className="font-bold text-white">{ex.name}</div>
                      <div className="text-[#FF5500] font-mono text-[11px]">{ex.setsAndReps}</div>
                      <div className="text-[#888888] text-[10px]">{ex.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeComplementaryTab === 'mobilidade' && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-1">
                  {COMPLEMENTARY_ROUTINES.mobilidade.title}
                </h4>
                <p className="text-xs text-[#777777] mb-3">
                  Mobilidade de tornozelo e quadril para garantir amplitude limpa na passada.
                </p>
                <div className="space-y-2">
                  {COMPLEMENTARY_ROUTINES.mobilidade.exercises.map((ex, i) => (
                    <div key={i} className="p-2.5 bg-[#171717] rounded-xl text-xs space-y-0.5">
                      <div className="font-bold text-white">{ex.name}</div>
                      <div className="text-[#FF5500] font-mono text-[11px]">{ex.setsAndReps}</div>
                      <div className="text-[#888888] text-[10px]">{ex.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeComplementaryTab === 'educativos' && (
              <div>
                <h4 className="text-sm font-extrabold text-white mb-1">
                  {COMPLEMENTARY_ROUTINES.educativos.title}
                </h4>
                <p className="text-xs text-[#777777] mb-3">
                  Exercícios de técnica de corrida e economia de energia mecânica.
                </p>
                <div className="space-y-2">
                  {COMPLEMENTARY_ROUTINES.educativos.exercises.map((ex, i) => (
                    <div key={i} className="p-2.5 bg-[#171717] rounded-xl text-xs space-y-0.5">
                      <div className="font-bold text-white">{ex.name}</div>
                      <div className="text-[#FF5500] font-mono text-[11px]">{ex.setsAndReps}</div>
                      <div className="text-[#888888] text-[10px]">{ex.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transparent Session Details Modal (Block-by-Block Metrics) */}
      {selectedSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#FF5500] font-bold">
                  {selectedSessionModal.dayName} {selectedSessionModal.isSimulado && '• 🏁 SESSÃO DE SIMULADO'}
                </span>
                <h3 className="text-xl font-black text-white">{selectedSessionModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="text-xs text-[#888888] hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#CCCCCC]">
              {/* Objective */}
              <div className="p-3.5 bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-[#FF5500]" />
                  <span>Objetivo da Sessão:</span>
                </div>
                <p className="text-[#AAAAAA] leading-relaxed">{selectedSessionModal.objective}</p>
              </div>

              {!selectedSessionModal.isRestDay ? (
                <>
                  {/* Summary Metric Header */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#262626]">
                      <div className="text-[10px] text-[#777777] uppercase font-bold">Distância Total</div>
                      <div className="text-base font-black text-white font-mono mt-0.5">
                        {selectedSessionModal.estimatedDistanceKm} km
                      </div>
                    </div>
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#262626]">
                      <div className="text-[10px] text-[#777777] uppercase font-bold">Tempo Total</div>
                      <div className="text-base font-black text-white font-mono mt-0.5">
                        {selectedSessionModal.breakdown?.totalDurationFormatted
                          ? `${selectedSessionModal.breakdown.totalDurationFormatted} min`
                          : `${selectedSessionModal.estimatedDurationMin} min`}
                      </div>
                    </div>
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#262626]">
                      <div className="text-[10px] text-[#777777] uppercase font-bold">Pace Médio</div>
                      <div className="text-sm font-black text-[#FF5500] font-mono mt-0.5">
                        {selectedSessionModal.breakdown?.averagePaceMinPerKm || 'Variável'}
                      </div>
                    </div>
                  </div>

                  {/* TRANSPARENT BLOCK-BY-BLOCK AUDIT CARD */}
                  {selectedSessionModal.breakdown ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="font-extrabold text-white uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                        <Layers className="w-4 h-4 text-[#FF5500]" />
                        <span>Detalhamento Matemático dos Blocos:</span>
                      </div>

                      {/* 1. Aquecimento */}
                      <div className="p-3 bg-[#181818] rounded-xl border border-[#242424] space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>1. Aquecimento</span>
                          <span className="font-mono text-[#FF5500]">
                            {selectedSessionModal.breakdown.warmup.distanceKm} km
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-[#888888] pt-1">
                          <div>
                            Duração: <strong className="text-white">{selectedSessionModal.breakdown.warmup.durationMin} min</strong>
                          </div>
                          <div>
                            Velocidade: <strong className="text-white">{selectedSessionModal.breakdown.warmup.speedKmH} km/h</strong>
                          </div>
                          <div>
                            Pace: <strong className="text-white">{selectedSessionModal.breakdown.warmup.paceMinPerKm}</strong>
                          </div>
                        </div>
                      </div>

                      {/* 2. Bloco Principal */}
                      <div className="p-3 bg-[#1a1815] rounded-xl border border-[#FF5500]/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-extrabold text-[#FF5500]">
                          <span>2. Bloco Principal ({selectedSessionModal.breakdown.main.isInterval ? 'Intervalado' : 'Contínuo'})</span>
                          <span className="font-mono">
                            {selectedSessionModal.breakdown.main.isInterval
                              ? `${selectedSessionModal.breakdown.main.workDistanceKm} km`
                              : `${selectedSessionModal.breakdown.main.continuousDistanceKm} km`}
                          </span>
                        </div>

                        {selectedSessionModal.breakdown.main.isInterval ? (
                          <div className="space-y-2 text-[11px]">
                            <div className="p-2 bg-[#121212] rounded-lg space-y-1">
                              <div className="font-bold text-white">Tiros / Séries de Estímulo:</div>
                              <div className="grid grid-cols-2 gap-2 text-[#999999]">
                                <div>Séries: <strong className="text-white">{selectedSessionModal.breakdown.main.repsCount} repetições</strong></div>
                                <div>Duração do tiro: <strong className="text-white">{(selectedSessionModal.breakdown.main.workDurationMin || 1) * 60}s</strong></div>
                                <div>Velocidade: <strong className="text-[#FF5500] font-mono">{selectedSessionModal.breakdown.main.workSpeedKmH} km/h</strong></div>
                                <div>Pace alvo: <strong className="text-[#FF5500] font-mono">{selectedSessionModal.breakdown.main.workPaceMinPerKm}</strong></div>
                              </div>
                            </div>

                            <div className="p-2 bg-[#121212] rounded-lg space-y-1">
                              <div className="font-bold text-white">Recuperação Ativa:</div>
                              <div className="grid grid-cols-2 gap-2 text-[#999999]">
                                <div>Pausas: <strong className="text-white">{selectedSessionModal.breakdown.main.recoveriesCount} vezes</strong></div>
                                <div>Tempo: <strong className="text-white">{(selectedSessionModal.breakdown.main.recoveryDurationMin || 1) * 60}s</strong></div>
                                <div>Velocidade: <strong className="text-white">{selectedSessionModal.breakdown.main.recoverySpeedKmH} km/h</strong></div>
                                <div>Pace: <strong className="text-white">{selectedSessionModal.breakdown.main.recoveryPaceMinPerKm}</strong></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-[#999999]">
                            <div>Distância: <strong className="text-white">{selectedSessionModal.breakdown.main.continuousDistanceKm} km</strong></div>
                            <div>Velocidade: <strong className="text-white">{selectedSessionModal.breakdown.main.continuousSpeedKmH} km/h</strong></div>
                            <div>Pace: <strong className="text-[#FF5500] font-mono">{selectedSessionModal.breakdown.main.continuousPaceMinPerKm}</strong></div>
                          </div>
                        )}
                      </div>

                      {/* 3. Desaquecimento */}
                      <div className="p-3 bg-[#181818] rounded-xl border border-[#242424] space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>3. Desaquecimento / Volta à Calma</span>
                          <span className="font-mono text-[#888888]">
                            {selectedSessionModal.breakdown.cooldown.distanceKm} km
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-[#888888] pt-1">
                          <div>
                            Duração: <strong className="text-white">{selectedSessionModal.breakdown.cooldown.durationMin} min</strong>
                          </div>
                          <div>
                            Velocidade: <strong className="text-white">{selectedSessionModal.breakdown.cooldown.speedKmH} km/h</strong>
                          </div>
                          <div>
                            Pace: <strong className="text-white">{selectedSessionModal.breakdown.cooldown.paceMinPerKm}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Trainer guidance */}
                  <div className="p-3.5 bg-[#181818] rounded-xl border border-[#2a2a2a]">
                    <div className="font-bold text-white mb-0.5 flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-[#FF5500]" />
                      <span>Orientação do Treinador:</span>
                    </div>
                    <p className="text-[#AAAAAA] italic leading-relaxed">
                      "{selectedSessionModal.executionGuidance}"
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const sess = selectedSessionModal;
                      setSelectedSessionModal(null);
                      onStartSession(sess, currentWeek.weekNumber);
                    }}
                    className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25 transition-transform active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>INICIAR TREINO NO CRONÔMETRO</span>
                  </button>
                </>
              ) : (
                <div className="p-5 bg-[#181818] rounded-xl text-center space-y-2">
                  <div className="font-bold text-white text-sm">Dia de Recuperação Passiva</div>
                  <p className="text-[#888888] text-xs leading-relaxed">
                    Hidrate-se bem, alimente-se com refeições ricas em nutrientes e priorize um sono restaurador. A supercompensação ocorre durante o repouso.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
