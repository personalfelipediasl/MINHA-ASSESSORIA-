import { WorkoutType, IntensityDomain } from '../types';

export interface IntervalModelDefinition {
  id: string;
  name: string;
  code: string; // "4x3", "2x1", etc.
  description: string;
  targetIntensityPercentVO2: string; // e.g. "80–90%"
  recoveryIntensityPercentVO2?: string; // e.g. "50–60%"
  seriesCount: number | string;
  workDurationSec: number;
  recoveryDurationSec: number;
  minLevel: 'iniciante' | 'intermediario' | 'avancado';
  bestForDistances: ('5km' | '10km' | '21km' | '42km')[];
}

export const INTERVAL_MODELS: IntervalModelDefinition[] = [
  {
    id: 'model_1_4x3',
    name: 'Modelo 1: 4x3 Minutos',
    code: '4X3',
    description: '4 min a 80–90% vVO₂max com 3 min de recuperação ativa.',
    targetIntensityPercentVO2: '80–90%',
    recoveryIntensityPercentVO2: '50–60%',
    seriesCount: 3,
    workDurationSec: 240,
    recoveryDurationSec: 180,
    minLevel: 'iniciante',
    bestForDistances: ['5km', '10km', '21km', '42km'],
  },
  {
    id: 'model_2_2x1',
    name: 'Modelo 2: 2x1 Minutos',
    code: '2X1',
    description: '2 min a 90–100% vVO₂max com 1 min a 50–60%.',
    targetIntensityPercentVO2: '90–100%',
    recoveryIntensityPercentVO2: '50–60%',
    seriesCount: 6,
    workDurationSec: 120,
    recoveryDurationSec: 60,
    minLevel: 'intermediario',
    bestForDistances: ['5km', '10km', '21km'],
  },
  {
    id: 'model_3_1x2',
    name: 'Modelo 3: 1x2 Minutos',
    code: '1X2',
    description: '1 min a 90–100% vVO₂max com 2 min a 50–60%.',
    targetIntensityPercentVO2: '90–100%',
    recoveryIntensityPercentVO2: '50–60%',
    seriesCount: 7,
    workDurationSec: 60,
    recoveryDurationSec: 120,
    minLevel: 'iniciante',
    bestForDistances: ['5km', '10km'],
  },
  {
    id: 'model_4_10x50',
    name: 'Modelo 4: 10x50 Segundos',
    code: '10X50',
    description: '10 segundos a 100–110% vVO₂max com 50 segundos a 40–50%.',
    targetIntensityPercentVO2: '100–110%',
    recoveryIntensityPercentVO2: '40–50%',
    seriesCount: 14,
    workDurationSec: 10,
    recoveryDurationSec: 50,
    minLevel: 'iniciante',
    bestForDistances: ['5km', '10km', '21km'],
  },
  {
    id: 'model_5_15x15',
    name: 'Modelo 5: 15x15 Segundos',
    code: '15X15',
    description: '15 segundos a 110% vVO₂max com 15 segundos a 40–50%. Apenas atletas treinados.',
    targetIntensityPercentVO2: '110%',
    recoveryIntensityPercentVO2: '40–50%',
    seriesCount: 16,
    workDurationSec: 15,
    recoveryDurationSec: 15,
    minLevel: 'avancado',
    bestForDistances: ['5km', '10km'],
  },
  {
    id: 'model_6_30x30',
    name: 'Modelo 6: 30x30 Segundos',
    code: '30X30',
    description: '30 segundos a 90–100% vVO₂max com 30 segundos a 50%.',
    targetIntensityPercentVO2: '90–100%',
    recoveryIntensityPercentVO2: '50%',
    seriesCount: 12,
    workDurationSec: 30,
    recoveryDurationSec: 30,
    minLevel: 'intermediario',
    bestForDistances: ['5km', '10km', '21km'],
  },
];

export interface ComplementaryRoutine {
  type: 'forca' | 'mobilidade' | 'estabilidade' | 'educativos' | 'pliometria';
  title: string;
  durationMin: number;
  exercises: {
    name: string;
    setsAndReps: string;
    focus: string;
  }[];
}

export const COMPLEMENTARY_ROUTINES: Record<string, ComplementaryRoutine> = {
  forca: {
    type: 'forca',
    title: 'Fortalecimento Específico para Corredores',
    durationMin: 20,
    exercises: [
      { name: 'Afundo Unilateral / Split Squat', setsAndReps: '3x 8-10 cada lado', focus: 'Estabilidade pélvica e força unilateral de quadríceps/glúteo' },
      { name: 'Elevação Pélvica Unipodal (Ponte)', setsAndReps: '3x 10-12 cada lado', focus: 'Glúteo máximo e isquiotibiais' },
      { name: 'Panturrilha em degrau (unilateral)', setsAndReps: '3x 12-15 cada perna', focus: 'Tríceps sural e tendão de Aquiles' },
      { name: 'Prancha Frontal com sustentação', setsAndReps: '3x 30-45s', focus: 'Core e anti-extensão lombar' },
    ],
  },
  mobilidade: {
    type: 'mobilidade',
    title: 'Mobilidade & Estabilidade Articular',
    durationMin: 12,
    exercises: [
      { name: 'Mobilidade de Tornozelo na parede (Dorsiflexão)', setsAndReps: '2x 10 repetições cada lado', focus: 'Amplitude de tornozelo na passada' },
      { name: 'Mobilidade de Quadril 90/90', setsAndReps: '2x 8 rotações', focus: 'Rotação interna e externa coxofemoral' },
      { name: 'Alongamento Dinâmico de Flexores de Quadril', setsAndReps: '2x 30s cada lado', focus: 'Abertura de passada' },
      { name: 'Liberação / Ativação de Pés e Fáscia Plantar', setsAndReps: '2x 1min', focus: 'Propriocepção e absorção de impacto' },
    ],
  },
  educativos: {
    type: 'educativos',
    title: 'Educativos de Corrida (Técnica & Economia)',
    durationMin: 10,
    exercises: [
      { name: 'Skipping Baixo (Anfersen)', setsAndReps: '3x 20 metros', focus: 'Frequência de passada e ponta de pé' },
      { name: 'Hop / Saltitamento unipodal baixo', setsAndReps: '3x 15 metros cada perna', focus: 'Rigidez elástica do tendão' },
      { name: 'Kick-out / Dribling', setsAndReps: '3x 20 metros', focus: 'Ciclo anterior e postura ereta' },
    ],
  },
};
