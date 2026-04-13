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
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-lg text-white truncate pr-2 uppercase italic tracking-tight" title={project.businessName}>
                            {project.businessName || 'Meu Site'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {project.status === 'frozen' ? (
                              <span className="bg-red-500/10 text-red-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/20 shadow-lg shadow-red-500/5 animate-pulse">
                                BLOQUEADO
                              </span>
                            ) : isPaid ? (
                              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                                PLANO ATIVO
                              </span>
                            ) : (
                              <span className="bg-orange-500/10 text-orange-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-orange-500/20">
                                TESTE GRÁTIS
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 bg-red-500/5 hover:bg-red-500/20 text-red-900/40 hover:text-red-500 rounded-lg transition-all"
                          title="Excluir Site Definitivamente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 py-4 border-y border-zinc-800/50">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Endereço:</span>
                          <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[150px]">
                            {project.officialDomain || `${project.internalDomain}.web.app`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expiração:</span>
                          <span className={`text-[11px] font-bold ${daysLeft <= 1 && !isPaid ? 'text-red-400 animate-pulse' : 'text-zinc-300'}`}>
                            {daysLeft} dias restantes
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status DNS:</span>
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                            {project.officialDomain ? (
                              <><Globe size={10} /> CONFIGURADO</>
                            ) : (
                              <><CheckCircle size={10} /> ORIGINAL</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-auto border-t border-zinc-800/50 flex flex-col gap-2">
                       <div className="flex gap-2">
                         <button 
                           onClick={() => onEditProject(project)}
                           className="flex-1 bg-zinc-800 hover:bg-white hover:text-black text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                         >
                           <Edit3 size={14} /> Editar
                         </button>
                         <a 
                           href={`https://${project.officialDomain || `${project.internalDomain}.web.app`}`} 
                           target="_blank" 
                           rel="noreferrer"
                           className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl flex items-center justify-center transition-colors"
                         >
                           <ExternalLink size={14} />
                         </a>
                       </div>
                       
                       <button 
                         onClick={() => onUpgrade(project.id)}
                         className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all shadow-xl
                           ${project.status === 'frozen' || isExpired ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/20' : 
                             isPaid ? 'bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white border border-zinc-700 hover:border-emerald-500' : 
                             'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20'}`}
                       >
                         <CreditCard size={14} /> 
                         {project.status === 'frozen' ? 'Reativar Site Agora' : 
                          isPaid ? 'Gerenciar Assinatura' : 'Assinar Plano Profissional'}
                       </button>
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
