import { VO2TestRecord, UserProfile, TargetDistance } from '../types';
import { speedToPace, paceToSpeed } from './vo2Calculator';

export interface TrainingPaceZone {
  zone: string; // 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
  shortName: string;
  name: string;
  tagline: string;
  percentVAM: string;
  speedRangeKmH: string;
  paceRangeMinPerKm: string;
  paceRangeClean: string;
  targetPaceFormatted: string;
  targetSpeedKmH: number;
  heartRatePercent: string;
  hrPercentClean: string;
  estimatedHR: string;
  hrRangeClean: string;
  purpose: string;
  description: string;
  color: string;
  bgBadgeColor: string;
}

export interface RacePaceTarget {
  distanceLabel: string;
  distanceKm: number;
  targetPaceMinPerKm: string;
  targetSpeedKmH: number;
  estimatedTimeFormatted: string;
  estimatedTimeMinutes: number;
  effortDescription: string;
}

/**
 * Calculates Maximum Heart Rate using the Tanaka et al. equation:
 * HRmax = 208 - (0.7 * Age)
 */
export function calculateTanakaMaxHR(age: number): number {
  const safeAge = Math.max(15, Math.min(95, age || 30));
  return Math.round(208 - 0.7 * safeAge);
}

/**
 * Derives VAM (Velocidade Aeróbica Máxima in km/h) from VO2max or test protocol.
 */
export function getVAMFromTest(test: VO2TestRecord | null | undefined): number {
  if (!test) return 10.0;

  if (test.protocol === 'incremental' && test.incrementalMaxSpeedKmH && test.incrementalMaxSpeedKmH > 0) {
    return Number(test.incrementalMaxSpeedKmH.toFixed(1));
  }

  if (test.protocol === 'cooper' && test.cooperDistanceMeters && test.cooperDistanceMeters > 0) {
    return Number((test.cooperDistanceMeters / 200).toFixed(1));
  }

  if (test.vo2max && test.vo2max > 0) {
    return Number((test.vo2max / 3.5).toFixed(1));
  }

  return 10.0;
}

/**
 * Generates simplified and scientifically calibrated training pace zones.
 */
export function calculatePaceZones(
  test: VO2TestRecord | null | undefined,
  age: number = 30
): TrainingPaceZone[] {
  const vam = getVAMFromTest(test);
  const maxHR = calculateTanakaMaxHR(age);

  // Z1: 58% - 68% VAM
  const z1MinSpeed = Number((vam * 0.58).toFixed(1));
  const z1MaxSpeed = Number((vam * 0.68).toFixed(1));
  const z1MidSpeed = Number((vam * 0.63).toFixed(1));

  // Z2: 68% - 78% VAM
  const z2MinSpeed = Number((vam * 0.68).toFixed(1));
  const z2MaxSpeed = Number((vam * 0.78).toFixed(1));
  const z2MidSpeed = Number((vam * 0.73).toFixed(1));

  // Z3: 78% - 86% VAM
  const z3MinSpeed = Number((vam * 0.78).toFixed(1));
  const z3MaxSpeed = Number((vam * 0.86).toFixed(1));
  const z3MidSpeed = Number((vam * 0.82).toFixed(1));

  // Z4: 86% - 94% VAM
  const z4MinSpeed = Number((vam * 0.86).toFixed(1));
  const z4MaxSpeed = Number((vam * 0.94).toFixed(1));
  const z4MidSpeed = Number((vam * 0.90).toFixed(1));

  // Z5: 95% - 105% VAM
  const z5MinSpeed = Number((vam * 0.95).toFixed(1));
  const z5MaxSpeed = Number((vam * 1.05).toFixed(1));
  const z5MidSpeed = Number((vam * 1.00).toFixed(1));

  return [
    {
      zone: 'Z1',
      shortName: 'Regenerativo',
      name: 'Regenerativo / Recuperação',
      tagline: 'Trote leve • Conversação livre',
      percentVAM: '58% - 68% VAM',
      speedRangeKmH: `${z1MinSpeed} - ${z1MaxSpeed} km/h`,
      paceRangeMinPerKm: `${speedToPace(z1MaxSpeed)} a ${speedToPace(z1MinSpeed)}`,
      paceRangeClean: `${speedToPace(z1MaxSpeed)} - ${speedToPace(z1MinSpeed)}`,
      targetPaceFormatted: speedToPace(z1MidSpeed),
      targetSpeedKmH: z1MidSpeed,
      heartRatePercent: '< 70% FCmax',
      hrPercentClean: '< 70%',
      estimatedHR: `< ${Math.round(maxHR * 0.70)} bpm`,
      hrRangeClean: `< ${Math.round(maxHR * 0.70)} bpm`,
      purpose: 'Recuperação muscular ativa e circulação sanguínea.',
      description: 'Ritmo super leve, sem cansaço muscular ou ofego. Ideal para o dia seguinte a treinos duros.',
      color: '#3B82F6', // Blue
      bgBadgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    },
    {
      zone: 'Z2',
      shortName: 'Rodagem (Base)',
      name: 'Rodagem / Base Aeróbia',
      tagline: 'Ritmo confortável • Queima de gordura',
      percentVAM: '68% - 78% VAM',
      speedRangeKmH: `${z2MinSpeed} - ${z2MaxSpeed} km/h`,
      paceRangeMinPerKm: `${speedToPace(z2MaxSpeed)} a ${speedToPace(z2MinSpeed)}`,
      paceRangeClean: `${speedToPace(z2MaxSpeed)} - ${speedToPace(z2MinSpeed)}`,
      targetPaceFormatted: speedToPace(z2MidSpeed),
      targetSpeedKmH: z2MidSpeed,
      heartRatePercent: '70% - 80% FCmax',
      hrPercentClean: '70% - 80%',
      estimatedHR: `${Math.round(maxHR * 0.70)} - ${Math.round(maxHR * 0.80)} bpm`,
      hrRangeClean: `${Math.round(maxHR * 0.70)} - ${Math.round(maxHR * 0.80)} bpm`,
      purpose: 'Construção da base aeróbia, coração e resistência mitocondrial.',
      description: 'O ritmo onde você deve passar 80% do seu volume. Confortável, sustentável por horas.',
      color: '#10B981', // Green
      bgBadgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      zone: 'Z3',
      shortName: 'Moderado',
      name: 'Ritmo Maratona / Moderado',
      tagline: 'Ritmo firme • Respiração rítmica',
      percentVAM: '78% - 86% VAM',
      speedRangeKmH: `${z3MinSpeed} - ${z3MaxSpeed} km/h`,
      paceRangeMinPerKm: `${speedToPace(z3MaxSpeed)} a ${speedToPace(z3MinSpeed)}`,
      paceRangeClean: `${speedToPace(z3MaxSpeed)} - ${speedToPace(z3MinSpeed)}`,
      targetPaceFormatted: speedToPace(z3MidSpeed),
      targetSpeedKmH: z3MidSpeed,
      heartRatePercent: '80% - 88% FCmax',
      hrPercentClean: '80% - 88%',
      estimatedHR: `${Math.round(maxHR * 0.80)} - ${Math.round(maxHR * 0.88)} bpm`,
      hrRangeClean: `${Math.round(maxHR * 0.80)} - ${Math.round(maxHR * 0.88)} bpm`,
      purpose: 'Economia de corrida e sustentação de prova longa.',
      description: 'Ritmo firme e constante. Você consegue falar frases curtas, mas exige concentração contínua.',
      color: '#F59E0B', // Amber
      bgBadgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      zone: 'Z4',
      shortName: 'Limiar (Tempo)',
      name: 'Limiar Anaeróbio / Tempo Run',
      tagline: 'Confortavelmente duro • Limiar de lactato',
      percentVAM: '86% - 94% VAM',
      speedRangeKmH: `${z4MinSpeed} - ${z4MaxSpeed} km/h`,
      paceRangeMinPerKm: `${speedToPace(z4MaxSpeed)} a ${speedToPace(z4MinSpeed)}`,
      paceRangeClean: `${speedToPace(z4MaxSpeed)} - ${speedToPace(z4MinSpeed)}`,
      targetPaceFormatted: speedToPace(z4MidSpeed),
      targetSpeedKmH: z4MidSpeed,
      heartRatePercent: '88% - 94% FCmax',
      hrPercentClean: '88% - 94%',
      estimatedHR: `${Math.round(maxHR * 0.88)} - ${Math.round(maxHR * 0.94)} bpm`,
      hrRangeClean: `${Math.round(maxHR * 0.88)} - ${Math.round(maxHR * 0.94)} bpm`,
      purpose: 'Aumentar a velocidade que você suporta sem acumular ácido lático.',
      description: 'Esforço de prova de 10km. Respiração pesada e focada. Não permite conversar.',
      color: '#FF5500', // Orange Accent
      bgBadgeColor: 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/30',
    },
    {
      zone: 'Z5',
      shortName: 'Tiros (VO₂max)',
      name: 'Tiros VO₂max / Potência',
      tagline: 'Esforço máximo • Velocidade & Potência',
      percentVAM: '95% - 105% VAM',
      speedRangeKmH: `${z5MinSpeed} - ${z5MaxSpeed} km/h`,
      paceRangeMinPerKm: `${speedToPace(z5MaxSpeed)} a ${speedToPace(z5MinSpeed)}`,
      paceRangeClean: `${speedToPace(z5MaxSpeed)} - ${speedToPace(z5MinSpeed)}`,
      targetPaceFormatted: speedToPace(z5MidSpeed),
      targetSpeedKmH: z5MidSpeed,
      heartRatePercent: '> 95% FCmax',
      hrPercentClean: '> 95%',
      estimatedHR: `> ${Math.round(maxHR * 0.95)} bpm`,
      hrRangeClean: `> ${Math.round(maxHR * 0.95)} bpm`,
      purpose: 'Atingir o consumo máximo de oxigênio e potência mecânica.',
      description: 'Tiros intervalados de 1 a 4 minutos em ritmo máximo com intervalos de descanso.',
      color: '#EF4444', // Red
      bgBadgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
  ];
}

/**
 * Format minutes to HH:MM:SS or MM:SS string
 */
export function formatRaceTime(totalMinutes: number): string {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) return '--:--';
  const totalSeconds = Math.round(totalMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const minStr = minutes < 10 && hours > 0 ? `0${minutes}` : `${minutes}`;

  if (hours > 0) {
    return `${hours}h ${minStr}m`;
  }
  return `${minStr}m ${secStr}s`;
}

/**
 * Calculates scientifically projected race paces using Peter Riegel's Equation:
 * T2 = T1 * (D2 / D1)^1.06
 */
export function calculateRacePaceTargets(
  test: VO2TestRecord | null | undefined
): RacePaceTarget[] {
  const vam = getVAMFromTest(test);

  // Baseline reference: 3000m at 100% VAM (approx 10-12 min sustained all-out effort)
  const baseDistanceKm = 3.0;
  const baseTimeHours = baseDistanceKm / vam;
  const baseTimeMinutes = baseTimeHours * 60;

  const distances: { label: string; km: number; effort: string }[] = [
    { label: '3 km', km: 3.0, effort: 'Velocidade Máxima Contínua (~100% VAM)' },
    { label: '5 km', km: 5.0, effort: 'Ritmo Forte Sustentado (~95% VAM)' },
    { label: '10 km', km: 10.0, effort: 'Ritmo de Limiar Anaeróbio (~88-90% VAM)' },
    { label: '21.1 km (Meia Maratona)', km: 21.0975, effort: 'Ritmo Estável Sublimiar (~83-85% VAM)' },
    { label: '42.2 km (Maratona)', km: 42.195, effort: 'Ritmo de Economia Aeróbia (~75-80% VAM)' },
  ];

  return distances.map((d) => {
    const predictedMinutes = baseTimeMinutes * Math.pow(d.km / baseDistanceKm, 1.06);
    const predictedHours = predictedMinutes / 60;
    const avgSpeedKmH = Number((d.km / predictedHours).toFixed(2));
    const targetPace = speedToPace(avgSpeedKmH);

    return {
      distanceLabel: d.label,
      distanceKm: d.km,
      targetPaceMinPerKm: targetPace,
      targetSpeedKmH: avgSpeedKmH,
      estimatedTimeFormatted: formatRaceTime(predictedMinutes),
      estimatedTimeMinutes: Number(predictedMinutes.toFixed(1)),
      effortDescription: d.effort,
    };
  });
}
