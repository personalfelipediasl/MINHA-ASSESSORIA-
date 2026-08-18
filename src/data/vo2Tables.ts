import { Gender, VO2Classification } from '../types';

/**
 * Exact Speed (km/h) to METs conversion table from material-base.
 * Every MET corresponds to 3.5 ml/kg/min.
 */
export const SPEED_TO_MET_TABLE: Record<number, number> = {
  3.0: 2.2,
  3.5: 2.4,
  4.0: 2.7,
  4.5: 3.0,
  5.0: 3.2,
  5.5: 3.8,
  6.0: 4.2,
  6.5: 4.8,
  7.0: 5.4,
  7.5: 6.0,
  8.0: 7.1,
  8.5: 7.8,
  9.0: 8.6,
  9.5: 9.1,
  10.0: 10.1,
  10.5: 10.4,
  11.0: 10.9,
  11.5: 11.4,
  12.0: 12.0,
  12.5: 12.4,
  13.0: 12.9,
  13.5: 13.5,
  14.0: 13.8,
  14.5: 14.2,
  15.0: 14.6,
  15.5: 15.4,
  16.0: 15.9,
  16.5: 16.4,
  17.0: 16.9,
  17.5: 17.4,
  18.0: 17.9,
  18.5: 18.4,
  19.0: 18.9,
  20.0: 19.9,
};

export const MET_ML_PER_KG_MIN = 3.5;

interface AgeClassificationRange {
  minAge: number;
  maxAge: number;
  muitoFracaMax: number; // strictly less than this
  fracaMin: number;
  fracaMax: number;
  regularMin: number;
  regularMax: number;
  boaMin: number;
  boaMax: number;
  excelenteMin: number; // strictly greater than or equal to this
}

export const MEN_VO2_CLASSIFICATION_TABLE: AgeClassificationRange[] = [
  { minAge: 20, maxAge: 29, muitoFracaMax: 25, fracaMin: 25, fracaMax: 33, regularMin: 34, regularMax: 42, boaMin: 43, boaMax: 54, excelenteMin: 55 },
  { minAge: 30, maxAge: 39, muitoFracaMax: 23, fracaMin: 23, fracaMax: 30, regularMin: 31, regularMax: 38, boaMin: 39, boaMax: 48, excelenteMin: 49 },
  { minAge: 40, maxAge: 49, muitoFracaMax: 20, fracaMin: 20, fracaMax: 26, regularMin: 27, regularMax: 35, boaMin: 36, boaMax: 44, excelenteMin: 45 },
  { minAge: 50, maxAge: 59, muitoFracaMax: 18, fracaMin: 18, fracaMax: 24, regularMin: 25, regularMax: 33, boaMin: 34, boaMax: 42, excelenteMin: 43 },
  { minAge: 60, maxAge: 99, muitoFracaMax: 16, fracaMin: 16, fracaMax: 22, regularMin: 23, regularMax: 30, boaMin: 31, boaMax: 40, excelenteMin: 41 },
];

export const WOMEN_VO2_CLASSIFICATION_TABLE: AgeClassificationRange[] = [
  { minAge: 20, maxAge: 29, muitoFracaMax: 24, fracaMin: 24, fracaMax: 30, regularMin: 31, regularMax: 37, boaMin: 38, boaMax: 48, excelenteMin: 49 },
  { minAge: 30, maxAge: 39, muitoFracaMax: 20, fracaMin: 20, fracaMax: 27, regularMin: 28, regularMax: 33, boaMin: 34, boaMax: 44, excelenteMin: 45 },
  { minAge: 40, maxAge: 49, muitoFracaMax: 17, fracaMin: 17, fracaMax: 23, regularMin: 24, regularMax: 30, boaMin: 31, boaMax: 41, excelenteMin: 42 },
  { minAge: 50, maxAge: 59, muitoFracaMax: 15, fracaMin: 15, fracaMax: 20, regularMin: 21, regularMax: 27, boaMin: 28, boaMax: 37, excelenteMin: 38 },
  { minAge: 60, maxAge: 99, muitoFracaMax: 13, fracaMin: 13, fracaMax: 17, regularMin: 18, regularMax: 23, boaMin: 24, boaMax: 34, excelenteMin: 35 },
];

export const TEST_SAFETY_DISCLAIMER = `Este teste exige esforço físico elevado. Você é responsável por estar apto a realizá-lo.

O aplicativo não realiza avaliação médica, não diagnostica condições de saúde e não substitui acompanhamento profissional presencial.

Se você possui doença cardiovascular, condição de saúde relevante, limitação articular, sintomas durante o exercício ou qualquer dúvida sobre sua aptidão, procure avaliação profissional antes de realizar o teste.`;

export const GENERAL_APP_DISCLAIMER = `Este aplicativo fornece uma organização de treinamento baseada nas informações fornecidas por você e nas regras programadas no sistema.

Ele não substitui avaliação médica, fisioterapêutica ou acompanhamento presencial de um profissional qualificado.

Você é responsável por informar corretamente seus dados e por estar apto a realizar os testes e os treinamentos propostos.

Não realize testes ou treinos se estiver com sintomas, mal-estar, dor importante ou condição que torne o exercício inadequado para você.

Em caso de dúvida, procure avaliação profissional.`;
