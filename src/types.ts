export type Gender = 'masculino' | 'feminino';

export type RunnerLevel = 'iniciante' | 'intermediario' | 'avancado';

export type WeeklyFrequency = 1 | 2 | 3 | 4 | 5 | 6;

export type TargetDistance = '5km' | '10km' | '21km' | '42km' | 'outro';

export type TargetGoalType = 'completar' | 'melhorar_tempo' | 'tempo_especifico';

export type RunningExperience =
  | 'comecei_agora'
  | 'menos_3_meses'
  | '3_6_meses'
  | '6_12_meses'
  | '1_2_anos'
  | 'mais_2_anos';

export interface UserProfile {
  id: string;
  name: string;
  birthDate?: string; // YYYY-MM-DD
  age: number;
  gender: Gender;
  level: RunnerLevel;
  weeklyFrequency: WeeklyFrequency;
  preferredDays: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  simuladoDayOfWeek: number; // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
  
  // History
  experience: RunningExperience;
  maxRecentDistanceKm?: number;
  bestRecentDistance?: string;
  bestRecentTime?: string; // e.g. "00:25:30"
  
  // Health & Limitations
  hasHealthCondition: boolean;
  healthConditionDetails?: string;
  hasPain: boolean;
  painLocations: string[]; // 'joelho' | 'quadril' | 'tornozelo' | 'pe' | 'coluna' | 'outro'
  
  // Goal
  targetDistance: TargetDistance;
  customDistanceKm?: number;
  goalType: TargetGoalType;
  targetTime?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  hasTargetDate: boolean;
  targetDate?: string; // YYYY-MM-DD
  
  // Terms & Creation
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function calculateAgeFromBirthDate(birthDateStr?: string): number {
  if (!birthDateStr) return 30;
  const today = new Date();
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 30;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
}

export type VO2Protocol = 'incremental' | 'cooper';

export type VO2Classification =
  | 'Muito fraca'
  | 'Fraca'
  | 'Regular'
  | 'Boa'
  | 'Excelente';

export interface VO2TestRecord {
  id: string;
  date: string; // ISO string
  protocol: VO2Protocol;
  vo2max: number; // ml/kg/min rounded to 2 decimals
  classification: VO2Classification;
  
  // Protocol specific details
  incrementalMaxSpeedKmH?: number;
  cooperDistanceMeters?: number;
  cooperPaceMinPerKm?: string;
  cooperAvgSpeedKmH?: number;
  
  // Subjective & vitals
  maxHeartRate?: number;
  avgHeartRate?: number;
  rpe?: number; // 1-10
  subjectiveFeel?: string;
  inclinePercent?: number;
  completedFullStages?: number;
  notes?: string;
}

export type WorkoutType =
  | 'corrida_leve'
  | 'corrida_continua'
  | 'corrida_moderada'
  | 'treino_intervalado'
  | 'fartlek'
  | 'treino_limiar'
  | 'longao'
  | 'recuperacao'
  | 'forca'
  | 'educativos'
  | 'mobilidade'
  | 'estabilidade';

export type IntensityDomain = 'moderado' | 'pesado' | 'severo' | 'recuperacao';

export interface WorkoutStep {
  id: string;
  name: string;
  type: 'warmup' | 'work' | 'recovery' | 'cooldown';
  durationSeconds: number;
  targetSpeedKmH?: number;
  targetPaceMinPerKm?: string;
  intensityDescription: string;
  percentVO2?: number;
  instructions: string;
}

export interface WorkoutBlockBreakdown {
  warmup: {
    durationMin: number;
    speedKmH: number;
    paceMinPerKm: string;
    distanceKm: number;
    description: string;
  };
  main: {
    isInterval: boolean;
    description: string;
    // For intervals
    repsCount?: number;
    workDurationMin?: number;
    workSpeedKmH?: number;
    workPaceMinPerKm?: string;
    workDistanceKm?: number; // total of all reps
    recoveriesCount?: number;
    recoveryDurationMin?: number;
    recoverySpeedKmH?: number;
    recoveryPaceMinPerKm?: string;
    recoveryDistanceKm?: number; // total of all recoveries
    intervalIntensityLabel?: string;
    // For continuous
    continuousDistanceKm?: number;
    continuousDurationMin?: number;
    continuousSpeedKmH?: number;
    continuousPaceMinPerKm?: string;
  };
  cooldown: {
    durationMin: number;
    speedKmH: number;
    paceMinPerKm: string;
    distanceKm: number;
    description: string;
  };
  // Math totals (strictly calculated block by block)
  totalDurationMin: number;
  totalDurationFormatted: string; // e.g. "27:00" or "46:18"
  totalDistanceKm: number;
  averageSpeedKmH: number;
  averagePaceMinPerKm: string;
}

export interface WorkoutSession {
  id: string;
  dayOfWeek: number; // 0 to 6
  dayName: string; // 'Segunda-feira', etc.
  workoutType: WorkoutType;
  title: string;
  objective: string;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  intensityDomain: IntensityDomain;
  intensityLabel: string;
  executionGuidance: string;
  
  // Mathematical Block-by-Block Transparency Breakdown
  breakdown?: WorkoutBlockBreakdown;
  
  // Simulado Special Flag
  isSimulado?: boolean;
  simuladoTargetDistanceKm?: number;
  
  // Structure
  warmupMinutes: number;
  warmupDetails: string;
  mainBlockDetails: string;
  recoveryDetails: string;
  cooldownMinutes: number;
  cooldownDetails: string;
  
  // Live steps for execution player
  steps: WorkoutStep[];
  
  // Interval model info if applicable
  intervalModelName?: string;
  
  // Status in the plan
  isCompleted?: boolean;
  isRestDay?: boolean;
}

export interface WeeklyMicrocycle {
  weekNumber: number;
  phaseName: 'Base' | 'Desenvolvimento' | 'Específica' | 'Polimento / Taper';
  focus: string;
  targetVolumeKm: number;
  targetDurationMin: number;
  sessions: WorkoutSession[];
  isDeloadWeek?: boolean;
  notes?: string;
}

export interface TrainingPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  runnerId: string;
  targetDistance: TargetDistance;
  targetDistanceKm: number;
  totalWeeks: number;
  currentWeekIndex: number;
  weeks: WeeklyMicrocycle[];
  referenceVo2max?: number;
  referenceSpeedKmH?: number;
  targetRaceDate?: string;
  simuladoDayOfWeek?: number;
}

export interface CheckInAssessment {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  workoutId?: string;
  
  // 6 Questions
  wakeUpState: 'otimo' | 'bem' | 'normal' | 'cansado' | 'destruido';
  sleepQuality: 'muito_bem' | 'bem' | 'mais_ou_menos' | 'dormi_mal';
  hydration: 'bem_hidratado' | 'moderada' | 'pouca';
  nutrition: 'bem_alimentado' | 'normal' | 'comi_pouco' | 'comi_mal';
  painLevel: 'nenhuma' | 'leve' | 'moderada' | 'forte';
  painLocation?: string;
  mentalState: 'focado' | 'normal' | 'estressado' | 'muito_estressado';
  
  // Deterministic Output
  readinessScore: number; // 0 to 100
  coachMessage: string;
  coachRecommendation: string;
  trainingAdjustment: 'normal' | 'reduzir_volume' | 'corrida_leve' | 'recuperacao' | 'adiar';
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO
  workoutId: string;
  weekNumber: number;
  completed: 'sim' | 'parcialmente' | 'nao';
  actualDurationMin: number;
  actualDistanceKm: number;
  rpe: number; // 1 to 10
  feltPain: boolean;
  painLocation?: string;
  notes?: string;
  adjustedDueToCheckIn: boolean;
}

export interface AppSettings {
  audioCues: boolean;
  vibration: boolean;
  autoSaveIntervalSec: number;
}
