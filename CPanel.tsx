import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, functions, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Globe, Settings, LogOut, ChevronRight, Eye, Edit3, 
  Search, ShieldAlert, DollarSign, ExternalLink, Loader2, RefreshCw, Save, Trash2, Star
} from 'lucide-react';
import { BRAND_LOGO } from './components/brand';

const ADMIN_EMAIL = 'caiotleal@gmail.com';

const CPanel: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSites: 0, totalRevenue: 0, activeSites: 0 });
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [editingProject, setEditingProject] = useState<any>(null);
  const [manualCss, setManualCss] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setUser(u);
        fetchAdminData();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    // Forçar fundo branco para o painel admin (sobrescrever index.html)
    document.body.style.backgroundColor = '#FBFBFA';
    document.body.style.color = '#1C1917';
    
    return () => {
      unsub();
      // Resetar ao sair (opcional, mas bom para o App principal)
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      console.log("Iniciando login admin:", email);
      if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error("Este e-mail não tem permissão de administrador.");
      }
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login Firebase aceito.");
    } catch (err: any) {
      console.error("Erro no login admin:", err);
      setAuthError(err.message || "Erro desconhecido ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      console.log("Solicitando listAllProjectsAdmin...");
      const listFn = httpsCallable(functions, 'listAllProjectsAdmin');
      const res: any = await listFn({});
      console.log("Resposta recebida:", res.data);
      
      const allProjects = Array.isArray(res.data?.projects) ? res.data.projects : [];
      setProjects(allProjects);

      // Calc stats
      let revenue = 0;
      allProjects.forEach((p: any) => {
        if (!p) return;
        if (p.status === 'active' || p.status === 'published') {
          if (p.plan === 'monthly') revenue += 49.90;
          if (p.plan === 'annual') revenue += 41.58; 
        }
      });
      
      setStats({
        totalSites: allProjects.length,
        totalRevenue: revenue,
        activeSites: allProjects.filter((p: any) => p && (p.status === 'active' || p.status === 'published')).length
      });
    } catch (err: any) {
      console.error("ERRO CRÍTICO no fetchAdminData:", err);
      // fallback for safety
      setProjects([]);
      setStats({ totalSites: 0, totalRevenue: 0, activeSites: 0 });
    }
  };

  const handleOpenEditor = (project: any) => {
    setEditingProject(project);
    setManualCss(project.manualCss || '');
    setView('editor');
  };

  const handleSaveManualChanges = async () => {
    if (!editingProject) return;
    setIsSaving(true);
    try {
      const updateFn = httpsCallable(functions, 'updateProjectAdminManual');
      await updateFn({ 
        projectId: editingProject.id, 
        manualCss 
      });
      alert('Alterações salvas com sucesso!');
      fetchAdminData();
    } catch (err) {
      alert('Erro ao salvar: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full"
      >
        <ShieldAlert className="w-16 h-16 text-orange-500 mb-6 mx-auto" />
        <h1 className="text-2xl font-black text-stone-900 mb-2 uppercase italic">Admin Login</h1>
        <p className="text-stone-500 text-sm mb-8 font-medium">Acesso exclusivo para gestão SiteZing.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-stone-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
            required
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-stone-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
            required
          />
          
          {authError && <p className="text-xs text-red-500 font-bold">{authError}</p>}
          
          <button 
            type="submit"
            className="w-full py-4 bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all shadow-lg text-sm"
          >
            Entrar no cPanel
          </button>
        </form>

        <button 
          onClick={() => window.location.href = '/'} 
          className="mt-6 text-[10px] font-black uppercase text-stone-400 tracking-widest hover:text-stone-600 transition-colors"
        >
          Voltar ao Site Principal
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col flex-shrink-0">
        <div className="p-8 border-b border-stone-200">
          <img src={BRAND_LOGO} alt="SiteZing" className="h-8 w-auto mb-2" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Admin Control Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <BarChart3 size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-50 transition-all">
            <Users size={18} /> Usuários
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-50 transition-all">
            <Globe size={18} /> Domínios
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-50 transition-all">
            <Settings size={18} /> Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-stone-200">
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-xl font-black uppercase italic tracking-tight">
            {view === 'dashboard' ? 'Gestão de Plataforma' : `Ajuste Manual: ${editingProject?.businessName}`}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-stone-100 px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">{user.email}</span>
            </div>
            {view === 'editor' && (
              <button 
                onClick={() => setView('dashboard')}
                className="bg-stone-100 text-stone-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div 
                key="dash"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Globe size={48} className="text-orange-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Total de Sites</p>
                    <h3 className="text-3xl font-black text-stone-900">{stats.totalSites}</h3>
                    <p className="text-[11px] text-emerald-600 font-bold mt-2">+{stats.activeSites} ativos agora</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <DollarSign size={48} className="text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Receita Mensal Est.</p>
                    <h3 className="text-3xl font-black text-stone-900">R$ {stats.totalRevenue.toFixed(2)}</h3>
                    <p className="text-[11px] text-stone-400 font-medium mt-2">Baseado em assinaturas ativas</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users size={48} className="text-blue-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Novos Leads (24h)</p>
                    <h3 className="text-3xl font-black text-stone-900">12</h3>
                    <p className="text-[11px] text-blue-600 font-bold mt-2">Taxa de conversão: 8%</p>
                  </div>
                </div>

                {/* Projects Table */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-stone-200 flex items-center justify-between">
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar site, dono ou domínio..." 
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <button onClick={fetchAdminData} className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                      <RefreshCw size={20} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Negócio / Cliente</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Domínio</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Receita</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {projects.map((p: any) => (
                          <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-stone-900 border-b border-transparent group-hover:border-stone-900 inline-block">{p.businessName}</div>
                              <div className="text-[10px] text-stone-400 mt-0.5">{p.ownerEmail || 'Anônimo'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600">
                                {p.internalDomain}.sitezing.com.br
                                <a href={`https://${p.internalDomain}.sitezing.com.br`} target="_blank" className="text-stone-300 hover:text-blue-500 transition-colors"><ExternalLink size={12}/></a>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                p.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {p.status || 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-bold text-stone-900">R$ {p.plan === 'monthly' ? '49,90' : p.plan === 'annual' ? '499,00' : '0,00'}</div>
                              <div className="text-[9px] text-stone-400 uppercase font-black">{p.plan || 'Nenhum'}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button title="Ver Site" className="p-2 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={16} /></button>
                                <button 
                                  onClick={() => handleOpenEditor(p)}
                                  title="Ajuste Manual Advanced" 
                                  className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Advanced Editor Panel */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2">
                      <Settings size={14}/> Estilos Manuais (CSS)
                    </h4>
                    <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">Injete CSS personalizado para este site. Útil para corrigir contrastes ou ajustes finos de layout.</p>
                    
                    <textarea 
                      value={manualCss}
                      onChange={(e) => setManualCss(e.target.value)}
                      placeholder="/* Ex: .hero-title { color: #f97316 !important; } */"
                      className="w-full h-80 bg-stone-900 text-emerald-400 font-mono text-xs p-4 rounded-xl focus:outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                    />

                    <button 
                      onClick={handleSaveManualChanges}
                      disabled={isSaving}
                      className="w-full mt-4 bg-orange-500 text-white font-black uppercase tracking-widest py-3 rounded-xl hover:bg-orange-600 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />}
                      Salvar Ajustes
                    </button>
                  </div>

                  <div className="bg-stone-100 p-6 rounded-2xl border border-stone-200">
                    <h4 className="text-[11px] font-black uppercase text-stone-500 tracking-widest mb-3">Dica de Admin</h4>
                    <p className="text-[10px] text-stone-600 leading-relaxed italic">Use seletores específicos do template. Injetar com !important garante a sobreposição dos estilos gerados pela IA.</p>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden flex flex-col h-[750px]">
                    <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-300"></div>
                      </div>
                      <div className="bg-white border border-stone-200 rounded px-3 py-1 flex-1 text-[10px] text-stone-400 font-mono">
                        {editingProject?.internalDomain}.sitezing.com.br
                      </div>
                    </div>
                    <div className="flex-1 bg-stone-100 relative">
                       {/* Simulação do Iframe com os estilos aplicados */}
                       <div className="absolute inset-0 bg-white">
                         <style dangerouslySetInnerHTML={{ __html: manualCss }} />
                         <iframe 
                           src={`https://${editingProject?.internalDomain}.sitezing.com.br?preview=true`} 
                           className="w-full h-full border-none"
                           title="Project Preview"
                         />
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default CPanel;
