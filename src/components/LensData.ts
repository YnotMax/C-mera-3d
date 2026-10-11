/**
 * Informações e especificações detalhadas de cada componente da lente fotográfica.
 */

export interface LensPartInfo {
  id: string;
  name: string;
  category: 'Óptica' | 'Mecânica' | 'Eletrônica' | 'Chassi';
  functionDescription: string;
  specs: string;
  explodeOffset: number; // Deslocamento no eixo Z quando explodido
  colorHighlight?: number;
}

export const LENS_PARTS_INFO: Record<string, LensPartInfo> = {
  front_element: {
    id: 'front_element',
    name: 'Elemento Frontal de Fluorita (CaF2 / ED)',
    category: 'Óptica',
    functionDescription: 'Superfície de entrada de cristal de fluorita artificial com baixíssima dispersão anômala. Elimina aberrações cromáticas secundárias no extremo teleobjetivo e conta com revestimento de flúor anti-oleofóbico.',
    specs: 'Diâmetro: 77mm · Material: Cristal de Fluorita CaF2 · Revestimento: Multicamadas SWC',
    explodeOffset: -180,
  },
  front_bezel: {
    id: 'front_bezel',
    name: 'Aro Frontal, Rosca de Filtro (77mm) e Baioneta de Para-sol',
    category: 'Chassi',
    functionDescription: 'Tubo frontal usinado em liga de alumínio e magnésio. Possui rosca interna de 77mm para polarizadores e filtros ND, além de ranhuras externas de travamento rápido para o para-sol tipo pétala.',
    specs: 'Rosca: M77 x 0.75mm · Encaixe de Para-sol ET-87 · Acabamento anodizado fosco',
    explodeOffset: -155,
  },
  red_ring: {
    id: 'red_ring',
    name: 'Faixa Vermelha Distintiva (Série L)',
    category: 'Chassi',
    functionDescription: 'Anel circular de alumínio usinado com anodização vermelha acetinada. Assinatura visual que identifica as lentes profissionais de luxo da Canon com construção blindada e ótica de primeira linha.',
    specs: 'Liga de alumínio 6061 · Anodização vermelha brilhante de alta durabilidade',
    explodeOffset: -135,
  },
  group1_doublet: {
    id: 'group1_doublet',
    name: 'Dublete Acromático Cimentado (Grupo Óptico 1)',
    category: 'Óptica',
    functionDescription: 'Combinação de um elemento positivo de vidro Crown (baixo índice) e um negativo de vidro Flint (alto índice) unidos por adesivo óptico UV. Corrige a dispersão e equaliza o foco das cores primárias.',
    specs: 'Vidro Crown N-BK7 + Flint SF11 · Cimentação óptica Norland NOA61',
    explodeOffset: -110,
  },
  focus_ring: {
    id: 'focus_ring',
    name: 'Anel de Foco Manual em Borracha Ranhurada',
    category: 'Mecânica',
    functionDescription: 'Empunhadura ergonômica em borracha vulcanizada com microfrisos antiderrapantes. Conectado ao sistema de foco manual em tempo integral (Full-Time Manual Focus - FTM), permitindo foco sem desarmar o AF.',
    specs: 'Borracha sintética EPDM com sulcos profundos · Rotação amortecida em 120°',
    explodeOffset: -80,
  },
  distance_window: {
    id: 'distance_window',
    name: 'Janela de Escala de Distância e Profundidade de Campo',
    category: 'Mecânica',
    functionDescription: 'Visor de policarbonato vedado contra poeira que exibe um tambor cilíndrico interno com as distâncias focadas em metros (branco) e pés (laranja), além dos índices de profundidade de campo.',
    specs: 'Escala graduada: 1.2m até Infinito (∞) · Lente de leitura em policarbonato óptico',
    explodeOffset: -55,
  },
  usm_motor: {
    id: 'usm_motor',
    name: 'Motor Ultrassônico USM de Anel (Piezoelétrico)',
    category: 'Eletrônica',
    functionDescription: 'Estator piezoelétrico com dentes cerâmicos excitados a frequências ultrassônicas (30 kHz). As ondas mecânicas impulsionam o rotor por atrito, girando o mecanismo com aceleração fulminante e silêncio absoluto.',
    specs: 'Frequência de ressonância: 30-33 kHz · Torque instantâneo: 0.15 Nm · Resposta: < 35ms',
    explodeOffset: -25,
  },
  zoom_cams: {
    id: 'zoom_cams',
    name: 'Tubo Helicoidal Interno e Cames de Zoom em Duralumínio',
    category: 'Mecânica',
    functionDescription: 'Tambor interno usinado com ranhuras em curvas espirais duplas de alta precisão. Pinos com rolamentos de teflon deslizam pelos canais helicoidais, transladando os grupos ópticos interna e linearmente.',
    specs: 'Duralumínio aeroespacial 7075 usinado em CNC 5 eixos · Pinos guia com buchas autolubrificantes',
    explodeOffset: 5,
  },
  aperture_mechanism: {
    id: 'aperture_mechanism',
    name: 'Mecanismo do Diafragma (9 Lâminas Circulares)',
    category: 'Mecânica',
    functionDescription: 'Conjunto circular de 9 lâminas de liga de carbono flexível acionadas por um motor de passo de alta velocidade (EMD). Abre e fecha com extrema suavidade para regular a exposição e gerar bokeh perfeitamente redondo.',
    specs: 'Abertura: f/2.8 a f/22 · 9 lâminas com geometria circular otimizada · Atuador EMD',
    explodeOffset: 35,
  },
  is_stabilizer: {
    id: 'is_stabilizer',
    name: 'Unidade de Estabilização Óptica (IS - 4 Stops)',
    category: 'Eletrônica',
    functionDescription: 'Lente móvel suspensa sobre esferas cerâmicas e impulsionada por 4 bobinas magnéticas de voz (voice-coil) a 90°. Dois giroscópios piezoelétricos detectam tremores angulares da mão e cancelam o desfoque.',
    specs: 'Compensação: até 4 stops de velocidade · Giroscópios MEMS biaxiais · Frequência: 8 kHz',
    explodeOffset: 65,
  },
  rear_zoom_group: {
    id: 'rear_zoom_group',
    name: 'Grupo Óptico Traseiro Asférico (Foco Interno IF)',
    category: 'Óptica',
    functionDescription: 'Lente asférica de vidro moldado de precisão (GMo). Reduz a aberração esférica e coma marginal, convergindo o feixe de luz colimado na direção da baioneta e vedando o interior contra poeira.',
    specs: 'Vidro moldado de precisão asférico (GMo) · Grupo de foco interno móvel leve',
    explodeOffset: 95,
  },
  zoom_ring: {
    id: 'zoom_ring',
    name: 'Anel de Zoom com Marcas Focais (70, 100, 135, 200mm)',
    category: 'Mecânica',
    functionDescription: 'Anel externo largo emborrachado para controle de zoom com amortecimento viscoso. Números brancos gravados na estrutura indicam o enquadramento angular de 34° a 12°.',
    specs: 'Borracha antiderrapante de alta espessura · Marcações focais: 70, 100, 135, 200mm',
    explodeOffset: 120,
  },
  tripod_collar: {
    id: 'tripod_collar',
    name: 'Colar de Fixação para Tripé com Base Arca-Swiss',
    category: 'Chassi',
    functionDescription: 'Anel metálico articulado de fixação ao redor da lente com manopla de travamento estriada e base compatível com tripés. Permite alternar suavemente entre orientação horizontal e vertical sem soltar a câmera.',
    specs: 'Liga de magnésio · Trava rotacional de 360° · Rosca padrão 1/4" e 3/8"',
    explodeOffset: 135,
  },
  switch_panel: {
    id: 'switch_panel',
    name: 'Painel de Interruptores Eletrônicos Selados',
    category: 'Eletrônica',
    functionDescription: 'Placa de comando lateral com chaves de perfil baixo: limitador de distância de foco (Full / 2.5m-∞), seletor AF/MF, ativador do Estabilizador (ON/OFF) e modo de estabilização (Modo 1 Normal / Modo 2 Panning).',
    specs: '4 chaves deslizantes mecânicas seladas com gaxetas de silicone contra umidade',
    explodeOffset: 150,
  },
  rear_mount: {
    id: 'rear_mount',
    name: 'Baioneta em Aço Inox Cromado e Gaxeta de Vedação',
    category: 'Chassi',
    functionDescription: 'Encaixe de extrema rigidez usinado em latão sólido com banho de cromo acetinado. Possui 3 aletas de travamento milimétrico, pino indicador vermelho de alinhamento e borracha perimetral de vedação climática.',
    specs: 'Baioneta de latão cromado com 3 garras · Gaxeta de borracha de vedação contra chuva',
    explodeOffset: 170,
  },
  gold_contacts: {
    id: 'gold_contacts',
    name: 'Contatos Eletrônicos Banhados a Ouro 24k (SPI Bus)',
    category: 'Eletrônica',
    functionDescription: '8 pinos de contato com molas internas e cobertura de ouro puro 24k. Conectam o microcontrolador da lente à câmera para comunicação em tempo real de autofoco, abertura, distância focal e dados EXIF.',
    specs: '8 pinos tipo pogo com banho de ouro 24 quilates · Protocolo de comunicação serial rápida',
    explodeOffset: 188,
  },
  camera_sensor: {
    id: 'camera_sensor',
    name: 'Sensor Digital da Câmera (CMOS Full-Frame 35mm)',
    category: 'Eletrônica',
    functionDescription: 'Plano focal traseiro no fundo da câmara escura onde os feixes de luz refratados convergem com precisão. Matriz de fotodiodos de silício com micro-lentes integradas e vidro de proteção dicroico IR-Cut.',
    specs: 'Área ativa: 36 x 24 mm · Filtro óptico passa-baixo com vidro dicroico IR-Cut',
    explodeOffset: 215,
  },
};
