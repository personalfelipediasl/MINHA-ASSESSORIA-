import React, { useState } from 'react';
import { UserProfile, calculateAgeFromBirthDate } from '../../types';
import {
  exportAllData,
  importAllData,
  clearAllLocalData,
  saveProfile,
} from '../../storage/indexedDB';
import {
  User,
  Shield,
  Download,
  Upload,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Heart,
  Calendar,
  Activity,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onDataReset: () => void;
  onOpenSelfTests?: () => void;
  onGoBack?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onProfileUpdated,
  onDataReset,
  onGoBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate || '');
  const [level, setLevel] = useState(profile.level);
  const [weeklyFrequency, setWeeklyFrequency] = useState(profile.weeklyFrequency);
  const [simuladoDayOfWeek, setSimuladoDayOfWeek] = useState(profile.simuladoDayOfWeek ?? 6);
  const [showWipeConfirm1, setShowWipeConfirm1] = useState(false);
  const [showWipeConfirm2, setShowWipeConfirm2] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const calculatedAge = birthDate ? calculateAgeFromBirthDate(birthDate) : profile.age;

  const handleSaveEdit = async () => {
    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      birthDate: birthDate || profile.birthDate,
      age: calculatedAge > 0 ? calculatedAge : profile.age,
      level,
      weeklyFrequency,
      simuladoDayOfWeek,
      updatedAt: new Date().toISOString(),
    };
    await saveProfile(updated);
    onProfileUpdated(updated);
    setIsEditing(false);
  };

  const handleExportBackup = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MinhaAssessoria_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importAllData(json);
        setImportStatus('Backup restaurado com sucesso! Recarregando...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        setImportStatus('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeData = async () => {
    await clearAllLocalData();
    onDataReset();
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Top Back Navigation */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#202020] text-xs font-bold text-[#CCCCCC] hover:text-white border border-[#262626] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
          <span>VOLTAR</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#FF5500] font-mono font-bold">
            CONFIGURAÇÕES PESSOAIS
          </span>
          <h1 className="text-2xl font-black text-white mt-1">MEU PERFIL</h1>
          <p className="text-xs text-[#AFAFAF] mt-1">
            Seus dados antropométricos, metas e controle de armazenamento local.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="py-2 px-3 bg-[#171717] hover:bg-[#222222] border border-[#2a2a2a] text-[#FF5500] hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>EDITAR</span>
          </button>
        ) : (
          <button
            onClick={handleSaveEdit}
            className="py-2 px-3 bg-[#FF5500] hover:bg-[#FF6600] text-black rounded-xl text-xs font-black flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>SALVAR</span>
          </button>
        )}
      </div>

      {/* Runner Profile Card */}
      <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-[#FF5500] font-black text-2xl font-mono">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#1c1c1c] border border-[#333333] rounded-lg px-3 py-1 text-white font-extrabold text-lg focus:outline-none focus:border-[#FF5500]"
              />
            ) : (
              <h2 className="text-xl font-black text-white">{profile.name}</h2>
            )}
            <p className="text-xs text-[#888888] capitalize">
              {profile.gender === 'masculino' ? 'Corredor' : 'Corredora'} • {profile.level}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#222222] text-xs">
          <div className="bg-[#171717] p-3 rounded-xl border border-[#252525]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Data de Nasc. / Idade</div>
            {isEditing ? (
              <div className="space-y-1">
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#202020] border border-[#333333] rounded p-1 text-white font-bold text-xs"
                />
                <span className="text-[10px] text-[#FF5500] font-mono block">
                  {calculatedAge} anos
                </span>
              </div>
            ) : (
              <div className="text-sm font-bold text-white">
                {profile.birthDate
                  ? `${new Date(profile.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')} (${profile.age} anos)`
                  : `${profile.age} anos`}
              </div>
            )}
          </div>

          <div className="bg-[#171717] p-3 rounded-xl border border-[#252525]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Frequência Semanal</div>
            {isEditing ? (
              <select
                value={weeklyFrequency}
                onChange={(e) => setWeeklyFrequency(Number(e.target.value) as any)}
                className="w-full bg-[#202020] border border-[#333333] rounded p-1 text-white font-bold text-xs"
              >
                {[1, 2, 3, 4, 5, 6].map((f) => (
                  <option key={f} value={f}>
                    {f}x por semana
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-base font-bold text-[#FF5500]">{profile.weeklyFrequency}x por semana</div>
            )}
          </div>

          <div className="bg-[#171717] p-3 rounded-xl border border-[#252525]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Objetivo Principal</div>
            <div className="text-base font-bold text-white uppercase">{profile.targetDistance}</div>
          </div>

          <div className="bg-[#171717] p-3 rounded-xl border border-[#252525]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Dia do Simulado 🏁</div>
            {isEditing ? (
              <select
                value={simuladoDayOfWeek}
                onChange={(e) => setSimuladoDayOfWeek(Number(e.target.value))}
                className="w-full bg-[#202020] border border-[#333333] rounded p-1 text-white font-bold text-xs"
              >
                <option value={1}>Segunda-feira</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
                <option value={6}>Sábado</option>
                <option value={0}>Domingo</option>
              </select>
            ) : (
              <div className="text-sm font-bold text-[#FF5500]">
                {profile.simuladoDayOfWeek === 0
                  ? 'Domingo'
                  : profile.simuladoDayOfWeek === 1
                  ? 'Segunda-feira'
                  : profile.simuladoDayOfWeek === 2
                  ? 'Terça-feira'
                  : profile.simuladoDayOfWeek === 3
                  ? 'Quarta-feira'
                  : profile.simuladoDayOfWeek === 4
                  ? 'Quinta-feira'
                  : profile.simuladoDayOfWeek === 5
                  ? 'Sexta-feira'
                  : 'Sábado'}
              </div>
            )}
          </div>

          <div className="bg-[#171717] p-3 rounded-xl border border-[#252525]">
            <div className="text-[10px] text-[#777777] uppercase font-bold">Data Alvo da Prova</div>
            <div className="text-sm font-bold text-white">
              {profile.hasTargetDate && profile.targetDate
                ? new Date(profile.targetDate).toLocaleDateString('pt-BR')
                : 'Sem data fixa'}
            </div>
          </div>
        </div>

        {/* Health Limits */}
        <div className="p-3 bg-[#171717] rounded-xl border border-[#252525] text-xs space-y-1">
          <div className="font-bold text-[#AFAFAF] uppercase text-[10px]">Histórico de Saúde & Dores:</div>
          <div className="text-white">
            {profile.hasPain && profile.painLocations.length > 0 ? (
              <span>Dores relatadas: {profile.painLocations.join(', ')}</span>
            ) : (
              <span>Nenhuma dor articular relatada</span>
            )}
          </div>
          {profile.hasHealthCondition && profile.healthConditionDetails && (
            <div className="text-[#888888] text-[11px]">
              Obs: {profile.healthConditionDetails}
            </div>
          )}
        </div>
      </div>

      {/* Privacy Guarantee (Section 66) */}
      <div className="p-5 bg-[#111111] border border-[#222222] rounded-3xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
          <Shield className="w-4 h-4 text-[#FF5500]" />
          <span>PRIVACIDADE & ARMAZENAMENTO LOCAL</span>
        </div>
        <p className="text-xs text-[#AFAFAF] leading-relaxed">
          Seus dados são armazenados exclusivamente neste dispositivo (IndexedDB). Nenhum histórico de VO₂max, treinos, frequência cardíaca ou rotina é enviado para servidores externos.
        </p>

        {/* Backup export & import */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="py-3 px-3 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2e2e2e] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#FF5500]" />
            <span>EXPORTAR BACKUP</span>
          </button>

          <label className="py-3 px-3 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2e2e2e] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-[#FF5500]" />
            <span>RESTAURAR</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 bg-[#1a1a1a] rounded-xl text-xs text-emerald-400 font-mono">
            {importStatus}
          </div>
        )}
      </div>

      {/* Delete All Data with Dual Confirmation (Section 66) */}
      <div className="p-5 bg-red-950/20 border border-red-900/40 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>REINICIAR CADASTRO & EXCLUIR DADOS</span>
        </div>
        <p className="text-xs text-red-200 leading-relaxed">
          Seus dados e treinos ficam salvos na memória do seu telefone e funcionam 100% offline. Para realizar um novo cadastro do zero, é necessário apagar os dados registrados anteriormente.
        </p>

        {!showWipeConfirm1 ? (
          <button
            onClick={() => setShowWipeConfirm1(true)}
            className="py-3 px-4 bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>EXCLUIR DADOS E REINICIAR CADASTRO</span>
          </button>
        ) : !showWipeConfirm2 ? (
          <div className="p-3 bg-red-900/40 rounded-xl space-y-2 border border-red-700">
            <div className="text-xs font-bold text-white">Confirmação 1/2: Deseja apagar seus dados para recadastrar?</div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowWipeConfirm2(true)}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg"
              >
                Sim, quero prosseguir
              </button>
              <button
                onClick={() => setShowWipeConfirm1(false)}
                className="py-2 px-4 bg-[#222222] text-white text-xs rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-red-900/60 rounded-xl space-y-2 border border-red-600">
            <div className="text-xs font-black text-white">Confirmação 2/2: Todos os registros locais serão apagados agora.</div>
            <div className="flex space-x-2">
              <button
                onClick={handleWipeData}
                className="py-2 px-4 bg-red-500 hover:bg-red-600 text-black font-black text-xs rounded-lg"
              >
                CONFIRMAR E REINICIAR
              </button>
              <button
                onClick={() => {
                  setShowWipeConfirm1(false);
                  setShowWipeConfirm2(false);
                }}
                className="py-2 px-4 bg-[#222222] text-white text-xs rounded-lg"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
