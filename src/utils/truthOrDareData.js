export const TRUTH_QUESTIONS = [
  "Já stalkeou alguém nas redes sociais hoje ou essa semana?",
  "Qual foi a mensagem mais vergonhosa que você já mandou para a pessoa errada?",
  "Qual foi a maior mentira boba que você já contou para não sair de casa?",
  "Qual aplicativo você mais tem vergonha de admitir quanto tempo passa usando?",
  "Qual foi a compra mais inútil ou sem sentido que você já fez na internet?",
  "Já fingiu que estava sem internet só para não responder alguém no WhatsApp/Discord?",
  "Qual foi o maior mico que você já pagou tentando impressionar alguém?",
  "Se você pudesse apagar um ano inteiro da sua vida, qual seria?",
  "Você já fingiu gostar de um presente horrível só por educação?",
  "Qual é o seu maior vício secreto em jogos ou séries?",
  "Já tomou um susto tão grande que gritou fino em público?",
  "Qual mania estranha você tem quando está completamente sozinho no quarto?"
];

export const DARE_CHALLENGES = [
  {
    type: "code",
    title: "💻 DESAFIO DO DESENVOLVEDOR (1 MINUTO)",
    text: "Você tem **60 segundos** para abrir o editor/terminal, criar um comando ou função em código e mandar o **PRINT** aqui no chat!",
    duration: 60,
    requiresImage: true,
    rewardCoins: 250,
    rewardXp: 80,
  },
  {
    type: "setup",
    title: "📸 DESAFIO DO SETUP / FOTO",
    text: "Mande uma foto ou print do seu setup, da sua área de trabalho ou do código que está aberto no seu PC agora!",
    duration: 90,
    requiresImage: true,
    rewardCoins: 150,
    rewardXp: 50,
  },
  {
    type: "text",
    title: "✍️ DESAFIO DE CRIATIVIDADE",
    text: "Escreva uma frase de pelo menos 10 palavras **sem usar a letra 'A'** nos próximos 45 segundos!",
    duration: 45,
    requiresImage: false,
    rewardCoins: 100,
    rewardXp: 40,
  },
  {
    type: "voice",
    title: "🎙️ DESAFIO DE VOZ",
    text: "Mande um áudio de 5 segundos no canal falando com voz de locutor de rádio ou narrador de futebol!",
    duration: 60,
    requiresImage: false,
    rewardCoins: 180,
    rewardXp: 60,
  }
];
