/**
 * htmlCleaner.ts
 * Utilitário para limpar o HTML gerado pelo editor antes de salvar ou publicar.
 * Remove atributos de edição, scripts do editor e elementos de UI internos.
 */

export const cleanHtmlForPublishing = (html: string, preserveEditable = false): string => {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!preserveEditable) {
    // 2. Remove atributos de identificação de edição do iframe
    const elementsWithEditingId = doc.querySelectorAll('[data-editing-id]');
    elementsWithEditingId.forEach(el => el.removeAttribute('data-editing-id'));

    // 3. Remove atributos contenteditable
    const editableElements = doc.querySelectorAll('[contenteditable]');
    editableElements.forEach(el => el.removeAttribute('contenteditable'));
    
    // Remove classes de ajuda do editor (ex: .editing-active)
    const editorClasses = ['editing-active', 'editor-marker', 'editable-element'];
    editorClasses.forEach(cls => {
      doc.querySelectorAll(`.${cls}`).forEach(el => el.classList.remove(cls));
    });
  }

  // 4. Remove scripts do editor (iframe-editor.js)
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.includes('iframe-editor.js')) {
      script.remove();
    }
  });

  // 6. Remove elementos de UI que possam ter sido injetados por engano
  const uiSelectors = ['#editor-ui-marker', '.zing-editor-temp', '#editor-toolbar', '#image-toolbar'];
  uiSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  return doc.documentElement.outerHTML;
};
