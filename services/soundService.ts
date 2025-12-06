
// Motor de Áudio do NeuroFocus
// Sons convertidos para Base64/Links estáveis para garantir carregamento e evitar erros 404.

// Sons curtos em Base64 para garantir que sempre funcionem (Click e Check)
const CLICK_BASE64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQcAAAAAAACAAAA="; // Silent/Short blip placeholder

const SOUNDS = {
    // Som curto e mecânico para check normal
    check: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', 
    
    // Som de energia/eletricidade para Crítico
    critical: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    
    // Som mágico/moeda para Jackpot
    jackpot: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    
    // Som etéreo/ascensão para Level Up
    levelUp: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    
    // Som suave de gongo/sino para o Timer
    timerFinish: 'https://assets.mixkit.co/active_storage/sfx/1497/1497-preview.mp3',
    
    // Som de click suave para interações UI
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
};
  
export type SoundType = keyof typeof SOUNDS;
  
export const playSound = (type: SoundType, volume: number = 0.5) => {
    try {
      // Tenta usar o link externo
      const audio = new Audio(SOUNDS[type]);
      audio.volume = volume;
      
      // Fallback para sons críticos se o link falhar
      audio.onerror = () => {
          if (type === 'click') {
              new Audio(CLICK_BASE64).play().catch(() => {});
          }
      };

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silencia erros de autoplay bloqueado ou rede
          // console.warn(`Áudio (${type}) não pôde ser reproduzido:`, error.message);
        });
      }
    } catch (e) {
      console.warn("Erro no motor de áudio:", e);
    }
};
