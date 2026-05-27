# IronTrack - Documentação do Projeto

## 📝 Resumo do App
O IronTrack é um aplicativo Web Progressivo (PWA) voltado para o acompanhamento e gerenciamento de rotinas de força e treinos de musculação.
Ele permite que os usuários montem suas fichas de treino personalizadas, registrem ativamente as séries, cargas e repetições executadas no dia a dia, e acompanhem evolução através de gráficos de progresso e histórico de atividades.

### Tecnologias e Frameworks Utilizados:
* **Frontend / Interface:** React (biblioteca principal), TypeScript (linguagem tipada para maior segurança), Vite (bundler/ferramenta de build) e Tailwind CSS (framework de estilos utilitários).
* **Animações e Gráficos:** `motion` (animações fluidas e transições) e `recharts` (para geração de gráficos de histórico).
* **Ícones:** `lucide-react`.
* **Backend / BaaS (Backend as a Service):** Supabase (plataforma que provê a Autenticação segura via E-mail/Senha, sistema de recuperação e um Banco de Dados relacional poderoso hospedado na nuvem).
* **PWA (Progressive Web App):** Service Workers (`sw.js`) em JavaScript puro e `manifest.json` para permitir que o app seja "instalável" na tela inicial de dispositivos móveis.

---

## 📂 Estrutura de Pastas e Arquivos Principais
O aplicativo segue uma arquitetura focada no Frontend (React) que se comunica com o Backend Cloud (Supabase) fornecendo as funcionalidades de conta e salvamento remoto.

/
├── `public/` # Arquivos estáticos e configurações do PWA
│ ├── `icon.png` # Ícone oficial do aplicativo (usado ao instalar o app)
│ ├── `manifest.json` # Manifesto com cores e definições para uso no mobile
│ └── `sw.js` # Service Worker responsável pela estratégia de cache
│
├── `src/` # Código-fonte principal do Frontend e Integração
│ ├── `App.tsx` # Arquivo mestre: Contém toda a interface do usuário, rotas lógicas das telas (Dashboard, Biblioteca, Execução de Treino) e controle de estado
│ ├── `main.tsx` # Ponto de entrada do React que inicializa no index.html
│ ├── `types.ts` # Tipagens globais do TypeScript (Modelos como Exercise, WorkoutPlan e CompletedSet)
│ ├── `index.css` # Ponto de entrada do Tailwind CSS
│ ├── `supabaseClient.ts` # Conexão e inicialização real do cliente do Supabase
│ └── `supabaseService.ts` # Abstração de banco de dados (CRUD de Treinos e Exercícios que conversam com as tabelas do Backend)
│
├── `supabase/` # Diretório contendo os schemas e migrações do Banco de Dados
├── `index.html` # HTML base onde o app é injetado
├── `package.json` # Dependências NPM e configurações de projeto
├── `vite.config.ts` # Configuração de build (Vite)
└── `.env.example` # Exemplo de variáveis de ambiente necessárias (como a URL e as chaves seguras do servidor Supabase)

---

## ✅ O que foi feito (Funcionalidades já ativas)
O IronTrack não é apenas um protótipo, o sistema principal e o core loop já estão plenamente operacionais.
O que já está funcionando no app:

### Autenticação Segura (via Supabase):
* Criação de nova conta de usuário.
* Autenticação e Sistema de Login.
* Fluxo completo de Redefinição/Atualização de Senha.

### Construtor e Gerenciador de Planos de Treino:
* Criação, edição e nomenclatura de novas fichas/planos.
* Alocação de planos para dias flexíveis da semana (Segunda, Terça, etc.).
* Recurso de Duplicação de Treino, facilitando cópias e variações da mesma rotina sem recomeçar do zero.
* Sistema seguro de exclusão de rotinas.

### Biblioteca de Exercícios Customizáveis:
* Uma galeria completa categorizada por agrupamento muscular e equipamento e tags de pesquisa.
* Adição de novos exercícios locais, e salvos no servidor caso autenticado.
* Edição e remoção individual dos exercícios criados.
* Correção Recente: O Menu flutuante (opções) para editar e apagar os cards foi reajustado (indexação z-50) limitando que ficassem escondidos atrás de outros cards.

### Painel de Execução (O Treino "No Ato"):
* Inicialização em tempo hábil das rotinas planejadas no dia.
* Inputs inteligentes do tipo numérico anotando de Cargas e Repetições.
* Timer e Cronômetro embutido atrelados à sessão atualmente rolando.
* Checkboxes de conclusão permitindo finalizar e consolidar os treinos no perfil do usuário.

### Acompanhamento (Relatórios e Dashboard):
* Histórico em formato "feed" detalhando treinos passados (Tonelagem somada e tempo decorrido de cada treino).
* Sessão de Dashboard contendo múltiplos gráficos vetoriais iterativos, processando contagens de treinos semanais e separação analítica de músculos atingidos no mês.

### Experiência do Usuário e Infraestrutura:
* Instalação no PWA pronta (Basta acessar no Chrome/Safari mobile e selecionar "Adicionar à Tela Inicial").
* Interface fluída com transições prevenidas de quebras abruptas, e Dark Mode (Zinc-950) estabelecido.