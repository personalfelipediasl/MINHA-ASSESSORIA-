import { jsPDF } from 'jspdf';
import { UserProfile, TrainingPlan, VO2TestRecord, WorkoutSession } from '../types';
import { speedToPace } from '../calculations/vo2Calculator';
import { calculatePaceZones, getVAMFromTest, calculateTanakaMaxHR } from '../calculations/paceCalculator';

/**
 * Extracts and calculates detailed speeds, paces and stimulus breakdown for continuous and interval sessions.
 */
function getSessionExecutionDetails(session: WorkoutSession, refSpeedKmH: number) {
  const isInterval =
    session.workoutType === 'treino_intervalado' ||
    session.workoutType === 'fartlek' ||
    session.workoutType === 'treino_limiar';

  const workSteps = session.steps?.filter((s) => s.type === 'work') || [];
  const recoverySteps = session.steps?.filter((s) => s.type === 'recovery') || [];
  const warmupStep = session.steps?.find((s) => s.type === 'warmup');
  const cooldownStep = session.steps?.find((s) => s.type === 'cooldown');

  const warmupSpeed = warmupStep?.targetSpeedKmH || Number((refSpeedKmH * 0.7).toFixed(1));
  const warmupPace = warmupStep?.targetPaceMinPerKm || speedToPace(warmupSpeed);
  const warmupDurMin = Math.round((warmupStep?.durationSeconds || 300) / 60);

  const cooldownSpeed = cooldownStep?.targetSpeedKmH || Number((refSpeedKmH * 0.55).toFixed(1));
  const cooldownPace = cooldownStep?.targetPaceMinPerKm || speedToPace(cooldownSpeed);
  const cooldownDurMin = Math.round((cooldownStep?.durationSeconds || 180) / 60);

  if (isInterval) {
    const workCount = Math.max(1, workSteps.length);
    const firstWork = workSteps[0];
    const workDurSec = firstWork?.durationSeconds || 180;
    const workDurMin = Math.floor(workDurSec / 60);
    const workDurRestSec = workDurSec % 60;
    const workTimeStr = workDurRestSec > 0 ? `${workDurMin}min${workDurRestSec}s` : `${workDurMin}:00 min`;

    const workSpeed = firstWork?.targetSpeedKmH || Number((refSpeedKmH * 0.98).toFixed(1));
    const workPace = firstWork?.targetPaceMinPerKm || speedToPace(workSpeed);
    const workIntensity = firstWork?.intensityDescription || '95-100% VAM';

    const firstRec = recoverySteps[0];
    const recDurSec = firstRec?.durationSeconds || 120;
    const recDurMin = Math.floor(recDurSec / 60);
    const recDurRestSec = recDurSec % 60;
    const recTimeStr = recDurRestSec > 0 ? `${recDurMin}min${recDurRestSec}s` : `${recDurMin}:00 min`;

    const recSpeed = firstRec?.targetSpeedKmH || Number((refSpeedKmH * 0.55).toFixed(1));
    const recPace = firstRec?.targetPaceMinPerKm || speedToPace(recSpeed);

    // Global session average speed calculation
    const avgSpeed = Number(
      (
        (session.estimatedDistanceKm / Math.max(0.1, session.estimatedDurationMin / 60))
      ).toFixed(1)
    );
    const avgPace = speedToPace(avgSpeed);

    return {
      isInterval: true,
      workCount,
      workTimeStr,
      workSpeed,
      workPace,
      workIntensity,
      recTimeStr,
      recSpeed,
      recPace,
      warmupSpeed,
      warmupPace,
      warmupDurMin,
      cooldownSpeed,
      cooldownPace,
      cooldownDurMin,
      avgSpeed,
      avgPace,
    };
  }

  // Continuous run
  const firstWork = workSteps[0];
  const targetSpeed = firstWork?.targetSpeedKmH || Number((refSpeedKmH * 0.72).toFixed(1));
  const minSpeed = Number((targetSpeed * 0.97).toFixed(1));
  const maxSpeed = Number((targetSpeed * 1.03).toFixed(1));
  const targetPace = firstWork?.targetPaceMinPerKm || speedToPace(targetSpeed);
  const minPace = speedToPace(maxSpeed);
  const maxPace = speedToPace(minSpeed);

  return {
    isInterval: false,
    targetSpeed,
    speedRange: `${minSpeed} a ${maxSpeed} km/h`,
    targetPace,
    paceRange: `${minPace} a ${maxPace}`,
    warmupSpeed,
    warmupPace,
    warmupDurMin,
    cooldownSpeed,
    cooldownPace,
    cooldownDurMin,
  };
}

export function generateTrainingPlanPDF(
  profile: UserProfile,
  plan: TrainingPlan,
  latestTest?: VO2TestRecord | null,
  allTests: VO2TestRecord[] = []
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;
  let pageNumber = 1;

  const vam = getVAMFromTest(latestTest);
  const effectiveRefSpeed = plan.referenceSpeedKmH || vam || 10.0;
  const maxHR = calculateTanakaMaxHR(profile.age);
  const paceZones = calculatePaceZones(latestTest, profile.age);

  // Helper to add new page with consistent page counter
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      // Add footer to current page before switching
      drawPageFooter();
      doc.addPage();
      pageNumber += 1;
      y = 16;
      drawMiniHeader();
    }
  };

  const drawPageFooter = () => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(
      'Minha Assessoria — Planilha de Corrida Individualizada | Prescrição Fisiológica por: Felipe Dias Lopes F.',
      margin,
      pageHeight - 8
    );
    doc.text(`Página ${pageNumber}`, pageWidth - margin - 15, pageHeight - 8);
  };

  const drawMiniHeader = () => {
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, pageWidth, 10, 'F');
    doc.setFillColor(255, 85, 0);
    doc.rect(0, 9.5, pageWidth, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`MINHA ASSESSORIA • ATLETA: ${profile.name.toUpperCase()} • OBJETIVO: ${profile.targetDistance.toUpperCase()}`, margin, 6.5);
    y = 16;
  };

  // ==========================================
  // PAGE 1: HEADER, PROFILE & PHYSIOLOGY
  // ==========================================

  // Header Banner
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Orange Accent Stripe
  doc.setFillColor(255, 85, 0);
  doc.rect(0, 31, pageWidth, 1.8, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MINHA ASSESSORIA', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(210, 210, 210);
  doc.text('Planilha de Treinamento Individualizado com Velocidades e Paces', margin, 21);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} • FCmax Estimada: ${maxHR} bpm`, margin, 26.5);

  doc.setTextColor(255, 85, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PRESCRIÇÃO CIENTÍFICA', pageWidth - margin - 52, 17);

  y = 38;

  // 1. Runner Profile Box
  doc.setFillColor(246, 246, 246);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'F');
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'S');

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`ATLETA: ${profile.name.toUpperCase()}`, margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Idade: ${profile.age} anos  |  Gênero: ${profile.gender === 'masculino' ? 'Masculino' : 'Feminino'}  |  Nível: ${profile.level.toUpperCase()}  |  Frequência: ${profile.weeklyFrequency}x por semana`,
    margin + 4,
    y + 11.5
  );

  const targetDateStr = profile.hasTargetDate && profile.targetDate
    ? `  |  Data da Prova: ${new Date(profile.targetDate).toLocaleDateString('pt-BR')}`
    : '';
  doc.text(
    `Objetivo: ${profile.targetDistance.toUpperCase()} (${plan.targetDistanceKm} km)  |  Ciclo: ${plan.totalWeeks} semanas${targetDateStr}`,
    margin + 4,
    y + 17
  );

  y += 26;

  // 2. Physiological Reference Box (Highlighted with Cooper / VAM)
  doc.setFillColor(238, 242, 247);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(200, 215, 230);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'S');

  doc.setTextColor(255, 85, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CALIBRAÇÃO FISIOLÓGICA & VELOCIDADE AERÓBICA MÁXIMA (VAM)', margin + 4, y + 5.5);

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (latestTest) {
    const testDate = new Date(latestTest.date).toLocaleDateString('pt-BR');
    const isCooper = latestTest.protocol === 'cooper';
    const protocolName = isCooper ? 'Teste de Cooper (12 min)' : 'Teste Incremental (Esteira)';
    const cooperDetails = isCooper && latestTest.cooperDistanceMeters
      ? `  |  Distância no teste: ${latestTest.cooperDistanceMeters}m (Pace: ${latestTest.cooperPaceMinPerKm || speedToPace(vam)})`
      : '';

    doc.text(
      `VO₂max: ${latestTest.vo2max.toFixed(2)} ml/kg/min  |  Classificação: ${latestTest.classification.toUpperCase()}  |  VAM Referência: ${vam.toFixed(1)} km/h (${speedToPace(vam)})`,
      margin + 4,
      y + 12
    );
    doc.text(
      `Protocolo Executado: ${protocolName} (${testDate})${cooperDetails}`,
      margin + 4,
      y + 18
    );
  } else {
    doc.text(
      `VO₂max Estimado: ${effectiveRefSpeed * 3.5} ml/kg/min (Provisório)  |  VAM Referência: ${effectiveRefSpeed.toFixed(1)} km/h (${speedToPace(effectiveRefSpeed)})`,
      margin + 4,
      y + 12
    );
    doc.text(
      'Atenção: Recomendamos realizar o Teste de Cooper (12 min) para calibrar as velocidades individuais com precisão máxima.',
      margin + 4,
      y + 18
    );
  }

  y += 28;

  // 3. Training Pace Zones Quick Table (Z1 - Z5)
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TABELA DE REFERÊNCIA DAS ZONAS DE RITMO E VELOCIDADE (Z1 A Z5)', margin + 3, y + 4.2);

  y += 7;

  // Table header
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('ZONA', margin + 2, y + 3.8);
  doc.text('NOME / OBJETIVO', margin + 18, y + 3.8);
  doc.text('VELOCIDADE (km/h)', margin + 70, y + 3.8);
  doc.text('PACE RECOMENDADO', margin + 105, y + 3.8);
  doc.text('FAIXA CARDÍACA', margin + 143, y + 3.8);

  y += 5.5;

  paceZones.forEach((z) => {
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, y, contentWidth, 5.2, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + 5.2, margin + contentWidth, y + 5.2);

    doc.setTextColor(255, 85, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(z.zone, margin + 2, y + 3.8);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(z.shortName, margin + 18, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.text(`${z.speedRangeKmH} km/h`, margin + 70, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(`${z.paceRangeClean} /km`, margin + 105, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`${z.hrPercentClean} (${z.estimatedHR})`, margin + 143, y + 3.8);

    y += 5.2;
  });

  y += 6;

  // ==========================================
  // 4. DETAILED WEEKLY MICROCROCYCLES & WORKOUTS
  // ==========================================
  doc.setTextColor(18, 18, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PRESCRIÇÃO DETALHADA DAS SESSÕES DE TREINO', margin, y);
  y += 4.5;

  // Print all planned weeks with complete details
  plan.weeks.forEach((week) => {
    checkPageBreak(30);

    // Week Banner
    doc.setFillColor(22, 22, 22);
    doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(
      `SEMANA ${week.weekNumber} — FASE ${week.phaseName.toUpperCase()}  |  Volume Alvo: ${week.targetVolumeKm} km (~${week.targetDurationMin} min)  |  ${week.focus}`,
      margin + 3,
      y + 4.4
    );

    y += 8;

    // Sessions for this week
    week.sessions.forEach((session) => {
      const isRest = session.isRestDay;
      const isSimulado = session.isSimulado;
      const details = getSessionExecutionDetails(session, effectiveRefSpeed);

      if (isRest) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        const restLines = doc.splitTextToSize(
          session.executionGuidance || 'Descanso total ou recuperação passiva. Hidratação adequada, sono reparador e regeneração neuromuscular.',
          contentWidth - 14
        );
        const cardHeight = 8 + restLines.length * 3.5;
        checkPageBreak(cardHeight + 2);

        // Card Background
        doc.setFillColor(249, 249, 249);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, 'F');
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, 'S');

        // Left Accent Strip
        doc.setFillColor(180, 180, 180);
        doc.rect(margin, y, 2.5, cardHeight, 'F');

        // Header
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`${session.dayName}: ${session.title}`, margin + 5, y + 4.8);

        // Rest guidance text
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        doc.text(restLines, margin + 5, y + 8.8);

        y += cardHeight + 2.5;
        return;
      }

      // Non-rest sessions (Interval, Simulado, Continuous)
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.6);
      const guidanceLines = doc.splitTextToSize(
        `Orientação do Treinador: ${session.executionGuidance}`,
        contentWidth - 12
      );
      const guidanceHeight = guidanceLines.length * 3.2;

      let cardHeight = 0;
      if (details.isInterval) {
        cardHeight = 24 + guidanceHeight;
      } else {
        cardHeight = 20 + guidanceHeight;
      }

      checkPageBreak(cardHeight + 2);

      // Card Background
      if (isSimulado) {
        doc.setFillColor(255, 250, 245);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1.2, 1.2, 'F');
        doc.setDrawColor(255, 120, 40);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1.2, 1.2, 'S');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, 'S');
      }

      // Left Accent Strip
      if (isSimulado) {
        doc.setFillColor(255, 85, 0);
      } else if (details.isInterval) {
        doc.setFillColor(235, 70, 0);
      } else {
        doc.setFillColor(30, 110, 195);
      }
      doc.rect(margin, y, 2.5, cardHeight, 'F');

      // Header of Session: Day + Title
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${session.dayName}: ${session.title}`, margin + 5, y + 4.5);

      // Metadata on right top
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.3);
      doc.setTextColor(isSimulado ? 230 : 255, isSimulado ? 60 : 85, 0);
      doc.text(
        `${session.estimatedDistanceKm} km  |  ~${session.estimatedDurationMin} min  |  ${session.intensityLabel}`,
        pageWidth - margin - 4,
        y + 4.5,
        { align: 'right' }
      );

      let curY = y + 6.5;

      if (details.isInterval) {
        // INTERVAL WORKOUT DISPLAY
        doc.setFillColor(255, 245, 238);
        doc.roundedRect(margin + 5, curY, contentWidth - 9, 11.5, 1, 1, 'F');

        doc.setTextColor(190, 50, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.text(
          `TIROS / ESTÍMULOS: ${details.workCount}x de ${details.workTimeStr}  @  Velocidade: ${details.workSpeed} km/h  |  Pace do Tiro: ${details.workPace}`,
          margin + 7,
          curY + 4.2
        );

        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.text(
          `PAUSA ATIVA: ${details.recTimeStr} trote leve  @  Velocidade: ${details.recSpeed} km/h (Pace: ${details.recPace})`,
          margin + 7,
          curY + 8.8
        );

        curY += 13.5;

        // Warmup + Cooldown + Global Average Speed/Pace
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.7);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `Aquecimento: ${details.warmupDurMin} min @ ${details.warmupSpeed} km/h (${details.warmupPace})  |  Desaquecimento: ${details.cooldownDurMin} min @ ${details.cooldownSpeed} km/h (${details.cooldownPace})  |  Média Global: ${details.avgSpeed} km/h (${details.avgPace})`,
          margin + 5,
          curY
        );

        curY += 4.2;

        // Guidance text completely printed without truncation
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.6);
        doc.setTextColor(95, 95, 95);
        doc.text(guidanceLines, margin + 5, curY);
      } else {
        // CONTINUOUS / SIMULADO RUN DISPLAY
        if (isSimulado) {
          doc.setFillColor(255, 238, 225);
          doc.roundedRect(margin + 5, curY, contentWidth - 9, 7.5, 1, 1, 'F');

          doc.setTextColor(200, 50, 0);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.2);
          doc.text(
            `🏁 RITMO ALVO DO SIMULADO: Pace ${details.targetPace}   |   Velocidade Alvo: ${details.targetSpeed} km/h (Distância Específica: ${session.simuladoTargetDistanceKm || session.estimatedDistanceKm} km)`,
            margin + 7,
            curY + 4.8
          );
        } else {
          doc.setFillColor(242, 247, 252);
          doc.roundedRect(margin + 5, curY, contentWidth - 9, 7.5, 1, 1, 'F');

          doc.setTextColor(10, 60, 140);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.2);
          doc.text(
            `Pace Recomendado: ${details.targetPace} (Faixa: ${details.paceRange} /km)   |   Velocidade Média Recomendada: ${details.targetSpeed} km/h (${details.speedRange})`,
            margin + 7,
            curY + 4.8
          );
        }

        curY += 9.5;

        // Warmup & Cooldown line
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.7);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `Aquecimento: ${details.warmupDurMin} min @ ${details.warmupSpeed} km/h (${details.warmupPace})  |  Desaquecimento: ${details.cooldownDurMin} min @ ${details.cooldownSpeed} km/h (${details.cooldownPace})`,
          margin + 5,
          curY
        );

        curY += 4.2;

        // Guidance text completely printed without truncation
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.6);
        doc.setTextColor(95, 95, 95);
        doc.text(guidanceLines, margin + 5, curY);
      }

      y += cardHeight + 2.5;
    });

    y += 3;
  });

  // Final Disclaimer Banner on the last page
  checkPageBreak(18);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'F');
  doc.setDrawColor(255, 85, 0);
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 85, 0);
  doc.text('ORIENTAÇÃO DE SEGURANÇA E ADAPTAÇÃO:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  doc.text(
    'Respeite os ritmos prescritos e a recuperação programada. Em caso de dores agudas persistentes ou mal-estar, interrompa a sessão. Hidratação recomendada: 400-600 ml/hora.',
    margin + 3,
    y + 8.5
  );

  drawPageFooter();

  // Save the generated document
  doc.save(`MinhaAssessoria_Planilha_${profile.name.replace(/\s+/g, '_')}.pdf`);
}
