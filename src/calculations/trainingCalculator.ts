import {
  UserProfile,
  TargetDistance,
  WeeklyMicrocycle,
  WorkoutSession,
  WorkoutStep,
  TrainingPlan,
  WorkoutType,
  IntensityDomain,
  WorkoutBlockBreakdown,
} from '../types';
import { INTERVAL_MODELS } from '../data/trainingModels';
import { speedToPace, paceToSpeed } from './vo2Calculator';

export const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

/**
 * Calculates distance in km from speed (km/h) and duration (minutes).
 * Formula: distance (km) = speed (km/h) * duration (min) / 60
 */
export function calculateBlockDistanceKm(speedKmH: number, durationMin: number): number {
  if (speedKmH <= 0 || durationMin <= 0) return 0;
  return Number(((speedKmH * durationMin) / 60).toFixed(2));
}

/**
 * Calculates duration in minutes from distance (km) and speed (km/h).
 * Formula: duration (min) = (distance / speed) * 60
 */
export function calculateBlockDurationMin(distanceKm: number, speedKmH: number): number {
  if (distanceKm <= 0 || speedKmH <= 0) return 0;
  return Number(((distanceKm / speedKmH) * 60).toFixed(2));
}

/**
 * Formats duration in minutes into a clean "MM:SS" or "X min" representation.
 * e.g., 38.30 min -> "38:18" (38 min and 18 sec)
 */
export function formatDurationMinutesSeconds(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0:00';
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  const formattedSec = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${formattedSec}`;
}

/**
 * Returns baseline weekly distance in km according to runner level and experience.
 */
export function getBaselineWeeklyVolume(profile: UserProfile): number {
  if (profile.maxRecentDistanceKm && profile.maxRecentDistanceKm > 0) {
    const freq = profile.weeklyFrequency;
    return Math.max(8, Math.round(profile.maxRecentDistanceKm * Math.min(2.5, 1 + freq * 0.3)));
  }

  // Level defaults
  switch (profile.level) {
    case 'iniciante':
      return profile.weeklyFrequency === 1 ? 4 : profile.weeklyFrequency * 4; // e.g. 3x -> 12km
    case 'intermediario':
      return profile.weeklyFrequency * 6.5; // e.g. 3x -> ~20km, 4x -> 26km
    case 'avancado':
      return profile.weeklyFrequency * 9; // e.g. 4x -> 36km, 5x -> 45km
  }
}

/**
 * Distributes weekly sessions across 7 days adapting strictly to the user's chosen Simulado Day.
 * Principle:
 * - Simulado is placed on the chosen day (e.g. Saturday or Sunday).
 * - Day before Simulado is kept for rest or light recovery.
 * - Quality/Interval workout is placed 2-3 days prior with recovery in between.
 */
export function getDistributedDaysWithSimulado(
  frequency: number,
  simuladoDay: number = 6,
  userPreferredDays?: number[]
): number[] {
  // If user provided valid preferred days containing the simulado day, respect them
  if (
    userPreferredDays &&
    userPreferredDays.length === frequency &&
    userPreferredDays.includes(simuladoDay)
  ) {
    return [...userPreferredDays].sort((a, b) => a - b);
  }

  const days: number[] = [simuladoDay];
  const dayBefore = (simuladoDay + 6) % 7;
  const twoDaysBefore = (simuladoDay + 5) % 7;
  const threeDaysBefore = (simuladoDay + 4) % 7;
  const fourDaysBefore = (simuladoDay + 3) % 7;
  const fiveDaysBefore = (simuladoDay + 2) % 7;

  switch (frequency) {
    case 1:
      // Single session is the main/simulado day
      return [simuladoDay];
    case 2:
      // Simulado + 1 Quality/Base session (3-4 days apart)
      days.push(threeDaysBefore);
      break;
    case 3:
      // Simulado + 1 Quality + 1 Continuous run
      days.push(fourDaysBefore, twoDaysBefore);
      break;
    case 4:
      // Simulado + 1 Quality + 2 Continuous/Light
      days.push(fiveDaysBefore, threeDaysBefore, twoDaysBefore);
      break;
    case 5:
      // Simulado + 1 Quality + 3 Continuous/Light (preserving day before as light/prep)
      days.push(fiveDaysBefore, fourDaysBefore, threeDaysBefore, dayBefore);
      break;
    case 6:
      // 6 days active, leaving only day after simulado as pure rest
      days.push(
        (simuladoDay + 2) % 7,
        (simuladoDay + 3) % 7,
        (simuladoDay + 4) % 7,
        (simuladoDay + 5) % 7,
        (simuladoDay + 6) % 7
      );
      break;
    default:
      days.push(fourDaysBefore, twoDaysBefore);
      break;
  }

  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * Validates a WorkoutSession mathematically block by block.
 * Corrects any slight floating-point drift and guarantees that:
 * 1. Warmup distance = speed * time / 60
 * 2. Main work distance = speed * time / 60 (or sum of reps)
 * 3. Recovery distance = speed * time / 60 (or sum of recoveries)
 * 4. Cooldown distance = speed * time / 60
 * 5. Total distance = exact sum of all blocks
 * 6. Total duration = exact sum of all blocks
 * 7. Pace matches speed (60 / speed)
 */
export function validateWorkout(workout: WorkoutSession): {
  isValid: boolean;
  workout: WorkoutSession;
  errors: string[];
} {
  const errors: string[] = [];

  if (workout.isRestDay) {
    workout.estimatedDistanceKm = 0;
    workout.estimatedDurationMin = 0;
    return { isValid: true, workout, errors: [] };
  }

  if (!workout.breakdown) {
    // If breakdown is missing, construct one from steps
    workout.breakdown = generateBreakdownFromSteps(workout);
  }

  const b = workout.breakdown;

  // 1. Validate warmup block
  const expectedWarmupDist = calculateBlockDistanceKm(b.warmup.speedKmH, b.warmup.durationMin);
  b.warmup.distanceKm = expectedWarmupDist;
  b.warmup.paceMinPerKm = speedToPace(b.warmup.speedKmH);

  // 2. Validate main block
  let expectedMainDist = 0;
  let expectedMainDur = 0;

  if (b.main.isInterval) {
    const reps = b.main.repsCount || 1;
    const workDurMin = b.main.workDurationMin || 1;
    const workSpeed = b.main.workSpeedKmH || 10;
    const singleWorkDist = calculateBlockDistanceKm(workSpeed, workDurMin);
    b.main.workDistanceKm = Number((singleWorkDist * reps).toFixed(2));
    b.main.workPaceMinPerKm = speedToPace(workSpeed);

    const recs = b.main.recoveriesCount ?? Math.max(0, reps - 1);
    const recDurMin = b.main.recoveryDurationMin || 1;
    const recSpeed = b.main.recoverySpeedKmH || 6;
    const singleRecDist = calculateBlockDistanceKm(recSpeed, recDurMin);
    b.main.recoveryDistanceKm = Number((singleRecDist * recs).toFixed(2));
    b.main.recoveryPaceMinPerKm = speedToPace(recSpeed);

    expectedMainDist = Number((b.main.workDistanceKm + b.main.recoveryDistanceKm).toFixed(2));
    expectedMainDur = Number((reps * workDurMin + recs * recDurMin).toFixed(2));
  } else {
    const contSpeed = b.main.continuousSpeedKmH || 9;
    const contDist = b.main.continuousDistanceKm || 5;
    const contDur = calculateBlockDurationMin(contDist, contSpeed);
    b.main.continuousDistanceKm = contDist;
    b.main.continuousDurationMin = contDur;
    b.main.continuousPaceMinPerKm = speedToPace(contSpeed);

    expectedMainDist = contDist;
    expectedMainDur = contDur;
  }

  // 3. Validate cooldown block
  const expectedCooldownDist = calculateBlockDistanceKm(b.cooldown.speedKmH, b.cooldown.durationMin);
  b.cooldown.distanceKm = expectedCooldownDist;
  b.cooldown.paceMinPerKm = speedToPace(b.cooldown.speedKmH);

  // 4. Validate exact totals
  const totalDist = Number(
    (b.warmup.distanceKm + expectedMainDist + b.cooldown.distanceKm).toFixed(2)
  );
  const totalDur = Number(
    (b.warmup.durationMin + expectedMainDur + b.cooldown.durationMin).toFixed(2)
  );

  b.totalDistanceKm = totalDist;
  b.totalDurationMin = totalDur;
  b.totalDurationFormatted = formatDurationMinutesSeconds(totalDur);

  const avgSpeed = Number(((totalDist / Math.max(0.1, totalDur / 60))).toFixed(2));
  b.averageSpeedKmH = avgSpeed;
  b.averagePaceMinPerKm = speedToPace(avgSpeed);

  // Sync session root fields with the validated breakdown
  workout.estimatedDistanceKm = totalDist;
  workout.estimatedDurationMin = Math.round(totalDur);
  workout.warmupMinutes = Math.round(b.warmup.durationMin);
  workout.cooldownMinutes = Math.round(b.cooldown.durationMin);

  return {
    isValid: errors.length === 0,
    workout,
    errors,
  };
}

/**
 * Builds a WorkoutBlockBreakdown fallback from WorkoutSteps.
 */
function generateBreakdownFromSteps(workout: WorkoutSession): WorkoutBlockBreakdown {
  const warmupStep = workout.steps.find((s) => s.type === 'warmup');
  const cooldownStep = workout.steps.find((s) => s.type === 'cooldown');
  const workSteps = workout.steps.filter((s) => s.type === 'work');
  const recSteps = workout.steps.filter((s) => s.type === 'recovery');

  const isInterval = workout.workoutType === 'treino_intervalado' || workSteps.length > 1;

  const warmupDur = (warmupStep?.durationSeconds || 300) / 60;
  const warmupSpeed = warmupStep?.targetSpeedKmH || 7.5;
  const warmupDist = calculateBlockDistanceKm(warmupSpeed, warmupDur);

  const cooldownDur = (cooldownStep?.durationSeconds || 180) / 60;
  const cooldownSpeed = cooldownStep?.targetSpeedKmH || 7.0;
  const cooldownDist = calculateBlockDistanceKm(cooldownSpeed, cooldownDur);

  if (isInterval) {
    const repsCount = workSteps.length || 6;
    const workDur = (workSteps[0]?.durationSeconds || 60) / 60;
    const workSpeed = workSteps[0]?.targetSpeedKmH || 12;
    const workDist = Number((calculateBlockDistanceKm(workSpeed, workDur) * repsCount).toFixed(2));

    const recCount = recSteps.length || Math.max(0, repsCount - 1);
    const recDur = (recSteps[0]?.durationSeconds || 60) / 60;
    const recSpeed = recSteps[0]?.targetSpeedKmH || 6.5;
    const recDist = Number((calculateBlockDistanceKm(recSpeed, recDur) * recCount).toFixed(2));

    const totalDur = Number((warmupDur + repsCount * workDur + recCount * recDur + cooldownDur).toFixed(2));
    const totalDist = Number((warmupDist + workDist + recDist + cooldownDist).toFixed(2));
    const avgSpeed = Number(((totalDist / (totalDur / 60))).toFixed(2));

    return {
      warmup: {
        durationMin: warmupDur,
        speedKmH: warmupSpeed,
        paceMinPerKm: speedToPace(warmupSpeed),
        distanceKm: warmupDist,
        description: `${warmupDur} min trote leve preparatório`,
      },
      main: {
        isInterval: true,
        description: `${repsCount} × ${workDur * 60}s tiro + ${recCount} × ${recDur * 60}s recuperação`,
        repsCount,
        workDurationMin: workDur,
        workSpeedKmH: workSpeed,
        workPaceMinPerKm: speedToPace(workSpeed),
        workDistanceKm: workDist,
        recoveriesCount: recCount,
        recoveryDurationMin: recDur,
        recoverySpeedKmH: recSpeed,
        recoveryPaceMinPerKm: speedToPace(recSpeed),
        intervalIntensityLabel: 'Potência Aeróbia (vVO₂max)',
      },
      cooldown: {
        durationMin: cooldownDur,
        speedKmH: cooldownSpeed,
        paceMinPerKm: speedToPace(cooldownSpeed),
        distanceKm: cooldownDist,
        description: `${cooldownDur} min trote regenerativo`,
      },
      totalDurationMin: totalDur,
      totalDurationFormatted: formatDurationMinutesSeconds(totalDur),
      totalDistanceKm: totalDist,
      averageSpeedKmH: avgSpeed,
      averagePaceMinPerKm: speedToPace(avgSpeed),
    };
  }

  // Continuous
  const contDist = Math.max(2, workout.estimatedDistanceKm - warmupDist - cooldownDist);
  const contSpeed = workSteps[0]?.targetSpeedKmH || 9.0;
  const contDur = calculateBlockDurationMin(contDist, contSpeed);
  const totalDur = Number((warmupDur + contDur + cooldownDur).toFixed(2));
  const totalDist = Number((warmupDist + contDist + cooldownDist).toFixed(2));
  const avgSpeed = Number(((totalDist / (totalDur / 60))).toFixed(2));

  return {
    warmup: {
      durationMin: warmupDur,
      speedKmH: warmupSpeed,
      paceMinPerKm: speedToPace(warmupSpeed),
      distanceKm: warmupDist,
      description: `${warmupDur} min aquecimento leve`,
    },
    main: {
      isInterval: false,
      description: `Corrida contínua de ${contDist} km em ritmo estável`,
      continuousDistanceKm: contDist,
      continuousDurationMin: contDur,
      continuousSpeedKmH: contSpeed,
      continuousPaceMinPerKm: speedToPace(contSpeed),
    },
    cooldown: {
      durationMin: cooldownDur,
      speedKmH: cooldownSpeed,
      paceMinPerKm: speedToPace(cooldownSpeed),
      distanceKm: cooldownDist,
      description: `${cooldownDur} min volta à calma`,
    },
    totalDurationMin: totalDur,
    totalDurationFormatted: formatDurationMinutesSeconds(totalDur),
    totalDistanceKm: totalDist,
    averageSpeedKmH: avgSpeed,
    averagePaceMinPerKm: speedToPace(avgSpeed),
  };
}

/**
 * Creates an exact interval workout session based on physiological models and vVO2max.
 */
export function createIntervalSession(
  sessionId: string,
  dayOfWeek: number,
  dayName: string,
  refSpeedKmH: number,
  level: string,
  targetDistance: TargetDistance,
  modelIndex: number = 0
): WorkoutSession {
  // Choose model
  let model = INTERVAL_MODELS[modelIndex] || INTERVAL_MODELS[0];

  // Specific model selection based on prompt rules:
  // 4x3 (80-90%), 2x1 (90-100%), 10x50 (100-110%), 1x2 (90-100%), 15x15 (110%)
  if (level === 'iniciante') {
    model = INTERVAL_MODELS.find((m) => m.code === '1X2') || INTERVAL_MODELS[2]; // 1x2 or 4x3
  } else if (level === 'avancado' && (targetDistance === '5km' || targetDistance === '10km')) {
    model = INTERVAL_MODELS.find((m) => m.code === '15X15') || INTERVAL_MODELS[4]; // 15x15
  } else {
    model = INTERVAL_MODELS.find((m) => m.code === '2X1') || INTERVAL_MODELS[1]; // 2x1
  }

  // Parse intensity percentages
  let workSpeedPct = 1.0; // 100%
  if (model.targetIntensityPercentVO2.includes('110')) workSpeedPct = 1.1;
  else if (model.targetIntensityPercentVO2.includes('90-100') || model.targetIntensityPercentVO2.includes('90–100')) workSpeedPct = 0.98;
  else if (model.targetIntensityPercentVO2.includes('80-90') || model.targetIntensityPercentVO2.includes('80–90')) workSpeedPct = 0.88;

  let recSpeedPct = 0.55; // 55%
  if (model.recoveryIntensityPercentVO2?.includes('40-50')) recSpeedPct = 0.45;
  else if (model.recoveryIntensityPercentVO2?.includes('50-60')) recSpeedPct = 0.55;

  const workSpeedKmH = Number((refSpeedKmH * workSpeedPct).toFixed(1));
  const workPaceMinPerKm = speedToPace(workSpeedKmH);
  const recoverySpeedKmH = Number((refSpeedKmH * recSpeedPct).toFixed(1));
  const recoveryPaceMinPerKm = speedToPace(recoverySpeedKmH);

  const warmupSpeedKmH = Number((refSpeedKmH * 0.70).toFixed(1));
  const warmupPaceMinPerKm = speedToPace(warmupSpeedKmH);
  const warmupDurationMin = 5.0; // 5 min
  const warmupDistanceKm = calculateBlockDistanceKm(warmupSpeedKmH, warmupDurationMin);

  const cooldownSpeedKmH = Number((refSpeedKmH * 0.55).toFixed(1));
  const cooldownPaceMinPerKm = speedToPace(cooldownSpeedKmH);
  const cooldownDurationMin = 3.0; // 3 min
  const cooldownDistanceKm = calculateBlockDistanceKm(cooldownSpeedKmH, cooldownDurationMin);

  const repsCount = typeof model.seriesCount === 'number' ? model.seriesCount : 6;
  const recoveriesCount = Math.max(1, repsCount - 1); // Exact: 7 reps have 6 recoveries between them

  const workDurationMin = Number((model.workDurationSec / 60).toFixed(2));
  const recoveryDurationMin = Number((model.recoveryDurationSec / 60).toFixed(2));

  const singleWorkDist = calculateBlockDistanceKm(workSpeedKmH, workDurationMin);
  const totalWorkDist = Number((singleWorkDist * repsCount).toFixed(2));

  const singleRecDist = calculateBlockDistanceKm(recoverySpeedKmH, recoveryDurationMin);
  const totalRecDist = Number((singleRecDist * recoveriesCount).toFixed(2));

  const totalDistKm = Number(
    (warmupDistanceKm + totalWorkDist + totalRecDist + cooldownDistanceKm).toFixed(2)
  );
  const totalDurMin = Number(
    (warmupDurationMin + repsCount * workDurationMin + recoveriesCount * recoveryDurationMin + cooldownDurationMin).toFixed(2)
  );
  const avgSpeedKmH = Number(((totalDistKm / (totalDurMin / 60))).toFixed(2));
  const avgPaceMinPerKm = speedToPace(avgSpeedKmH);

  // Construct Live Execution Steps
  const steps: WorkoutStep[] = [
    {
      id: `${sessionId}_warmup`,
      name: 'Aquecimento Gradual',
      type: 'warmup',
      durationSeconds: Math.round(warmupDurationMin * 60),
      targetSpeedKmH: warmupSpeedKmH,
      targetPaceMinPerKm: warmupPaceMinPerKm,
      intensityDescription: 'Ritmo Leve (Z1)',
      instructions: 'Trote preparatório para elevar frequência cardíaca e lubrificar articulações.',
    },
  ];

  for (let i = 1; i <= repsCount; i++) {
    steps.push({
      id: `${sessionId}_work_${i}`,
      name: `Tiro ${i}/${repsCount} (${model.code})`,
      type: 'work',
      durationSeconds: model.workDurationSec,
      targetSpeedKmH: workSpeedKmH,
      targetPaceMinPerKm: workPaceMinPerKm,
      intensityDescription: `Esforço Alto (${model.targetIntensityPercentVO2} vVO₂max)`,
      instructions: `Mantenha a postura alinhada e cadência alta. Ritmo alvo: ${workSpeedKmH} km/h (${workPaceMinPerKm}).`,
    });

    if (i <= recoveriesCount) {
      steps.push({
        id: `${sessionId}_rec_${i}`,
        name: `Recuperação ${i}/${repsCount}`,
        type: 'recovery',
        durationSeconds: model.recoveryDurationSec,
        targetSpeedKmH: recoverySpeedKmH,
        targetPaceMinPerKm: recoveryPaceMinPerKm,
        intensityDescription: `Trote / Caminhada Ativa (${model.recoveryIntensityPercentVO2 ?? '50%'})`,
        instructions: 'Controle a respiração, solte os braços e baixe os batimentos cardíacos.',
      });
    }
  }

  steps.push({
    id: `${sessionId}_cooldown`,
    name: 'Desaquecimento / Volta à Calma',
    type: 'cooldown',
    durationSeconds: Math.round(cooldownDurationMin * 60),
    targetSpeedKmH: cooldownSpeedKmH,
    targetPaceMinPerKm: cooldownPaceMinPerKm,
    intensityDescription: 'Trote Regenerativo',
    instructions: 'Desaceleração suave para retorno dos parâmetros basais.',
  });

  const breakdown: WorkoutBlockBreakdown = {
    warmup: {
      durationMin: warmupDurationMin,
      speedKmH: warmupSpeedKmH,
      paceMinPerKm: warmupPaceMinPerKm,
      distanceKm: warmupDistanceKm,
      description: `${warmupDurationMin} min trote a ${warmupSpeedKmH} km/h (${warmupPaceMinPerKm})`,
    },
    main: {
      isInterval: true,
      description: `${repsCount} × ${model.workDurationSec}s a ${workSpeedKmH} km/h + ${recoveriesCount} × ${model.recoveryDurationSec}s a ${recoverySpeedKmH} km/h`,
      repsCount,
      workDurationMin,
      workSpeedKmH,
      workPaceMinPerKm,
      workDistanceKm: totalWorkDist,
      recoveriesCount,
      recoveryDurationMin,
      recoverySpeedKmH,
      recoveryPaceMinPerKm,
      recoveryDistanceKm: totalRecDist,
      intervalIntensityLabel: `Modelo ${model.code} (${model.targetIntensityPercentVO2} vVO₂max)`,
    },
    cooldown: {
      durationMin: cooldownDurationMin,
      speedKmH: cooldownSpeedKmH,
      paceMinPerKm: cooldownPaceMinPerKm,
      distanceKm: cooldownDistanceKm,
      description: `${cooldownDurationMin} min trote a ${cooldownSpeedKmH} km/h (${cooldownPaceMinPerKm})`,
    },
    totalDurationMin: totalDurMin,
    totalDurationFormatted: formatDurationMinutesSeconds(totalDurMin),
    totalDistanceKm: totalDistKm,
    averageSpeedKmH: avgSpeedKmH,
    averagePaceMinPerKm: avgPaceMinPerKm,
  };

  const session: WorkoutSession = {
    id: sessionId,
    dayOfWeek,
    dayName,
    workoutType: 'treino_intervalado',
    title: `Treino Intervalado (${model.code})`,
    objective: 'Desenvolvimento de potência aeróbia máxima (VO₂max) e tolerância ao lactato.',
    estimatedDistanceKm: totalDistKm,
    estimatedDurationMin: Math.round(totalDurMin),
    intensityDomain: 'severo',
    intensityLabel: 'Severo (Alta Intensidade)',
    executionGuidance: `Executar ${repsCount} repetições de ${model.workDurationSec}s a ${workSpeedKmH} km/h (${workPaceMinPerKm}) intercaladas com ${recoveriesCount} recuperações de ${model.recoveryDurationSec}s a ${recoverySpeedKmH} km/h.`,
    warmupMinutes: Math.round(warmupDurationMin),
    warmupDetails: `${warmupDurationMin} min a ${warmupSpeedKmH} km/h (${warmupPaceMinPerKm}) — ${warmupDistanceKm} km`,
    mainBlockDetails: `${repsCount}x ${model.workDurationSec}s a ${workSpeedKmH} km/h (${totalWorkDist} km) + ${recoveriesCount}x ${model.recoveryDurationSec}s a ${recoverySpeedKmH} km/h (${totalRecDist} km)`,
    recoveryDetails: `${recoveriesCount} recuperações ativas de ${model.recoveryDurationSec}s`,
    cooldownMinutes: Math.round(cooldownDurationMin),
    cooldownDetails: `${cooldownDurationMin} min a ${cooldownSpeedKmH} km/h (${cooldownPaceMinPerKm}) — ${cooldownDistanceKm} km`,
    steps,
    intervalModelName: model.name,
    breakdown,
    isRestDay: false,
  };

  return validateWorkout(session).workout;
}

/**
 * Creates an exact Continuous Run session with main distance and separate warmup/cooldown.
 */
export function createContinuousSession(
  sessionId: string,
  dayOfWeek: number,
  dayName: string,
  mainDistanceKm: number,
  refSpeedKmH: number,
  type: 'corrida_leve' | 'corrida_continua' | 'corrida_moderada' | 'longao' | 'recuperacao' = 'corrida_continua'
): WorkoutSession {
  let speedPct = 0.72; // default continuous 72%
  let intensityDomain: IntensityDomain = 'moderado';
  let title = 'Corrida Contínua';
  let objective = 'Desenvolvimento da base aeróbia, capilarização e estabilidade de ritmo.';
  let label = 'Moderado (70-75% vVO₂max)';

  if (type === 'corrida_leve') {
    speedPct = 0.68;
    intensityDomain = 'moderado';
    title = 'Corrida Leve Regenerativa';
    objective = 'Estímulo aeróbio leve com baixo estresse articular e aceleração da recuperação tecidual.';
    label = 'Leve / Confortável (65-70% vVO₂max)';
  } else if (type === 'corrida_moderada') {
    speedPct = 0.78;
    intensityDomain = 'moderado';
    title = 'Corrida Moderada Estruturada';
    objective = 'Aumento da eficiência de transporte de oxigênio e ritmo específico de sustentação.';
    label = 'Moderado / Firme (75-80% vVO₂max)';
  } else if (type === 'longao') {
    speedPct = 0.70;
    intensityDomain = 'moderado';
    title = 'Longão de Resistência';
    objective = 'Construção da resistência muscular de longa duração e otimização do uso de gorduras como combustível.';
    label = 'Resistência de Base (70% vVO₂max)';
  } else if (type === 'recuperacao') {
    speedPct = 0.58;
    intensityDomain = 'recuperacao';
    title = 'Trote Regenerativo Z1';
    objective = 'Recuperação ativa com fluxo sanguíneo periférico elevado e impacto mínimo.';
    label = 'Regenerativo Puro (55-60% vVO₂max)';
  }

  const mainSpeedKmH = Number((refSpeedKmH * speedPct).toFixed(1));
  const mainPaceMinPerKm = speedToPace(mainSpeedKmH);
  const mainDurationMin = calculateBlockDurationMin(mainDistanceKm, mainSpeedKmH);

  // Warmup and cooldown
  const warmupSpeedKmH = Number((refSpeedKmH * 0.65).toFixed(1));
  const warmupPaceMinPerKm = speedToPace(warmupSpeedKmH);
  const warmupDurationMin = type === 'recuperacao' ? 3.0 : 5.0;
  const warmupDistanceKm = calculateBlockDistanceKm(warmupSpeedKmH, warmupDurationMin);

  const cooldownSpeedKmH = Number((refSpeedKmH * 0.55).toFixed(1));
  const cooldownPaceMinPerKm = speedToPace(cooldownSpeedKmH);
  const cooldownDurationMin = 3.0;
  const cooldownDistanceKm = calculateBlockDistanceKm(cooldownSpeedKmH, cooldownDurationMin);

  const totalDistKm = Number((warmupDistanceKm + mainDistanceKm + cooldownDistanceKm).toFixed(2));
  const totalDurMin = Number((warmupDurationMin + mainDurationMin + cooldownDurationMin).toFixed(2));
  const avgSpeedKmH = Number(((totalDistKm / (totalDurMin / 60))).toFixed(2));
  const avgPaceMinPerKm = speedToPace(avgSpeedKmH);

  const steps: WorkoutStep[] = [
    {
      id: `${sessionId}_warmup`,
      name: 'Aquecimento Leve',
      type: 'warmup',
      durationSeconds: Math.round(warmupDurationMin * 60),
      targetSpeedKmH: warmupSpeedKmH,
      targetPaceMinPerKm: warmupPaceMinPerKm,
      intensityDescription: 'Ritmo Muito Leve (Z1)',
      instructions: 'Trote suave para aquecer a musculatura e elevar os batimentos gradualmente.',
    },
    {
      id: `${sessionId}_main`,
      name: `Bloco Principal (${mainDistanceKm} km)`,
      type: 'work',
      durationSeconds: Math.round(mainDurationMin * 60),
      targetSpeedKmH: mainSpeedKmH,
      targetPaceMinPerKm: mainPaceMinPerKm,
      intensityDescription: label,
      instructions: `Mantenha ritmo constante a ${mainSpeedKmH} km/h (${mainPaceMinPerKm}) durante os ${mainDistanceKm} km inteiros.`,
    },
    {
      id: `${sessionId}_cooldown`,
      name: 'Desaquecimento',
      type: 'cooldown',
      durationSeconds: Math.round(cooldownDurationMin * 60),
      targetSpeedKmH: cooldownSpeedKmH,
      targetPaceMinPerKm: cooldownPaceMinPerKm,
      intensityDescription: 'Trote ou Caminhada Leve',
      instructions: 'Desaceleração suave para retorno da frequência ao estado basal.',
    },
  ];

  const breakdown: WorkoutBlockBreakdown = {
    warmup: {
      durationMin: warmupDurationMin,
      speedKmH: warmupSpeedKmH,
      paceMinPerKm: warmupPaceMinPerKm,
      distanceKm: warmupDistanceKm,
      description: `${warmupDurationMin} min a ${warmupSpeedKmH} km/h (${warmupPaceMinPerKm})`,
    },
    main: {
      isInterval: false,
      description: `Corrida principal de ${mainDistanceKm} km em ${formatDurationMinutesSeconds(mainDurationMin)} min (${mainSpeedKmH} km/h | ${mainPaceMinPerKm})`,
      continuousDistanceKm: mainDistanceKm,
      continuousDurationMin: mainDurationMin,
      continuousSpeedKmH: mainSpeedKmH,
      continuousPaceMinPerKm: mainPaceMinPerKm,
    },
    cooldown: {
      durationMin: cooldownDurationMin,
      speedKmH: cooldownSpeedKmH,
      paceMinPerKm: cooldownPaceMinPerKm,
      distanceKm: cooldownDistanceKm,
      description: `${cooldownDurationMin} min a ${cooldownSpeedKmH} km/h (${cooldownPaceMinPerKm})`,
    },
    totalDurationMin: totalDurMin,
    totalDurationFormatted: formatDurationMinutesSeconds(totalDurMin),
    totalDistanceKm: totalDistKm,
    averageSpeedKmH: avgSpeedKmH,
    averagePaceMinPerKm: avgPaceMinPerKm,
  };

  const session: WorkoutSession = {
    id: sessionId,
    dayOfWeek,
    dayName,
    workoutType: type,
    title,
    objective,
    estimatedDistanceKm: totalDistKm,
    estimatedDurationMin: Math.round(totalDurMin),
    intensityDomain,
    intensityLabel: label,
    executionGuidance: `Corrida principal de ${mainDistanceKm} km no pace ${mainPaceMinPerKm} (${mainSpeedKmH} km/h). Tempo principal de ~${formatDurationMinutesSeconds(mainDurationMin)} min. Tempo total com aquecimento e desaquecimento: ${formatDurationMinutesSeconds(totalDurMin)} min (${totalDistKm} km).`,
    warmupMinutes: Math.round(warmupDurationMin),
    warmupDetails: `${warmupDurationMin} min a ${warmupSpeedKmH} km/h (${warmupPaceMinPerKm}) — ${warmupDistanceKm} km`,
    mainBlockDetails: `${mainDistanceKm} km em ${formatDurationMinutesSeconds(mainDurationMin)} min no pace ${mainPaceMinPerKm}`,
    recoveryDetails: 'Hidratação contínua e respiração cadenciada.',
    cooldownMinutes: Math.round(cooldownDurationMin),
    cooldownDetails: `${cooldownDurationMin} min a ${cooldownSpeedKmH} km/h (${cooldownPaceMinPerKm}) — ${cooldownDistanceKm} km`,
    steps,
    breakdown,
    isRestDay: false,
  };

  return validateWorkout(session).workout;
}

/**
 * Creates the Special SIMULADO Session (🏁 SIMULADO).
 * Positioned on the user-selected Simulado Day of the week.
 */
export function createSimuladoSession(
  sessionId: string,
  dayOfWeek: number,
  dayName: string,
  simuladoDistanceKm: number,
  refSpeedKmH: number,
  weekNumber: number,
  totalWeeks: number
): WorkoutSession {
  // Simulado pace is the target race pace (e.g. 85-92% vVO2max depending on distance)
  let pacePct = 0.85;
  if (simuladoDistanceKm <= 5) pacePct = 0.92;
  else if (simuladoDistanceKm <= 10) pacePct = 0.86;
  else if (simuladoDistanceKm <= 21) pacePct = 0.80;
  else pacePct = 0.74;

  const targetSpeedKmH = Number((refSpeedKmH * pacePct).toFixed(1));
  const targetPaceMinPerKm = speedToPace(targetSpeedKmH);
  const mainDurationMin = calculateBlockDurationMin(simuladoDistanceKm, targetSpeedKmH);

  // Warmup (8 min) and cooldown (5 min)
  const warmupSpeedKmH = Number((refSpeedKmH * 0.65).toFixed(1));
  const warmupPaceMinPerKm = speedToPace(warmupSpeedKmH);
  const warmupDurationMin = 8.0;
  const warmupDistanceKm = calculateBlockDistanceKm(warmupSpeedKmH, warmupDurationMin);

  const cooldownSpeedKmH = Number((refSpeedKmH * 0.55).toFixed(1));
  const cooldownPaceMinPerKm = speedToPace(cooldownSpeedKmH);
  const cooldownDurationMin = 5.0;
  const cooldownDistanceKm = calculateBlockDistanceKm(cooldownSpeedKmH, cooldownDurationMin);

  const totalDistKm = Number((warmupDistanceKm + simuladoDistanceKm + cooldownDistanceKm).toFixed(2));
  const totalDurMin = Number((warmupDurationMin + mainDurationMin + cooldownDurationMin).toFixed(2));
  const avgSpeedKmH = Number(((totalDistKm / (totalDurMin / 60))).toFixed(2));
  const avgPaceMinPerKm = speedToPace(avgSpeedKmH);

  const steps: WorkoutStep[] = [
    {
      id: `${sessionId}_warmup`,
      name: 'Aquecimento Pré-Simulado',
      type: 'warmup',
      durationSeconds: Math.round(warmupDurationMin * 60),
      targetSpeedKmH: warmupSpeedKmH,
      targetPaceMinPerKm: warmupPaceMinPerKm,
      intensityDescription: 'Ritmo Leve Progressivo (Z1/Z2)',
      instructions: '8 min de trote preparatório com 2 acelerações curtas de 15s para ativar as fibras rápidas.',
    },
    {
      id: `${sessionId}_simulado_main`,
      name: `🏁 SIMULADO (${simuladoDistanceKm} km Alvo)`,
      type: 'work',
      durationSeconds: Math.round(mainDurationMin * 60),
      targetSpeedKmH: targetSpeedKmH,
      targetPaceMinPerKm: targetPaceMinPerKm,
      intensityDescription: 'Ritmo de Prova Alvo (100% Especificidade)',
      instructions: `Corra os ${simuladoDistanceKm} km sustentando o pace de prova ${targetPaceMinPerKm} (${targetSpeedKmH} km/h). Simule hidratação e estratégia real de corrida.`,
    },
    {
      id: `${sessionId}_cooldown`,
      name: 'Desaquecimento Pós-Simulado',
      type: 'cooldown',
      durationSeconds: Math.round(cooldownDurationMin * 60),
      targetSpeedKmH: cooldownSpeedKmH,
      targetPaceMinPerKm: cooldownPaceMinPerKm,
      intensityDescription: 'Caminhada & Trote Regenerativo',
      instructions: 'Desaceleração completa. Hidratação com eletrólitos e alongamento suave.',
    },
  ];

  const breakdown: WorkoutBlockBreakdown = {
    warmup: {
      durationMin: warmupDurationMin,
      speedKmH: warmupSpeedKmH,
      paceMinPerKm: warmupPaceMinPerKm,
      distanceKm: warmupDistanceKm,
      description: `${warmupDurationMin} min aquecimento a ${warmupSpeedKmH} km/h (${warmupPaceMinPerKm})`,
    },
    main: {
      isInterval: false,
      description: `🏁 SIMULADO DE ${simuladoDistanceKm} KM NO RITMO ALVO (${targetSpeedKmH} km/h | ${targetPaceMinPerKm})`,
      continuousDistanceKm: simuladoDistanceKm,
      continuousDurationMin: mainDurationMin,
      continuousSpeedKmH: targetSpeedKmH,
      continuousPaceMinPerKm: targetPaceMinPerKm,
    },
    cooldown: {
      durationMin: cooldownDurationMin,
      speedKmH: cooldownSpeedKmH,
      paceMinPerKm: cooldownPaceMinPerKm,
      distanceKm: cooldownDistanceKm,
      description: `${cooldownDurationMin} min volta à calma a ${cooldownSpeedKmH} km/h (${cooldownPaceMinPerKm})`,
    },
    totalDurationMin: totalDurMin,
    totalDurationFormatted: formatDurationMinutesSeconds(totalDurMin),
    totalDistanceKm: totalDistKm,
    averageSpeedKmH: avgSpeedKmH,
    averagePaceMinPerKm: avgPaceMinPerKm,
  };

  const session: WorkoutSession = {
    id: sessionId,
    dayOfWeek,
    dayName,
    workoutType: 'corrida_continua',
    title: `🏁 SIMULADO DE PROVA (${simuladoDistanceKm} km)`,
    objective: `Testar estratégia de prova, tolerância ao ritmo ${targetPaceMinPerKm} e validação da capacidade aeróbia.`,
    estimatedDistanceKm: totalDistKm,
    estimatedDurationMin: Math.round(totalDurMin),
    intensityDomain: 'pesado',
    intensityLabel: 'Ritmo Específico de Prova',
    executionGuidance: `Sessão chave da semana. Execute ${simuladoDistanceKm} km de corrida contínua no ritmo alvo ${targetPaceMinPerKm} (${targetSpeedKmH} km/h). Tempo de prova estimado em ${formatDurationMinutesSeconds(mainDurationMin)} min. Tempo total da sessão com aquecimento e desaquecimento: ${formatDurationMinutesSeconds(totalDurMin)} min (${totalDistKm} km).`,
    warmupMinutes: Math.round(warmupDurationMin),
    warmupDetails: `${warmupDurationMin} min de trote leve preparatório (${warmupDistanceKm} km)`,
    mainBlockDetails: `🏁 ${simuladoDistanceKm} km no ritmo de prova (${targetSpeedKmH} km/h | ${targetPaceMinPerKm})`,
    recoveryDetails: 'Recuperação com reposição hídrica e sono reparador.',
    cooldownMinutes: Math.round(cooldownDurationMin),
    cooldownDetails: `${cooldownDurationMin} min de trote suave e caminhada (${cooldownDistanceKm} km)`,
    steps,
    breakdown,
    isSimulado: true,
    simuladoTargetDistanceKm: simuladoDistanceKm,
    isRestDay: false,
  };

  return validateWorkout(session).workout;
}

/**
 * Creates a Rest/Recovery session.
 */
export function createRestSession(
  sessionId: string,
  dayOfWeek: number,
  dayName: string
): WorkoutSession {
  return {
    id: sessionId,
    dayOfWeek,
    dayName,
    workoutType: 'recuperacao',
    title: 'Descanso / Recuperação Passiva',
    objective: 'Recuperação dos estoques de glicogênio, reparação muscular e assimilação da carga.',
    estimatedDistanceKm: 0,
    estimatedDurationMin: 0,
    intensityDomain: 'recuperacao',
    intensityLabel: 'Descanso Total',
    executionGuidance: 'Permita que o corpo absorva o estímulo dos treinos anteriores. Priorize sono e hidratação.',
    warmupMinutes: 0,
    warmupDetails: 'Sem atividade de corrida programada.',
    mainBlockDetails: 'Dia livre para regeneração passiva ou mobilidade leve opcional.',
    recoveryDetails: 'Boa hidratação e sono reparador.',
    cooldownMinutes: 0,
    cooldownDetails: '',
    steps: [],
    isRestDay: true,
  };
}

/**
 * Creates a single weekly microcycle with exact block-by-block sessions,
 * reorganized strictly around the user's chosen Simulado Day.
 */
export function generateWeeklyMicrocycle(
  weekNumber: number,
  totalWeeks: number,
  baseVolumeKm: number,
  profile: UserProfile,
  refSpeedKmH: number = 10.0
): WeeklyMicrocycle {
  const isDeload = weekNumber % 4 === 0 && weekNumber < totalWeeks;

  // Determine Phase
  let phaseName: 'Base' | 'Desenvolvimento' | 'Específica' | 'Polimento / Taper' = 'Base';
  if (totalWeeks >= 8) {
    const fraction = weekNumber / totalWeeks;
    if (fraction <= 0.35) phaseName = 'Base';
    else if (fraction <= 0.70) phaseName = 'Desenvolvimento';
    else if (fraction <= 0.90) phaseName = 'Específica';
    else phaseName = 'Polimento / Taper';
  } else if (totalWeeks === 4) {
    if (weekNumber === 1) phaseName = 'Base';
    else if (weekNumber === 2) phaseName = 'Desenvolvimento';
    else if (weekNumber === 3) phaseName = 'Específica';
    else phaseName = 'Polimento / Taper';
  } else {
    phaseName = weekNumber === totalWeeks ? 'Polimento / Taper' : 'Desenvolvimento';
  }

  const simuladoDay = profile.simuladoDayOfWeek ?? 6; // Default to Saturday if undefined
  const activeDays = getDistributedDaysWithSimulado(
    profile.weeklyFrequency,
    simuladoDay,
    profile.preferredDays
  );

  // Target distance in km
  let targetRaceDistKm = 10;
  if (profile.targetDistance === '5km') targetRaceDistKm = 5;
  else if (profile.targetDistance === '10km') targetRaceDistKm = 10;
  else if (profile.targetDistance === '21km') targetRaceDistKm = 21.1;
  else if (profile.targetDistance === '42km') targetRaceDistKm = 42.2;
  else if (profile.targetDistance === 'outro' && profile.customDistanceKm) {
    targetRaceDistKm = profile.customDistanceKm;
  }

  // Simulado distance strictly matches the user's chosen target distance across all weeks
  const simuladoDistanceKm = targetRaceDistKm;

  const sessions: WorkoutSession[] = [];
  let qualityPlaced = false;

  for (let day = 0; day < 7; day++) {
    const dayName = DAY_NAMES[day];
    const isRunningDay = activeDays.includes(day);

    if (!isRunningDay) {
      sessions.push(createRestSession(`w${weekNumber}_d${day}_rest`, day, dayName));
      continue;
    }

    // 1. If it's the Simulado Day
    if (day === simuladoDay) {
      sessions.push(
        createSimuladoSession(
          `w${weekNumber}_d${day}_simulado`,
          day,
          dayName,
          simuladoDistanceKm,
          refSpeedKmH,
          weekNumber,
          totalWeeks
        )
      );
      continue;
    }

    // 2. Day before Simulado: MUST BE LIGHT / RECOVERY (Rule 15 & 16)
    const isDayBeforeSimulado = (day + 1) % 7 === simuladoDay;
    if (isDayBeforeSimulado) {
      sessions.push(
        createContinuousSession(
          `w${weekNumber}_d${day}_prep`,
          day,
          dayName,
          3.0,
          refSpeedKmH,
          'corrida_leve'
        )
      );
      continue;
    }

    // 3. Quality Session (Intervals or Limiar) placed 2-3 days before Simulado
    if (!qualityPlaced && profile.weeklyFrequency >= 2) {
      if (profile.level === 'iniciante' || targetRaceDistKm <= 10) {
        sessions.push(
          createIntervalSession(
            `w${weekNumber}_d${day}_interval`,
            day,
            dayName,
            refSpeedKmH,
            profile.level,
            profile.targetDistance,
            weekNumber % 3
          )
        );
      } else {
        // Longer distance: Continuous moderate or Limiar
        sessions.push(
          createContinuousSession(
            `w${weekNumber}_d${day}_mod`,
            day,
            dayName,
            Math.max(4, Math.round(targetRaceDistKm * 0.4)),
            refSpeedKmH,
            'corrida_moderada'
          )
        );
      }
      qualityPlaced = true;
      continue;
    }

    // 4. Remaining days: Continuous base or light run
    const baseDist = profile.level === 'iniciante' ? 3.0 : profile.level === 'intermediario' ? 5.0 : 7.0;
    sessions.push(
      createContinuousSession(
        `w${weekNumber}_d${day}_base`,
        day,
        dayName,
        baseDist,
        refSpeedKmH,
        'corrida_continua'
      )
    );
  }

  // Calculate real mathematical totals by summing the validated sessions
  const targetVolumeKm = Number(
    sessions.reduce((sum, s) => sum + (s.estimatedDistanceKm || 0), 0).toFixed(2)
  );
  const targetDurationMin = Math.round(
    sessions.reduce((sum, s) => sum + (s.estimatedDurationMin || 0), 0)
  );

  return {
    weekNumber,
    phaseName,
    focus: isDeload
      ? 'Consolidação e Recuperação Estrutural'
      : `${phaseName} — Foco em Simulado de ${simuladoDistanceKm} km`,
    targetVolumeKm,
    targetDurationMin,
    sessions,
    isDeloadWeek: isDeload,
  };
}

/**
 * Creates the entire multi-week periodized plan strictly based on validated mathematical sessions.
 */
export function createTrainingPlan(
  profile: UserProfile,
  refVo2max?: number,
  refSpeedKmH?: number
): TrainingPlan {
  // Plan standardized to 4 weeks (monthly mesocycle for monthly VO2 re-evaluations)
  const totalWeeks = 4;

  const baseVolume = getBaselineWeeklyVolume(profile);
  const effectiveRefSpeed = refSpeedKmH && refSpeedKmH > 0 ? refSpeedKmH : 10.0;

  const weeks: WeeklyMicrocycle[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    weeks.push(generateWeeklyMicrocycle(w, totalWeeks, baseVolume, profile, effectiveRefSpeed));
  }

  let targetDistanceKm = 10;
  if (profile.targetDistance === '5km') targetDistanceKm = 5;
  else if (profile.targetDistance === '10km') targetDistanceKm = 10;
  else if (profile.targetDistance === '21km') targetDistanceKm = 21.1;
  else if (profile.targetDistance === '42km') targetDistanceKm = 42.2;
  else if (profile.targetDistance === 'outro' && profile.customDistanceKm) {
    targetDistanceKm = profile.customDistanceKm;
  }

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runnerId: profile.id,
    targetDistance: profile.targetDistance,
    targetDistanceKm,
    totalWeeks,
    currentWeekIndex: 0,
    weeks,
    referenceVo2max: refVo2max,
    referenceSpeedKmH: effectiveRefSpeed,
    targetRaceDate: profile.targetDate,
    simuladoDayOfWeek: profile.simuladoDayOfWeek ?? 6,
  };
}

/**
 * Top-level macrocycle generator entry point.
 */
export const generateMacrocyclePlan = (
  profile: UserProfile,
  latestTest?: {
    vo2max?: number;
    incrementalMaxSpeedKmH?: number;
    cooperDistanceMeters?: number;
    cooperAvgSpeedKmH?: number;
    protocol?: string;
  } | null
): TrainingPlan => {
  let refSpeed: number | undefined;
  if (latestTest) {
    if (latestTest.incrementalMaxSpeedKmH && latestTest.incrementalMaxSpeedKmH > 0) {
      refSpeed = latestTest.incrementalMaxSpeedKmH;
    } else if (latestTest.cooperAvgSpeedKmH && latestTest.cooperAvgSpeedKmH > 0) {
      refSpeed = latestTest.cooperAvgSpeedKmH;
    } else if (latestTest.cooperDistanceMeters && latestTest.cooperDistanceMeters > 0) {
      refSpeed = Number((latestTest.cooperDistanceMeters / 200).toFixed(1));
    } else if (latestTest.vo2max && latestTest.vo2max > 0) {
      refSpeed = Number((latestTest.vo2max / 3.5).toFixed(1));
    }
  }

  return createTrainingPlan(profile, latestTest?.vo2max, refSpeed);
};
