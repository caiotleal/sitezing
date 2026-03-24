import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, functions, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Globe, Settings, LogOut, ChevronRight, Eye, Edit3, 
  Search, ShieldAlert, DollarSign, ExternalLink, Loader2, RefreshCw, Save, Trash2, Star, X,
  Layout, CreditCard, Megaphone, FileText, CheckCircle2
} from 'lucide-react';
import { BRAND_LOGO } from './components/brand';

const ADMIN_EMAIL = 'caiotleal@gmail.com';

const CPanel: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [platformConfigs, setPlatformConfigs] = useState<any>(null);
  const [isSavingConfigs, setIsSavingConfigs] = useState(false);
  const [stats, setStats] = useState({ totalSites: 0, totalRevenue: 0, activeSites: 0 });
  const [view, setView] = useState<'dashboard' | 'editor' | 'users' | 'domains' | 'settings' | 'platform' | 'edit'>('dashboard');
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingFormData, setEditingFormData] = useState<any>(null);
  const [manualCss, setManualCss] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingProject, setInspectingProject] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const fetchPlatformConfigs = async () => {
    try {
      const getConfigs = httpsCallable(functions, 'getPlatformConfigs');
      const result: any = await getConfigs();
      setPlatformConfigs(result.data);
    } catch (error) {
      console.error("Erro ao buscar configurações da plataforma:", error);
    }
  };

  const savePlatformConfigs = async () => {
    setIsSavingConfigs(true);
    try {
      const updateConfigs = httpsCallable(functions, 'updatePlatformConfigs');
      await updateConfigs({ configs: platformConfigs });
      alert("Configurações atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Falha ao salvar configurações.");
    } finally {
      setIsSavingConfigs(false);
    }
  };

  useEffect(() => {
    if (view === 'platform') fetchPlatformConfigs();
  }, [view]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && u.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setUser(u);
        fetchAdminData();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    document.body.style.backgroundColor = '#FBFBFA';
    document.body.style.color = '#1C1917';
    
    return () => {
      unsubscribe();
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error("Este e-mail não tem permissão de administrador.");
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message || "Erro desconhecido ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const listFn = httpsCallable(functions, 'listAllProjectsAdmin');
      const res: any = await listFn({});
      const allProjects = Array.isArray(res.data?.projects) ? res.data.projects : [];
      // Ordenar por data de criação (se houver) decrescente
      setProjects(allProjects.sort((a,b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0)));

      let revenue = 0;
      allProjects.forEach((p: any) => {
        if (!p) return;
        // Considerar tanto status de publicação quanto status de pagamento/assinatura
        if (p.status === 'active' || p.status === 'published' || p.subscriptionStatus === 'active' || p.paymentStatus === 'paid') {
          const plan = p.planSelected?.toLowerCase() || p.plan?.toLowerCase() || '';
          if (plan === 'mensal' || p.stripePlanId?.includes('monthly')) revenue += 49.90;
          if (plan === 'anual' || p.stripePlanId?.includes('annual')) revenue += 499.00; 
        }
      });
      
      setStats({
        totalSites: allProjects.length,
        totalRevenue: revenue,
        activeSites: allProjects.filter((p: any) => p && (p.status === 'active' || p.status === 'published')).length
      });
    } catch (err: any) {
      console.error("Erro fetchAdminData:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Tem certeza que deseja APAGAR DEFINITIVAMENTE este site e todos os seus dados?")) return;
    try {
      const deleteFn = httpsCallable(functions, 'deleteProjectAdmin');
      await deleteFn({ projectId });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      alert("Projeto apagado com sucesso.");
    } catch (err: any) {
      alert("Erro ao apagar: " + err.message);
    }
  };

  const handleOpenEditor = (project: any) => {
    setEditingProject(project);
    setEditingFormData(project.formData || {});
    setManualCss(project.manualCss || '');
    setView('editor');
  };

  const handleSaveManualChanges = async () => {
    if (!editingProject) return;
    setIsSaving(true);
    try {
      // Aqui usamos a função admin que agora deve aceitar formData também ou apenas manualCss
      // Vou atualizar a função no index.js para aceitar formData.
      const updateFn = httpsCallable(functions, 'updateProjectAdminManual');
      await updateFn({ 
        projectId: editingProject.id, 
        manualCss,
        formData: editingFormData
      });
      alert('Alterações salvas com sucesso!');
      fetchAdminData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setEditingFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Helper selectors
  const filteredProjects = projects.filter(p => 
    p.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.accountEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueUsers = Array.from(new Set(projects.map(p => p.accountEmail))).map(email => {
    const userProjects = projects.filter(p => p.accountEmail === email);
    let userRevenue = 0;
    userProjects.forEach(p => {
      if (p.status === 'active' || p.status === 'published' || p.subscriptionStatus === 'active' || p.paymentStatus === 'paid') {
        const plan = p.planSelected?.toLowerCase() || p.plan?.toLowerCase() || '';
        if (plan === 'mensal' || p.stripePlanId?.includes('monthly')) userRevenue += 49.90;
        if (plan === 'anual' || p.stripePlanId?.includes('annual')) userRevenue += 499.00;
      }
    });

    return {
      email: email || 'Anônimo',
      count: userProjects.length,
      active: userProjects.filter(p => p.status === 'active' || p.status === 'published').length,
      revenue: userRevenue
    };
  });

  const domains = projects.filter(p => p.officialDomain && p.officialDomain !== 'Pendente').map(p => ({
    id: p.id,
    businessName: p.businessName,
    domain: p.officialDomain,
    status: p.domainStatus || 'PENDING',
    internal: `${p.internalDomain}.sitezing.com.br`
  }));

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Processando...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full border border-stone-200"
      >
        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8 p-4">
          <img src={BRAND_LOGO} alt="Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-2 uppercase italic">Admin Portal</h1>
        <p className="text-stone-400 text-[10px] mb-10 font-black uppercase tracking-widest">Painel de Controle SiteZing</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Username / Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
            required
          />
          <input 
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
            required
          />
          {authError && <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{authError}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-stone-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-stone-800 transition-all shadow-xl text-xs flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Acessar Sistema"}
          </button>
        </form>
      </motion.div>
    </div>
  );

  if (view === 'platform' && !platformConfigs) return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Carregando Configurações...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1C1917] flex font-[Inter]">
      <aside className="w-72 bg-white border-r border-stone-200 h-screen sticky top-0 flex flex-col">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-8 h-8"><img src={BRAND_LOGO} alt="Logo" className="w-full h-full object-contain" /></div>
          <h1 className="text-lg font-black uppercase italic tracking-tighter">SiteZing <span className="text-orange-600">Admin</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <BarChart3 size={18} /> Dashboard
          </button>
          <button onClick={() => setView('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'users' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Users size={18} /> Usuários
          </button>
          <button onClick={() => setView('domains')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'domains' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Globe size={18} /> Domínios
          </button>
          <button onClick={() => setView('platform')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'platform' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Layout size={18} /> Plataforma
          </button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Settings size={18} /> Ajustes Admin
          </button>
        </nav>

        <div className="p-4 border-t border-stone-200">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={18} /> Sair do Painel
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-stone-900">
            {view === 'dashboard' ? 'Dashboard Geral' : 
             view === 'users' ? 'Gestão de Usuários' :
             view === 'domains' ? 'Gestão de Domínios' :
             view === 'platform' ? 'Configurações da Plataforma' :
             view === 'settings' ? 'Ajustes Admin' : `Ajuste Admin: ${editingProject?.businessName}`}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-stone-100 px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">{user.email}</span>
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Globe size={48} className="text-orange-500" /></div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Total de Sites</p>
                    <h3 className="text-3xl font-black text-stone-900">{stats.totalSites}</h3>
                    <p className="text-[11px] text-emerald-600 font-bold mt-2">+{stats.activeSites} ativos agora</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={48} className="text-emerald-500" /></div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Receita Mensal Est.</p>
                    <h3 className="text-3xl font-black text-stone-900">R$ {stats.totalRevenue.toFixed(2)}</h3>
                    <p className="text-[11px] text-stone-400 font-medium mt-2">Baseado em assinaturas ativas</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={48} className="text-blue-500" /></div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Total de Clientes</p>
                    <h3 className="text-3xl font-black text-stone-900">{uniqueUsers.length}</h3>
                    <p className="text-[11px] text-blue-600 font-bold mt-2">Média {(stats.totalSites / (uniqueUsers.length || 1)).toFixed(1)} sites/usuário</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-stone-200 flex items-center justify-between">
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar site, dono ou Stripe ID..." className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500 transition-all font-medium" />
                    </div>
                    <button onClick={fetchAdminData} className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"><RefreshCw size={20} /></button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Projeto / Proprietário</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Criação</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Valor</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Assinatura</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Site</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredProjects.map((p: any) => (
                          <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-stone-900">{p.businessName}</div>
                              <div className="text-[10px] text-stone-500 mt-0.5">{p.accountEmail || 'Desconhecido'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-bold text-stone-700">
                                {p.createdAt?._seconds ? new Date(p.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-bold text-stone-700">
                                {p.planSelected === 'mensal' || p.plan === 'mensal' ? 'R$ 49,90' : p.planSelected === 'anual' || p.plan === 'anual' ? 'R$ 499,00' : 'R$ 0,00'}
                              </div>
                              <div className="text-[9px] text-stone-400 font-mono">{p.stripeSubscriptionId || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                (p.subscriptionStatus === 'active' || p.paymentStatus === 'paid') && !p.cancelAtPeriodEnd ? 'bg-emerald-100 text-emerald-700' : 
                                p.cancelAtPeriodEnd ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {p.cancelAtPeriodEnd ? 'CANCELADA' : 
                                 (p.subscriptionStatus === 'active' || p.paymentStatus === 'paid' ? 'ATIVA' : 'INATIVA')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                p.status === 'active' || p.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 
                                p.status === 'frozen' ? 'bg-blue-100 text-blue-700' : 
                                p.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {p.status || 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a href={`https://${p.internalDomain}.sitezing.com.br`} target="_blank" className="p-2 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Ver Site"><Eye size={16} /></a>
                                <button onClick={() => setInspectingProject(p)} className="p-2 text-stone-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all" title="Ver JSON Bruto"><Search size={16} /></button>
                                <button onClick={() => handleOpenEditor(p)} className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Editar Admin"><Edit3 size={16} /></button>
                                <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Apagar Site"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">E-mail do Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Qtd Sites</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Sites Ativos</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Receita Estimada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {uniqueUsers.map(u => (
                        <tr key={u.email} className="hover:bg-stone-50/50">
                          <td className="px-6 py-4 font-bold text-stone-900">{u.email}</td>
                          <td className="px-6 py-4 text-xs font-bold">{u.count}</td>
                          <td className="px-6 py-4 text-xs font-bold text-emerald-600">{u.active}</td>
                          <td className="px-6 py-4 text-xs font-black">R$ {u.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'domains' && (
              <motion.div key="domains" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Projeto</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Domínio Oficial</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Redirecionamento</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Status DNS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {domains.map(d => (
                        <tr key={d.id} className="hover:bg-stone-50/50">
                          <td className="px-6 py-4 font-bold text-stone-900">{d.businessName}</td>
                          <td className="px-6 py-4 text-xs font-mono text-blue-600">{d.domain}</td>
                          <td className="px-6 py-4 text-xs font-mono text-stone-400">{d.internal}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'platform' && platformConfigs && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black text-stone-900 italic uppercase">Configurações Globais</h2>
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">Gerencie chaves, preços e campanhas da plataforma</p>
              </div>
              <button 
                onClick={savePlatformConfigs}
                disabled={isSavingConfigs}
                className="flex items-center gap-2 bg-stone-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50"
              >
                {isSavingConfigs ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />}
                {isSavingConfigs ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Vendas e Planos */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><DollarSign size={24} /></div>
                  <h3 className="font-black italic uppercase text-lg">Vendas e Planos</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Preço Mensal (BRL)</label>
                    <input 
                      type="number" step="0.01" value={platformConfigs.pricing.mensal} 
                      onChange={e => setPlatformConfigs({...platformConfigs, pricing: {...platformConfigs.pricing, mensal: parseFloat(e.target.value)}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Preço Anual (BRL)</label>
                    <input 
                      type="number" step="0.01" value={platformConfigs.pricing.anual} 
                      onChange={e => setPlatformConfigs({...platformConfigs, pricing: {...platformConfigs.pricing, anual: parseFloat(e.target.value)}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Cupom de Boas-vindas</label>
                    <input 
                      type="text" value={platformConfigs.marketing.couponCode || ''} 
                      onChange={e => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, couponCode: e.target.value.toUpperCase()}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-stone-300"
                      placeholder="EX: SITEZING10"
                    />
                  </div>
                </div>
              </div>

              {/* Integração Stripe */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={24} /></div>
                    <h3 className="font-black italic uppercase text-lg">Gateway Stripe</h3>
                  </div>
                  <select 
                    value={platformConfigs.stripe.mode} 
                    onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, mode: e.target.value}})}
                    className="text-[10px] font-black uppercase tracking-widest bg-stone-100 px-3 py-1.5 rounded-full outline-none border-none cursor-pointer"
                  >
                    <option value="test">Teste</option>
                    <option value="prod">Produção</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {platformConfigs.stripe.mode === 'test' ? (
                    <>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Test Public Key</label>
                        <input type="password" value={platformConfigs.stripe.testPublicKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, testPublicKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Test Secret Key</label>
                        <input type="password" value={platformConfigs.stripe.testSecretKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, testSecretKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Production Public Key</label>
                        <input type="password" value={platformConfigs.stripe.prodPublicKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, prodPublicKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Production Secret Key</label>
                        <input type="password" value={platformConfigs.stripe.prodSecretKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, prodSecretKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Marketing e Banners */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Megaphone size={24} /></div>
                    <h3 className="font-black italic uppercase text-lg">Campanhas e Banners</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Ativar Banner</span>
                    <button 
                      onClick={() => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, bannerActive: !platformConfigs.marketing.bannerActive}})}
                      className={`w-12 h-6 rounded-full relative transition-all ${platformConfigs.marketing.bannerActive ? 'bg-orange-500' : 'bg-stone-200'}`}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: platformConfigs.marketing.bannerActive ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Texto do Banner Digital</label>
                    <textarea 
                      value={platformConfigs.marketing.bannerText}
                      onChange={e => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, bannerText: e.target.value}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none h-32"
                      placeholder="Ex: Oferta Limitada! Use o cupom BLACK60 para 60% de desconto no plano anual."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Estilo Visual da Campanha</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['info', 'christmas', 'black-friday', 'warning'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, bannerType: type}})}
                          className={`p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${platformConfigs.marketing.bannerType === type ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200'}`}
                        >
                          {type.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Jurídico e Documentos */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-stone-50 text-stone-600 rounded-2xl"><FileText size={24} /></div>
                  <h3 className="font-black italic uppercase text-lg">Termos e Políticas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Termos de Uso</label>
                    <textarea 
                      value={platformConfigs.legal.termsOfUse}
                      onChange={e => setPlatformConfigs({...platformConfigs, legal: {...platformConfigs.legal, termsOfUse: e.target.value}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-3xl text-[10px] font-normal focus:ring-2 focus:ring-orange-500 outline-none h-64 overflow-y-auto"
                      placeholder="Cole aqui os termos de uso da sua plataforma..."
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Política de Privacidade</label>
                    <textarea 
                      value={platformConfigs.legal.privacyPolicy}
                      onChange={e => setPlatformConfigs({...platformConfigs, legal: {...platformConfigs.legal, privacyPolicy: e.target.value}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-3xl text-[10px] font-normal focus:ring-2 focus:ring-orange-500 outline-none h-64 overflow-y-auto"
                      placeholder="Cole aqui a política de privacidade..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl space-y-6">
                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                  <h3 className="text-lg font-black uppercase italic">Configurações Gerais</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold">Modo de Manutenção</p>
                        <p className="text-[10px] text-stone-500">Bloqueia o acesso de todos os clientes ao criador.</p>
                      </div>
                      <div className="w-12 h-6 bg-stone-200 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'editor' && (
              <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Sidebar de Edição */}
                  <div className="lg:col-span-1 space-y-6 overflow-y-auto max-h-[800px] pr-2">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2"><Settings size={14}/> Dados do Projeto</h4>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">Nome do Negócio</label>
                        <input type="text" value={editingFormData.businessName || ''} onChange={e => updateField('businessName', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">WhatsApp</label>
                        <input type="text" value={editingFormData.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">Instagram</label>
                        <input type="text" value={editingFormData.instagram || ''} onChange={e => updateField('instagram', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">E-mail de Contato</label>
                        <input type="email" value={editingFormData.email || ''} onChange={e => updateField('email', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">Facebook</label>
                        <input type="text" value={editingFormData.facebook || ''} onChange={e => updateField('facebook', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">TikTok</label>
                        <input type="text" value={editingFormData.tiktok || ''} onChange={e => updateField('tiktok', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">Link iFood</label>
                        <input type="text" value={editingFormData.ifood || ''} onChange={e => updateField('ifood', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase text-stone-400">Endereço</label>
                        <textarea value={editingFormData.address || ''} onChange={e => updateField('address', e.target.value)} className="w-full h-20 bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                      <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Injeção de CSS</h4>
                      <textarea value={manualCss} onChange={(e) => setManualCss(e.target.value)} placeholder="/* Ex: .hero-title { color: #f97316 !important; } */" className="w-full h-60 bg-stone-900 text-emerald-400 font-mono text-[10px] p-4 rounded-xl focus:outline-none border-2 border-transparent focus:border-orange-500 transition-all shadow-inner" />
                    </div>
                  </div>

                  {/* Preview e Ações */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-2xl overflow-hidden flex flex-col h-[800px]">
                      <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-200"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-200"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-200"></div>
                          </div>
                          <div className="bg-white border border-stone-200 rounded-lg px-4 py-1.5 text-[11px] text-stone-400 font-mono shadow-sm">
                            {editingProject?.internalDomain}.sitezing.com.br
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setView('dashboard')} className="px-6 py-2 bg-stone-100 text-stone-600 font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-stone-200 transition-all">Sair</button>
                          <button onClick={handleSaveManualChanges} disabled={isSaving} className="px-8 py-2 bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-orange-600 transition-all shadow-md flex items-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin w-3 h-3" /> : <Save size={14} />} Salvar Site
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 bg-stone-100 relative">
                        <div className="absolute inset-0 bg-white">
                          <style dangerouslySetInnerHTML={{ __html: manualCss }} />
                          <iframe src={`https://${editingProject?.internalDomain}.sitezing.com.br?preview=true&v=${Date.now()}`} className="w-full h-full border-none" title="Project Preview" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Settings size={18}/></div>
                      <p className="text-[11px] text-orange-700 font-bold leading-tight">Ao salvar, o sistema irá regenerar o HTML estático do cliente com os novos dados de formulário e CSS informados ao lado.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal de Inspeção de JSON */}
          <AnimatePresence>
            {inspectingProject && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-stone-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase italic">Universal Inspector</h3>
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-1">Firestore Record: {inspectingProject.id}</p>
                    </div>
                    <button onClick={() => setInspectingProject(null)} className="p-3 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-all"><X size={20} className="" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-stone-50">
                    <pre className="text-[11px] font-mono text-stone-800 bg-white p-6 rounded-2xl border border-stone-200 shadow-inner overflow-x-auto">
                      {JSON.stringify(inspectingProject, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default CPanel;
