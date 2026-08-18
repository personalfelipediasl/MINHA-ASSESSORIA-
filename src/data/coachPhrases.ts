export interface PreWorkoutEvaluation {
  score: number;
  title: string;
  message: string;
  recommendation: string;
  suggestedAdjustment: 'normal' | 'reduzir_volume' | 'corrida_leve' | 'recuperacao' | 'adiar';
}

export function evaluateCheckIn(params: {
  wakeUpState: 'otimo' | 'bem' | 'normal' | 'cansado' | 'destruido';
  sleepQuality: 'muito_bem' | 'bem' | 'mais_ou_menos' | 'dormi_mal';
  hydration: 'bem_hidratado' | 'moderada' | 'pouca';
  nutrition: 'bem_alimentado' | 'normal' | 'comi_pouco' | 'comi_mal';
  painLevel: 'nenhuma' | 'leve' | 'moderada' | 'forte';
  painLocation?: string;
  mentalState: 'focado' | 'normal' | 'estressado' | 'muito_estressado';
}): PreWorkoutEvaluation {
  const { wakeUpState, sleepQuality, hydration, nutrition, painLevel, painLocation, mentalState } = params;

  // Calculate composite readiness score (0 - 100)
  let score = 100;

  // Wake up penalty
  if (wakeUpState === 'bem') score -= 5;
  if (wakeUpState === 'normal') score -= 15;
  if (wakeUpState === 'cansado') score -= 30;
  if (wakeUpState === 'destruido') score -= 50;

  // Sleep penalty
  if (sleepQuality === 'bem') score -= 5;
  if (sleepQuality === 'mais_ou_menos') score -= 15;
  if (sleepQuality === 'dormi_mal') score -= 30;

  // Hydration penalty
  if (hydration === 'moderada') score -= 10;
  if (hydration === 'pouca') score -= 20;

  // Nutrition penalty
  if (nutrition === 'normal') score -= 5;
  if (nutrition === 'comi_pouco') score -= 15;
  if (nutrition === 'comi_mal') score -= 20;

  // Pain penalty
  if (painLevel === 'leve') score -= 15;
  if (painLevel === 'moderada') score -= 40;
  if (painLevel === 'forte') score -= 70;

  // Mental stress penalty
  if (mentalState === 'normal') score -= 5;
  if (mentalState === 'estressado') score -= 15;
  if (mentalState === 'muito_estressado') score -= 25;

  score = Math.max(10, Math.min(100, score));

  // 1. Critical Pain Rule (Priority 1: Safety)
  if (painLevel === 'forte') {
    const locText = painLocation ? ` (${painLocation})` : '';
    return {
      score,
      title: 'Atenção: Sinal Vermelho para Dor',
      message: `Você relatou dor forte${locText}. Treinar com dor aguda não é disciplina, é risco desnecessário de lesão crônica.`,
      recommendation: 'Recomendação: Não execute o treino de corrida hoje. Faça repouso, gelo se indicado e consulte um profissional de saúde/fisioterapia se persistir.',
      suggestedAdjustment: 'adiar',
    };
  }

  if (painLevel === 'moderada') {
    const locText = painLocation ? ` (${painLocation})` : '';
    return {
      score,
      title: 'Cuidado: Dor Moderada Identificada',
      message: `Dor não é um detalhe para ignorar${locText}. Antes de aumentar qualquer intensidade, precisamos proteger suas articulações e musculatura.`,
      recommendation: 'Recomendação: Transforme a sessão em recuperação ativa ou caminhada leve. Se a dor aumentar durante o aquecimento, interrompa imediatamente.',
      suggestedAdjustment: 'recuperacao',
    };
  }

  // 2. High Fatigue / Bad Sleep combo
  const isHighFatigue = wakeUpState === 'destruido' || wakeUpState === 'cansado';
  const isBadSleep = sleepQuality === 'dormi_mal' || sleepQuality === 'mais_ou_menos';

  if (isHighFatigue && isBadSleep) {
    return {
      score,
      title: 'Ajuste de Carga: Recuperação Comprometida',
      message: 'Hoje seu corpo está sinalizando que a recuperação não foi das melhores. Isso não significa que você perdeu o treino. Significa que precisamos respeitar o momento e reduzir a exigência.',
      recommendation: 'Recomendação: Reduza a intensidade para ritmo puramente regenerativo (Zona 1/Leve) e diminua 20–30% da duração prevista.',
      suggestedAdjustment: 'corrida_leve',
    };
  }

  // 3. High Stress / Mental Fatigue
  if (mentalState === 'muito_estressado') {
    return {
      score,
      title: 'Alívio Mental: Corra para Descomprimir',
      message: 'Seu dia pode estar pesado. Mas você não precisa carregar tudo isso para a corrida. Faça o aquecimento, respire fundo, comece devagar e deixe a mente esvaziar.',
      recommendation: 'Recomendação: Esqueça relógio e metas duras hoje. Foque em uma corrida contínua moderada e sustentável para liberar endorfina sem sobrecarregar o sistema nervoso.',
      suggestedAdjustment: 'corrida_leve',
    };
  }

  // 4. Low Hydration / Low Nutrition Alert
  if (hydration === 'pouca' || nutrition === 'comi_mal') {
    return {
      score,
      title: 'Atenção aos Substratos: Hidratação e Energia',
      message: 'Você apontou déficit em água ou alimentação prévia. Seu rendimento pode oscilar e a percepção de esforço será mais alta.',
      recommendation: 'Recomendação: Beba 300-500ml de água antes de calçar o tênis, faça um aquecimento mais longo e mantenha ritmo conservador.',
      suggestedAdjustment: 'reduzir_volume',
    };
  }

  // 5. Mild warning (score between 60 and 75)
  if (score < 75) {
    return {
      score,
      title: 'Prudência: Treino Consciente',
      message: 'Você está apto para correr, mas seu corpo não está em 100% de plenitude. Treino bom não é o que te destrói; é o que você consegue absorver.',
      recommendation: 'Recomendação: Inicie com aquecimento caprichado de pelo menos 5 minutos. Sinta como o ritmo se encaixa antes de acelerar.',
      suggestedAdjustment: 'reduzir_volume',
    };
  }

  // 6. Optimal Condition (score >= 75)
  return {
    score,
    title: 'Condição Excelente: Foco na Execução',
    message: 'Boa! Você parece chegar em ótimas condições de descanso, energia e foco. Agora é simples: aquecimento primeiro. Depois execute o treino como planejado. Não tente provar nada no primeiro minuto.',
    recommendation: 'Recomendação: Mantenha a disciplina de ritmo estipulada na planilha. Sustente a estratégia até a última série.',
    suggestedAdjustment: 'normal',
  };
}
