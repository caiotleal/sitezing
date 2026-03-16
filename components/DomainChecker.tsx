import React, { useState, useEffect } from 'react';
import { Globe, ArrowUpRight, Search, Zap, CheckCircle2 } from 'lucide-react';

interface DomainCheckerProps {
  onDomainChange: (domain: string, registerLater: boolean) => void;
}

const DomainChecker: React.FC<DomainCheckerProps> = ({ onDomainChange }) => {
  const [officialDomain, setOfficialDomain] = useState('');
  const [registerLater, setRegisterLater] = useState(true); // Já deixamos como true por padrão para não travar

  useEffect(() => {
    onDomainChange(officialDomain, registerLater);
  }, [officialDomain, registerLater, onDomainChange]);

  return (
    <div className="space-y-4 bg-teal-50/50 p-5 rounded-2xl border border-teal-100">
      {/* Cabeçalho Amigável */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-teal-100 p-2.5 rounded-xl shadow-sm">
          <Globe className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 text-sm">Endereço do Site</h3>
          <p className="text-[11px] text-stone-500 font-medium">Como as pessoas vão te encontrar?</p>
        </div>
      </div>

      {/* Caixa de Mensagem ZING! (Sem Trava) */}
      <div className="bg-white border border-teal-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 blur-[20px] rounded-full pointer-events-none"></div>
        
        <div className="flex items-start gap-3 relative z-10">
          <Zap className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
            <p>
              <strong className="text-stone-800">Criação Instantânea!</strong><br/>
              Ao salvar, seu site será publicado na mesma hora usando um <strong>link gratuito e seguro</strong> gerado pelo nosso sistema.
            </p>
            <p>
              Você não precisa se preocupar com domínio agora. Deixe para configurar o seu endereço personalizado <em>(ex: www.suaempresa.com.br)</em> com calma, direto no seu Painel de Controle, quando o site já estiver no ar!
            </p>
          </div>
        </div>
      </div>

      {/* Opção Avançada (Acordion suave para quem já tem domínio) */}
      <div className="pt-2">
        <label className="flex items-center gap-3 cursor-pointer group p-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors">
          <input 
            type="checkbox" 
            checked={!registerLater}
            onChange={(e) => {
              setRegisterLater(!e.target.checked);
              if (!e.target.checked) setOfficialDomain('');
            }}
            className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4" 
          />
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider group-hover:text-teal-700 transition-colors">
            Eu já comprei um domínio oficial
          </span>
        </label>

        {/* Input revelado apenas se ele marcar que já tem */}
        {!registerLater && (
          <div className="mt-3 p-4 bg-white border border-stone-200 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-2 block">
              Digite seu domínio:
            </label>
            <input 
              type="text" 
              placeholder="ex: suaempresa.com.br"
              value={officialDomain}
              onChange={(e) => setOfficialDomain(e.target.value.toLowerCase())}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-stone-800 placeholder:text-stone-400 font-mono"
            />
            
            <button 
              type="button"
              onClick={() => window.open('https://registro.br/busca-dominio/', '_blank')}
              className="w-full mt-3 bg-stone-100 hover:bg-stone-200 text-stone-600 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-stone-200"
            >
              <Search className="w-3 h-3" />
              Pesquisar domínios no Registro.br <ArrowUpRight className="w-3 h-3 opacity-50" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default DomainChecker;
