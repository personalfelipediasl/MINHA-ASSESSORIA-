import React, { useState } from 'react';
import {
  UserProfile,
  Gender,
  RunnerLevel,
  WeeklyFrequency,
  TargetDistance,
  TargetGoalType,
  RunningExperience,
  calculateAgeFromBirthDate,
} from '../types';
import { GENERAL_APP_DISCLAIMER } from '../data/vo2Tables';
import {
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Activity,
  Calendar,
  Heart,
  Gauge,
  Timer,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [welcomeCardIndex, setWelcomeCardIndex] = useState<number>(0);

  // Form State
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<string>('1994-05-15');
  const [gender, setGender] = useState<Gender>('masculino');
  const [level, setLevel] = useState<RunnerLevel>('iniciante');
  const [weeklyFrequency, setWeeklyFrequency] = useState<WeeklyFrequency>(3);
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 3, 6]);
  const [simuladoDayOfWeek, setSimuladoDayOfWeek] = useState<number>(6); // 6 = Sábado

  const [experience, setExperience] = useState<RunningExperience>('menos_3_meses');
  const [maxRecentDistanceKm, setMaxRecentDistanceKm] = useState<number | ''>('');
  const [knowsBestTime, setKnowsBestTime] = useState<boolean>(false);
  const [bestRecentDistance, setBestRecentDistance] = useState('');
  const [bestRecentTime, setBestRecentTime] = useState('');

  const [hasHealthCondition, setHasHealthCondition] = useState<boolean>(false);
  const [healthConditionDetails, setHealthConditionDetails] = useState('');
  const [hasPain, setHasPain] = useState<boolean>(false);
  const [painLocations, setPainLocations] = useState<string[]>([]);

  const [targetDistance, setTargetDistance] = useState<TargetDistance>('10km');
  const [customDistanceKm, setCustomDistanceKm] = useState<number | ''>('');
  const [goalType, setGoalType] = useState<TargetGoalType>('completar');
  const [targetHours, setTargetHours] = useState<number>(0);
  const [targetMinutes, setTargetMinutes] = useState<number>(50);
  const [targetSeconds, setTargetSeconds] = useState<number>(0);

  const [hasTargetDate, setHasTargetDate] = useState<boolean>(false);
  const [targetDate, setTargetDate] = useState<string>('');

  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const calculatedAge = calculateAgeFromBirthDate(birthDate);

  const daysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const togglePreferredDay = (dayIndex: number) => {
    if (preferredDays.includes(dayIndex)) {
      if (preferredDays.length > 1) {
        setPreferredDays(preferredDays.filter((d) => d !== dayIndex));
      }
    } else {
      if (preferredDays.length < weeklyFrequency) {
        setPreferredDays([...preferredDays, dayIndex].sort((a, b) => a - b));
      } else {
        // replace first
        setPreferredDays([...preferredDays.slice(1), dayIndex].sort((a, b) => a - b));
      }
    }
  };

  const togglePainLocation = (loc: string) => {
    if (painLocations.includes(loc)) {
      setPainLocations(painLocations.filter((l) => l !== loc));
    } else {
      setPainLocations([...painLocations, loc]);
    }
  };

  const handleFinish = () => {
    if (!name.trim()) return;

    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      birthDate,
      age: calculatedAge > 0 ? calculatedAge : 30,
      gender,
      level,
      weeklyFrequency,
      preferredDays,
      simuladoDayOfWeek,
      experience,
      maxRecentDistanceKm: typeof maxRecentDistanceKm === 'number' ? maxRecentDistanceKm : undefined,
      bestRecentDistance: knowsBestTime ? bestRecentDistance : undefined,
      bestRecentTime: knowsBestTime ? bestRecentTime : undefined,
      hasHealthCondition,
      healthConditionDetails: hasHealthCondition ? healthConditionDetails : undefined,
      hasPain,
      painLocations: hasPain ? painLocations : [],
      targetDistance,
      customDistanceKm: targetDistance === 'outro' && typeof customDistanceKm === 'number' ? customDistanceKm : undefined,
      goalType,
      targetTime:
        goalType === 'tempo_especifico'
          ? { hours: targetHours, minutes: targetMinutes, seconds: targetSeconds }
          : undefined,
      hasTargetDate,
      targetDate: hasTargetDate && targetDate ? targetDate : undefined,
      termsAccepted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between p-4 pt-[max(env(safe-area-inset-top,0px),1.5rem)] md:p-8 max-w-xl mx-auto">
      {/* Barra superior preta de proteção contra a barra de status */}
      <div className="mobile-status-bar-shield" aria-hidden="true" />

      {/* Progress Bar */}
      {step > 0 && (
        <div className="w-full mb-6">
          <div className="flex items-center justify-between text-xs text-[#AFAFAF] mb-2 font-mono">
            <span>ETAPA {step} DE 5</span>
            <span>{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#FF5500] h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 0: Welcome & Explanatory Multi-Card Walkthrough */}
      {step === 0 && (
        <div className="flex-1 flex flex-col justify-between py-2 min-h-[580px]">
          {/* Top Brand Header & Progress Dots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#171717] border border-[#2a2a2a] rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                <span className="text-[10px] font-bold text-[#FF5500] uppercase tracking-widest">
                  MINHA ASSESSORIA
                </span>
              </div>
              <span className="text-xs font-mono text-[#777777] font-bold">
                {welcomeCardIndex + 1} de 5
              </span>
            </div>

            {/* Indicator Dots */}
            <div className="flex items-center space-x-1.5 pt-1">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setWelcomeCardIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === welcomeCardIndex
                      ? 'w-8 bg-[#FF5500]'
                      : idx < welcomeCardIndex
                      ? 'w-3 bg-[#666666]'
                      : 'w-2 bg-[#222222]'
                  }`}
                  title={`Ir para o card ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* CARD 1: APRESENTAÇÃO GERAL DO APLICATIVO */}
          {welcomeCardIndex === 0 && (
            <div className="my-auto py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-[#282828] flex items-center justify-center shadow-2xl shadow-[#FF5500]/10 mx-auto">
                <Activity className="w-8 h-8 text-[#FF5500]" />
              </div>

              <div className="text-center space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-black">
                  BEM-VINDO À SUA ASSESSORIA DE CORRIDA
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  COMO FUNCIONA O APLICATIVO?
                </h1>
                <p className="text-xs md:text-sm font-bold text-[#FF5500]">
                  Treinar bem não é treinar mais. É treinar no ritmo certo.
                </p>
              </div>

              <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 md:p-5 text-xs text-[#CCCCCC] leading-relaxed space-y-3">
                <p>
                  O <strong>Minha Assessoria</strong> foi construído para que você não precise mais seguir planilhas genéricas. Todo o treinamento é adaptado à sua <strong>fisiologia real</strong>, velocidade e capacidade cardiorrespiratória.
                </p>
                <div className="space-y-2 pt-1 border-t border-[#222222]">
                  <div className="flex items-start space-x-2 text-white text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                    <span><strong>Zonas de Ritmo Científicas:</strong> Paces exatos de Z1 a Z5 calculados para seu corpo.</span>
                  </div>
                  <div className="flex items-start space-x-2 text-white text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                    <span><strong>Periodização de Microciclos:</strong> Treinos contínuos, longões e intervalados detalhados.</span>
                  </div>
                  <div className="flex items-start space-x-2 text-white text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                    <span><strong>Execução com Cronômetro:</strong> Passo a passo sonoro e visual para correr na rua ou esteira.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD 2: O 1º PASSO OBRIGATÓRIO (TESTE DE VO2MAX) */}
          {welcomeCardIndex === 1 && (
            <div className="my-auto py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#1a110a] border border-[#FF5500]/40 flex items-center justify-center shadow-2xl shadow-[#FF5500]/15 mx-auto">
                <Gauge className="w-8 h-8 text-[#FF5500]" />
              </div>

              <div className="text-center space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-black">
                  1º PASSO INDISPENSÁVEL
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  O TESTE DE VO₂MAX É A CHAVE
                </h1>
                <p className="text-xs md:text-sm text-[#AAAAAA]">
                  A base fisiológica que desbloqueia a montagem da sua planilha
                </p>
              </div>

              <div className="bg-[#12100e] border border-[#FF5500]/30 rounded-2xl p-4 md:p-5 space-y-3 text-xs text-[#DDDDDD] leading-relaxed">
                <p>
                  Para utilizar as funções de criação e montagem de planilha individualizada, o <strong>primeiro passo fundamental</strong> é realizar o seu <strong>Teste de VO₂max</strong>.
                </p>
                <div className="p-3 bg-[#1e150f] rounded-xl border border-[#FF5500]/30 text-amber-200 text-xs">
                  <strong>Por que ele é obrigatório?</strong> O teste determina sua <strong>Velocidade Aeróbica Máxima (VAM)</strong>. É através da VAM que calculamos todas as velocidades de corrida, paces de rodagem, tempos de tiros e zonas cardíacas.
                </div>
                <p className="text-[#AAAAAA] text-[11px]">
                  Sem o teste, não é possível calibrar as intensidades de forma segura e eficaz.
                </p>
              </div>
            </div>
          )}

          {/* CARD 3: RECOMENDAÇÃO DO TESTE DE COOPER (12 MIN) */}
          {welcomeCardIndex === 2 && (
            <div className="my-auto py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#1c130c] border-2 border-[#FF5500] flex items-center justify-center shadow-2xl shadow-[#FF5500]/25 mx-auto">
                <Timer className="w-8 h-8 text-[#FF5500]" />
              </div>

              <div className="text-center space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 bg-[#FF5500] text-black font-black text-[10px] uppercase tracking-wider rounded-md">
                  ★ PROTOCOLO RECOMENDADO PELA ASSESSORIA
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  TESTE DE COOPER (12 MIN)
                </h1>
                <p className="text-xs md:text-sm text-[#AAAAAA]">
                  Mais fácil de executar e cientificamente fidedigno
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#CCCCCC]">
                <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-[#202020] text-[#FF5500] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Fácil Execução em Qualquer Lugar</h4>
                    <p className="text-[11px] text-[#999999] mt-0.5">
                      Pode ser feito tanto em <strong>pista de atletismo</strong>, quanto em <strong>rua plana</strong> com GPS/smartwatch ou na <strong>esteira da academia</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-[#202020] text-[#FF5500] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Simples: 12 Minutos Contínuos</h4>
                    <p className="text-[11px] text-[#999999] mt-0.5">
                      Basta percorrer a maior distância possível em exatamente 12 minutos, em ritmo firme e uniforme.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-[#202020] text-[#FF5500] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Altamente Fidedigno e Rápido</h4>
                    <p className="text-[11px] text-[#999999] mt-0.5">
                      Ao digitar a distância percorrida, o app calcula na hora seu <strong>VO₂max</strong>, sua <strong>VAM</strong> e seu <strong>Pace Médio</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD 4: MONTAGEM DO TREINO APÓS O CADASTRO */}
          {welcomeCardIndex === 3 && (
            <div className="my-auto py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-[#282828] flex items-center justify-center shadow-2xl shadow-[#FF5500]/10 mx-auto">
                <Calendar className="w-8 h-8 text-[#FF5500]" />
              </div>

              <div className="text-center space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-black">
                  PERIODIZAÇÃO ADAPTADA À SUA ROTINA
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  MONTAGEM DA PLANILHA
                </h1>
                <p className="text-xs md:text-sm text-[#AAAAAA]">
                  Você define seus dias e o sistema calcula suas cargas
                </p>
              </div>

              <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 md:p-5 text-xs text-[#CCCCCC] leading-relaxed space-y-3">
                <p>
                  Com o resultado do seu <strong>Teste de VO₂</strong> em mãos, ao realizar seu cadastro você irá lançar:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#181818] p-2.5 rounded-xl border border-[#262626]">
                    <div className="font-bold text-[#FF5500]">Frequência Semanal</div>
                    <div className="text-[#AAAAAA] mt-0.5">Quantas vezes por semana irá treinar (de 1x a 6x).</div>
                  </div>
                  <div className="bg-[#181818] p-2.5 rounded-xl border border-[#262626]">
                    <div className="font-bold text-[#FF5500]">Dias Preferidos</div>
                    <div className="text-[#AAAAAA] mt-0.5">Seus dias ideais (ex: Seg, Qua, Sáb).</div>
                  </div>
                  <div className="bg-[#181818] p-2.5 rounded-xl border border-[#262626]">
                    <div className="font-bold text-[#FF5500]">Objetivo Alvo</div>
                    <div className="text-[#AAAAAA] mt-0.5">5km, 10km, Meia (21k) ou Maratona (42k).</div>
                  </div>
                  <div className="bg-[#181818] p-2.5 rounded-xl border border-[#262626]">
                    <div className="font-bold text-[#FF5500]">Histórico e Nível</div>
                    <div className="text-[#AAAAAA] mt-0.5">Para proteção articular e segurança.</div>
                  </div>
                </div>
                <p className="text-[#AAAAAA] text-[11px] pt-1">
                  O aplicativo gera sua periodização completa com <strong>velocidades médias</strong>, <strong>paces recomendados</strong> e <strong>estímulos de tiros com tempos exatos</strong>.
                </p>
              </div>
            </div>
          )}

          {/* CARD 5: CONCLUSÃO & INÍCIO DO CADASTRO */}
          {welcomeCardIndex === 4 && (
            <div className="my-auto py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#151c14] border border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/15 mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="text-center space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-black">
                  TUDO PRONTO PARA COMEÇAR
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  VAMOS AO SEU CADASTRO!
                </h1>
                <p className="text-xs md:text-sm text-[#AAAAAA]">
                  Leva menos de 1 minuto para configurar seu perfil
                </p>
              </div>

              <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 md:p-5 text-xs text-[#CCCCCC] space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Roteiro da sua Assessoria:
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center font-bold text-[#FF5500] text-[10px]">
                      1
                    </span>
                    <span>Preencha seus dados de cadastro e disponibilidade semanal;</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center font-bold text-[#FF5500] text-[10px]">
                      2
                    </span>
                    <span>Realize o Teste de Cooper (12 min) para calibrar seu VO₂max;</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center font-bold text-[#FF5500] text-[10px]">
                      3
                    </span>
                    <span>Acesse sua planilha completa de treinos e comece a evoluir!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions for Card Navigation */}
          <div className="space-y-2.5 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {welcomeCardIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setWelcomeCardIndex(welcomeCardIndex - 1)}
                  className="py-3.5 bg-[#141414] hover:bg-[#202020] text-white font-bold text-xs tracking-wider uppercase rounded-xl border border-[#282828] flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#888888]" />
                  <span>VOLTAR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3.5 bg-[#141414] hover:bg-[#202020] text-[#888888] hover:text-white font-bold text-xs tracking-wider uppercase rounded-xl border border-[#282828] transition-colors"
                >
                  PULAR GUIA
                </button>
              )}

              {welcomeCardIndex < 4 ? (
                <button
                  type="button"
                  onClick={() => setWelcomeCardIndex(welcomeCardIndex + 1)}
                  className="py-3.5 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-[#FF5500]/20 transition-transform active:scale-[0.98]"
                >
                  <span>AVANÇAR</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  id="start-onboarding-btn"
                  onClick={() => setStep(1)}
                  className="py-3.5 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-[#FF5500]/25 transition-transform active:scale-[0.98]"
                >
                  <span>INICIAR CADASTRO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {welcomeCardIndex < 4 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-[11px] text-[#666666] hover:text-[#999999] py-1 transition-colors"
              >
                Pular explicações e ir direto para o formulário de cadastro →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Perfil do Corredor */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">CADASTRO DO CORREDOR</h2>
              <p className="text-xs text-[#AFAFAF] mt-1">Dados fundamentais para o cálculo de intensidade e recuperação.</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Como devemos te chamar?
              </label>
              <input
                id="input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou apelido"
                className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3.5 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500]"
              />
            </div>

            {/* Birth Date & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
                    Data de Nascimento
                  </label>
                  {birthDate && (
                    <span className="text-xs font-mono font-bold text-[#FF5500] bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#2a2a2a]">
                      {calculatedAge} anos
                    </span>
                  )}
                </div>
                <input
                  id="input-birthdate"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500] text-sm"
                />
                <p className="text-[10px] text-[#777777] mt-1.5">
                  Sua idade ({calculatedAge} anos) é calculada para classificar seus testes de VO₂max e zonas de treino.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                  Gênero Biológico
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('masculino')}
                    className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                      gender === 'masculino'
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                    }`}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('feminino')}
                    className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                      gender === 'feminino'
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                    }`}
                  >
                    Feminino
                  </button>
                </div>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Nível de Treinamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'iniciante', label: 'Iniciante' },
                  { id: 'intermediario', label: 'Intermediário' },
                  { id: 'avancado', label: 'Avançado' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id as RunnerLevel)}
                    className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                      level === lvl.id
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Frequency */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Quantas vezes por semana você pretende correr?
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setWeeklyFrequency(freq as WeeklyFrequency)}
                    className={`py-3 text-sm font-extrabold rounded-xl border transition-all ${
                      weeklyFrequency === freq
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#141414] text-white border-[#262626]'
                    }`}
                  >
                    {freq}x
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#777777] mt-2">
                Não recomendamos automaticamente 7 sessões para assegurar a recuperação osteoarticular.
              </p>
            </div>

            {/* Preferred Days */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Dias preferidos ({preferredDays.length}/{weeklyFrequency} selecionados)
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {daysLabels.map((label, idx) => {
                  const isSelected = preferredDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => togglePreferredDay(idx)}
                      className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#262626] text-[#FF5500] border-[#FF5500]'
                          : 'bg-[#111111] text-[#666666] border-[#1e1e1e]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulado Day Selection (Nova Função Obrigatória - Item 14) */}
            <div className="p-4 bg-[#141414] border border-[#FF5500]/30 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-white uppercase tracking-wider">
                  🏁 Em qual dia da semana você quer fazer o simulado?
                </label>
                <span className="text-[10px] bg-[#FF5500]/20 text-[#FF5500] px-2 py-0.5 rounded font-mono font-bold">
                  Sessão Chave
                </span>
              </div>
              <p className="text-[11px] text-[#888888]">
                O motor organizará a semana para proteger a recuperação antes e após esse treino.
              </p>
              <div className="grid grid-cols-7 gap-1 pt-1">
                {[
                  { id: 1, label: 'Seg' },
                  { id: 2, label: 'Ter' },
                  { id: 3, label: 'Qua' },
                  { id: 4, label: 'Qui' },
                  { id: 5, label: 'Sex' },
                  { id: 6, label: 'Sáb' },
                  { id: 0, label: 'Dom' },
                ].map((d) => {
                  const isSelected = simuladoDayOfWeek === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSimuladoDayOfWeek(d.id);
                        if (!preferredDays.includes(d.id)) {
                          togglePreferredDay(d.id);
                        }
                      }}
                      className={`py-2.5 text-xs font-extrabold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#FF5500] text-black border-[#FF5500] shadow-md shadow-[#FF5500]/20'
                          : 'bg-[#181818] text-[#888888] border-[#262626] hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              onClick={() => setStep(0)}
              className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>VOLTAR</span>
            </button>
            <button
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="flex-1 py-4 bg-[#FF5500] disabled:opacity-40 disabled:pointer-events-none hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2"
            >
              <span>CONTINUAR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Histórico de Corrida */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">HISTÓRICO DE CORRIDA</h2>
              <p className="text-xs text-[#AFAFAF] mt-1">Para calibrarmos o volume inicial com total segurança.</p>
            </div>

            {/* How long running */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Há quanto tempo você corre?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'comecei_agora', label: 'Comecei agora' },
                  { id: 'menos_3_meses', label: 'Menos de 3 meses' },
                  { id: '3_6_meses', label: '3 a 6 meses' },
                  { id: '6_12_meses', label: '6 a 12 meses' },
                  { id: '1_2_anos', label: '1 a 2 anos' },
                  { id: 'mais_2_anos', label: 'Mais de 2 anos' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExperience(item.id as RunningExperience)}
                    className={`py-3 px-3 text-left text-xs font-bold rounded-xl border transition-all ${
                      experience === item.id
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Recent Distance */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Qual foi sua maior distância recente? (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={maxRecentDistanceKm}
                onChange={(e) => setMaxRecentDistanceKm(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 5.0 ou 10.0"
                className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3.5 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500]"
              />
            </div>

            {/* Best Recent Time */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
                  Melhor tempo recente
                </label>
                <button
                  type="button"
                  onClick={() => setKnowsBestTime(!knowsBestTime)}
                  className="text-xs text-[#FF5500] hover:underline"
                >
                  {knowsBestTime ? 'Não sei informar' : 'Tenho uma marca recente'}
                </button>
              </div>

              {knowsBestTime ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={bestRecentDistance}
                    onChange={(e) => setBestRecentDistance(e.target.value)}
                    placeholder="Distância (ex: 5km)"
                    className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#555555] text-xs focus:outline-none focus:border-[#FF5500]"
                  />
                  <input
                    type="text"
                    value={bestRecentTime}
                    onChange={(e) => setBestRecentTime(e.target.value)}
                    placeholder="Tempo (ex: 28:30)"
                    className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#555555] text-xs focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              ) : (
                <div className="p-3.5 bg-[#141414] border border-[#262626] rounded-xl text-xs text-[#777777]">
                  Sem problema. O teste de VO₂max fornecerá a referência precisa para suas zonas de treino.
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              onClick={() => setStep(1)}
              className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>VOLTAR</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2"
            >
              <span>CONTINUAR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Saúde e Limitações */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">SAÚDE E LIMITAÇÕES</h2>
              <p className="text-xs text-[#AFAFAF] mt-1">Atenção preventiva para evitar sobrecarga e lesões.</p>
            </div>

            {/* Health condition */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Possui alguma doença, condição de saúde ou limitação articular?
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setHasHealthCondition(false)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                    !hasHealthCondition
                      ? 'bg-[#FF5500] text-black border-[#FF5500]'
                      : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setHasHealthCondition(true)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                    hasHealthCondition
                      ? 'bg-[#FF5500] text-black border-[#FF5500]'
                      : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                  }`}
                >
                  Sim
                </button>
              </div>

              {hasHealthCondition && (
                <textarea
                  value={healthConditionDetails}
                  onChange={(e) => setHealthConditionDetails(e.target.value)}
                  placeholder="Conte brevemente o que acontece (ex: asma leve, cirurgia prévia no menisco)..."
                  rows={2}
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl p-3 text-white text-xs placeholder-[#555555] focus:outline-none focus:border-[#FF5500]"
                />
              )}
            </div>

            {/* Pain */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Você sente dor durante ou depois da corrida?
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setHasPain(false)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                    !hasPain
                      ? 'bg-[#FF5500] text-black border-[#FF5500]'
                      : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setHasPain(true)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                    hasPain
                      ? 'bg-[#FF5500] text-black border-[#FF5500]'
                      : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                  }`}
                >
                  Sim
                </button>
              </div>

              {hasPain && (
                <div>
                  <span className="block text-[11px] text-[#AFAFAF] mb-2 font-medium">Local da dor:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['joelho', 'quadril', 'tornozelo', 'pé', 'coluna', 'outro'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => togglePainLocation(loc)}
                        className={`py-2 text-xs font-bold rounded-lg border capitalize transition-all ${
                          painLocations.includes(loc)
                            ? 'bg-[#262626] text-[#FF5500] border-[#FF5500]'
                            : 'bg-[#141414] text-[#888888] border-[#222222]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#111111] border border-[#222222] rounded-xl flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-[#FF5500] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#777777] leading-relaxed">
                Importante: Não diagnosticamos doenças nem recomendamos tratamentos médicos. As informações calibram o nível de prudência e os alertas do seu treinador.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              onClick={() => setStep(2)}
              className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>VOLTAR</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2"
            >
              <span>CONTINUAR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Objetivo e Data */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">SEU OBJETIVO</h2>
              <p className="text-xs text-[#AFAFAF] mt-1">Cada distância possui exigências fisiológicas e estratégicas próprias.</p>
            </div>

            {/* Target Distance */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Distância Alvo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '5km', label: '5 KM', sub: 'Velocidade & VO₂max' },
                  { id: '10km', label: '10 KM', sub: 'Limiar & Volume' },
                  { id: '21km', label: '21 KM (Meia)', sub: 'Resistência & Sustentação' },
                  { id: '42km', label: '42 KM (Maratona)', sub: 'Volume & Especificidade' },
                  { id: 'outro', label: 'OUTRA DISTÂNCIA', sub: 'Personalizado' },
                ].map((dist) => (
                  <button
                    key={dist.id}
                    type="button"
                    onClick={() => setTargetDistance(dist.id as TargetDistance)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      targetDistance === dist.id
                        ? 'bg-[#1c1c1c] border-[#FF5500] text-white shadow-md'
                        : 'bg-[#141414] border-[#262626] text-[#AFAFAF]'
                    }`}
                  >
                    <div className={`font-extrabold text-sm ${targetDistance === dist.id ? 'text-[#FF5500]' : 'text-white'}`}>
                      {dist.label}
                    </div>
                    <div className="text-[10px] text-[#888888]">{dist.sub}</div>
                  </button>
                ))}
              </div>

              {targetDistance === 'outro' && (
                <div className="mt-3">
                  <input
                    type="number"
                    value={customDistanceKm}
                    onChange={(e) => setCustomDistanceKm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Distância em km (ex: 8)"
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#555555] text-xs focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              )}
            </div>

            {/* Goal Type */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Meta de Desempenho
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'completar', label: 'Completar' },
                  { id: 'melhorar_tempo', label: 'Evoluir' },
                  { id: 'tempo_especifico', label: 'Tempo Fixo' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoalType(item.id as TargetGoalType)}
                    className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                      goalType === item.id
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#141414] text-[#AFAFAF] border-[#262626]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {goalType === 'tempo_especifico' && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <span className="text-[10px] text-[#777777] block mb-1">Horas</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-center text-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] block mb-1">Minutos</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-center text-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] block mb-1">Segundos</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={targetSeconds}
                      onChange={(e) => setTargetSeconds(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-center text-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Target Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
                  Tem uma prova ou data-alvo?
                </label>
                <button
                  type="button"
                  onClick={() => setHasTargetDate(!hasTargetDate)}
                  className="text-xs text-[#FF5500] hover:underline"
                >
                  {hasTargetDate ? 'Sem data fixa' : 'Sim, tenho data'}
                </button>
              </div>

              {hasTargetDate && (
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#FF5500]"
                />
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              onClick={() => setStep(3)}
              className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>VOLTAR</span>
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2"
            >
              <span>CONTINUAR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Termos e Responsabilidade */}
      {step === 5 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">RESPONSABILIDADE</h2>
              <p className="text-xs text-[#AFAFAF] mt-1">Aviso legal e compromisso com a sua integridade física.</p>
            </div>

            <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 text-xs text-[#AFAFAF] leading-relaxed max-h-60 overflow-y-auto space-y-3">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider">
                IMPORTANTE
              </p>
              <p>{GENERAL_APP_DISCLAIMER}</p>
            </div>

            <label className="flex items-start space-x-3 p-3.5 bg-[#141414] border border-[#262626] rounded-xl cursor-pointer hover:border-[#333333] transition-colors">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-[#333333] text-[#FF5500] focus:ring-[#FF5500] bg-[#222222]"
              />
              <span className="text-xs font-bold text-white select-none">
                Li, compreendi e ESTOU CIENTE. Sou responsável pela minha aptidão física.
              </span>
            </label>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              onClick={() => setStep(4)}
              className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>VOLTAR</span>
            </button>
            <button
              id="finish-onboarding-btn"
              disabled={!termsAccepted}
              onClick={handleFinish}
              className="flex-1 py-4 bg-[#FF5500] disabled:opacity-40 disabled:pointer-events-none hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25 transition-transform active:scale-[0.98]"
            >
              <span>ACESSAR O MINHA ASSESSORIA</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
