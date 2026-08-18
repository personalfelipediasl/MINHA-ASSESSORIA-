import { Gender, VO2Classification } from '../types';
import {
  SPEED_TO_MET_TABLE,
  MET_ML_PER_KG_MIN,
  MEN_VO2_CLASSIFICATION_TABLE,
  WOMEN_VO2_CLASSIFICATION_TABLE,
} from '../data/vo2Tables';

/**
 * Calculates VO2max from Incremental Treadmill Test based on the last completed stage speed (km/h).
 * METs table is multiplied by 3.5 ml/kg/min.
 * Example: 14 km/h -> 13.8 METs -> 13.8 * 3.5 = 48.30 ml/kg/min.
 */
export function calculateIncrementalVO2(completedSpeedKmH: number): {
  vo2max: number;
  mets: number;
} {
  // Normalize to 0.5 increments if needed
  const normalizedSpeed = Math.round(completedSpeedKmH * 2) / 2;
  const clampedSpeed = Math.max(3.0, Math.min(20.0, normalizedSpeed));

  const mets = SPEED_TO_MET_TABLE[clampedSpeed] ?? (clampedSpeed * 0.98); // fallback interpolation
  const vo2max = Number((mets * MET_ML_PER_KG_MIN).toFixed(2));

  return { vo2max, mets };
}

/**
 * Calculates VO2max from Cooper 12-minute test distance in meters.
 * Formula: VO2max = (Distance - 504) / 45
 * Example: 1600m -> (1600 - 504) / 45 = 1096 / 45 = 24.355... -> 24.35 ml/kg/min.
 */
export function calculateCooperVO2(distanceMeters: number): number {
  if (distanceMeters <= 504) return 0;
  const raw = (distanceMeters - 504) / 45;
  return Number(raw.toFixed(2));
}

/**
 * Calculates average speed in km/h from Cooper 12-min test distance in meters.
 * Formula: Speed (km/h) = (distanceMeters / 1000) / (12 / 60) = distanceMeters / 200
 * Example: 2400m -> 2400 / 200 = 12.0 km/h
 */
export function calculateCooperSpeedKmH(distanceMeters: number): number {
  if (!distanceMeters || distanceMeters <= 0) return 0;
  return Number((distanceMeters / 200).toFixed(2));
}

/**
 * Calculates average pace string ("M:SS /km") from Cooper 12-min test distance in meters.
 * Formula: Pace = 12 minutes / (distanceMeters / 1000 km)
 * Example: 2400m -> 12 / 2.4 = 5.0 -> "5:00 /km"
 * Example: 1600m -> 12 / 1.6 = 7.5 -> "7:30 /km"
 */
export function calculateCooperPace(distanceMeters: number): string {
  if (!distanceMeters || distanceMeters <= 0) return '--:-- /km';
  const speed = calculateCooperSpeedKmH(distanceMeters);
  return speedToPace(speed);
}

/**
 * Classifies VO2max according to the exact age and gender reference tables from material-base.
 */
export function classifyVO2(
  vo2max: number,
  age: number,
  gender: Gender
): VO2Classification {
  const table =
    gender === 'masculino'
      ? MEN_VO2_CLASSIFICATION_TABLE
      : WOMEN_VO2_CLASSIFICATION_TABLE;

  // Find corresponding age bracket
  const bracket =
    table.find((b) => age >= b.minAge && age <= b.maxAge) ??
    (age < 20 ? table[0] : table[table.length - 1]);

  if (vo2max < bracket.muitoFracaMax) {
    return 'Muito fraca';
  }
  if (vo2max >= bracket.fracaMin && vo2max <= bracket.fracaMax) {
    return 'Fraca';
  }
  if (vo2max >= bracket.regularMin && vo2max <= bracket.regularMax) {
    return 'Regular';
  }
  if (vo2max >= bracket.boaMin && vo2max <= bracket.boaMax) {
    return 'Boa';
  }
  return 'Excelente';
}

/**
 * Converts speed (km/h) to pace string in "M:SS /km" format.
 * E.g., 10 km/h -> "6:00 /km", 12 km/h -> "5:00 /km", 8.5 km/h -> "7:04 /km"
 */
export function speedToPace(speedKmH: number): string {
  if (!speedKmH || speedKmH <= 0) return '--:--';
  const totalMinutes = 60 / speedKmH;
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);
  const formattedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${formattedSec} /km`;
}

/**
 * Converts pace string ("5:30") to speed in km/h.
 */
export function paceToSpeed(paceMinSec: string): number {
  const parts = paceMinSec.split(':').map((p) => Number(p.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return 10;
  const minutes = parts[0] + parts[1] / 60;
  if (minutes <= 0) return 10;
  return Number((60 / minutes).toFixed(2));
}

/**
 * Calculates relative speeds and paces based on a reference speed (vVO2max).
 */
export function calculateRelativeIntensities(refSpeedKmH: number) {
  const p80 = Number((refSpeedKmH * 0.8).toFixed(1));
  const p90 = Number((refSpeedKmH * 0.9).toFixed(1));
  const p100 = Number((refSpeedKmH * 1.0).toFixed(1));
  const p110 = Number((refSpeedKmH * 1.1).toFixed(1));
  const p50 = Number((refSpeedKmH * 0.5).toFixed(1));
  const p60 = Number((refSpeedKmH * 0.6).toFixed(1));
  const p70 = Number((refSpeedKmH * 0.7).toFixed(1));

  return {
    p50: { speed: p50, pace: speedToPace(p50) },
    p60: { speed: p60, pace: speedToPace(p60) },
    p70: { speed: p70, pace: speedToPace(p70) },
    p80: { speed: p80, pace: speedToPace(p80) },
    p90: { speed: p90, pace: speedToPace(p90) },
    p100: { speed: p100, pace: speedToPace(p100) },
    p110: { speed: p110, pace: speedToPace(p110) },
  };
}
