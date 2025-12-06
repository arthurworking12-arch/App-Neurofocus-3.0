
// Motor de Áudio do NeuroFocus
// Sons convertidos para Base64/Links estáveis para garantir carregamento e evitar erros 404.

// Som curto de click para UI
const CLICK_BASE64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQcAAAAAAACAAAA="; 

// Som de CHECK (Sucesso/Conclusão) - Embutido para garantir feedback 100% das vezes
const CHECK_BASE64 = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAADwAAAA8AAAt4AAOdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADIwAAAAAABIAAAAAAAAAP/7kGQAAAAGkH8GAAAAAA0gwgAAAAAABpB/BgAAAAANIMIAAAAA/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ//uQZAAABiQ/gYAAAAADSDCAAAAAAAGkD+AAAAAAA0gwgAAAAAABiZ/5j/4xIARiZ";

const SOUNDS = {
    check: CHECK_BASE64, 
    critical: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    jackpot: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    levelUp: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    timerFinish: 'https://assets.mixkit.co/active_storage/sfx/1497/1497-preview.mp3',
    click: CLICK_BASE64
};
  
export type SoundType = keyof typeof SOUNDS;
  
export const playSound = (type: SoundType, volume: number = 0.5) => {
    try {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = volume;
      
      // Se qualquer som externo falhar, usa o click simples como fallback
      audio.onerror = () => {
         if (type !== 'click') {
            const fallback = new Audio(CLICK_BASE64);
            fallback.volume = 0.2;
            fallback.play().catch(() => {});
         }
      };

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silently handle autoplay blocks
        });
      }
    } catch (e) {
      console.warn("Audio engine error:", e);
    }
};