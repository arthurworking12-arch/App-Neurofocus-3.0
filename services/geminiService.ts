import { GoogleGenAI } from "@google/genai";
import { Task, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRoutineSuggestions = async (
  completedTasks: Task[],
  pendingTasks: Task[],
  userGoal: string = "melhorar produtividade e foco"
): Promise<string> => {
  try {
    const completedTitles = completedTasks.map(t => t.title).join(", ");
    const pendingTitles = pendingTasks.map(t => t.title).join(", ");

    const prompt = `
      Atue como um coach de produtividade e bem-estar minimalista (estilo Zen).
      O objetivo do usuário é: ${userGoal}.
      
      Tarefas completadas recentemente: ${completedTitles || "Nenhuma ainda"}.
      Tarefas pendentes: ${pendingTitles || "Nenhuma no momento"}.

      Com base nisso, forneça 3 sugestões curtas, práticas e gentis para melhorar a rotina do usuário hoje.
      As sugestões devem ser acionáveis.
      
      Retorne APENAS um objeto JSON (sem markdown code blocks) com a seguinte estrutura:
      {
        "suggestions": [
          { "title": "Titulo curto", "description": "Descrição breve de 1 frase" },
          { "title": "Titulo curto", "description": "Descrição breve de 1 frase" },
          { "title": "Titulo curto", "description": "Descrição breve de 1 frase" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    // Limpeza de segurança para remover crases de markdown (```json ... ```)
    const rawText = response.text || "";
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    return cleanText;
  } catch (error) {
    console.error("Erro ao obter sugestões da IA:", error);
    return JSON.stringify({
      suggestions: [
        { title: "Respire Fundo", description: "Tire 5 minutos para apenas respirar antes da próxima tarefa." },
        { title: "Priorize Uma Coisa", description: "Escolha apenas uma tarefa essencial para focar agora." },
        { title: "Hidrate-se", description: "Beba um copo de água para reativar seu cérebro." }
      ]
    });
  }
};

export const createChatSession = (user: UserProfile, tasks: Task[]) => {
  const pendingTasks = tasks.filter(t => !t.is_completed).map(t => t.title).join(", ");
  const completedTasks = tasks.filter(t => t.is_completed).map(t => t.title).join(", ");

  const systemInstruction = `
    Você é a Dra. Neuro, uma assistente de IA especializada em neurociência comportamental, produtividade e bem-estar.
    Sua missão é ajudar o usuário a ter uma rotina saudável mental e fisicamente.
    
    Perfil do Usuário:
    - Nome: ${user.username || "Membro"}
    - Bio/Mantra: ${user.bio || "Não definido"}
    - Nível: ${user.level} (XP: ${user.current_xp})
    - Tarefas Pendentes Hoje: ${pendingTasks || "Nenhuma"}
    - Tarefas Completadas Hoje: ${completedTasks || "Nenhuma"}

    Diretrizes:
    1. Seja empática, clara e baseie seus conselhos em ciência (dopamina, ritmo circadiano, foco, etc), mas com linguagem acessível.
    2. Use o contexto das tarefas do usuário para dar conselhos práticos. Ex: "Vi que você tem 'Meditar' pendente, que tal começar por ela?"
    3. Mantenha as respostas concisas (máximo 3 parágrafos curtos) para não sobrecarregar cognitivamente o usuário.
    4. Adote um tom calmo, encorajador e objetivo.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    }
  });
};