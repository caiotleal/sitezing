const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Move currentProject logic out of the generatedHtml check in the CPanel
// and refactor the tabs to be more global.

const cpanelStartRegex = /\{isMenuOpen && !isMobile && \(\s*<motion\.div[\s\S]*?className="flex-shrink-0 h-full flex flex-col justify-center overflow-hidden relative z-50 bg-\[#FAFAF9\] w-full md:w-\[420px\] py-4"\s*>\s*<motion\.div[\s\S]*?className="w-full h-full lg:aspect-\[16\/9\] lg:max-h-\[min\(90vh,900px\)\] lg:mx-auto lg:my-auto bg-\[#F8FAFC\] border border-stone-200 lg:rounded-\[2rem\] rounded-none shadow-xl flex flex-col overflow-hidden relative"\s*>\s*<div className="flex justify-between items-center px-6 py-5 border-b border-stone-200 flex-shrink-0 bg-white">[\s\S]*?<\/div>/;

const cpanelEnd = '            </motion.div>\n          </motion.div>\n        )}';

// I need to find the specific part that starts with {generatedHtml && (() => {
const generatedHtmlCheckStart = /\{generatedHtml && \(\(\) => \{[\s\S]*?const currentProject = savedProjects\.find\(p => p\.id === currentProjectSlug\);[\s\S]*?return \(/m;
const generatedHtmlCheckEnd = /        \}\)\(\)\}/m;

// Let's replace the whole body of the CPanel to be more consistent.

content = content.replace(generatedHtmlCheckStart, `(() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  let daysLeft = 0; let isPaid = false;
                  if (currentProject?.expiresAt) {
                    const expirationDate = getExpirationTimestampMs(currentProject.expiresAt);
                    if (expirationDate) {
                      daysLeft = Math.ceil((expirationDate - Date.now()) / (1000 * 3600 * 24));
                    }
                    isPaid = currentProject.paymentStatus === 'paid';
                  }
                  return (`);

content = content.replace(generatedHtmlCheckEnd, `      })()`);

// Now adjust the tabs to show only dashboard/geral based on generatedHtml
const tabsStartStr = `<div className="flex border-b border-stone-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-white">`;
const tabsEndStr = `</div>`;

const newTabsLogic = `<div className="flex border-b border-stone-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-white">
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
                    </div>`;

// Find only the first instance of tabs (the one in CPanel)
const tabsRegex = /<div className="flex border-b border-stone-200 text-\[10px\] sm:text-\[11px\] font-bold uppercase tracking-wider flex-shrink-0 bg-white">[\s\S]*?<\/div>/;
content = content.replace(tabsRegex, newTabsLogic);

// Ensure that if !generatedHtml and activeTab isn't dashboard, we force it (or just handle it in the render)

// 2. Mobile Menu Refactor
content = content.replace('if (!isMobile || !generatedHtml) return null;', 'if (!isMobile) return null;');

// Add "Meus Projetos" to mobile grid
const mobileStepsGridRegex = /<div className="grid grid-cols-4 gap-3">[\s\S]*?<\/div>/;
const newMobileStepsGrid = `<div className="grid grid-cols-4 gap-3">
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
content = content.replace(mobileStepsGridRegex, newMobileStepsGrid);

// Add Step ID 9 to renderMobileBottomSheet
const mobileSheetContentStart = /<div className="p-5 overflow-y-auto pb-10 space-y-6 flex-1">/m;
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
content = content.replace(mobileSheetContentStart, match => match + mobileDashboardContent);

fs.writeFileSync(file, content, 'utf8');
console.log("Refactor Complete: Dashboard is now visible on initial screen!");
