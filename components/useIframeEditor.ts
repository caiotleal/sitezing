import { useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

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

      if (event.data?.type === 'REQUEST_AI') {
        const promptText = event.data.prompt;
        if (!promptText) return;

        const iframe = document.querySelector('iframe');
        iframe?.contentWindow?.postMessage({
          type: 'INSERT_IMAGE',
          targetId: event.data.targetId,
          url: 'https://placehold.co/800x600/059669/ffffff?text=✨+Gerando+Imagem+Realista...'
        }, '*');

        try {
          const generateImageFn = httpsCallable(functions, 'generateImage');
          const result: any = await generateImageFn({ prompt: promptText });
          if (result.data?.imageUrl) {
            iframe?.contentWindow?.postMessage({
              type: 'INSERT_IMAGE',
              targetId: event.data.targetId,
              url: result.data.imageUrl,
            }, '*');
            setHasUnsavedChanges(true);
          }
        } catch (error: any) {
          alert('Erro ao gerar imagem: ' + error.message);
          iframe?.contentWindow?.postMessage({
            type: 'INSERT_IMAGE',
            targetId: event.data.targetId,
            url: 'https://placehold.co/800x600/ef4444/ffffff?text=Falha+ao+gerar+imagem'
          }, '*');
        }
      }

    };
    
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
    
  }, [setGeneratedHtml, setHasUnsavedChanges]); 
};
