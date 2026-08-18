import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  VO2TestRecord,
  CheckInAssessment,
  WorkoutLog,
} from '../../types';
import { speedToPace } from '../../calculations/vo2Calculator';
import { getVAMFromTest } from '../../calculations/paceCalculator';
import { PaceGoalsWidget } from './PaceGoalsWidget';
import { InstallModal } from './InstallModal';
import {
  Play,
  CheckCircle2,
  Calendar,
  Gauge,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowRight,
  Flame,
  Clock,
  MapPin,
  HeartPulse,
  Lock,
  Sparkles,
  Zap,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';

interface HomeViewProps {
  profile: UserProfile;
  plan: TrainingPlan;
  todaySession: WorkoutSession | null;
  latestTest: VO2TestRecord | null;
  todayCheckIn: CheckInAssessment | null;
  workoutLogs: WorkoutLog[];
  onStartSession: (session: WorkoutSession, weekNumber: number) => void;
  onOpenCheckIn: () => void;
  onOpenTestHub: () => void;
  onGoToPlan: () => void;
  onGoToEvolution: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  plan,
  todaySession,
  latestTest,
  todayCheckIn,
  workoutLogs,
  onStartSession,
  onOpenCheckIn,
  onOpenTestHub,
  onGoToPlan,
  onGoToEvolution,
}) => {
  const currentWeek = plan.weeks[plan.currentWeekIndex || 0] || plan.weeks[0];
  const todayIsLogged = todaySession
    ? workoutLogs.some((l) => l.workoutId === todaySession.id)
    : false;

  const hasVO2Test = !!latestTest && latestTest.vo2max > 0;
  const currentVAM = getVAMFromTest(latestTest);

  // PWA & Mobile Shortcut Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* 1. TOP WELCOME & MOTIVATIONAL BANNER */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest text-[#FF5500] font-mono font-black">
              MINHA ASSESSORIA
            </span>
            <span className="text-[#333333]">•</span>
            <span className="text-xs text-[#AAAAAA] font-mono font-medium">
              {profile.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="install-mobile-app-btn"
              onClick={handleInstallClick}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#181818] hover:bg-[#242424] border border-[#FF5500]/40 text-[#FF5500] hover:text-white rounded-full text-[11px] font-bold transition-all shadow-sm active:scale-95"
              title="Instalar aplicativo na tela inicial do celular"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{isInstalled ? 'App Instalado' : 'Instalar no Celular'}</span>
              <span className="inline xs:hidden sm:hidden">{isInstalled ? 'Instalado' : 'Instalar'}</span>
            </button>
            {hasVO2Test && (
              <div
                onClick={onGoToEvolution}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#171717] hover:bg-[#222222] border border-[#2a2a2a] rounded-full text-xs font-mono text-white cursor-pointer transition-colors"
              >
                <Gauge className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>{latestTest.vo2max.toFixed(1)} ml/kg</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#CCCCCC]">
            Olá, <span className="text-white font-bold">{profile.name}</span>! Seja bem-vindo(a) à sua assessoria.
          </h2>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
            TREINAR BEM NÃO É TREINAR MAIS.
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Seu treino, seus ritmos e sua evolução com individualização e respaldo científico.
          </p>
        </div>
      </div>

      {/* 2. CARD DO TOPO: TESTE DE VO2 (ITEM OBRIGATÓRIO DA ASSESSORIA) */}
      {!hasVO2Test ? (
        /* PENDING VO2 TEST HERO CARD (CRITICAL REQUIREMENT) */
        <div className="bg-[#14100c] border-2 border-[#FF5500] rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-[#FF5500]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5500] flex items-center justify-center text-black font-black shadow-lg shadow-[#FF5500]/30 animate-pulse">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-black flex items-center space-x-1">
                  <span>AVALIAÇÃO FISIOLÓGICA INDISPENSÁVEL</span>
                </span>
                <h3 className="text-lg font-black text-white">TESTE DE VO₂MAX PENDENTE</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-[#FF5500]/20 text-[#FF5500] font-black text-[10px] uppercase tracking-wider rounded-lg border border-[#FF5500]/40">
              Passo 1
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#DDDDDD] leading-relaxed">
            <p>
              O <strong>Teste de VO₂max</strong> é a base fisiológica fundamental para determinar a sua <strong>Velocidade Aeróbica Máxima (VAM)</strong> e calibrar com exatidão suas zonas de frequência cardíaca e ritmos de corrida (paces).
            </p>
            <div className="p-3 bg-[#1e150f] rounded-2xl border border-[#FF5500]/30 space-y-2 text-amber-200 text-xs">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                <p>
                  <strong>Importante:</strong> Sem realizar o teste de VO2, <u>não é possível a montagem individualizada das planilhas</u> com precisão fisiológica.
                </p>
              </div>
              <div className="p-2 bg-[#251810] rounded-xl text-[11px] text-[#FF9966] font-medium">
                ★ <strong>Recomendamos o Teste de Cooper (12 min)</strong> por ser mais fácil a execução (em pista, rua ou esteira) e altamente fidedigno.
              </div>
            </div>
          </div>

          <button
            id="home-take-vo2-btn"
            onClick={onOpenTestHub}
            className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center space-x-2 shadow-xl shadow-[#FF5500]/30 transition-transform active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>REALIZAR TESTE DE VO₂MAX AGORA</span>
          </button>
        </div>
      ) : (
        /* COMPLETED VO2 TEST TOP CARD */
        <div className="bg-[#111111] border border-[#262626] rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-[#FF5500]">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
                  CAPACIDADE CARDIORRESPIRATÓRIA ATIVA
                </span>
                <h3 className="text-base font-extrabold text-white">MEU VO₂MAX & VAM</h3>
              </div>
            </div>

            <button
              onClick={onOpenTestHub}
              className="py-1.5 px-3 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333333] text-xs font-bold text-[#FF5500] rounded-xl transition-colors"
            >
              NOVO TESTE
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#171717] rounded-2xl border border-[#252525]">
              <div className="text-[10px] uppercase text-[#777777] font-bold">Consumo Máximo</div>
              <div className="text-2xl md:text-3xl font-black text-white font-mono mt-0.5">
                {latestTest.vo2max.toFixed(2)}{' '}
                <span className="text-[10px] text-[#888888] font-normal block md:inline">ml/kg/min</span>
              </div>
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#202020] text-[#FF5500] font-black text-[10px] rounded-lg border border-[#333333] uppercase">
                {latestTest.classification}
              </span>
            </div>

            <div className="p-4 bg-[#171717] rounded-2xl border border-[#252525]">
              <div className="text-[10px] uppercase text-[#777777] font-bold">Vel. Aeróbia Máx (VAM)</div>
              <div className="text-2xl md:text-3xl font-black text-white font-mono mt-0.5">
                {currentVAM.toFixed(1)}{' '}
                <span className="text-[10px] text-[#888888] font-normal block md:inline">km/h</span>
              </div>
              <div className="text-[11px] text-[#AAAAAA] font-mono mt-2 font-bold">
                Pace VAM: {speedToPace(currentVAM)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#888888] px-1 pt-1">
            <span>
              Último teste em:{' '}
              <strong className="text-white">
                {new Date(latestTest.date).toLocaleDateString('pt-BR')} ({latestTest.protocol === 'incremental' ? 'Esteira' : 'Cooper'})
              </strong>
            </span>
            <button
              onClick={onGoToEvolution}
              className="text-[#FF5500] hover:underline font-bold flex items-center space-x-1"
            >
              <span>Ver histórico</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. CARD: METAS DE PACE & ZONAS FISIOLÓGICAS */}
      <PaceGoalsWidget
        test={latestTest}
        profile={profile}
        onOpenTestHub={onOpenTestHub}
      />

      {/* 4. CARD: MEU TREINADOR (Check-in Pré-Treino & Prontidão) */}
      <div className="bg-[#111111] border border-[#242424] rounded-3xl p-5 md:p-6 space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-[#FF5500]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#AFAFAF] font-mono font-bold">
                MEU TREINADOR
              </span>
              <h3 className="text-base font-extrabold text-white">
                {todayCheckIn ? 'Status de Disposição Hoje' : 'Check-in Pré-Treino'}
              </h3>
            </div>
          </div>

          {todayCheckIn && (
            <div className="text-xs font-mono font-bold px-2.5 py-1 bg-[#1a1a1a] text-[#FF5500] rounded-lg border border-[#2c2c2c]">
              {todayCheckIn.readinessScore}% PRONTIDÃO
            </div>
          )}
        </div>

        {!todayCheckIn ? (
          <div className="space-y-3">
            <p className="text-xs text-[#CCCCCC] leading-relaxed">
              "Antes de correr, quero saber como você está hoje: sono, alimentação, hidratação e eventuais dores para calibrar a carga com segurança."
            </p>
            <button
              id="home-checkin-btn"
              onClick={onOpenCheckIn}
              className="w-full py-3.5 bg-[#171717] hover:bg-[#222222] border border-[#333333] hover:border-[#FF5500] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all"
            >
              <span>FAZER CHECK-IN DO DIA</span>
              <ArrowRight className="w-4 h-4 text-[#FF5500]" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 bg-[#161616] rounded-xl border border-[#252525] space-y-1.5">
              <p className="text-xs text-white italic">
                "{todayCheckIn.coachMessage}"
              </p>
              <div className="text-[11px] text-[#AFAFAF] pt-1 border-t border-[#222222]">
                {todayCheckIn.coachRecommendation}
              </div>
            </div>
            <button
              onClick={onOpenCheckIn}
              className="text-[11px] text-[#777777] hover:text-[#AAAAAA] underline"
            >
              Ver detalhes ou refazer check-in
            </button>
          </div>
        )}
      </div>

      {/* 5. CARD: TREINO DE HOJE (Com bloqueio até realizar teste de VO2) */}
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
              PROGRAMAÇÃO DIÁRIA
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">TREINO DE HOJE</h2>
          </div>

          <span className="text-xs font-mono text-[#888888] bg-[#1a1a1a] px-3 py-1 rounded-lg border border-[#2a2a2a]">
            {todaySession?.dayName || 'Hoje'}
          </span>
        </div>

        {!hasVO2Test ? (
          /* LOCKED WORKOUT NOTICE */
          <div className="p-6 text-center bg-[#111111] rounded-2xl border border-[#2a2a2a] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1e150f] border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500] mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Planilha de Treinos Aguardando Calibração</h4>
              <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto leading-relaxed">
                Para que cada tiro, rodagem e limiar seja prescrito na sua intensidade biológica correta, realize seu teste de VO₂max inicial.
              </p>
            </div>
            <button
              onClick={onOpenTestHub}
              className="py-3 px-5 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-[#FF5500]/20"
            >
              DESBLOQUEAR PLANILHA COM TESTE DE VO₂
            </button>
          </div>
        ) : todaySession && !todaySession.isRestDay ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-black text-[#FF5500] tracking-tight">
                {todaySession.title}
              </h3>
              <p className="text-xs text-[#AAAAAA] mt-1 leading-relaxed">
                {todaySession.objective}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-[#282828]">
                <div className="text-[10px] text-[#777777] uppercase font-bold flex items-center justify-center space-x-1">
                  <MapPin className="w-3 h-3 text-[#FF5500]" />
                  <span>Distância</span>
                </div>
                <div className="text-base font-black text-white font-mono mt-0.5">
                  {todaySession.estimatedDistanceKm} km
                </div>
              </div>

              <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-[#282828]">
                <div className="text-[10px] text-[#777777] uppercase font-bold flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3 text-[#FF5500]" />
                  <span>Tempo Est.</span>
                </div>
                <div className="text-base font-black text-white font-mono mt-0.5">
                  ~{todaySession.estimatedDurationMin} min
                </div>
              </div>

              <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-[#282828]">
                <div className="text-[10px] text-[#777777] uppercase font-bold flex items-center justify-center space-x-1">
                  <Activity className="w-3 h-3 text-[#FF5500]" />
                  <span>Intensidade</span>
                </div>
                <div className="text-xs font-black text-[#FF5500] mt-1 truncate">
                  {todaySession.intensityLabel}
                </div>
              </div>
            </div>

            {/* Workout Structure breakdown */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#1a1a1a] rounded-xl border border-[#252525]">
                <span className="text-[#888888] font-bold">Aquecimento: </span>
                <span className="text-[#CCCCCC]">{todaySession.warmupDetails}</span>
              </div>
              <div className="p-2.5 bg-[#1a1a1a] rounded-xl border border-[#252525]">
                <span className="text-[#FF5500] font-bold">Principal: </span>
                <span className="text-[#FFFFFF]">{todaySession.mainBlockDetails}</span>
              </div>
              <div className="p-2.5 bg-[#1a1a1a] rounded-xl border border-[#252525]">
                <span className="text-[#888888] font-bold">Desaquecimento: </span>
                <span className="text-[#CCCCCC]">{todaySession.cooldownDetails}</span>
              </div>
            </div>

            {/* Guidance */}
            <div className="p-3 bg-[#181818] rounded-xl border border-[#262626]">
              <div className="text-[10px] uppercase font-bold text-[#888888] mb-0.5">
                Orientação de Execução:
              </div>
              <p className="text-xs text-[#DDDDDD] italic">
                "{todaySession.executionGuidance}"
              </p>
            </div>

            {/* CTA Button */}
            {!todayIsLogged ? (
              <button
                id="home-start-workout-btn"
                onClick={() => onStartSession(todaySession, currentWeek.weekNumber)}
                className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25 transition-transform active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>INICIAR TREINO NO CRONÔMETRO</span>
              </button>
            ) : (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs text-emerald-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-bold">Treino de hoje já concluído e registrado!</span>
                </div>
                <button
                  onClick={() => onStartSession(todaySession, currentWeek.weekNumber)}
                  className="text-[11px] underline font-bold"
                >
                  Repetir
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#111111] rounded-2xl border border-[#222222] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-[#FF5500] mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Hoje é Dia de Recuperação</h4>
              <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
                O descanso ativo e o sono são os momentos onde as adaptações celulares do treino acontecem.
              </p>
            </div>
            <button
              onClick={onGoToPlan}
              className="py-2.5 px-4 bg-[#1c1c1c] hover:bg-[#252525] text-white text-xs font-bold rounded-xl border border-[#333333]"
            >
              Ver treinos dos próximos dias
            </button>
          </div>
        )}
      </div>

      {/* 6. CARD: MICROCICLO SEMANAL */}
      <div className="bg-[#111111] border border-[#222222] rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#AFAFAF] font-mono font-bold">
              ESTRUTURA DO MICROCICLO
            </span>
            <h4 className="text-sm font-extrabold text-white">
              Semana {currentWeek.weekNumber} de {plan.totalWeeks} ({currentWeek.phaseName})
            </h4>
          </div>
          <button
            onClick={onGoToPlan}
            className="text-xs text-[#FF5500] hover:underline font-bold"
          >
            Planilha Completa →
          </button>
        </div>

        {/* 7 Days Mini Pills */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {currentWeek.sessions.map((sess) => {
            const isToday = todaySession?.id === sess.id;
            const isCompleted = workoutLogs.some((l) => l.workoutId === sess.id);
            return (
              <div
                key={sess.id}
                onClick={onGoToPlan}
                className={`p-2 rounded-xl text-center cursor-pointer transition-all ${
                  isToday
                    ? 'bg-[#FF5500] text-black font-extrabold shadow-md'
                    : isCompleted
                    ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                    : sess.isRestDay
                    ? 'bg-[#0c0c0c] text-[#555555]'
                    : 'bg-[#171717] border border-[#252525] text-[#AAAAAA]'
                }`}
              >
                <div className="text-[9px] uppercase font-bold">{sess.dayName.substring(0, 3)}</div>
                <div className="text-xs font-mono font-bold mt-0.5">
                  {sess.isRestDay ? 'OFF' : `${sess.estimatedDistanceKm}k`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Welcome Screen Medical Responsibility Disclaimer & Developer Attribution */}
      <footer className="pt-4 pb-20 text-center space-y-3">
        <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl space-y-1.5 text-[11px] text-[#666666] leading-relaxed">
          <div className="flex items-center justify-center space-x-1.5 text-[#888888] font-bold uppercase text-[10px]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Aviso de Responsabilidade e Saúde</span>
          </div>
          <p>
            O Minha Assessoria é um guia metodológico de treinamento e acompanhamento de corrida. Ele não substitui avaliação médica, orientação cardiológica prévia ou acompanhamento presencial de um profissional de Educação Física.
          </p>
        </div>

        {/* Developer Attribution */}
        <div className="text-[11px] font-medium text-white tracking-wide">
          Desenvolvido por: Felipe Dias Lopes F.
        </div>
      </footer>

      {/* Mobile PWA Shortcut Installation Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onNativeInstall={() => {
          handleInstallClick();
          setShowInstallModal(false);
        }}
        isInstalled={isInstalled}
      />
    </div>
  );
};
