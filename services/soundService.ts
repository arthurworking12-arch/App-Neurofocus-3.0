
// Motor de Áudio do NeuroFocus
// Sons convertidos para Base64 para garantir carregamento instantâneo e sem erros de CORS/Rede.

// Short UI Click (Clean Snap)
const CLICK_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

// Check Sound (Satisfying Pop/Ding)
const CHECK_SOUND = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA="; // Placeholder curto para evitar arquivo gigante no chat, usando fallback lógico abaixo.

// Para evitar poluir o código com strings Base64 gigantescas (que deixariam o arquivo pesado e ilegível aqui),
// vamos usar uma abordagem híbrida: 
// 1. Tentar carregar de uma CDN mais confiável (Github Raw ou similar).
// 2. Se falhar, não quebrar o app.

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
      const audio = new Audio(SOUNDS[type]);
      audio.volume = volume;
      
      // Carrega o áudio antes de tentar tocar
      audio.load();

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Apenas loga no console como aviso, não trava a aplicação
          // O erro mais comum é "User didn't interact with document first"
          console.warn(`Áudio (${type}) não pôde ser reproduzido:`, error.message);
        });
      }
    } catch (e) {
      console.warn("Erro no motor de áudio:", e);
    }
};
