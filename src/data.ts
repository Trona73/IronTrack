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
  },
  {
    id: 'p3',
    name: 'Treino C - Pernas e Ombros',
    daysOfWeek: [3, 6], // Qua, Sab
    exercises: [
      {
        id: 'pe5',
        exerciseId: 'e2',
        sets: [
          { reps: 10, weight: 80 },
          { reps: 8, weight: 90 },
          { reps: 6, weight: 100 },
        ]
      },
      {
        id: 'pe6',
        exerciseId: 'e7',
        sets: [
          { reps: 12, weight: 120 },
          { reps: 12, weight: 140 },
          { reps: 10, weight: 160 },
        ]
      },
      {
        id: 'pe7',
        exerciseId: 'e4',
        sets: [
          { reps: 12, weight: 14 },
          { reps: 10, weight: 16 },
          { reps: 8, weight: 18 },
        ]
      },
      {
        id: 'pe8',
        exerciseId: 'e9',
        sets: [
          { reps: 15, weight: 8 },
          { reps: 12, weight: 10 },
          { reps: 12, weight: 10 },
        ]
      }
    ]
  },
  {
    id: 'p4',
    name: 'Treino D - Full Body',
    daysOfWeek: [0], // Dom
    exercises: [
      {
        id: 'pe9',
        exerciseId: 'e2',
        sets: [{ reps: 10, weight: 60 }, { reps: 10, weight: 60 }]
      },
      {
        id: 'pe10',
        exerciseId: 'e1',
        sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }]
      },
      {
        id: 'pe11',
        exerciseId: 'e15',
        sets: [{ reps: 10, weight: 40 }, { reps: 10, weight: 40 }]
      },
      {
        id: 'pe12',
        exerciseId: 'e4',
        sets: [{ reps: 12, weight: 12 }, { reps: 12, weight: 12 }]
      }
    ]
  },
  {
    id: 'p5',
    name: 'Treino E - Core Fortalecimento',
    daysOfWeek: [1, 3, 5], // Seg, Qua, Sex
    exercises: [
      {
        id: 'pe13',
        exerciseId: 'e13',
        sets: [{ reps: 60, weight: 0 }, { reps: 60, weight: 0 }, { reps: 45, weight: 0 }]
      },
      {
        id: 'pe14',
        exerciseId: 'e14',
        sets: [{ reps: 20, weight: 0 }, { reps: 20, weight: 0 }, { reps: 20, weight: 0 }]
      }
    ]
  },
  {
    id: 'p6',
    name: 'Treino F - Força Pura',
    daysOfWeek: [2, 4], // Ter, Qui
    exercises: [
      {
        id: 'pe15',
        exerciseId: 'e1',
        sets: [{ reps: 5, weight: 80 }, { reps: 5, weight: 85 }, { reps: 3, weight: 90 }]
      },
      {
        id: 'pe16',
        exerciseId: 'e3',
        sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 110 }, { reps: 3, weight: 120 }]
      },
      {
        id: 'pe17',
        exerciseId: 'e2',
        sets: [{ reps: 5, weight: 90 }, { reps: 5, weight: 95 }, { reps: 3, weight: 100 }]
      }
    ]
  },
  {
    id: 'p7',
    name: 'Treino G - Hipertrofia Pernas',
    daysOfWeek: [5], // Sex
    exercises: [
      {
        id: 'pe18',
        exerciseId: 'e10',
        sets: [{ reps: 15, weight: 40 }, { reps: 12, weight: 45 }, { reps: 10, weight: 50 }]
      },
      {
        id: 'pe19',
        exerciseId: 'e11',
        sets: [{ reps: 15, weight: 40 }, { reps: 12, weight: 45 }, { reps: 10, weight: 50 }]
      },
      {
        id: 'pe20',
        exerciseId: 'e12',
        sets: [{ reps: 20, weight: 30 }, { reps: 15, weight: 35 }, { reps: 15, weight: 40 }]
      },
      {
        id: 'pe21',
        exerciseId: 'e7',
        sets: [{ reps: 12, weight: 100 }, { reps: 10, weight: 120 }, { reps: 8, weight: 140 }]
      }
    ]
  },
  {
    id: 'p8',
    name: 'Treino H - Calistenia Básica',
    daysOfWeek: [6], // Sab
    exercises: [
      {
        id: 'pe22',
        exerciseId: 'e13',
        sets: [{ reps: 45, weight: 0 }, { reps: 45, weight: 0 }]
      },
      {
        id: 'pe23',
        exerciseId: 'e14',
        sets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }]
      },
      {
        id: 'pe24',
        exerciseId: 'e2',
        sets: [{ reps: 20, weight: 0 }, { reps: 20, weight: 0 }]
      }
    ]
  },
  {
    id: 'p9',
    name: 'Treino I - Upper Body',
    daysOfWeek: [1, 4], // Seg, Qui
    exercises: [
      {
        id: 'pe25',
        exerciseId: 'e1',
        sets: [{ reps: 10, weight: 50 }, { reps: 8, weight: 60 }]
      },
      {
        id: 'pe26',
        exerciseId: 'e15',
        sets: [{ reps: 10, weight: 40 }, { reps: 8, weight: 50 }]
      },
      {
        id: 'pe27',
        exerciseId: 'e4',
        sets: [{ reps: 12, weight: 12 }, { reps: 10, weight: 14 }]
      },
      {
        id: 'pe28',
        exerciseId: 'e5',
        sets: [{ reps: 12, weight: 20 }, { reps: 10, weight: 25 }]
      },
      {
        id: 'pe29',
        exerciseId: 'e6',
        sets: [{ reps: 15, weight: 15 }, { reps: 12, weight: 20 }]
      }
    ]
  },
  {
    id: 'p10',
    name: 'Treino J - Lower Body',
    daysOfWeek: [2, 5], // Ter, Sex
    exercises: [
      {
        id: 'pe30',
        exerciseId: 'e2',
        sets: [{ reps: 10, weight: 70 }, { reps: 8, weight: 80 }]
      },
      {
        id: 'pe31',
        exerciseId: 'e3',
        sets: [{ reps: 8, weight: 90 }, { reps: 6, weight: 100 }]
      },
      {
        id: 'pe32',
        exerciseId: 'e11',
        sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 45 }]
      },
      {
        id: 'pe33',
        exerciseId: 'e12',
        sets: [{ reps: 15, weight: 30 }, { reps: 15, weight: 30 }]
      }
    ]
  }
];
