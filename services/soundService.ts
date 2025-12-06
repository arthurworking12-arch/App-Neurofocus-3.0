
// Motor de Áudio do NeuroFocus
// Sons curados para uma estética Futurista/Zen

const SOUNDS = {
    // Som curto e mecânico para check normal
    check: 'https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3', 
    
    // Som de energia/eletricidade para Crítico
    critical: 'https://cdn.freesound.org/previews/350/350865_5065094-lq.mp3',
    
    // Som mágico/moeda para Jackpot
    jackpot: 'https://cdn.freesound.org/previews/403/403297_5121236-lq.mp3',
    
    // Som etéreo/ascensão para Level Up
    levelUp: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3',
    
    // Som suave de gongo/sino para o Timer
    timerFinish: 'https://cdn.freesound.org/previews/536/536774_6213605-lq.mp3',
    
    // Som de click suave para interações UI (opcional)
    click: 'https://cdn.freesound.org/previews/616/616226_11363435-lq.mp3'
};
  
export type SoundType = keyof typeof SOUNDS;
  
export const playSound = (type: SoundType, volume: number = 0.5) => {
    try {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = volume;
      
      // Tratamento para navegadores que bloqueiam autoplay
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silenciosamente falha se o navegador bloquear (comum se não houver interação do usuário antes)
          console.debug("Áudio bloqueado ou falhou:", error);
        });
      }
    } catch (e) {
      console.error("Erro no motor de áudio:", e);
    }
};
