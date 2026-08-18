import React, { useState, useEffect } from 'react';
import { UserProfile, VO2TestRecord, VO2Protocol } from '../../types';
import { TEST_SAFETY_DISCLAIMER } from '../../data/vo2Tables';
import {
  calculateIncrementalVO2,
  calculateCooperVO2,
  calculateCooperPace,
  calculateCooperSpeedKmH,
  classifyVO2,
  speedToPace,
  calculateRelativeIntensities,
} from '../../calculations/vo2Calculator';
import { saveVO2Test } from '../../storage/indexedDB';
import { playStageAlert, playWorkoutFinish, triggerVibration } from '../../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Gauge,
  Timer,
  AlertTriangle,
  HeartPulse,
  Flame,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  Activity,
  Zap,
} from 'lucide-react';

interface VO2TestHubProps {
  profile: UserProfile;
  onTestSaved: (test: VO2TestRecord) => void;
  onClose?: () => void;
}

export const VO2TestHub: React.FC<VO2TestHubProps> = ({
  profile,
  onTestSaved,
  onClose,
}) => {
  // State
  const [selectedProtocol, setSelectedProtocol] = useState<VO2Protocol | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [testPhase, setTestPhase] = useState<'select' | 'disclaimer' | 'running' | 'manual_entry' | 'result'>('select');

  // Incremental Live State
  const [incStageSpeed, setIncStageSpeed] = useState<number>(profile.level === 'iniciante' ? 4 : 6);
  const [incSecondsRemaining, setIncSecondsRemaining] = useState<number>(120); // 2 min per stage
  const [incIsWarmup, setIncIsWarmup] = useState<boolean>(true);
  const [incIsActive, setIncIsActive] = useState<boolean>(false);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [incline1Percent, setIncline1Percent] = useState<boolean>(true);

  // Cooper Live State
  const [cooperSecondsRemaining, setCooperSecondsRemaining] = useState<number>(720); // 12 min = 720s
  const [cooperIsActive, setCooperIsActive] = useState<boolean>(false);
  const [cooperDistanceInput, setCooperDistanceInput] = useState<number | ''>('');

  // Result & Vitals State
  const [resultTest, setResultTest] = useState<VO2TestRecord | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [heartRate, setHeartRate] = useState<number | ''>('');
  const [rpe, setRpe] = useState<number>(8);
  const [subjectiveFeel, setSubjectiveFeel] = useState<string>('');

  // Timer Effect for Incremental
  useEffect(() => {
    let interval: any = null;
    if (incIsActive && incSecondsRemaining > 0) {
      interval = setInterval(() => {
        setIncSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (incIsActive && incSecondsRemaining === 0) {
      // Stage finished
      playStageAlert();
      if (incIsWarmup) {
        setIncIsWarmup(false);
        setIncStageSpeed(profile.level === 'iniciante' ? 5 : 7);
        setIncSecondsRemaining(120);
      } else {
        // Record completed stage
        setCompletedStages((prev) => [...prev, incStageSpeed]);
        setIncStageSpeed((prev) => prev + 1);
        setIncSecondsRemaining(120);
      }
    }
    return () => clearInterval(interval);
  }, [incIsActive, incSecondsRemaining, incIsWarmup, incStageSpeed, profile.level]);

  // Timer Effect for Cooper
  useEffect(() => {
    let interval: any = null;
    if (cooperIsActive && cooperSecondsRemaining > 0) {
      interval = setInterval(() => {
        setCooperSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (cooperIsActive && cooperSecondsRemaining === 0) {
      playWorkoutFinish();
      setCooperIsActive(false);
      setTestPhase('manual_entry');
    }
    return () => clearInterval(interval);
  }, [cooperIsActive, cooperSecondsRemaining]);

  // Finish Incremental Test
  const handleFinishIncremental = async (lastFullSpeed?: number) => {
    setIncIsActive(false);
    playWorkoutFinish();

    // The result is the LAST COMPLETED FULL STAGE
    let finalSpeed = lastFullSpeed;
    if (finalSpeed === undefined) {
      if (completedStages.length > 0) {
        finalSpeed = completedStages[completedStages.length - 1];
      } else {
        finalSpeed = incStageSpeed > 4 ? incStageSpeed - 1 : 4;
      }
    }

    const { vo2max } = calculateIncrementalVO2(finalSpeed);
    const classification = classifyVO2(vo2max, profile.age, profile.gender);

    const testRecord: VO2TestRecord = {
      id: `test_${Date.now()}`,
      date: new Date().toISOString(),
      protocol: 'incremental',
      vo2max,
      classification,
      incrementalMaxSpeedKmH: finalSpeed,
      maxHeartRate: typeof heartRate === 'number' ? heartRate : undefined,
      rpe,
      subjectiveFeel: subjectiveFeel || 'Finalizado com exaustão controlada',
      inclinePercent: incline1Percent ? 1 : 0,
      completedFullStages: completedStages.length,
    };

    await saveVO2Test(testRecord);
    setResultTest(testRecord);
    onTestSaved(testRecord);
    setTestPhase('result');
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Finish Cooper Test
  const handleFinishCooper = async () => {
    const dist = typeof cooperDistanceInput === 'number' ? cooperDistanceInput : 1600;
    const vo2max = calculateCooperVO2(dist);
    const classification = classifyVO2(vo2max, profile.age, profile.gender);
    const pace = calculateCooperPace(dist);
    const speed = calculateCooperSpeedKmH(dist);

    const testRecord: VO2TestRecord = {
      id: `test_${Date.now()}`,
      date: new Date().toISOString(),
      protocol: 'cooper',
      vo2max,
      classification,
      cooperDistanceMeters: dist,
      cooperPaceMinPerKm: pace,
      cooperAvgSpeedKmH: speed,
      maxHeartRate: typeof heartRate === 'number' ? heartRate : undefined,
      rpe,
      subjectiveFeel: subjectiveFeel || 'Esforço máximo de 12 minutos',
    };

    await saveVO2Test(testRecord);
    setResultTest(testRecord);
    onTestSaved(testRecord);
    setTestPhase('result');
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // 1. SELECT PROTOCOL
  if (testPhase === 'select') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
            <span>VOLTAR</span>
          </button>
        )}

        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
            AVALIAÇÃO FISIOLÓGICA
          </span>
          <h1 className="text-2xl font-black text-white mt-1">TESTES DE VO₂MAX</h1>
          <p className="text-xs text-[#AFAFAF] mt-1">
            Escolha o protocolo de corrida para calibrar individualmente suas zonas de intensidade e velocidade.
          </p>
        </div>

        {/* Recommendation Callout */}
        <div className="p-4 bg-[#1b140d] border border-[#FF5500]/50 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#FF5500] text-black font-black text-[10px] uppercase tracking-wider rounded-md">
              ★ RECOMENDADO PELA ASSESSORIA
            </span>
          </div>
          <p className="text-xs text-[#E5E5E5] leading-relaxed">
            Recomendamos o <strong>Teste de Cooper (12 minutos)</strong> por ser de <strong>mais fácil execução</strong> (podendo ser realizado em pista, rua plana ou esteira) e por ser <strong>altamente fidedigno</strong> para determinar seu VO₂max e sua Velocidade Aeróbica Máxima (VAM).
          </p>
        </div>

        <div className="space-y-4">
          {/* Cooper (Recommended - First) */}
          <div
            onClick={() => {
              setSelectedProtocol('cooper');
              setTestPhase('disclaimer');
            }}
            className="p-5 bg-[#141210] hover:bg-[#1c1611] border-2 border-[#FF5500] rounded-2xl cursor-pointer transition-all active:scale-[0.99] group space-y-3 relative overflow-hidden shadow-lg shadow-[#FF5500]/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5500] flex items-center justify-center text-black font-black group-hover:scale-105 transition-transform shadow-md shadow-[#FF5500]/30">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-white group-hover:text-[#FF5500] transition-colors">
                      1. Teste de Cooper — 12 Minutos
                    </h3>
                    <span className="text-[9px] bg-[#FF5500]/20 text-[#FF5500] font-bold px-1.5 py-0.5 rounded border border-[#FF5500]/40">
                      RECOMENDADO
                    </span>
                  </div>
                  <p className="text-xs text-[#AAAAAA]">Fácil execução em pista aberta, rua plana ou esteira</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#FF5500] group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-[#1c1815] p-2 rounded-lg border border-[#33251a]">
                <div className="text-[10px] text-[#999999]">Local</div>
                <div className="font-bold text-white">Pista / Rua / Esteira</div>
              </div>
              <div className="bg-[#1c1815] p-2 rounded-lg border border-[#33251a]">
                <div className="text-[10px] text-[#999999]">Duração</div>
                <div className="font-bold text-white">12:00 min</div>
              </div>
              <div className="bg-[#1c1815] p-2 rounded-lg border border-[#33251a]">
                <div className="text-[10px] text-[#999999]">Métrica</div>
                <div className="font-bold text-white">Distância Total (m)</div>
              </div>
            </div>
          </div>

          {/* Incremental */}
          <div
            onClick={() => {
              setSelectedProtocol('incremental');
              setTestPhase('disclaimer');
            }}
            className="p-5 bg-[#111111] hover:bg-[#171717] border border-[#222222] hover:border-[#444444] rounded-2xl cursor-pointer transition-all active:scale-[0.99] group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] flex items-center justify-center text-[#999999] group-hover:text-white transition-colors">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#DDDDDD] group-hover:text-white transition-colors">
                    2. Teste Incremental — Esteira
                  </h3>
                  <p className="text-xs text-[#777777]">Aumentos de +1 km/h a cada 2 min com inclinação de 1%</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#555555] group-hover:text-white transition-colors" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-[#171717] p-2 rounded-lg border border-[#252525]">
                <div className="text-[10px] text-[#777777]">Equipamento</div>
                <div className="font-bold text-white">Esteira</div>
              </div>
              <div className="bg-[#171717] p-2 rounded-lg border border-[#252525]">
                <div className="text-[10px] text-[#777777]">Estágios</div>
                <div className="font-bold text-white">+1 km/h / 2 min</div>
              </div>
              <div className="bg-[#171717] p-2 rounded-lg border border-[#252525]">
                <div className="text-[10px] text-[#777777]">Inclinação</div>
                <div className="font-bold text-white">1%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. MANDATORY DISCLAIMER
  if (testPhase === 'disclaimer') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        <button
          onClick={() => setTestPhase('select')}
          className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
          <span>VOLTAR</span>
        </button>

        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
            SEGURANÇA EM PRIMEIRO LUGAR
          </span>
          <h1 className="text-2xl font-black text-white mt-1">ANTES DE TESTAR</h1>
        </div>

        <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 text-xs text-[#CCCCCC] leading-relaxed space-y-3">
          <div className="flex items-center space-x-2 text-[#FF5500] font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>TERMO DE RESPONSABILIDADE</span>
          </div>
          <p className="whitespace-pre-line">{TEST_SAFETY_DISCLAIMER}</p>
        </div>

        <label className="flex items-start space-x-3 p-4 bg-[#141414] border border-[#262626] rounded-xl cursor-pointer hover:border-[#3a3a3a] transition-colors">
          <input
            id="test-disclaimer-checkbox"
            type="checkbox"
            checked={disclaimerAccepted}
            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-[#333333] text-[#FF5500] focus:ring-[#FF5500] bg-[#222222]"
          />
          <span className="text-xs font-bold text-white select-none">
            Li e estou ciente. Estou apto e assumo a responsabilidade pela realização do teste.
          </span>
        </label>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={() => setTestPhase('select')}
            className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLTAR</span>
          </button>

          <button
            id="start-protocol-btn"
            disabled={!disclaimerAccepted}
            onClick={() => setTestPhase('running')}
            className="flex-1 py-4 bg-[#FF5500] disabled:opacity-40 disabled:pointer-events-none hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25"
          >
            <span>CONTINUAR PARA O TESTE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. RUNNING INCREMENTAL PROTOCOL
  if (testPhase === 'running' && selectedProtocol === 'incremental') {
    const minutes = Math.floor(incSecondsRemaining / 60);
    const seconds = incSecondsRemaining % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
              ESTEIRA — INCREMENTAL
            </span>
            <h2 className="text-xl font-black text-white">
              {incIsWarmup ? 'AQUECIMENTO (2 MIN)' : `ESTÁGIO ATUAL: ${incStageSpeed} KM/H`}
            </h2>
          </div>
          <button
            onClick={() => {
              setIncIsActive(false);
              setTestPhase('select');
            }}
            className="text-xs text-[#777777] hover:text-white"
          >
            Cancelar
          </button>
        </div>

        {/* Big Speed & Timer Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-[#888888] font-bold">
            {incIsWarmup ? 'Velocidade de Aquecimento' : 'Velocidade Alvo na Esteira'}
          </div>

          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-6xl md:text-7xl font-black text-[#FF5500] font-mono tracking-tighter">
              {incStageSpeed.toFixed(1)}
            </span>
            <span className="text-xl font-extrabold text-[#888888]">KM/H</span>
          </div>

          <div className="inline-block px-4 py-1.5 bg-[#1a1a1a] rounded-full text-xs font-mono text-white border border-[#2c2c2c]">
            Pace: {speedToPace(incStageSpeed)}
          </div>

          {/* Stage Countdown */}
          <div className="pt-4 border-t border-[#222222]">
            <div className="text-[10px] uppercase tracking-widest text-[#777777] mb-1">
              Tempo Restante no Estágio
            </div>
            <div className="text-4xl font-black text-white font-mono">{timeFormatted}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          {!incIsActive ? (
            <button
              onClick={() => setIncIsActive(true)}
              className="py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>INICIAR CRONÔMETRO</span>
            </button>
          ) : (
            <button
              onClick={() => setIncIsActive(false)}
              className="py-4 bg-[#222222] text-white hover:bg-[#2c2c2c] font-bold text-xs tracking-wider uppercase rounded-xl"
            >
              PAUSAR
            </button>
          )}

          <button
            onClick={() => handleFinishIncremental()}
            className="py-4 bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-300 font-extrabold text-xs tracking-wider uppercase rounded-xl"
          >
            ENCERRAR (ATINGI O LIMITE)
          </button>
        </div>

        {/* Manual Speed Override helper */}
        <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl space-y-2">
          <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wider">
            Já realizou o teste antes e quer registrar a velocidade final direto?
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.5"
              placeholder="Ex: 14.0"
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 3 && val <= 20) {
                  setIncStageSpeed(val);
                }
              }}
              className="flex-1 bg-[#1c1c1c] border border-[#333333] rounded-lg px-3 py-2 text-white text-xs"
            />
            <button
              onClick={() => handleFinishIncremental(incStageSpeed)}
              className="py-2 px-4 bg-[#262626] hover:bg-[#FF5500] hover:text-black text-white text-xs font-bold rounded-lg transition-colors"
            >
              Salvar Resultado
            </button>
          </div>
        </div>

        {/* Symptoms Alert */}
        <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300 leading-relaxed">
            Se sentir dor no peito, pressão na nuca, tontura, mal-estar ou se sua FC parar de subir enquanto estiver exausto, interrompa imediatamente a esteira.
          </p>
        </div>
      </div>
    );
  }

  // 4. RUNNING COOPER PROTOCOL OR MANUAL ENTRY
  if (testPhase === 'running' && selectedProtocol === 'cooper') {
    const minutes = Math.floor(cooperSecondsRemaining / 60);
    const seconds = cooperSecondsRemaining % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
              TESTE DE COOPER — 12 MINUTOS
            </span>
            <h2 className="text-xl font-black text-white">PERCORRA A MAIOR DISTÂNCIA POSSÍVEL</h2>
          </div>
          <button
            onClick={() => setTestPhase('manual_entry')}
            className="text-xs text-[#FF5500] hover:underline"
          >
            Digitar Metros
          </button>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-[#888888] font-bold">
            Tempo Restante
          </div>
          <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tight">
            {timeFormatted}
          </div>
          <p className="text-xs text-[#888888]">
            Mantenha ritmo firme e uniforme. Não dê sprint nos primeiros minutos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!cooperIsActive ? (
            <button
              onClick={() => setCooperIsActive(true)}
              className="py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>INICIAR 12 MIN</span>
            </button>
          ) : (
            <button
              onClick={() => setCooperIsActive(false)}
              className="py-4 bg-[#222222] text-white hover:bg-[#2c2c2c] font-bold text-xs tracking-wider uppercase rounded-xl"
            >
              PAUSAR
            </button>
          )}

          <button
            onClick={() => setTestPhase('manual_entry')}
            className="py-4 bg-[#1a1a1a] hover:bg-[#262626] text-white font-bold text-xs tracking-wider uppercase rounded-xl border border-[#333333]"
          >
            CONCLUIR & REGISTRAR
          </button>
        </div>
      </div>
    );
  }

  // 5. MANUAL ENTRY FOR COOPER / VITALS
  if (testPhase === 'manual_entry' && selectedProtocol === 'cooper') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        <button
          onClick={() => setTestPhase('select')}
          className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
          <span>VOLTAR</span>
        </button>

        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
            REGISTRO DO TESTE
          </span>
          <h2 className="text-2xl font-black text-white mt-1">QUAL FOI SUA DISTÂNCIA TOTAL?</h2>
          <p className="text-xs text-[#AFAFAF] mt-1">
            Informe a metragem percorrida nos 12 minutos (esteira, pista ou GPS).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
              Distância Percorrida (em Metros nos 12 min)
            </label>
            <input
              id="cooper-distance-input"
              type="number"
              min="505"
              max="5000"
              value={cooperDistanceInput}
              onChange={(e) => setCooperDistanceInput(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ex: 2400 ou 1600"
              className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-4 text-white text-xl font-mono font-bold placeholder-[#555555] focus:outline-none focus:border-[#FF5500]"
            />
            
            {/* Automatic Real-Time Pace & VO2max Feedback */}
            {typeof cooperDistanceInput === 'number' && cooperDistanceInput > 0 && (
              <div className="mt-3 p-4 bg-[#181818] border border-[#FF5500]/40 rounded-2xl space-y-3">
                <div className="text-[10px] text-[#FF5500] font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Cálculo Automático de Ritmo em Tempo Real</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#111111] rounded-xl border border-[#262626]">
                    <span className="text-[10px] uppercase font-bold text-[#888888] block">Pace Médio do Teste</span>
                    <span className="text-xl md:text-2xl font-black text-[#FF5500] font-mono block mt-0.5">
                      {calculateCooperPace(cooperDistanceInput)}
                    </span>
                    <span className="text-[10px] text-[#888888] font-mono mt-0.5 block">
                      {calculateCooperSpeedKmH(cooperDistanceInput)} km/h média
                    </span>
                  </div>

                  <div className="p-3 bg-[#111111] rounded-xl border border-[#262626]">
                    <span className="text-[10px] uppercase font-bold text-[#888888] block">Estimativa VO₂max</span>
                    <span className="text-xl md:text-2xl font-black text-white font-mono block mt-0.5">
                      {cooperDistanceInput > 504 ? `${calculateCooperVO2(cooperDistanceInput)}` : '--'}
                      <span className="text-[10px] text-[#777777] ml-1 font-normal">ml/kg</span>
                    </span>
                    {cooperDistanceInput > 504 && (
                      <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                        {classifyVO2(calculateCooperVO2(cooperDistanceInput), profile.age, profile.gender)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                FC Máxima (opcional)
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 185 bpm"
                className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#AFAFAF] uppercase tracking-wider mb-2">
                Percepção (1 a 10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-[#FF5500]"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={() => setTestPhase('select')}
            className="py-4 px-5 bg-[#141414] hover:bg-[#202020] text-[#CCCCCC] hover:text-white font-bold rounded-xl border border-[#262626] flex items-center space-x-1.5 transition-colors text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLTAR</span>
          </button>

          <button
            id="save-cooper-btn"
            disabled={!cooperDistanceInput || cooperDistanceInput <= 504}
            onClick={handleFinishCooper}
            className="flex-1 py-4 bg-[#FF5500] disabled:opacity-40 disabled:pointer-events-none hover:bg-[#FF6600] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#FF5500]/25"
          >
            <span>CALCULAR E SALVAR MEU VO₂MAX</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 6. RESULT CARD SCREEN (Section 20, 23)
  if (testPhase === 'result' && resultTest) {
    const cooperSpeed = resultTest.protocol === 'cooper' && resultTest.cooperDistanceMeters
      ? (resultTest.cooperAvgSpeedKmH || calculateCooperSpeedKmH(resultTest.cooperDistanceMeters))
      : null;
    const cooperPace = resultTest.protocol === 'cooper' && resultTest.cooperDistanceMeters
      ? (resultTest.cooperPaceMinPerKm || calculateCooperPace(resultTest.cooperDistanceMeters))
      : null;

    const relative = resultTest.incrementalMaxSpeedKmH
      ? calculateRelativeIntensities(resultTest.incrementalMaxSpeedKmH)
      : cooperSpeed
      ? calculateRelativeIntensities(cooperSpeed)
      : null;

    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        <button
          onClick={() => {
            if (onClose) onClose();
            else setTestPhase('select');
          }}
          className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
          <span>VOLTAR</span>
        </button>

        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
            RESULTADO DO TESTE
          </span>
          <h1 className="text-2xl font-black text-white mt-1">SEU PONTO DE PARTIDA</h1>
        </div>

        {/* Big VO2max Card */}
        <div className="bg-[#111111] border border-[#262626] rounded-3xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="text-xs uppercase tracking-widest text-[#888888] font-bold">
            SEU VO₂MAX
          </div>

          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-6xl md:text-7xl font-black text-[#FF5500] font-mono tracking-tight">
              {resultTest.vo2max.toFixed(2)}
            </span>
            <span className="text-sm md:text-base font-bold text-[#888888]">ml/kg/min</span>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#777777] mb-1">
              SEU NÍVEL / CLASSIFICAÇÃO
            </div>
            <span className="inline-block px-4 py-1.5 bg-[#1e1e1e] border border-[#FF5500]/40 rounded-full text-xs font-mono font-extrabold text-white">
              {resultTest.classification.toUpperCase()}
            </span>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#222222] text-xs">
            <div>
              <div className="text-[10px] text-[#777777]">Protocolo</div>
              <div className="font-bold text-white capitalize">{resultTest.protocol === 'cooper' ? 'Cooper (12 min)' : 'Esteira'}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#777777]">
                {resultTest.protocol === 'incremental' ? 'Velocidade Final' : 'Distância'}
              </div>
              <div className="font-bold text-[#FF5500]">
                {resultTest.protocol === 'incremental'
                  ? `${resultTest.incrementalMaxSpeedKmH} km/h`
                  : `${resultTest.cooperDistanceMeters} m`}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#777777]">
                {resultTest.protocol === 'cooper' ? 'Pace do Teste' : 'RPE / Esforço'}
              </div>
              <div className="font-bold text-white font-mono">
                {resultTest.protocol === 'cooper'
                  ? cooperPace
                  : `${resultTest.rpe ?? 8} / 10`}
              </div>
            </div>
          </div>
        </div>

        {/* Cooper Specific Summary Card if Cooper */}
        {resultTest.protocol === 'cooper' && cooperPace && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-[#FF5500]" />
                <span>Métricas de Ritmo do Teste de Cooper</span>
              </span>
              <span className="text-[11px] text-[#888888]">12 minutos</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#262626]">
                <div className="text-[10px] text-[#777777] uppercase font-bold">Pace Médio</div>
                <div className="text-lg font-black text-[#FF5500] font-mono mt-0.5">{cooperPace}</div>
              </div>

              <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#262626]">
                <div className="text-[10px] text-[#777777] uppercase font-bold">Velocidade Média</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">{cooperSpeed} km/h</div>
              </div>

              <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#262626]">
                <div className="text-[10px] text-[#777777] uppercase font-bold">Distância Total</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">{resultTest.cooperDistanceMeters}m</div>
              </div>
            </div>
          </div>
        )}

        {/* Speed & Pace Percentages Table */}
        {relative && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Zonas de Velocidade e Pace Relativas ({resultTest.protocol === 'cooper' ? 'Estimadas pelo Cooper' : 'vVO₂max Esteira'})
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-[#1a1a1a] p-2 rounded-xl">
                <div className="text-[10px] text-[#777777]">80% (Mod)</div>
                <div className="font-bold text-white">{relative.p80.speed} km/h</div>
                <div className="text-[10px] text-[#FF5500] font-mono">{relative.p80.pace}</div>
              </div>
              <div className="bg-[#1a1a1a] p-2 rounded-xl">
                <div className="text-[10px] text-[#777777]">90% (Limiar)</div>
                <div className="font-bold text-white">{relative.p90.speed} km/h</div>
                <div className="text-[10px] text-[#FF5500] font-mono">{relative.p90.pace}</div>
              </div>
              <div className="bg-[#1a1a1a] p-2 rounded-xl border border-[#FF5500]/40">
                <div className="text-[10px] text-[#FF5500] font-bold">100% (VO₂)</div>
                <div className="font-bold text-white">{relative.p100.speed} km/h</div>
                <div className="text-[10px] text-[#FF5500] font-mono">{relative.p100.pace}</div>
              </div>
              <div className="bg-[#1a1a1a] p-2 rounded-xl">
                <div className="text-[10px] text-[#777777]">110% (Tiro)</div>
                <div className="font-bold text-white">{relative.p110.speed} km/h</div>
                <div className="text-[10px] text-[#FF5500] font-mono">{relative.p110.pace}</div>
              </div>
            </div>
          </div>
        )}

        {/* Advisory Box (Section 23) */}
        <div className="bg-[#111111] border border-[#262626] rounded-2xl p-4 space-y-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
            <span>AGORA VOCÊ TEM UM PONTO DE PARTIDA</span>
          </div>
          <p className="text-xs text-[#AFAFAF] leading-relaxed">
            O ideal é repetir o teste aproximadamente uma vez por mês e seguir os treinos programados durante esse período. Assim você consegue comparar os resultados e acompanhar sua evolução.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="w-full py-3 bg-[#171717] hover:bg-[#222222] text-[#AFAFAF] hover:text-white text-xs font-bold rounded-xl border border-[#2a2a2a] flex items-center justify-center space-x-2 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>VER COMO CHEGAMOS A ESSE RESULTADO</span>
          </button>

          <button
            id="close-vo2-result-btn"
            onClick={() => {
              if (onClose) onClose();
              else setTestPhase('select');
            }}
            className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-black font-black text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-[#FF5500]/25"
          >
            APLICAR AO MEU PLANO DE TREINOS
          </button>
        </div>

        {/* Formula Explanation Modal */}
        {showFormulaModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Memória de Cálculo</h3>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="text-xs text-[#888888] hover:text-white"
                >
                  ✕ Fechar
                </button>
              </div>

              <div className="text-xs text-[#CCCCCC] space-y-3 leading-relaxed">
                {resultTest.protocol === 'incremental' ? (
                  <>
                    <p>
                      <strong>Protocolo Incremental na Esteira:</strong>
                    </p>
                    <p>
                      O resultado considera a velocidade do <em>último estágio completo</em> de 2 minutos (
                      <strong>{resultTest.incrementalMaxSpeedKmH} km/h</strong>).
                    </p>
                    <p>
                      Pela tabela fisiológica do material, {resultTest.incrementalMaxSpeedKmH} km/h equivale a{' '}
                      <strong>{(resultTest.vo2max / 3.5).toFixed(1)} METs</strong>.
                    </p>
                    <p className="font-mono bg-[#1c1c1c] p-2 rounded text-[#FF5500]">
                      VO₂max = METs × 3.5 = {(resultTest.vo2max / 3.5).toFixed(1)} × 3.5 = {resultTest.vo2max} ml/kg/min
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Protocolo de Cooper (12 minutos):</strong>
                    </p>
                    <p>Distância percorrida: <strong>{resultTest.cooperDistanceMeters} metros</strong>.</p>
                    <p className="font-mono bg-[#1c1c1c] p-2 rounded text-[#FF5500]">
                      VO₂max = (Distância - 504) ÷ 45
                      <br />= ({resultTest.cooperDistanceMeters} - 504) ÷ 45 = {resultTest.vo2max} ml/kg/min
                    </p>
                  </>
                )}

                <p>
                  Classificação baseada na faixa etária ({profile.age} anos) e gênero ({profile.gender}):{' '}
                  <strong className="text-white">{resultTest.classification}</strong>.
                </p>
              </div>

              <button
                onClick={() => setShowFormulaModal(false)}
                className="w-full py-3 bg-[#262626] text-white font-bold text-xs rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
