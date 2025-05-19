# Sonatto - Sistema de Gestão de Tarefas

Sistema de gestão de tarefas desenvolvido com React, TypeScript e Firebase, oferecendo uma interface moderna e intuitiva para gerenciamento de tarefas e acompanhamento de tempo.

## 🚀 Tecnologias

- [React](https://reactjs.org/) - Biblioteca JavaScript para construção de interfaces
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript com tipagem estática
- [Vite](https://vitejs.dev/) - Build tool e servidor de desenvolvimento
- [Firebase](https://firebase.google.com/) - Backend como serviço
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS utilitário
- [React Query](https://tanstack.com/query/latest) - Gerenciamento de estado e cache
- [React Router](https://reactrouter.com/) - Roteamento
- [Zustand](https://github.com/pmndrs/zustand) - Gerenciamento de estado
- [Radix UI](https://www.radix-ui.com/) - Componentes acessíveis
- [Lucide Icons](https://lucide.dev/) - Ícones modernos
- [Day.js](https://day.js.org/) - Manipulação de datas

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Firebase
- Git

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone git@github.com:willcruz07/sonatto.git
cd sonatto
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## 🔄 Configuração do Git

Se você estiver iniciando um novo repositório:

1. Inicialize o Git:
```bash
git init
```

2. Adicione os arquivos:
```bash
git add .
```

3. Faça o primeiro commit:
```bash
git commit -m "Initial commit"
```

4. Configure a branch principal:
```bash
git branch -M main
```

5. Adicione o repositório remoto:
```bash
git remote add origin git@github.com:willcruz07/sonatto.git
```

6. Faça o push inicial:
```bash
git push -u origin main
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o ESLint
- `npm run lint:fix` - Corrige problemas de linting
- `npm run format` - Formata o código com Prettier
- `npm run format:check` - Verifica a formatação do código

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── config/        # Configurações (Firebase, etc)
├── hooks/         # Custom hooks
├── lib/           # Utilitários e configurações
├── pages/         # Páginas da aplicação
├── routes/        # Configuração de rotas
├── services/      # Serviços e integrações
├── store/         # Gerenciamento de estado
└── styles/        # Estilos globais
```

## 🎨 Configuração do Editor

O projeto utiliza ESLint e Prettier para padronização de código. Recomendamos as seguintes extensões do VS Code:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

Configurações do VS Code já estão incluídas no projeto (`.vscode/settings.json`).

## 🔐 Autenticação

O sistema utiliza Firebase Authentication para gerenciamento de usuários. Os usuários podem se autenticar com:

- Email/Senha
- Google
- GitHub

## 📊 Funcionalidades

- Gestão de tarefas
- Atribuição de tarefas
- Acompanhamento de tempo
- Dashboard com métricas
- Filtros e busca
- Temas claro/escuro
- Interface responsiva

## 🧪 Testes

Para executar os testes:
```bash
npm run test
```

## 📝 Convenções de Código

- TypeScript com tipagem estrita
- ESLint para linting
- Prettier para formatação
- Convenções de nomenclatura:
  - Interfaces: Prefixo `I` (ex: `IUser`)
  - Types: Prefixo `T` (ex: `TStatus`)
  - Componentes: PascalCase
  - Funções: camelCase
  - Constantes: UPPER_SNAKE_CASE

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Agradecimentos

- [Vite](https://vitejs.dev/) pela excelente ferramenta de build
- [TailwindCSS](https://tailwindcss.com/) pelo framework CSS
- [Radix UI](https://www.radix-ui.com/) pelos componentes acessíveis
- [Firebase](https://firebase.google.com/) pelo backend robusto
