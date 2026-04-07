const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Desktop CPanel: Refactor the tab navigation block
const desktopTabBlockRegex = /\{generatedHtml && \(\(\) => \{[\s\S]*?const currentProject = savedProjects\.find[\s\S]*?return \([\s\S]*?<div className="flex border-b border-stone-200 text-\[10px\] sm:text-\[11px\] font-bold uppercase tracking-wider flex-shrink-0 bg-white">[\s\S]*?<\/div>[\s\S]*?\);\s*\}\)\(\)\}/;

const newDesktopTabBlock = `{(() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  let daysLeft = 0; let isPaid = false;
                  if (currentProject?.expiresAt) {
                    const expirationDate = getExpirationTimestampMs(currentProject.expiresAt);
                    if (expirationDate) {
                      daysLeft = Math.ceil((expirationDate - Date.now()) / (1000 * 3600 * 24));
                    }
                    isPaid = currentProject.paymentStatus === 'paid';
                  }
                  return (
                    <div className="flex border-b border-stone-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-white">
                      <button onClick={() => setActiveTab('dashboard')} className={\`flex-1 py-3 sm:py-3.5 text-center transition-colors \${activeTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}\`}>
                        Meus Sites
                      </button>
                      {generatedHtml && (
                        <>
                          <button onClick={() => setActiveTab('geral')} className={\`flex-1 py-3 sm:py-3.5 text-center transition-colors \${activeTab === 'geral' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}\`}>
                            Visual
                          </button>
                          <button onClick={() => setActiveTab('dominio')} className={\`flex-1 py-3 sm:py-3.5 text-center transition-colors relative \${activeTab === 'dominio' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}\`}>
                            Domínio
                          </button>
                          {currentProjectSlug && (
                            <button onClick={() => setActiveTab('assinatura')} className={\`flex-1 py-3 sm:py-3.5 text-center transition-colors relative \${activeTab === 'assinatura' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}\`}>
                              Plano
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}`;

if (content.match(desktopTabBlockRegex)) {
  content = content.replace(desktopTabBlockRegex, newDesktopTabBlock);
} else {
  console.log("Warning: Desktop Table Block Regex didn't match.");
}

// 2. State Init: Change default activeTab
content = content.replace(/useState<'dashboard' \| 'geral' \| 'dominio' \| 'assinatura' \| 'plataforma'>\('geral'\)/, "useState<'dashboard' | 'geral' | 'dominio' | 'assinatura' | 'plataforma'>('dashboard')");

// 3. Mobile Menu Refactor
content = content.replace(/if \(!isMobile \|\| !generatedHtml\) return null;/, "if (!isMobile) return null;");

const mobileGridRegex = /<div className="grid grid-cols-4 gap-3">[\s\S]*?<\/div>/;
const newMobileGrid = `<div className="grid grid-cols-4 gap-3">
               <button 
                  onClick={() => setActiveMobileSheet(9)}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl active:scale-95 transition-all text-indigo-600 hover:bg-indigo-100"
               >
                 <LayoutDashboard size={16} />
                 <span className="text-[9px] font-bold text-center leading-tight">Meus Sites</span>
               </button>
               {steps.map(s => (
                 <button 
                   key={s.id} 
                   onClick={() => {
                     if (!generatedHtml) {
                       showToast('Gere um site ou selecione um existente primeiro.', 'info');
                       return;
                     }
                     setActiveMobileSheet(s.id);
                   }}
                   className={\`flex flex-col items-center justify-center gap-2 p-3 bg-stone-50 border border-stone-100 rounded-2xl active:scale-95 transition-all text-stone-600 hover:bg-stone-100 \${!generatedHtml ? 'opacity-50 grayscale' : ''}\`}
                 >
                   {s.icon}
                   <span className="text-[9px] font-bold text-center leading-tight">{s.title}</span>
                 </button>
               ))}
             </div>`;

if (content.match(mobileGridRegex)) {
  content = content.replace(mobileGridRegex, newMobileGrid);
}

// 4. Mobile Bottom Sheet Dashboard Content
const mobileSheetContentRegex = /<div className="p-5 overflow-y-auto pb-10 space-y-6 flex-1">/m;
const mobileDashboardContent = `
                 {/* ID 9: Dashboard Mobile */}
                 {activeMobileSheet === 9 && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Seus Projetos</h4>
                       {loggedUserEmail && <button onClick={handleLogout} className="text-[10px] font-bold text-red-500">Sair</button>}
                     </div>
                     {!loggedUserEmail ? (
                        <div className="bg-stone-50 rounded-2xl p-8 border border-stone-100 text-center">
                          <p className="text-xs text-stone-500 font-bold mb-4">Faça login para ver seus sites.</p>
                          <button onClick={() => { setIsLoginOpen(true); setActiveMobileSheet(null); }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">Fazer Login</button>
                        </div>
                     ) : (
                        <div className="space-y-3">
                          {savedProjects.length === 0 ? (
                            <p className="text-[10px] text-stone-400 italic text-center py-6">Nenhum site encontrado.</p>
                          ) : (
                            savedProjects.map(p => (
                              <div key={p.id} className={\`flex items-center gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl \${currentProjectSlug === p.id ? 'ring-2 ring-indigo-500' : ''}\`}>
                                <div className="flex-1 min-w-0">
                                   <p className="text-xs font-bold text-stone-800 truncate">{p.businessName || 'Sem título'}</p>
                                   <p className="text-[9px] font-mono text-stone-400 truncate">{p.publishUrl?.replace('https://', '') || 'Rascunho'}</p>
                                </div>
                                <button onClick={() => { handleLoadProject(p); setActiveMobileSheet(null); }} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase">Editar</button>
                              </div>
                            ))
                          )}
                          <div className="pt-4 border-t border-stone-100 text-center">
                            <button onClick={() => { window.location.reload(); }} className="text-[10px] font-black text-indigo-600 uppercase">+ Criar Novo</button>
                          </div>
                        </div>
                     )}
                   </div>
                 )}
`;

content = content.replace(mobileSheetContentRegex, match => match + mobileDashboardContent);

fs.writeFileSync(file, content, 'utf8');
console.log("Refactor Complete!");
