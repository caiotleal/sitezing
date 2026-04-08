import { useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { functions, storage } from '../firebase';

interface UseIframeEditorProps {
  setGeneratedHtml: (html: string | null) => void;
  setHasUnsavedChanges: (status: boolean) => void;
}

export const useIframeEditor = ({ setGeneratedHtml, setHasUnsavedChanges }: UseIframeEditorProps) => {
  useEffect(() => {
    // Helper function to compress base64 images to prevent Firestore 1MB limit errors
    const compressImage = async (base64Str: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(base64Str); // Fallback if no context
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality)); // Compress as JPEG
        };
        img.onerror = () => resolve(base64Str); // Fallback on error
      });
    };

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
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;

          try {
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                // Comprime a imagem antes do upload para economizar espaço e banda
                const compressedBase64 = await compressImage(reader.result as string);
                
                // Converte base64 de volta para Blob para o upload (mais robusto que fetch)
                const parts = compressedBase64.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                  uInt8Array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([uInt8Array], { type: contentType });

                // Nome único para o arquivo
                const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
                const storageRef = ref(storage, fileName);

                // Upload
                await uploadBytes(storageRef, blob);
                const downloadUrl = await getDownloadURL(storageRef);

                const iframe = document.querySelector('iframe');
                iframe?.contentWindow?.postMessage({ 
                  type: 'INSERT_IMAGE', 
                  targetId: event.data.targetId, 
                  url: downloadUrl 
                }, '*');
                
                setHasUnsavedChanges(true);
              } catch (innerErr: any) {
                console.error("Erro interno no processamento da imagem:", innerErr);
                alert("Erro ao processar imagem: " + (innerErr.message || "Erro desconhecido"));
              }
            };
            reader.onerror = () => {
              alert("Erro ao ler o arquivo selecionado.");
            };
            reader.readAsDataURL(file);
          } catch (error: any) {
            console.error("Erro no upload do usuário:", error);
            alert("Erro ao enviar imagem: " + (error.message || "Erro desconhecido"));
          }
        };
        input.click();
      }

      if (event.data?.type === 'REQUEST_STOCK_IMAGES') {
        const promptText = event.data.prompt;
        if (!promptText) return;

        const iframe = document.querySelector('iframe');
        const cleanPrompt = encodeURIComponent(String(promptText).trim().toLowerCase());
        const seedBase = String(Date.now());

        // Evita depender apenas do source.unsplash.com (instável/503 em alguns momentos).
        // Cada opção já vem com fallback público para aumentar resiliência.
        const options = [1, 2, 3, 4].map((i) => {
          const primary = `https://loremflickr.com/800/600/${cleanPrompt}?lock=${seedBase}${i}`;
          const fallback = `https://picsum.photos/seed/${cleanPrompt}-${seedBase}-${i}/800/600`;
          return `${primary}|${fallback}`;
        });

        iframe?.contentWindow?.postMessage({
          type: 'STOCK_IMAGE_OPTIONS',
          targetId: event.data.targetId,
          options,
        }, '*');
        setHasUnsavedChanges(true);
      }

      // 3. Geração de Imagem com IA
      if (event.data?.type === 'REQUEST_AI') {
        const promptText = event.data.prompt;
        const targetId = event.data.targetId;
        if (!promptText) return;

        try {
          const generateImageFn = httpsCallable(functions, 'generateImage');
          const result: any = await generateImageFn({ prompt: promptText });
          
          if (result.data?.imageUrl) {
            let optimizedUrl = result.data.imageUrl;
            // Compress only if it's a data URI (base64) returned from the function
            if (optimizedUrl.startsWith('data:image')) {
               optimizedUrl = await compressImage(optimizedUrl);
            }
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({ type: 'INSERT_IMAGE', targetId, url: optimizedUrl }, '*');
            setHasUnsavedChanges(true);
          }
        } catch (error: any) {
          console.error("Erro ao gerar imagem AI:", error);
          alert("Falha ao gerar imagem com IA: " + error.message);
          
          // Reverte o estado de carregamento
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentDocument) {
             const targetEl = iframe.contentDocument.querySelector(`.editable-image[data-id="${targetId}"]`);
             if (targetEl) {
               targetEl.innerHTML = '<i class="fas fa-camera text-4xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Adicionar Imagem</span>';
             }
          }
        }
      }

      // 4. Beneficiamento de Foto com IA (Qualidade + SEO)
      if (event.data?.type === 'REQUEST_ENHANCE_IMAGE') {
        const imageUrl = event.data.url;
        const targetId = event.data.targetId;
        
        try {
          const enhanceFn = httpsCallable(functions, 'enhanceProjectImage');
          // Nota: O projectId é usado para auditoria no backend, o limite é por UID
          const result: any = await enhanceFn({ imageUrl, projectId: "sitezing-project" });
          
          if (result.data?.success) {
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({ 
              type: 'INSERT_IMAGE', 
              targetId, 
              url: result.data.enhancedUrl,
              alt: result.data.seoAltText
            }, '*');
            setHasUnsavedChanges(true);
          }
        } catch (error: any) {
          console.error("Erro no Beneficiamento IA:", error);
          alert(error.message || "Falha ao melhorar imagem.");
          
          // Reverte o estado de carregamento no iframe voltando a imagem original
          const iframe = document.querySelector('iframe');
          iframe?.contentWindow?.postMessage({ 
            type: 'INSERT_IMAGE', 
            targetId, 
            url: imageUrl 
          }, '*');
        }
      }

    };
    
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
    
  }, [setGeneratedHtml, setHasUnsavedChanges]); 
};
