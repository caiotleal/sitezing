import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Edit3, CreditCard, ExternalLink, Globe, LayoutDashboard, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  businessName: string;
  internalDomain: string;
  officialDomain?: string;
  createdAt: any;
  expiresAt?: any;
  status: 'active' | 'expired' | 'pending' | 'frozen';
  isPaid?: boolean;
  paymentStatus?: 'paid' | 'trial' | 'expired' | 'pending';
}

interface ClientDashboardProps {
  projects: Project[];
  userEmail: string;
  onEditProject: (project: Project) => void;
  onUpgrade: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onClose: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ projects, userEmail, onEditProject, onUpgrade, onDeleteProject, onClose }) => {
  
  const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
    return null;
  };

  const calculateDaysLeft = (project: Project) => {
    let expirationDate = toDate(project.expiresAt);

    if (!expirationDate) {
      const createdDate = toDate(project.createdAt);
      if (!createdDate) return 0;
      expirationDate = new Date(createdDate);
      expirationDate.setDate(expirationDate.getDate() + 7);
    }

    const diffTime = expirationDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0c0c0e] w-full max-w-5xl h-[85vh] rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="bg-zinc-900/50 border-b border-zinc-800 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-xl">
              <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Meu Painel de Controle</h2>
              <p className="text-sm text-zinc-400">Bem-vindo(a), {userEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors font-semibold text-sm px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">
            Voltar ao Editor
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <Globe className="w-16 h-16 opacity-20" />
              <p>Você ainda não criou nenhum site.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const daysLeft = calculateDaysLeft(project);
                const isPaid = Boolean(project.isPaid || project.paymentStatus === 'paid');
                const isExpired = !isPaid && daysLeft === 0;

                return (
                  <motion.div 
                    key={project.id}
                    whileHover={{ y: -4 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between group transition-colors hover:border-zinc-700"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-white truncate pr-2" title={project.businessName}>
                          {project.businessName || 'Meu Site'}
                        </h3>
                        <button 
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          title="Excluir Site Definitivamente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {project.status === 'frozen' ? (
                          <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-red-500/20 shadow-lg shadow-red-500/5 animate-pulse">
                            <AlertCircle size={10} /> SITE BLOQUEADO
                          </span>
                        ) : isPaid ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <CheckCircle size={10} /> PLANO ATIVO
                          </span>
                        ) : isExpired ? (
                          <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-red-500/20 shadow-lg shadow-red-500/5">
                            <AlertCircle size={10} /> TESTE EXPIRADO
                          </span>
                        ) : (
                          <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-orange-500/20 animate-pulse shadow-lg shadow-orange-500/5">
                            <Clock size={10} /> {daysLeft} DIAS DE TESTE
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                          <Globe size={12} /> {project.internalDomain}.web.app
                        </p>
                      </div>
                    </div>

                    {!isPaid && (
                      <div className="mt-5 mb-2">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5 font-medium">
                          <span>Período de Teste</span>
                          <span className={isExpired ? 'text-red-400' : 'text-zinc-300'}>
                            {isExpired ? 'Esgotado' : `${7 - daysLeft} de 7 dias`}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isExpired ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${isExpired ? 100 : ((7 - daysLeft) / 7) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-5 mt-auto border-t border-zinc-800/50 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onEditProject(project)}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Edit3 size={14} /> Editar Site
                        </button>
                        <a 
                          href={`https://${project.internalDomain}.web.app`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl flex items-center justify-center transition-colors"
                          title="Acessar Site"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      
                      {!isPaid && (
                        <button 
                          onClick={() => onUpgrade(project.id)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                            ${isExpired ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                          <CreditCard size={14} /> 
                          {isExpired ? 'Desbloquear Site Agora' : 'Ativar Plano Premium'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ClientDashboard;
