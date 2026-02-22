import { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Supino Reto', equipment: 'Barra', muscleGroup: 'Peito', description: 'Exercício fundamental para o desenvolvimento do peitoral, tríceps e deltoide anterior. Mantenha as escápulas retraídas e os pés firmes no chão.', imageUrl: 'https://picsum.photos/seed/supino/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+supino+reto' },
  { id: 'e2', name: 'Agachamento Livre', equipment: 'Barra', muscleGroup: 'Pernas', description: 'O rei dos exercícios para pernas. Trabalha quadríceps, glúteos e core. Mantenha a coluna neutra e desça até quebrar a paralela, se a mobilidade permitir.', imageUrl: 'https://picsum.photos/seed/agachamento/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+agachamento+livre' },
  { id: 'e3', name: 'Levantamento Terra', equipment: 'Barra', muscleGroup: 'Costas', description: 'Exercício composto que trabalha toda a cadeia posterior do corpo. Foco na extensão do quadril e em manter a barra próxima ao corpo.', imageUrl: 'https://picsum.photos/seed/terra/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+levantamento+terra' },
  { id: 'e4', name: 'Desenvolvimento', equipment: 'Halteres', muscleGroup: 'Ombros', description: 'Focado no ganho de força e volume dos ombros (deltoides). Pode ser feito sentado ou em pé.', imageUrl: 'https://picsum.photos/seed/desenvolvimento/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+desenvolvimento+com+halteres' },
  { id: 'e5', name: 'Rosca Direta', equipment: 'Barra', muscleGroup: 'Braços', description: 'Clássico para o desenvolvimento dos bíceps. Evite usar o impulso do corpo (roubar) durante a execução.', imageUrl: 'https://picsum.photos/seed/rosca/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+rosca+direta' },
  { id: 'e6', name: 'Tríceps Polia', equipment: 'Cabos', muscleGroup: 'Braços', description: 'Isolador excelente para a porção lateral e medial do tríceps. Mantenha os cotovelos fixos ao lado do corpo.', imageUrl: 'https://picsum.photos/seed/triceps/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+triceps+polia' },
  { id: 'e7', name: 'Leg Press 45º', equipment: 'Máquina', muscleGroup: 'Pernas', description: 'Ótima alternativa para focar nos quadríceps e glúteos com suporte para as costas. Não estenda completamente os joelhos no topo.', imageUrl: 'https://picsum.photos/seed/legpress/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+leg+press+45' },
  { id: 'e8', name: 'Puxada Frontal', equipment: 'Máquina', muscleGroup: 'Costas', description: 'Desenvolve a largura das costas (latíssimo do dorso). Puxe a barra em direção ao peito, estufando-o.', imageUrl: 'https://picsum.photos/seed/puxada/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+puxada+frontal' },
  { id: 'e9', name: 'Elevação Lateral', equipment: 'Halteres', muscleGroup: 'Ombros', description: 'Essencial para o desenvolvimento da porção lateral dos ombros, dando o aspecto de "ombros largos".', imageUrl: 'https://picsum.photos/seed/elevacao/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+elevacao+lateral' },
  { id: 'e10', name: 'Cadeira Extensora', equipment: 'Máquina', muscleGroup: 'Pernas', description: 'Isolador focado exclusivamente nos quadríceps. Excelente para finalização do treino de pernas.', imageUrl: 'https://picsum.photos/seed/extensora/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+cadeira+extensora' },
  { id: 'e11', name: 'Cadeira Flexora', equipment: 'Máquina', muscleGroup: 'Pernas', description: 'Focado no desenvolvimento dos isquiotibiais (posterior de coxa). Controle a fase excêntrica do movimento.', imageUrl: 'https://picsum.photos/seed/flexora/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+cadeira+flexora' },
  { id: 'e12', name: 'Panturrilha Sentado', equipment: 'Máquina', muscleGroup: 'Pernas', description: 'Trabalha especificamente o músculo sóleo da panturrilha. Faça uma pausa no alongamento máximo.', imageUrl: 'https://picsum.photos/seed/panturrilha/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+panturrilha+sentado' },
  { id: 'e13', name: 'Prancha', equipment: 'Peso Corporal', muscleGroup: 'Core', description: 'Exercício isométrico excelente para fortalecimento do core. Mantenha o corpo em linha reta e o abdômen contraído.', imageUrl: 'https://picsum.photos/seed/prancha/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+prancha+abdominal' },
  { id: 'e14', name: 'Abdominal Supra', equipment: 'Peso Corporal', muscleGroup: 'Core', description: 'Focado na porção superior do abdômen. Concentre-se em enrolar o tronco e não apenas levantar a cabeça.', imageUrl: 'https://picsum.photos/seed/abdominal/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+abdominal+supra' },
  { id: 'e15', name: 'Remada Curvada', equipment: 'Barra', muscleGroup: 'Costas', description: 'Constrói espessura e força nas costas. Mantenha a coluna reta e puxe a barra em direção ao umbigo.', imageUrl: 'https://picsum.photos/seed/remada/400/200', videoUrl: 'https://www.youtube.com/results?search_query=como+fazer+remada+curvada' },
];

export const MOCK_PLANS = [
  {
    id: 'p1',
    name: 'Treino A - Peito e Tríceps',
    daysOfWeek: [1, 4], // Seg, Qui
    exercises: [
      {
        id: 'pe1',
        exerciseId: 'e1',
        sets: [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 8, weight: 65 },
          { reps: 8, weight: 65 },
        ]
      },
      {
        id: 'pe2',
        exerciseId: 'e6',
        sets: [
          { reps: 12, weight: 20 },
          { reps: 12, weight: 20 },
          { reps: 10, weight: 25 },
        ]
      }
    ]
  },
  {
    id: 'p2',
    name: 'Treino B - Costas e Bíceps',
    daysOfWeek: [2, 5], // Ter, Sex
    exercises: [
      {
        id: 'pe3',
        exerciseId: 'e8',
        sets: [
          { reps: 12, weight: 50 },
          { reps: 10, weight: 55 },
          { reps: 8, weight: 60 },
        ]
      },
      {
        id: 'pe4',
        exerciseId: 'e5',
        sets: [
          { reps: 10, weight: 30 },
          { reps: 10, weight: 30 },
          { reps: 8, weight: 35 },
        ]
      }
    ]
  }
];
