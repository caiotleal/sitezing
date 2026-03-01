import { useEffect } from 'react';

interface UseIframeEditorProps {
  setGeneratedHtml: (html: string | null) => void;
  setHasUnsavedChanges: (status: boolean) => void;
}

export const useIframeEditor = ({ setGeneratedHtml, setHasUnsavedChanges }: UseIframeEditorProps) => {
  useEffect(() => {
    const handleIframeMessage = async (event: MessageEvent) => {
      
      // 1. Textos e Cores
      if (event.data?.type === 'CONTENT_EDITED') {
        setGeneratedHtml(event.data.html);
        setHasUnsavedChanges(true);
      }
      
      // 2. Upload de Foto do Computador
      if (event.data?.type === 'REQUEST_UPLOAD') {
        const input = document.createElement('input');
        input.type = 'file'; 
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({ type: 'INSERT_IMAGE', targetId: event.data.targetId, url: reader.result }, '*');
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }

      if (event.data?.type === 'REQUEST_STOCK_IMAGES') {
        const promptText = event.data.prompt;
        if (!promptText) return;

        const iframe = document.querySelector('iframe');
        const cleanPrompt = encodeURIComponent(String(promptText).trim());
        const options = [1, 2, 3, 4].map(i => `https://source.unsplash.com/800x600/?${cleanPrompt}&sig=${Date.now()}${i}`);

        iframe?.contentWindow?.postMessage({
          type: 'STOCK_IMAGE_OPTIONS',
          targetId: event.data.targetId,
          options,
        }, '*');
        setHasUnsavedChanges(true);
      }

    };
    
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
    
  }, [setGeneratedHtml, setHasUnsavedChanges]); 
};
