import React, { useState } from 'react';
import { CheckInAssessment, WorkoutSession } from '../../types';
import { evaluateCheckIn } from '../../data/coachPhrases';
import { saveCheckIn } from '../../storage/indexedDB';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Activity,
  Moon,
  Droplets,
  Utensils,
  HeartPulse,
  Brain,
  ChevronLeft,
} from 'lucide-react';

interface CoachCheckInProps {
  todaySession?: WorkoutSession | null;
  onCheckInComplete: (assessment: CheckInAssessment) => void;
  onGoToWorkout: () => void;
  existingCheckIn?: CheckInAssessment | null;
  onGoBack?: () => void;
}

export const CoachCheckIn: React.FC<CoachCheckInProps> = ({
  todaySession,
  onCheckInComplete,
  onGoToWorkout,
  existingCheckIn,
  onGoBack,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(existingCheckIn ? 6 : 0);

  // 6 State variables
  const [wakeUpState, setWakeUpState] = useState<'otimo' | 'bem' | 'normal' | 'cansado' | 'destruido'>(
    existingCheckIn?.wakeUpState ?? 'bem'
  );
  const [sleepQuality, setSleepQuality] = useState<'muito_bem' | 'bem' | 'mais_ou_menos' | 'dormi_mal'>(
    existingCheckIn?.sleepQuality ?? 'bem'
  );
  const [hydration, setHydration] = useState<'bem_hidratado' | 'moderada' | 'pouca'>(
    existingCheckIn?.hydration ?? 'bem_hidratado'
  );
  const [nutrition, setNutrition] = useState<'bem_alimentado' | 'normal' | 'comi_pouco' | 'comi_mal'>(
    existingCheckIn?.nutrition ?? 'bem_alimentado'
  );
  const [painLevel, setPainLevel] = useState<'nenhuma' | 'leve' | 'moderada' | 'forte'>(
    existingCheckIn?.painLevel ?? 'nenhuma'
  );
  const [painLocation, setPainLocation] = useState<string>(existingCheckIn?.painLocation ?? '');
  const [mentalState, setMentalState] = useState<'focado' | 'normal' | 'estressado' | 'muito_estressado'>(
    existingCheckIn?.mentalState ?? 'focado'
  );

  const [assessmentResult, setAssessmentResult] = useState<CheckInAssessment | null>(existingCheckIn ?? null);

  const handleFinishCheckIn = async () => {
    const evaluation = evaluateCheckIn({
      wakeUpState,
      sleepQuality,
      hydration,
      nutrition,
      painLevel,
      painLocation: painLevel !== 'nenhuma' ? painLocation : undefined,
      mentalState,
    });

    const assessment: CheckInAssessment = {
      id: `checkin_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      workoutId: todaySession?.id,
      wakeUpState,
      sleepQuality,
      hydration,
      nutrition,
      painLevel,
      painLocation: painLevel !== 'nenhuma' ? painLocation : undefined,
      mentalState,
      readinessScore: evaluation.score,
      coachMessage: evaluation.message,
      coachRecommendation: evaluation.recommendation,
      trainingAdjustment: evaluation.suggestedAdjustment,
    };

    await saveCheckIn(assessment);
    setAssessmentResult(assessment);
    onCheckInComplete(assessment);
    setCurrentStep(6); // Summary screen
  };

  const questions = [
    {
      id: 0,
      title: 'Como você acordou hoje?',
      subtitle: 'Nível geral de energia e disposição física.',
      icon: Activity,
      options: [
        { id: 'otimo', label: 'Estou ótimo', sub: 'Energia total, corpo descansado' },
        { id: 'bem', label: 'Estou bem', sub: 'Pronto para treinar' },
        { id: 'normal', label: 'Estou normal', sub: 'Disposição padrão' },
        { id: 'cansado', label: 'Estou cansado', sub: 'Fadiga residual visível' },
        { id: 'destruido', label: 'Estou destruído', sub: 'Cansaço acumulado alto' },
      ],
      current: wakeUpState,
      onSelect: (val: any) => {
        setWakeUpState(val);
        setCurrentStep(1);
      },
    },
    {
      id: 1,
      title: 'Como foi seu sono?',
      subtitle: 'A recuperação celular e neuromuscular ocorre durante a noite.',
      icon: Moon,
      options: [
        { id: 'muito_bem', label: 'Dormi muito bem', sub: 'Sono profundo e revigorante' },
        { id: 'bem', label: 'Dormi bem', sub: 'Descanso suficiente' },
        { id: 'mais_ou_menos', label: 'Poderia ter sido melhor', sub: 'Acordei algumas vezes' },
        { id: 'dormi_mal', label: 'Dormi mal', sub: 'Poucas horas ou insônia' },
      ],
      current: sleepQuality,
      onSelect: (val: any) => {
        setSleepQuality(val);
        setCurrentStep(2);
      },
    },
    {
      id: 2,
      title: 'E a hidratação?',
      subtitle: 'O volume plasmático afeta diretamente a frequência cardíaca.',
      icon: Droplets,
      options: [
        { id: 'bem_hidratado', label: 'Estou bem hidratado', sub: 'Bebi água regularmente' },
        { id: 'moderada', label: 'Acho que poderia beber mais', sub: 'Consumo moderado' },
        { id: 'pouca', label: 'Quase não bebi água', sub: 'Sinto sede ou desidratação' },
      ],
      current: hydration,
      onSelect: (val: any) => {
        setHydration(val);
        setCurrentStep(3);
      },
    },
    {
      id: 3,
      title: 'E sua alimentação hoje?',
      subtitle: 'Disponibilidade de glicogênio para o esforço programado.',
      icon: Utensils,
      options: [
        { id: 'bem_alimentado', label: 'Estou bem alimentado', sub: 'Refeições completas e no horário' },
        { id: 'normal', label: 'Normal', sub: 'Rotina padrão' },
        { id: 'comi_pouco', label: 'Comi pouco', sub: 'Pouca energia ingerida' },
        { id: 'comi_mal', label: 'Comi mal', sub: 'Junk food / refeição pulada' },
      ],
      current: nutrition,
      onSelect: (val: any) => {
        setNutrition(val);
        setCurrentStep(4);
      },
    },
    {
      id: 4,
      title: 'Tem alguma dor antes de começar?',
      subtitle: 'Dores articulares ou musculares agudas não devem ser ignoradas.',
      icon: HeartPulse,
      options: [
        { id: 'nenhuma', label: 'Nenhuma dor', sub: 'Corpo livre de incômodos' },
        { id: 'leve', label: 'Leve incômodo', sub: 'Sensação suportável' },
        { id: 'moderada', label: 'Dor moderada', sub: 'Presença nítida ao apoiar o pé' },
        { id: 'forte', label: 'Dor forte', sub: 'Inviabiliza impacto normal' },
      ],
      current: painLevel,
      onSelect: (val: any) => {
        setPainLevel(val);
        if (val === 'nenhuma') {
          setCurrentStep(5);
        }
      },
    },
    {
      id: 5,
      title: 'Como está sua cabeça hoje?',
      subtitle: 'O estresse mental altera a percepção subjetiva de esforço (RPE).',
      icon: Brain,
      options: [
        { id: 'focado', label: 'Focado e motivado', sub: 'Pronto para o objetivo' },
        { id: 'normal', label: 'Tranquilo / Normal', sub: 'Sem oscilações' },
        { id: 'estressado', label: 'Estressado', sub: 'Carga de trabalho ou preocupação' },
        { id: 'muito_estressado', label: 'Muito estressado', sub: 'Mente sobrecarregada' },
      ],
      current: mentalState,
      onSelect: (val: any) => {
        setMentalState(val);
      },
    },
  ];

  // Screen 6: Check-In Result Summary
  if (currentStep === 6 && assessmentResult) {
    const isGood = assessmentResult.readinessScore >= 70;
    const isCaution = assessmentResult.readinessScore >= 50 && assessmentResult.readinessScore < 70;

    let adjustedType = 'TREINO PROGRAMADO';
    if (assessmentResult.trainingAdjustment === 'corrida_leve') adjustedType = 'CORRIDA LEVE';
    if (assessmentResult.trainingAdjustment === 'reduzir_volume') adjustedType = 'VOLUME REDUZIDO';
    if (assessmentResult.trainingAdjustment === 'recuperacao') adjustedType = 'RECUPERAÇÃO ATIVA';
    if (assessmentResult.trainingAdjustment === 'adiar') adjustedType = 'REPOUSO / ADIAR';

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

        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2a2a2a] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#FF5500]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#AFAFAF] font-mono">
                MEU TREINADOR
              </span>
              <h1 className="text-xl font-black text-white">CHECK-IN CONCLUÍDO</h1>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${
              isGood
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : isCaution
                ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                : 'bg-red-950/40 text-red-400 border-red-800/60'
            }`}
          >
            DISPOSIÇÃO: {assessmentResult.readinessScore}%
          </div>
        </div>

        {/* Coach Message Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 text-[#FF5500] text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>AVALIAÇÃO DO TREINADOR</span>
          </div>

          <p className="text-sm md:text-base text-white leading-relaxed font-medium">
            "{assessmentResult.coachMessage}"
          </p>

          <div className="p-3.5 bg-[#171717] rounded-xl border border-[#282828]">
            <p className="text-xs text-[#CCCCCC] leading-relaxed">
              {assessmentResult.coachRecommendation}
            </p>
          </div>
        </div>

        {/* Today's Prescribed Session */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          <div className="text-[11px] text-[#AFAFAF] uppercase tracking-wider font-bold">
            Seu treino de hoje é:
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-[#FF5500] tracking-tight">
              {adjustedType}
            </div>
            {todaySession && !todaySession.isRestDay && (
              <div className="text-xs text-[#AFAFAF]">
                ~{todaySession.estimatedDistanceKm} km ({todaySession.estimatedDurationMin} min)
              </div>
            )}
          </div>

          {todaySession && (
            <p className="text-xs text-[#888888] leading-relaxed">
              {todaySession.objective}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          {assessmentResult.trainingAdjustment !== 'adiar' && todaySession && !todaySession.isRestDay ? (
            <button
              id="coach-start-workout-btn"
              onClick={onGoToWorkout}
              className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25 transition-transform active:scale-[0.98]"
            >
              <span>INICIAR TREINO COM ORIENTAÇÃO</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onGoToWorkout}
              className="w-full py-4 bg-[#1c1c1c] text-white hover:bg-[#262626] font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 border border-[#333333]"
            >
              <span>VER DETALHES DA SEMANA</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setCurrentStep(0)}
            className="w-full py-2.5 text-xs text-[#777777] hover:text-[#AAAAAA] underline text-center"
          >
            Refazer check-in de hoje
          </button>
        </div>
      </div>
    );
  }

  // Active question step
  const q = questions[currentStep];
  const Icon = q.icon;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Top Back Navigation */}
      <button
        onClick={() => {
          if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
          } else if (onGoBack) {
            onGoBack();
          }
        }}
        className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
        <span>VOLTAR</span>
      </button>

      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#FF5500]" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
              PERGUNTA {currentStep + 1} DE 6
            </span>
            <h1 className="text-xl font-black text-white">{q.title}</h1>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#AFAFAF]">{q.subtitle}</p>

      {/* Options List */}
      <div className="space-y-2.5">
        {q.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              if (currentStep === 5) {
                setMentalState(opt.id as any);
                handleFinishCheckIn();
              } else {
                q.onSelect(opt.id);
              }
            }}
            className="w-full p-4 bg-[#111111] hover:bg-[#181818] border border-[#222222] hover:border-[#FF5500]/50 rounded-xl text-left transition-all active:scale-[0.99] group flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-bold text-white group-hover:text-[#FF5500] transition-colors">
                {opt.label}
              </div>
              <div className="text-xs text-[#777777] mt-0.5">{opt.sub}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#444444] group-hover:text-[#FF5500] transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Pain Location Selector if in step 4 with pain */}
      {currentStep === 4 && painLevel !== 'nenhuma' && (
        <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Onde você sente dor?
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Joelho', 'Quadril', 'Tornozelo', 'Pé', 'Coluna', 'Outro'].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setPainLocation(loc);
                  setCurrentStep(5);
                }}
                className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                  painLocation === loc
                    ? 'bg-[#FF5500] text-black border-[#FF5500]'
                    : 'bg-[#111111] text-[#AFAFAF] border-[#222222]'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation back */}
      {currentStep > 0 && (
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="text-xs text-[#777777] hover:text-white"
        >
          ← Voltar à pergunta anterior
        </button>
      )}
    </div>
  );
};
