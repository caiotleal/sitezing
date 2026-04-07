import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, functions, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Globe, Settings, LogOut, ChevronRight, Eye, Edit3, 
  Search, ShieldAlert, DollarSign, ExternalLink, Loader2, RefreshCw, Save, Trash2, Star, X,
  Layout, CreditCard, Megaphone, FileText, CheckCircle2, MessageSquare, Send, Rocket
} from 'lucide-react';
import { BRAND_LOGO } from './components/brand';

const ADMIN_EMAIL = 'caiotleal@gmail.com';

const CPanel: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showStripeKeys, setShowStripeKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [platformConfigs, setPlatformConfigs] = useState<any>(null);
  const [isSavingConfigs, setIsSavingConfigs] = useState(false);
  const [stats, setStats] = useState({ totalSites: 0, totalRevenue: 0, activeSites: 0, totalUsers: 0 });
  const [view, setView] = useState<'dashboard' | 'editor' | 'users' | 'domains' | 'settings' | 'platform' | 'edit' | 'support'>('dashboard');
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingFormData, setEditingFormData] = useState<any>(null);
  const [manualCss, setManualCss] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingProject, setInspectingProject] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planInterval, setPlanInterval] = useState<'month' | 'year' | 'bimestral' | 'trimestral' | 'semestral' | 'one_time'>('month');
  const [planDescription, setPlanDescription] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planBadge, setPlanBadge] = useState('');
  const [planSortOrder, setPlanSortOrder] = useState('0');
  const [planAllowInstallments, setPlanAllowInstallments] = useState(false);
  const [planMaxInstallments, setPlanMaxInstallments] = useState('12');
  const [planInterestFree, setPlanInterestFree] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [ticketReplyMessage, setTicketReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestLog, setSmtpTestLog] = useState<string | null>(null);
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [isTriggeringRecovery, setIsTriggeringRecovery] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

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
    if (view === 'platform') {
      fetchPlatformConfigs();
      fetchRecentEmailLogs();
    }
    if (view === 'support') fetchSupportTickets();
  }, [view]);

  const fetchRecentEmailLogs = async () => {
    try {
      const listLogsFn = httpsCallable(functions, 'listRecentEmailLogsAdmin');
      const res: any = await listLogsFn();
      setEmailLogs(res.data?.logs || []);
    } catch (err) {
      console.error("Erro ao buscar logs de e-mail:", err);
    }
  };

  const fetchSupportTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const listFn = httpsCallable(functions, 'listSupportTicketsAdmin');
      const res: any = await listFn({});
      setSupportTickets(res.data?.tickets || []);
    } catch (err: any) {
      console.error("Erro fetchSupportTickets:", err);
      alert("Erro ao buscar tickets: " + err.message);
    } finally {
      setIsLoadingTickets(false);
    }
  };

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
      const fetchedProjects = Array.isArray(res.data?.projects) ? res.data.projects : [];
      const fetchedUsers = Array.isArray(res.data?.users) ? res.data.users : [];
      
      setProjects(fetchedProjects.sort((a: any, b: any) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0)));
      setAllUsers(fetchedUsers);

      let revenue = 0;
      fetchedProjects.forEach((p: any) => {
        if (!p) return;
        if (p.status === 'active' || p.status === 'published' || p.subscriptionStatus === 'active' || p.paymentStatus === 'paid') {
          const plan = p.planSelected?.toLowerCase() || p.plan?.toLowerCase() || '';
          if (plan === 'mensal' || p.stripePlanId?.includes('monthly')) revenue += 49.90;
          if (plan === 'anual' || p.stripePlanId?.includes('annual')) revenue += 499.00; 
        }
      });
      
      setStats({
        totalSites: fetchedProjects.length,
        totalRevenue: revenue,
        activeSites: fetchedProjects.filter((p: any) => p && (p.status === 'active' || p.status === 'published')).length,
        totalUsers: fetchedUsers.length
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

  const handleCreateCoupon = async () => {
    if (!couponCode || !couponDiscount) return alert("Preencha todos os campos do cupom.");
    setIsCreatingCoupon(true);
    try {
      const createFn = httpsCallable(functions, 'createStripeCouponAdmin');
      await createFn({ 
        code: couponCode, 
        percent_off: couponType === 'percent' ? couponDiscount : null,
        amount_off: couponType === 'fixed' ? couponDiscount : null
      });
      alert("Cupom criado com sucesso!");
      setCouponCode('');
      setCouponDiscount('');
      fetchPlatformConfigs();
    } catch (err: any) {
      alert("Erro ao criar cupom: " + err.message);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (coupon: any) => {
    if (!confirm(`Deseja remover o cupom ${coupon.code}?`)) return;
    try {
      const deleteFn = httpsCallable(functions, 'deleteStripeCouponAdmin');
      await deleteFn({ couponId: coupon.id, promoId: coupon.promoId, index: projects.indexOf(coupon), code: coupon.code });
      fetchPlatformConfigs();
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    }
  };

  const handleCreatePlan = async () => {
    if (!planName || !planPrice) return alert("Preencha nome e preço.");
    setIsCreatingPlan(true);
    try {
      if (editingPlanId) {
        const updateFn = httpsCallable(functions, 'updateStripePlanAdmin');
        await updateFn({ 
          productId: editingPlanId,
          name: planName, 
          price: planPrice, 
          interval: planInterval, 
          description: planDescription, 
          features: planFeatures.split(',').map(f => f.trim()).filter(f => f),
          badge: planBadge,
          sortOrder: planSortOrder,
          allowInstallments: planAllowInstallments,
          maxInstallments: planMaxInstallments,
          interestFree: planInterestFree
        });
        alert("Plano atualizado com sucesso!");
      } else {
        const createFn = httpsCallable(functions, 'createStripePlanAdmin');
        await createFn({ 
          name: planName, 
          price: planPrice, 
          interval: planInterval, 
          description: planDescription, 
          features: planFeatures.split(',').map(f => f.trim()).filter(f => f),
          badge: planBadge,
          sortOrder: planSortOrder,
          allowInstallments: planAllowInstallments,
          maxInstallments: planMaxInstallments,
          interestFree: planInterestFree
        });
        alert("Plano criado e sincronizado com Stripe!");
      }
       
       setPlanName(''); setPlanPrice(''); setPlanInterval('month'); setPlanDescription(''); setPlanFeatures('');
       setPlanBadge(''); setPlanSortOrder('0'); setPlanAllowInstallments(false); setPlanMaxInstallments('12'); setPlanInterestFree(false);
       setEditingPlanId(null);
      fetchPlatformConfigs();
    } catch (err: any) {
      alert("Erro ao processar plano: " + err.message);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const startEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanPrice(plan.price.toString());
    setPlanInterval(plan.interval);
    setPlanDescription(plan.description || '');
    setPlanFeatures(plan.features?.join(', ') || '');
    setPlanBadge(plan.badge || '');
    setPlanSortOrder((plan.sortOrder || 0).toString());
    setPlanAllowInstallments(!!plan.allowInstallments);
    setPlanMaxInstallments((plan.maxInstallments || 12).toString());
    setPlanInterestFree(!!plan.interestFree);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditPlan = () => {
    setEditingPlanId(null);
    setPlanName(''); setPlanPrice(''); setPlanInterval('month'); setPlanDescription(''); setPlanFeatures('');
    setPlanBadge(''); setPlanSortOrder('0'); setPlanAllowInstallments(false); setPlanMaxInstallments('12');
  };

  const handleDeletePlan = async (plan: any) => {
    if (!confirm(`Deseja remover o plano ${plan.name}? Isso não cancela assinaturas existentes.`)) return;
    try {
      const deleteFn = httpsCallable(functions, 'deleteStripePlanAdmin');
      await deleteFn({ productId: plan.id, priceId: plan.priceId });
      fetchPlatformConfigs();
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
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

  const handleReplyTicket = async (ticket: any) => {
    if (!ticketReplyMessage.trim()) return alert("Digite uma mensagem de resposta.");
    setIsReplying(true);
    try {
      const replyFn = httpsCallable(functions, 'replySupportTicket');
      const res: any = await replyFn({ 
        ticketId: ticket.id, 
        replyMessage: ticketReplyMessage,
        ticketEmail: ticket.email,
        ticketName: ticket.name || "Cliente",
        ticketSubject: ticket.subject
      });
      
      if (res.data?.success) {
        alert("Resposta enviada com sucesso por E-mail ao cliente!");
        setReplyingTicketId(null);
        setTicketReplyMessage('');
        setReplyErrors(prev => {
          const next = { ...prev };
          delete next[ticket.id];
          return next;
        });
        fetchSupportTickets();
      } else {
        const errorStack = [
          `❌ ERRO SMTP: ${res.data.error || 'Falha no envio'}`,
          `Código: ${res.data.code || 'N/A'}`,
          `Comando: ${res.data.command || 'N/A'}`,
          `Stack Trace:`,
          res.data.stack || 'Sem detalhes.'
        ].join('\n');
        
        setReplyErrors(prev => ({ ...prev, [ticket.id]: errorStack }));
      }
    } catch (err: any) {
      setReplyErrors(prev => ({ ...prev, [ticket.id]: `🚫 ERRO FATAL: ${err.message}` }));
    } finally {
      setIsReplying(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!platformConfigs.smtp?.host || !platformConfigs.smtp?.user || !platformConfigs.smtp?.pass) {
      return alert("Preencha Host, Usuário e Senha antes de testar.");
    }
    
    setIsTestingSmtp(true);
    setSmtpTestLog("⏳ Iniciando teste de conexão SMTP...");
    
    try {
      const testFn = httpsCallable(functions, 'testSmtpConfig');
      const res: any = await testFn({ smtpConfig: platformConfigs.smtp });
      
      if (res.data?.success) {
        setSmtpTestLog(`✅ SUCESSO: ${res.data.message}`);
      } else {
        const errorMsg = [
          `❌ FALHA NA CONEXÃO`,
          `Mensagem: ${res.data.error || 'Erro desconhecido'}`,
          `Código: ${res.data.code || 'N/A'}`,
          `Comando: ${res.data.command || 'N/A'}`,
          `Stack Trace:`,
          res.data.stack || 'Sem detalhes disponíveis.'
        ].join('\n');
        setSmtpTestLog(errorMsg);
      }
    } catch (err: any) {
      setSmtpTestLog(`🚫 ERRO DE SOLICITAÇÃO: ${err.message}`);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleTriggerRecovery = async () => {
    if (!confirm("Deseja disparar a campanha de recuperação para todos os sites abandonados nas últimas 24h?")) return;
    setIsTriggeringRecovery(true);
    try {
      const triggerFn = httpsCallable(functions, 'triggerRecoveryManual');
      const res: any = await triggerFn();
      if (res.data?.success) {
        alert(`Campanha finalizada! ${res.data.sentCount} e-mails de recuperação foram enviados.`);
        fetchRecentEmailLogs();
      } else {
        alert("Falha ao disparar campanha: " + (res.data?.message || "Erro desconhecido"));
      }
    } catch (err: any) {
      alert("Erro na solicitação: " + err.message);
    } finally {
      setIsTriggeringRecovery(false);
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

  const uniqueUsers = allUsers.map(user => {
    const userProjects = projects.filter(p => p.uid === user.uid || p.accountEmail === user.email);
    let userRevenue = 0;
    userProjects.forEach(p => {
      if (p.status === 'active' || p.status === 'published' || p.subscriptionStatus === 'active' || p.paymentStatus === 'paid') {
        const plan = p.planSelected?.toLowerCase() || p.plan?.toLowerCase() || '';
        if (plan === 'mensal' || p.stripePlanId?.includes('monthly')) userRevenue += 49.90;
        if (plan === 'anual' || p.stripePlanId?.includes('annual')) userRevenue += 499.00;
      }
    });

    return {
      email: user.email || 'Anônimo',
      uid: user.uid || `user-${Math.random()}`,
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
    <div className="min-h-screen bg-[#FBFBFA] text-[#1C1917] flex flex-col md:flex-row font-[Inter]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200 sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8"><img src={BRAND_LOGO} alt="Logo" className="w-full h-full object-contain" /></div>
          <h1 className="text-sm font-black uppercase italic tracking-tighter">SiteZing <span className="text-orange-600">Admin</span></h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-stone-900 border border-stone-200 rounded-lg">
          {isSidebarOpen ? <X size={20} /> : <Layout size={20} />}
        </button>
      </div>

      <aside className={`
        fixed md:sticky top-0 left-0 w-72 bg-white border-r border-stone-200 h-screen z-50 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-4 hidden md:flex items-center gap-3">
          <div className="w-8 h-8"><img src={BRAND_LOGO} alt="Logo" className="w-full h-full object-contain" /></div>
          <h1 className="text-lg font-black uppercase italic tracking-tighter">SiteZing <span className="text-orange-600">Admin</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <BarChart3 size={18} /> Dashboard
          </button>
          <button onClick={() => { setView('users'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'users' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Users size={18} /> Usuários
          </button>
          <button onClick={() => { setView('domains'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'domains' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Globe size={18} /> Domínios
          </button>
          <button onClick={() => { setView('platform'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'platform' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Layout size={18} /> Plataforma
          </button>
          <button onClick={() => { setView('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Settings size={18} /> Ajustes Admin
          </button>
          <button onClick={() => { setView('support'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'support' ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
            <MessageSquare size={18} /> Suporte e Tickets
          </button>
        </nav>

        <div className="p-4 border-t border-stone-200">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={18} /> Sair do Painel
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight text-stone-900">
            {view === 'dashboard' ? 'Dashboard Geral' : 
             view === 'users' ? 'Gestão de Usuários' :
             view === 'domains' ? 'Gestão de Domínios' :
             view === 'platform' ? 'Configurações da Plataforma' :
             view === 'support' ? 'Central de Atendimento' :
             view === 'settings' ? 'Ajustes Admin' : `Ajuste Admin: ${editingProject?.businessName}`}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-stone-100 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] md:text-[10px] font-black uppercase text-stone-500 tracking-widest hidden sm:inline">{user.email}</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
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
                    <h3 className="text-3xl font-black text-stone-900">{stats.totalUsers}</h3>
                    <p className="text-[11px] text-blue-600 font-bold mt-2">Média {(stats.totalSites / (stats.totalUsers || 1)).toFixed(1)} sites/usuário</p>
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
                      {uniqueUsers.map((u, idx) => (
                        <tr key={u.uid || `u-${idx}`} className="hover:bg-stone-50/50">
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

            {view === 'support' && (
              <motion.div key="support" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase text-stone-900 italic">Caixa de Entrada</h3>
                  <button onClick={fetchSupportTickets} disabled={isLoadingTickets} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={isLoadingTickets ? 'animate-spin' : ''} /> {isLoadingTickets ? 'Buscando...' : 'Atualizar'}
                  </button>
                </div>
                
                {supportTickets.length === 0 && !isLoadingTickets && (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-stone-200 text-center shadow-sm">
                    <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-sm font-black text-stone-500 uppercase tracking-widest">Nenhum chamado aberto!</h4>
                    <p className="text-xs text-stone-400 mt-2 font-medium max-w-sm mx-auto">Sua caixa de suporte está limpa. Todos os clientes estão atendidos.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {supportTickets.map(t => (
                    <div key={t.id} className={`bg-white rounded-3xl p-6 shadow-sm border ${t.status === 'open' ? 'border-indigo-200 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.1)] relative overflow-hidden' : 'border-stone-200 opacity-60'}`}>
                      {t.status === 'open' && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-bl-xl shadow-sm tracking-widest flex items-center gap-1"><Star size={10} /> Aguardando Resposta</div>}
                      
                      <div className="flex items-start justify-between mb-4 mt-2">
                        <div>
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">{t.subject}</div>
                          <h4 className="text-sm font-bold text-stone-900">{t.name || 'Cliente Sem Nome'}</h4>
                          <span className="text-[11px] font-mono text-stone-500">{t.email}</span>
                          <span className="text-[11px] text-stone-400 ml-2 font-medium">{t.phone}</span>
                        </div>
                      </div>

                      <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl mb-4 text-xs text-stone-700 leading-relaxed font-medium">
                        {t.message}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Enviado: {new Date(t.createdAt).toLocaleString()}</span>
                        {t.status === 'open' ? (
                          <button onClick={() => setReplyingTicketId(t.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 transition-colors flex items-center gap-2">
                            <Send size={14} /> Responder C/ E-mail
                          </button>
                        ) : (
                          <span className="bg-stone-100 text-stone-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 size={12} /> Resolvido
                          </span>
                        )}
                      </div>

                      {/* Caixa de Resposta (Abre in-line) */}
                      <AnimatePresence>
                        {replyingTicketId === t.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-indigo-100">
                            <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2 ml-1">Mensagem de Retorno (Envia E-mail)</label>
                            <textarea 
                              className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-sm focus:border-indigo-400 outline-none text-stone-800 min-h-[100px] resize-none mb-3"
                              placeholder={`Olá ${t.name || 'Cliente'}...`}
                              value={ticketReplyMessage}
                              onChange={e => setTicketReplyMessage(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setReplyingTicketId(null); setTicketReplyMessage(''); }} className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Cancelar</button>
                              <button onClick={() => handleReplyTicket(t)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md">
                                {isReplying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar e Fechar Chamado
                              </button>
                            </div>
                            
                            {replyErrors[t.id] && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1 border-b border-red-200 pb-1">Falha no Envio SMTP</p>
                                <pre className="text-[9px] font-mono whitespace-pre-wrap leading-tight text-red-700">
                                  {replyErrors[t.id]}
                                </pre>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  ))}
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
              {/* Gestão Dinâmica de Planos */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><DollarSign size={24} /></div>
                    <h3 className="font-black italic uppercase text-lg">Gestão de Planos (Stripe Sync)</h3>
                  </div>
                  <span className="text-[10px] font-black bg-stone-100 px-3 py-1 rounded-full text-stone-500 uppercase tracking-widest">
                    {platformConfigs.plans?.length || 0} Planos Ativos
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Formulário de Criação */}
                  <div className="lg:col-span-1 space-y-4 border-r border-stone-100 pr-0 lg:pr-8">
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">{editingPlanId ? 'Editar Plano Existente' : 'Novo Plano de Assinatura'}</p>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 ml-1 tracking-widest">Nome do Plano</label>
                      <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ex: Plano Diamond" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 ml-1 tracking-widest">Preço Mensal/Anual (R$)</label>
                      <input type="number" value={planPrice} onChange={e => setPlanPrice(e.target.value)} className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="49.90" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 ml-1 tracking-widest">Recorrência</label>
                      <select value={planInterval} onChange={e => setPlanInterval(e.target.value as any)} className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="month">Mensal</option>
                        <option value="bimestral">Bimestral (2 meses)</option>
                        <option value="trimestral">Trimestral (3 meses)</option>
                        <option value="semestral">Semestral (6 meses)</option>
                        <option value="year">Anual</option>
                        <option value="one_time">Pagamento Único (Avulso)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 ml-1 tracking-widest">Selo de Destaque (Badge)</label>
                      <input type="text" value={planBadge} onChange={e => setPlanBadge(e.target.value)} className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ex: Mais Vendidos" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 ml-1 tracking-widest">Ordem de Exibição (0 = primeiro)</label>
                      <input type="number" value={planSortOrder} onChange={e => setPlanSortOrder(e.target.value)} className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="0" />
                    </div>
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Habilitar Parcelamento?</span>
                        <input type="checkbox" checked={planAllowInstallments} onChange={e => {
                          const checked = e.target.checked;
                          setPlanAllowInstallments(checked);
                          if (checked) setPlanInterval('one_time'); // Trava: Parcelamento exige pagamento único
                        }} className="w-4 h-4 accent-orange-500" />
                      </label>
                      {planAllowInstallments && (
                        <div className="space-y-3 pt-2 border-t border-stone-200">
                          <div>
                            <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 tracking-widest">Máximo de Parcelas (ex: 12)</label>
                            <input type="number" value={planMaxInstallments} onChange={e => setPlanMaxInstallments(e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500" />
                          </div>
                          <label className="flex items-center justify-between cursor-pointer group/toggle">
                            <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest group-hover/toggle:text-orange-500 transition-colors">Assumir Juros (Sem Juros p/ Cliente)</span>
                            <input type="checkbox" checked={planInterestFree} onChange={e => setPlanInterestFree(e.target.checked)} className="w-3.5 h-3.5 accent-orange-500" />
                          </label>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1 ml-1 tracking-widest">Vantagens (Separadas por vírgula)</label>
                      <textarea value={planFeatures} onChange={e => setPlanFeatures(e.target.value)} className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500 h-20" placeholder="Domínio grátis, IA ilimitada, Suporte VIP" />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCreatePlan}
                        disabled={isCreatingPlan}
                        className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                      >
                        {isCreatingPlan ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : (editingPlanId ? 'Salvar Edição' : 'Criar e Sincronizar')}
                      </button>
                      {editingPlanId && (
                        <button 
                          onClick={cancelEditPlan}
                          className="px-4 bg-stone-100 text-stone-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-200 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Listagem de Planos */}
                  <div className="lg:col-span-2 space-y-4">
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Planos Disponíveis no Site</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {platformConfigs.plans && platformConfigs.plans.length > 0 ? (
                        [...platformConfigs.plans].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((p: any) => (
                          <div key={p.id} className="p-5 bg-stone-50 rounded-2xl border border-stone-100 relative group min-h-[140px] flex flex-col justify-between">
                            {p.badge && (
                              <div className="absolute -top-2 -left-2 bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg z-10 transition-transform group-hover:scale-110">
                                {p.badge}
                              </div>
                            )}
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-stone-800 uppercase italic text-sm">{p.name}</h4>
                                <div className="flex gap-1">
                                  <button onClick={() => startEditPlan(p)} className="p-2 text-stone-400 hover:text-orange-500 hover:bg-white rounded-lg transition-all" title="Editar Plano"><Edit3 size={14} /></button>
                                  <button onClick={() => handleDeletePlan(p)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Remover Plano"><Trash2 size={14} /></button>
                                </div>
                              </div>
                              <div className="text-xl font-black text-stone-900 leading-none mb-1">
                                R$ {p.price} <span className="text-[9px] text-stone-400 font-bold uppercase tracking-tight">/ {
                                  p.interval === 'month' ? 'mês' : 
                                  p.interval === 'bimestral' ? 'bimestre' :
                                  p.interval === 'trimestral' ? 'trimestre' :
                                  p.interval === 'semestral' ? 'semestre' : 'ano'
                                }</span>
                              </div>
                              <p className="text-[10px] text-stone-500 line-clamp-1">{p.description}</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {p.features?.slice(0, 3).map((f: string, i: number) => (
                                <span key={i} className="text-[8px] bg-white border border-stone-100 px-2 py-0.5 rounded-full text-stone-400 font-bold uppercase">{f}</span>
                              ))}
                              <p className="text-[8px] font-mono text-stone-300 truncate">ID: {p.priceId}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-12 text-center bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                          <p className="text-xs text-stone-400 font-medium italic">Nenhum plano dinâmico criado.<br/>Crie o primeiro para aparecer no site.</p>
                        </div>
                      )}
                    </div>
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
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Credenciais Stripe</p>
                  <button 
                    onClick={() => setShowStripeKeys(!showStripeKeys)} 
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    {showStripeKeys ? <Eye size={14} /> : <Eye size={14} className="opacity-40" />} 
                    {showStripeKeys ? 'Ocultar Chaves' : 'Visualizar Chaves'}
                  </button>
                </div>
                <div className="space-y-4">
                  {platformConfigs.stripe.mode === 'test' ? (
                    <>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Test Public Key</label>
                        <input type={showStripeKeys ? "text" : "password"} value={platformConfigs.stripe.testPublicKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, testPublicKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Test Secret Key</label>
                        <input type={showStripeKeys ? "text" : "password"} value={platformConfigs.stripe.testSecretKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, testSecretKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Test Webhook Secret</label>
                        <input type={showStripeKeys ? "text" : "password"} value={platformConfigs.stripe.testWebhookSecret || ''} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, testWebhookSecret: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" placeholder="whsec_..." />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Production Public Key</label>
                        <input type={showStripeKeys ? "text" : "password"} value={platformConfigs.stripe.prodPublicKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, prodPublicKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Production Secret Key</label>
                        <input type={showStripeKeys ? "text" : "password"} value={platformConfigs.stripe.prodSecretKey} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, prodSecretKey: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Production Webhook Secret</label>
                        <input type={showStripeKeys ? "text" : "password"} value={platformConfigs.stripe.prodWebhookSecret || ''} onChange={e => setPlatformConfigs({...platformConfigs, stripe: {...platformConfigs.stripe, prodWebhookSecret: e.target.value}})} className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none" placeholder="whsec_..." />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100">
                  <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-500 text-white rounded-lg"><ExternalLink size={16} /></div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-orange-900">Webhook do Stripe</h4>
                    </div>
                    <p className="text-[10px] text-stone-500 font-bold mb-4 leading-relaxed">
                      Siga o link abaixo para configurar o Webhook no seu painel do Stripe (em Desenvolvedores {'->'} Webhooks). Use a URL abaixo e selecione os eventos necessários.
                    </p>
                    <div className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between gap-4">
                      <code className="text-[10px] font-mono font-bold text-orange-600 break-all">https://us-central1-sitezing-4714c.cloudfunctions.net/stripeWebhook</code>
                      <button 
                         onClick={() => { navigator.clipboard.writeText('https://us-central1-sitezing-4714c.cloudfunctions.net/stripeWebhook'); alert('Copiado!'); }}
                         className="flex-shrink-0 p-2 text-stone-400 hover:text-orange-500 transition-all"
                      ><FileText size={18} /></button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <h5 className="text-[9px] font-black uppercase text-stone-800 mb-1">O que configurar no Stripe?</h5>
                      <p className="text-[9px] text-stone-400 font-medium leading-normal">
                        Marque os seguintes eventos: <br/>
                        • <code className="text-orange-600 font-bold italic">checkout.session.completed</code> <br/>
                        • <code className="text-orange-600 font-bold italic">customer.subscription.updated</code> <br/>
                        • <code className="text-orange-600 font-bold italic">customer.subscription.deleted</code> <br/>
                        • <code className="text-orange-600 font-bold italic">invoice.paid</code>
                      </p>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <h5 className="text-[9px] font-black uppercase text-stone-800 mb-1">Importante sobre as chaves</h5>
                      <p className="text-[9px] text-stone-400 font-medium leading-normal">
                        <b>Public Key:</b> Identifica sua conta no seu front-end.<br/>
                        <b>Secret Key:</b> Permite ao servidor realizar cobranças.<br/>
                        <b>Webhook Secret:</b> (Iniciada com <code className="italic font-bold">whsec_</code>) Garante que as notificações sejam autênticas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurações de E-mail (SMTP) */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Globe size={24} /></div>
                    <h3 className="font-black italic uppercase text-lg">E-mail (SMTP)</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center justify-between mb-1">
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-0 ml-1 tracking-widest">Servidor SMTP (Host)</label>
                      <button 
                        onClick={() => setPlatformConfigs({
                          ...platformConfigs, 
                          smtp: {
                            ...(platformConfigs.smtp || {}), 
                            host: 'smtp.gmail.com', 
                            port: '465'
                          }
                        })}
                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1"
                      >
                        ⚡ Auto-Configurar Gmail
                      </button>
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        value={platformConfigs.smtp?.host || ''} 
                        onChange={e => setPlatformConfigs({...platformConfigs, smtp: {...(platformConfigs.smtp || {}), host: e.target.value}})} 
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Porta</label>
                      <input 
                        type="number" 
                        value={platformConfigs.smtp?.port || ''} 
                        onChange={e => setPlatformConfigs({...platformConfigs, smtp: {...(platformConfigs.smtp || {}), port: e.target.value}})} 
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        placeholder="465"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Alias / Remetente</label>
                      <input 
                        type="text" 
                        value={platformConfigs.smtp?.from || ''} 
                        onChange={e => setPlatformConfigs({...platformConfigs, smtp: {...(platformConfigs.smtp || {}), from: e.target.value}})} 
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        placeholder="Suporte@sitezing.com.br"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Usuário SMTP (E-mail)</label>
                      <input 
                        type="text" 
                        value={platformConfigs.smtp?.user || ''} 
                        onChange={e => setPlatformConfigs({...platformConfigs, smtp: {...(platformConfigs.smtp || {}), user: e.target.value}})} 
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        placeholder="usuario@exemplo.com"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Senha SMTP (ou App Password)</label>
                      <input 
                        type="password" 
                        value={platformConfigs.smtp?.pass || ''} 
                        onChange={e => setPlatformConfigs({...platformConfigs, smtp: {...(platformConfigs.smtp || {}), pass: e.target.value}})} 
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="mt-3 bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                    <p className="text-[9px] text-indigo-700 font-bold leading-tight">
                      Para Gmail, gere uma <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-black">Senha de Aplicativo (16 dígitos)</a>. A sua senha normal não funcionará.
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-stone-200 mt-4">
                    <button 
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp}
                      className="w-full bg-stone-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isTestingSmtp ? <Loader2 className="animate-spin w-3 h-3" /> : <RefreshCw size={14} />} 
                      Testar Conexão
                    </button>
                    
                    {smtpTestLog && (
                      <div className="mt-3 p-4 bg-stone-950 rounded-xl overflow-x-auto">
                        <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2 border-b border-stone-800 pb-1">Console SMTP</p>
                        <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed text-indigo-400">
                          {smtpTestLog}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recuperação de Clientes (Marketing) */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Rocket size={120} className="rotate-12 text-stone-900" />
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Rocket size={24} /></div>
                  <h3 className="font-black italic uppercase text-lg">Recuperação de Clientes</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-stone-600 leading-relaxed">
                      O sistema busca automaticamente por sites que foram criados, mas não foram publicados após 24 horas. 
                      Um e-mail amigável é enviado incentivando o cliente a voltar e finalizar o projeto.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleTriggerRecovery}
                        disabled={isTriggeringRecovery}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                      >
                        {isTriggeringRecovery ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Disparar Lembretes Agora (Manual)
                      </button>
                      <p className="text-[9px] text-stone-400 text-center font-bold italic">
                        Nota: A automação roda sozinha a cada 24 horas.
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-3xl p-5 border border-stone-100 flex flex-col">
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-3">Prévia do Texto</p>
                    <div className="space-y-2 flex-1">
                      <div className="mt-1 p-4 bg-white rounded-xl border border-stone-100 text-[10px] font-bold text-stone-500 leading-relaxed">
                        "Olá! Reparamos que você parou... O seu site <span className="text-indigo-600">[Nome do Negócio]</span> está esperando. Não deixe sua ideia esfriar!"
                      </div>
                      <div className="flex justify-center mt-3">
                         <div className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tight">Botão de Link Direto</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela de Logs Recentes */}
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                       <FileText size={14} className="text-stone-300" />
                       Envios das Últimas 24 Horas
                    </h4>
                    <button onClick={fetchRecentEmailLogs} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                      <RefreshCw size={12} className={isTriggeringRecovery ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="bg-stone-50 rounded-[2rem] border border-stone-100 overflow-hidden">
                    {emailLogs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-stone-200/60 text-[8px] font-black uppercase text-stone-400 tracking-tighter">
                              <th className="px-6 py-4">Data/Hora</th>
                              <th className="px-6 py-4">Destinatário</th>
                              <th className="px-6 py-4">Tipo</th>
                              <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-200/40">
                            {emailLogs.map((log) => (
                              <tr key={log.id} className="group hover:bg-white transition-colors">
                                <td className="px-6 py-3 text-[9px] font-bold text-stone-500">
                                  {log.sentAt ? new Date(log.sentAt._seconds * 1000).toLocaleString('pt-BR') : 'Agora'}
                                </td>
                                <td className="px-6 py-3">
                                  <div className="text-[10px] font-black text-stone-800">{log.recipient}</div>
                                  <div className="text-[8px] text-stone-400 truncate max-w-[200px]">{log.subject}</div>
                                </td>
                                <td className="px-6 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                    log.type === 'recovery' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {log.type === 'recovery' ? 'Recuperação' : 'Suporte'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                                  Sucesso
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <p className="text-[10px] text-stone-400 font-bold italic">Nenhum envio registrado nas últimas 24 horas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Marketing e Banners */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Megaphone size={24} /></div>
                    <h3 className="font-black italic uppercase text-lg">Campanhas</h3>
                  </div>
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
                <div className="space-y-6">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Texto do Banner</label>
                    <textarea 
                      value={platformConfigs.marketing.bannerText}
                      onChange={e => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, bannerText: e.target.value}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none h-24"
                      placeholder="Ex: Oferta Limitada!"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['info', 'christmas', 'black-friday', 'warning'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, bannerType: type}})}
                        className={`p-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest ${platformConfigs.marketing.bannerType === type ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200'}`}
                      >
                        {type.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prova Social (Google Reviews) */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Star size={24} /></div>
                    <h3 className="font-black italic uppercase text-lg">Prova Social</h3>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg text-[9px] font-black uppercase text-stone-400">Google Business</div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Nome da Empresa ou Link do Google Maps</label>
                    <div className="flex gap-2 mb-4">
                      <input 
                        className="flex-1 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        placeholder="Ex: SiteZing São Paulo ou Link Completo" 
                        value={platformConfigs?.marketing?.googleSearchQuery || ''} 
                        onChange={e => setPlatformConfigs({...platformConfigs, marketing: {...platformConfigs.marketing, googleSearchQuery: e.target.value}})} 
                      />
                      <button 
                        onClick={async () => {
                          if(!platformConfigs?.marketing?.googleSearchQuery) return;
                          try {
                            const fetchFn = httpsCallable(functions, 'fetchGoogleBusiness');
                            const res: any = await fetchFn({ query: platformConfigs.marketing.googleSearchQuery });
                            if(res.data?.reviews) {
                              setPlatformConfigs({ ...platformConfigs, reviews: res.data.reviews });
                              alert(`${res.data.reviews.length} avaliações capturadas!`);
                            }
                          } catch(e: any) {
                            alert("Erro ao buscar: " + e.message);
                          }
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-xl transition-all"
                        title="Buscar Avaliações"
                      >
                         <RefreshCw size={16}/>
                      </button>
                    </div>

                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Ajuste Manual de Depoimentos (JSON)</label>
                    <textarea 
                      value={JSON.stringify(platformConfigs?.reviews || [], null, 2)}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setPlatformConfigs({...platformConfigs, reviews: parsed});
                        } catch(err) {} 
                      }}
                      className="w-full h-32 px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-orange-500 outline-none overflow-y-auto"
                      placeholder='[ { "author_name": "Nome", "text": "Mensagem", "rating": 5 } ]'
                    />
                  </div>
                  {platformConfigs?.reviews && platformConfigs.reviews.length > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                       <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle2 size={12}/> {platformConfigs.reviews.length} depoimentos ativos
                       </p>
                    </div>
                  ) : (
                    <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl">
                       <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Nenhuma avaliação carregada</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Jurídico e Documentos */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-stone-50 text-stone-600 rounded-2xl"><FileText size={24} /></div>
                  <h3 className="font-black italic uppercase text-lg">Políticas do Site</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Termos de Uso</label>
                    <textarea 
                      value={platformConfigs?.legal?.termsOfUse || ''}
                      onChange={e => setPlatformConfigs({...platformConfigs, legal: {...platformConfigs.legal, termsOfUse: e.target.value}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-3xl text-[10px] font-normal focus:ring-2 focus:ring-orange-500 outline-none h-48 overflow-y-auto"
                      placeholder="Termos de uso..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Política de Privacidade</label>
                    <textarea 
                      value={platformConfigs?.legal?.privacyPolicy || ''}
                      onChange={e => setPlatformConfigs({...platformConfigs, legal: {...platformConfigs.legal, privacyPolicy: e.target.value}})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-3xl text-[10px] font-normal focus:ring-2 focus:ring-orange-500 outline-none h-48 overflow-y-auto"
                      placeholder="Política de privacidade..."
                    />
                  </div>
                </div>
              </div>

              {/* Gestão de Cupons */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm md:col-span-1">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Star size={24} /></div>
                  <h3 className="font-black italic uppercase text-lg">Cupons de Desconto</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Código do Cupom</label>
                      <input 
                        type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-black focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                        placeholder="EX: PROMO10"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Valor</label>
                      <input 
                        type="number" value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)}
                        className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-stone-400 mb-1.5 ml-1 tracking-widest">Tipo</label>
                      <select 
                        value={couponType} onChange={e => setCouponType(e.target.value as any)}
                        className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="percent">% Porcentagem</option>
                        <option value="fixed">R$ Valor Fixo</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={handleCreateCoupon}
                    disabled={isCreatingCoupon || !couponCode || !couponDiscount}
                    className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                  >
                    {isCreatingCoupon ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Criar Cupom Estratégico'}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">Cupons Ativos</p>
                  {platformConfigs.activeCoupons && platformConfigs.activeCoupons.length > 0 ? (
                    platformConfigs.activeCoupons.map((c: any) => (
                      <div key={c.code} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <div>
                          <p className="text-xs font-black text-stone-900">{c.code}</p>
                          <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Desconto: {c.discount}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteCoupon(c)}
                          className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-stone-400 italic">Nenhum cupom ativo no momento.</p>
                  )}
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
