import * as THREE from 'three';

/**
 * Utilitários para criação de texturas procedurais via HTML5 Canvas em alta definição.
 * Elimina dependências externas de imagens, garantindo carregamento instantâneo e offline.
 */

const textureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Gera textura difusa de borracha estriada para anéis de zoom e foco
 */
export function createRubberGripTexture(ribSpacing = 8, ribWidth = 4): THREE.CanvasTexture {
  const key = `rubber_diffuse_${ribSpacing}_${ribWidth}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#1c1c1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x += ribSpacing) {
      // Sombra profunda
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(x, 0, 2, canvas.height);

      // Crista com gradiente de luz
      const grad = ctx.createLinearGradient(x + 2, 0, x + ribWidth + 2, 0);
      grad.addColorStop(0, '#262629');
      grad.addColorStop(0.5, '#3b3b40');
      grad.addColorStop(1, '#202023');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, 0, ribWidth, canvas.height);

      // Vale
      ctx.fillStyle = '#121214';
      ctx.fillRect(x + ribWidth + 2, 0, ribSpacing - ribWidth - 2, canvas.height);
    }

    // Micro-granulação tátil
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 1);
  textureCache[key] = texture;
  return texture;
}

/**
 * Gera mapa de relevo (bump map) para dar profundidade 3D real às ranhuras de borracha
 */
export function createRubberBumpMap(ribSpacing = 8, ribWidth = 4): THREE.CanvasTexture {
  const key = `rubber_bump_${ribSpacing}_${ribWidth}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#000000'; // Vales pretos (rebaixo)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x += ribSpacing) {
      // Cristas brancas (relevo alto)
      const grad = ctx.createLinearGradient(x, 0, x + ribWidth, 0);
      grad.addColorStop(0, '#444444');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, ribWidth, canvas.height);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 1);
  textureCache[key] = texture;
  return texture;
}

/**
 * Textura com as gravações frontais da lente em alta definição
 */
export function createFrontBezelTexture(): THREE.CanvasTexture {
  const key = 'front_bezel_text_hd';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#161618';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Texto circular gravado com precisão óptica
    const text = 'PRO OPTICS · ZOOM LENS EF 70-200mm  1:2.8  L  IS  USM · Ø77mm · ULTRASONIC · FLUORITE ED';
    const radius = 385;
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const angleStep = (Math.PI * 1.88) / text.length;
    const startAngle = -Math.PI * 0.94;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charAngle = startAngle + i * angleStep;
      ctx.save();
      ctx.rotate(charAngle);
      ctx.translate(0, -radius);

      if (char === 'L') {
        ctx.fillStyle = '#ef233c'; // 'L' vermelho icônico
        ctx.fillText(char, 0, 0);
        ctx.fillStyle = '#f1f5f9';
      } else {
        ctx.fillText(char, 0, 0);
      }
      ctx.restore();
    }

    // Círculos concêntricos de acabamento torneado
    ctx.strokeStyle = '#2d2e33';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius - 35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Textura com marcações de distância focal no anel de zoom (70, 100, 135, 200)
 */
export function createZoomMarkingsTexture(): THREE.CanvasTexture {
  const key = 'zoom_markings_hd';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    const marks = [
      { text: '70', x: 130 },
      { text: '100', x: 280 },
      { text: '135', x: 440 },
      { text: '200', x: 620 },
    ];

    marks.forEach((mark) => {
      // Traço indicador superior
      ctx.beginPath();
      ctx.moveTo(mark.x, 24);
      ctx.lineTo(mark.x, 56);
      ctx.stroke();

      // Número gravado
      ctx.font = 'bold 36px "JetBrains Mono", sans-serif';
      ctx.fillText(mark.text, mark.x, 110);
    });

    // Sub-traços graduados
    const subMarks = [205, 360, 530];
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    subMarks.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, 50);
      ctx.stroke();
    });

    // Marcador branco de índice de zoom
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(620, 155, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Textura da escala de distância de foco (metros em branco, pés em laranja, linha vermelha e DoF)
 */
export function createDistanceScaleTexture(): THREE.CanvasTexture {
  const key = 'distance_scale_hd';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha de índice central vermelha
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 16);
    ctx.lineTo(canvas.width / 2, canvas.height - 16);
    ctx.stroke();

    // Valores em metros (branco)
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    const meters = [
      { text: '1.2', x: 130 },
      { text: '1.5', x: 250 },
      { text: '2', x: 370 },
      { text: '3', x: 490 },
      { text: '5', x: 610 },
      { text: '10', x: 730 },
      { text: '∞', x: 860 },
    ];

    meters.forEach((m) => {
      ctx.fillText(m.text, m.x, 78);
      ctx.fillRect(m.x - 1, 92, 2.5, 14);
    });

    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('m', 70, 78);

    // Valores em pés (laranja característico)
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f59e0b';

    const feet = [
      { text: '4', x: 150 },
      { text: '5', x: 270 },
      { text: '7', x: 400 },
      { text: '10', x: 540 },
      { text: '20', x: 680 },
      { text: '∞', x: 860 },
    ];

    feet.forEach((f) => {
      ctx.fillText(f.text, f.x, 172);
      ctx.fillRect(f.x - 1, 134, 2.5, 12);
    });

    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('ft', 70, 172);

    // Escala de profundidade de campo (DoF marks: 32 | 16 | 16 | 32)
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('32', canvas.width / 2 - 40, 120);
    ctx.fillText('16', canvas.width / 2 - 20, 120);
    ctx.fillText('16', canvas.width / 2 + 20, 120);
    ctx.fillText('32', canvas.width / 2 + 40, 120);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Textura do painel de interruptores de estabilizador, limitador e foco
 */
export function createSwitchPanelTexture(): THREE.CanvasTexture {
  const key = 'switch_panel_hd';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#202125';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#32343b';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#ffffff';

    // 1. LIMITADOR DE FOCO
    ctx.font = 'bold 18px "JetBrains Mono", sans-serif';
    ctx.fillText('FOCUS LIMITER', 32, 55);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('FULL  |  2.5m - ∞', 32, 85);

    // 2. FOCO AF / MF
    ctx.font = 'bold 18px "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AF / MF', 32, 170);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('AF      MF', 32, 200);

    // 3. ESTABILIZADOR ON / OFF
    ctx.font = 'bold 18px "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STABILIZER', 32, 285);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ON      OFF', 32, 315);

    // 4. MODO DE ESTABILIZAÇÃO 1 / 2
    ctx.font = 'bold 18px "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STABILIZER MODE', 32, 400);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('1 (ALL)  2 (PAN)', 32, 430);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Textura do sensor digital da câmera (Matriz CMOS de alta fidelidade)
 */
export function createCameraSensorTexture(): THREE.CanvasTexture {
  const key = 'camera_sensor_hd';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
    grad.addColorStop(0, '#065f46');
    grad.addColorStop(0.5, '#022c22');
    grad.addColorStop(1, '#021814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Malha de micro-lentes
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
    ctx.lineWidth = 1;
    const step = 8;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Moldura do chip com contatos dourados
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#fde047';
    for (let i = 24; i < canvas.width - 24; i += 16) {
      ctx.fillRect(i, 6, 8, 4);
      ctx.fillRect(i, canvas.height - 10, 8, 4);
      ctx.fillRect(6, i, 4, 8);
      ctx.fillRect(canvas.width - 10, i, 4, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}
