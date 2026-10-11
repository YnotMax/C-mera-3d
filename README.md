# 📷 Lente de Câmera 3D Interativa (70-200mm f/2.8 L IS USM)

Exploração técnica e fotorrealista em **3D com Three.js**, desenvolvida em **React 19**, **TypeScript** e **Tailwind CSS**. Apresenta corte transversal com física de refração óptica, diafragma mecânico animado, vista explodida interativa, cinemática de foco/zoom e visor de sensor CMOS.

---

## ✨ Funcionalidades Principais

- **🔍 Fotorrealismo Óptico e Mecânico**:
  - Vidro de cristal de fluorita artificial com reflexos multicamadas (*anti-reflective coating* esmeralda/lavanda), índice de refração $n=1.52$ e espessura física real.
  - Chassi usinado em liga de magnésio/alumínio com a icônica **faixa vermelha** carmesim da série de luxo.
  - Anéis de foco e zoom com texturas emborrachadas estriadas geradas via *bump mapping*.
  - Encaixe de baioneta cromado com 3 garras, gaxeta de borracha e **8 pinos banhados a ouro puro 24k**.
  - **Colar de tripé** com sapata padrão *Arca-Swiss* e manopla estriada de travamento.

- **✂️ Corte Lateral Transversal (Cutaway)**:
  - Revele instantaneamente o interior da lente: grupos ópticos, motor piezoelétrico USM, cames helicoidais de duralumínio e estabilizador de imagem (IS).

- **🌈 Física Óptica e Feixes de Luz Espectrais**:
  - Trajetória volumétrica de feixes de luz incidente com dispersão cromática real pela **Lei de Snell** (vermelho 650nm, âmbar 589nm, verde 532nm, ciano 486nm e azul 435nm).
  - Ponto cáustico e *bokeh* poligonal de 9 lâminas projetado diretamente sobre o plano focal do sensor CMOS.
  - Corte físico dos raios marginais ao fechar a abertura (*stopping down*).

- **💥 Vista Explodida com Etiquetas 3D Flutuantes**:
  - Deslocamento suave de todos os 17 grupos ao longo do eixo Z.
  - Etiquetas 3D flutuantes no espaço com linhas de chamada conectadas a cada peça.
  - Clique em qualquer etiqueta ou peça para **voo suave de câmera (*camera flight*)** e enquadramento em close-up.

- **⭕ Mecânica de Diafragma e Cinemática**:
  - 9 lâminas curvas de liga de carbono flexível com sobreposição mecânica real.
  - Modo oscilação lenta contínua ou seleção direta de f-stops: **f/2.8, f/4, f/8, f/16, f/22**.
  - Controle de distância focal: **70mm, 100mm, 135mm e 200mm** (rotaciona o anel e translada o grupo interno).
  - Controle de foco manual: **1.2m, 2.5m, 5.0m e Infinito (∞)** (rotaciona o tambor graduado de distâncias).

- **📷 Visor do Sensor (Sensor Viewfinder)**:
  - Janela *Picture-in-Picture* simulando o que o sensor CMOS captura através da lente com profundidade de campo (*DoF*), desfoque *bokeh* e botão de disparo com som de obturador em dois tempos.

- **🔊 Áudio 100% Procedural (Web Audio API)**:
  - Efeitos sonoros mecânicos gerados em tempo real sem arquivos externos: catraca de abertura, servo piezoelétrico USM, descompressão (*swoosh*) ao explodir e obturador de cortina dupla.

- **📦 Arquivo Único Autônomo**:
  - Inclui botão de download e arquivo `/camera-lens-3d.html` pronto para rodar offline em qualquer navegador sem servidores.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** 18+ instalado
- **npm**, **yarn** ou **pnpm**

### Instalação
```bash
# 1. Clone o repositório
git clone https://github.com/SEU-USUARIO/camera-lens-3d.git
cd camera-lens-3d

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🛠️ Build e Verificação

```bash
# Validar tipagem TypeScript
npm run lint

# Gerar build de produção otimizado
npm run build

# Pré-visualizar build localmente
npm run preview
```

---

## 🌐 Como Fazer Deploy na Vercel

O projeto já inclui o arquivo `vercel.json` pré-configurado para a **Vercel** com roteamento SPA automático.

### Método 1: Via Painel da Vercel (Recomendado)
1. Suba este projeto para o seu repositório no **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New... -> Project**.
3. Importe o repositório do GitHub.
4. A Vercel detectará automaticamente as configurações:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **Deploy**! Em menos de 1 minuto seu site estará online com HTTPS gratuito e CDN global.

### Método 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 📂 Estrutura de Arquivos

```
├── camera-lens-3d.html          # Versão HTML autônoma única (sem dependências)
├── public/
│   └── camera-lens-3d.html     # Cópia pública servida no build de produção
├── src/
│   ├── components/
│   │   ├── AudioEffects.ts     # Sintetizador sonoro Web Audio API
│   │   ├── LensData.ts         # Catálogo técnico de especificações dos 17 grupos
│   │   ├── LensModel.ts        # Construtor de malhas e materiais 3D Three.js
│   │   ├── OpticalRays.ts      # Simulação física de feixes refratados de Snell
│   │   ├── ProceduralTextures.ts # Gerador de texturas de borracha e gravações
│   │   ├── SensorViewfinder.tsx # Componente do visor óptico do sensor CMOS
│   │   ├── StandaloneHtmlGenerator.ts # Exportador do arquivo HTML único
│   │   └── StudioEnvironment.ts # Gerador do mapa de iluminação HDR de estúdio
│   ├── App.tsx                 # Interface e controles principais
│   ├── main.tsx                # Ponto de entrada React
│   └── index.css               # Estilos Tailwind CSS
├── vercel.json                 # Configuração de deploy da Vercel
├── package.json
└── vite.config.ts
```

---

## 📜 Licença
Distribuído sob a licença Apache-2.0.
