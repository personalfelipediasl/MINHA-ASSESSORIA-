import React, { useState, useEffect } from 'react';
import { WorkoutSession, WorkoutLog } from '../../types';
import { playStageAlert, playWorkoutFinish, triggerVibration } from '../../services/soundEffects';
import { saveWorkoutLog } from '../../storage/indexedDB';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  AlertCircle,
  Activity,
  Flame,
} from 'lucide-react';

interface WorkoutExecutionProps {
  session: WorkoutSession;
  weekNumber: number;
  onFinish: (log: WorkoutLog) => void;
  onCancel: () => void;
}

export const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({
  session,
  weekNumber,
  onFinish,
  onCancel,
}) => {
  const steps = session.steps.length > 0 ? session.steps : [
    {
      id: 'default_work',
      name: session.title,
      type: 'work' as const,
      durationSeconds: session.estimatedDurationMin * 60,
      targetSpeedKmH: 10,
      intensityDescription: session.intensityLabel,
      instructions: session.executionGuidance,
    },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [secondsRemainingInStep, setSecondsRemainingInStep] = useState<number>(
    steps[0]?.durationSeconds || 300
  );
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  // Post-workout feedback form
  const [completedStatus, setCompletedStatus] = useState<'sim' | 'parcialmente' | 'nao'>('sim');
  const [rpe, setRpe] = useState<number>(7);
  const [feltPain, setFeltPain] = useState<boolean>(false);
  const [painLocation, setPainLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemainingInStep > 0) {
      interval = setInterval(() => {
        setSecondsRemainingInStep((prev) => prev - 1);
        setTotalElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (isRunning && secondsRemainingInStep === 0) {
      // Step complete
      if (currentStepIndex < steps.length - 1) {
        if (soundEnabled) playStageAlert();
        setCurrentStepIndex((prev) => prev + 1);
        setSecondsRemainingInStep(steps[currentStepIndex + 1].durationSeconds);
      } else {
        // Workout complete!
        if (soundEnabled) playWorkoutFinish();
        setIsRunning(false);
        setShowCompletionModal(true);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemainingInStep, currentStepIndex, steps, soundEnabled]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      if (soundEnabled) playStageAlert();
      setCurrentStepIndex((prev) => prev + 1);
      setSecondsRemainingInStep(steps[currentStepIndex + 1].durationSeconds);
    } else {
      setIsRunning(false);
      setShowCompletionModal(true);
    }
  };

  const handleSaveLog = async () => {
    const actualMin = Math.max(1, Math.round(totalElapsedSeconds / 60));
    // Estimate distance based on elapsed ratio
    const actualDist = Number(
      ((actualMin / Math.max(1, session.estimatedDurationMin)) * session.estimatedDistanceKm).toFixed(2)
    );

    const log: WorkoutLog = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString(),
      workoutId: session.id,
      weekNumber,
      completed: completedStatus,
      actualDurationMin: actualMin,
      actualDistanceKm: actualDist,
      rpe,
      feltPain,
      painLocation: feltPain ? painLocation : undefined,
      notes,
      adjustedDueToCheckIn: false,
    };

    await saveWorkoutLog(log);
    onFinish(log);
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-[#FF5500] uppercase tracking-widest font-bold">
            MODO TREINO AO VIVO
          </div>
          <h2 className="text-lg font-black text-white truncate max-w-[240px] md:max-w-md">
            {session.title}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#AFAFAF] hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#AFAFAF] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center space-x-1.5 py-2">
        {steps.map((s, idx) => (
          <div
            key={s.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentStepIndex
                ? 'w-8 bg-[#FF5500]'
                : idx < currentStepIndex
                ? 'w-3 bg-[#444444]'
                : 'w-2 bg-[#222222]'
            }`}
          />
        ))}
      </div>

      {/* Center Stage & Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-5">
        <div className="inline-block px-4 py-1.5 bg-[#171717] border border-[#2c2c2c] rounded-full text-xs font-bold text-[#FF5500] tracking-wider uppercase">
          ETAPA {currentStepIndex + 1} DE {steps.length}: {currentStep.type.toUpperCase()}
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
          {currentStep.name}
        </h1>

        {/* Big Countdown Timer */}
        <div className="relative my-2">
          <div className="text-7xl md:text-9xl font-black text-white font-mono tracking-tighter">
            {formatMinSec(secondsRemainingInStep)}
          </div>
          <div className="text-xs font-mono text-[#888888] mt-1">
            Tempo total decorrido: {formatMinSec(totalElapsedSeconds)}
          </div>
        </div>

        {/* Pace & Intensity Target */}
        <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
          {currentStep.targetPaceMinPerKm && (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-xl text-center">
              <div className="text-[10px] text-[#777777] uppercase font-bold">Ritmo Alvo</div>
              <div className="text-base font-black text-[#FF5500] font-mono">
                {currentStep.targetPaceMinPerKm}
              </div>
            </div>
          )}
          <div className="p-3 bg-[#111111] border border-[#222222] rounded-xl text-center">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Intensidade</div>
            <div className="text-xs font-bold text-white truncate">
              {currentStep.intensityDescription}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#AFAFAF] max-w-md italic">
          "{currentStep.instructions}"
        </p>

        {/* Next Step Preview */}
        {nextStep && (
          <div className="p-2.5 bg-[#141414] border border-[#222222] rounded-xl text-xs text-[#777777] max-w-sm w-full flex items-center justify-between">
            <span>Próximo bloco:</span>
            <span className="text-white font-bold">{nextStep.name} ({formatMinSec(nextStep.durationSeconds)})</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-3 max-w-md w-full mx-auto">
        <button
          onClick={handleNextStep}
          className="p-4 bg-[#171717] hover:bg-[#222222] text-white rounded-2xl border border-[#2c2c2c] flex items-center justify-center transition-colors"
          title="Pular etapa"
        >
          <SkipForward className="w-6 h-6" />
        </button>

        {!isRunning ? (
          <button
            id="workout-play-btn"
            onClick={() => setIsRunning(true)}
            className="flex-1 py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25 transition-transform active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{totalElapsedSeconds === 0 ? 'COMEÇAR TREINO' : 'CONTINUAR'}</span>
          </button>
        ) : (
          <button
            id="workout-pause-btn"
            onClick={() => setIsRunning(false)}
            className="flex-1 py-4 bg-[#262626] hover:bg-[#333333] text-white font-black text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center space-x-2"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span>PAUSAR</span>
          </button>
        )}

        <button
          onClick={() => {
            setIsRunning(false);
            setShowCompletionModal(true);
          }}
          className="py-4 px-4 bg-red-950/40 border border-red-800/80 text-red-300 font-bold text-xs rounded-2xl"
        >
          FINALIZAR
        </button>
      </div>

      {/* Post-Workout Log Modal (Section 48, 70) */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#262626] rounded-3xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-[#FF5500] mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white mt-2">TREINO CONCLUÍDO</h2>
              <p className="text-xs text-[#AFAFAF]">Como seu corpo respondeu ao estímulo?</p>
            </div>

            {/* Completion Status */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Você completou o treino?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sim', label: 'Sim, total' },
                  { id: 'parcialmente', label: 'Parcial' },
                  { id: 'nao', label: 'Não' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCompletedStatus(s.id as any)}
                    className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                      completedStatus === s.id
                        ? 'bg-[#FF5500] text-black border-[#FF5500]'
                        : 'bg-[#171717] text-[#AFAFAF] border-[#262626]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RPE 1-10 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
                  Percepção Subjetiva de Esforço (RPE)
                </label>
                <span className="text-sm font-black text-[#FF5500] font-mono">{rpe} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full accent-[#FF5500]"
              />
              <div className="flex justify-between text-[10px] text-[#666666] mt-1 font-mono">
                <span>1 (Muito Leve)</span>
                <span>5 (Moderado)</span>
                <span>10 (Máximo)</span>
              </div>
            </div>

            {/* Pain check */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Sentiu alguma dor durante a sessão?
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFeltPain(false)}
                  className={`py-2.5 text-xs font-bold rounded-xl border ${
                    !feltPain ? 'bg-[#FF5500] text-black border-[#FF5500]' : 'bg-[#171717] text-[#AFAFAF] border-[#262626]'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setFeltPain(true)}
                  className={`py-2.5 text-xs font-bold rounded-xl border ${
                    feltPain ? 'bg-[#FF5500] text-black border-[#FF5500]' : 'bg-[#171717] text-[#AFAFAF] border-[#262626]'
                  }`}
                >
                  Sim
                </button>
              </div>

              {feltPain && (
                <input
                  type="text"
                  placeholder="Local da dor (ex: tendão de Aquiles)"
                  value={painLocation}
                  onChange={(e) => setPainLocation(e.target.value)}
                  className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-xs"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Observações / Sensações
              </label>
              <textarea
                rows={2}
                placeholder="Como foi o ritmo, o clima ou a hidratação?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl p-3 text-white text-xs placeholder-[#555555]"
              />
            </div>

            <button
              id="confirm-log-btn"
              onClick={handleSaveLog}
              className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-[#FF5500]/25"
            >
              SALVAR REGISTRO & ATUALIZAR EVOLUÇÃO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
