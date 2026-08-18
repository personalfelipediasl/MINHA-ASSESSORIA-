import React from 'react';
import { Smartphone, X, Share2, PlusSquare, MoreVertical, CheckCircle, Download } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onNativeInstall: () => void;
  isInstalled: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstall,
  isInstalled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative my-auto">
        {/* Close Button */}
        <button
          id="close-install-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#777777] hover:text-white bg-[#1a1a1a] hover:bg-[#252525] rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Instalar Minha Assessoria</h3>
            <p className="text-xs text-[#888888]">Crie um atalho na tela inicial do seu celular</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-400 text-xs">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <p className="leading-relaxed">
              O aplicativo já está instalado e funcionando como atalho independente na tela inicial do seu dispositivo.
            </p>
          </div>
        ) : (
          <>
            {/* Native Install Button if supported & ready */}
            {deferredPrompt && (
              <div className="p-4 bg-[#1A140F] border border-[#FF5500]/40 rounded-2xl space-y-2.5">
                <p className="text-xs text-white font-bold flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-[#FF5500]" />
                  <span>Instalação Automática Disponível</span>
                </p>
                <p className="text-[11px] text-[#AAAAAA]">
                  Clique no botão abaixo para adicionar o ícone diretamente à sua tela inicial:
                </p>
                <button
                  id="native-install-prompt-btn"
                  onClick={onNativeInstall}
                  className="w-full py-2.5 bg-[#FF5500] hover:bg-[#FF6600] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#FF5500]/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Agora no Celular</span>
                </button>
              </div>
            )}

            {/* iOS Instructions */}
            <div className="space-y-2 p-4 bg-[#181818] border border-[#262626] rounded-2xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <span className="px-2 py-0.5 bg-[#222222] text-[#FF5500] rounded text-[10px] font-mono">
                  iOS (iPhone / iPad)
                </span>
                <span>Safari</span>
              </div>
              <ol className="text-xs text-[#AAAAAA] space-y-2 pt-1 list-decimal list-inside leading-relaxed">
                <li>
                  Toque no ícone de <strong className="text-white">Compartilhar</strong>{' '}
                  <Share2 className="w-3.5 h-3.5 inline text-[#FF5500] ml-0.5" /> (barra inferior do Safari).
                </li>
                <li>
                  Role as opções para baixo e selecione{' '}
                  <strong className="text-white">"Adicionar à Tela de Início"</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-[#FF5500] ml-0.5" />.
                </li>
                <li>
                  Toque em <strong className="text-white">"Adicionar"</strong> no canto superior direito.
                </li>
              </ol>
            </div>

            {/* Android Instructions */}
            <div className="space-y-2 p-4 bg-[#181818] border border-[#262626] rounded-2xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <span className="px-2 py-0.5 bg-[#222222] text-[#FF5500] rounded text-[10px] font-mono">
                  Android
                </span>
                <span>Chrome / Navegador</span>
              </div>
              <ol className="text-xs text-[#AAAAAA] space-y-2 pt-1 list-decimal list-inside leading-relaxed">
                <li>
                  Toque no menu de <strong className="text-white">3 pontos</strong>{' '}
                  <MoreVertical className="w-3.5 h-3.5 inline text-[#FF5500] ml-0.5" /> (canto superior direito).
                </li>
                <li>
                  Selecione <strong className="text-white">"Instalar aplicativo"</strong> ou{' '}
                  <strong className="text-white">"Adicionar à tela inicial"</strong>.
                </li>
                <li>
                  Confirme tocando em <strong className="text-white">"Instalar"</strong>.
                </li>
              </ol>
            </div>
          </>
        )}

        <button
          id="close-install-modal-footer-btn"
          onClick={onClose}
          className="w-full py-2.5 bg-[#1F1F1F] hover:bg-[#282828] text-[#CCCCCC] hover:text-white font-bold text-xs rounded-xl transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
