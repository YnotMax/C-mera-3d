import * as THREE from 'three';

/**
 * Gerador de mapa de ambiente de estúdio HDR procedural (IBL - Image Based Lighting).
 * Cria caixas de luz difusas de estúdio fotográfico, reflexos de teto e piso suave,
 * conferindo reflexos realistas a vidros ópticos e metais sem carregar imagens externas.
 */

export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fundo escuro com gradiente suave de estúdio
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0c1017'); // Teto escuro
    bgGrad.addColorStop(0.45, '#1e2430'); // Linha do horizonte
    bgGrad.addColorStop(0.55, '#161a22');
    bgGrad.addColorStop(1, '#080a0e'); // Piso escuro
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Softbox superior principal (Grande difusor retangular no teto)
    const softbox1 = ctx.createRadialGradient(512, 120, 10, 512, 120, 220);
    softbox1.addColorStop(0, '#ffffff');
    softbox1.addColorStop(0.3, '#f1f5f9');
    softbox1.addColorStop(0.7, '#64748b');
    softbox1.addColorStop(1, 'transparent');
    ctx.fillStyle = softbox1;
    ctx.fillRect(256, 20, 512, 200);

    // 2. Stripbox lateral esquerda (Faixa vertical de luz para realçar silhueta)
    const strip1 = ctx.createLinearGradient(120, 0, 220, 0);
    strip1.addColorStop(0, 'transparent');
    strip1.addColorStop(0.4, '#38bdf8'); // Toque sutil azul-celeste
    strip1.addColorStop(0.5, '#ffffff');
    strip1.addColorStop(0.6, '#38bdf8');
    strip1.addColorStop(1, 'transparent');
    ctx.fillStyle = strip1;
    ctx.fillRect(120, 80, 100, 320);

    // 3. Stripbox lateral direita (Luz de preenchimento âmbar suave)
    const strip2 = ctx.createLinearGradient(800, 0, 900, 0);
    strip2.addColorStop(0, 'transparent');
    strip2.addColorStop(0.4, '#fbbf24'); // Toque dourado/âmbar
    strip2.addColorStop(0.5, '#fffbeb');
    strip2.addColorStop(0.6, '#fbbf24');
    strip2.addColorStop(1, 'transparent');
    ctx.fillStyle = strip2;
    ctx.fillRect(800, 80, 100, 320);

    // 4. Luz de realce de horizonte para reflexos no aro vermelho e vidro
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 240, canvas.width, 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const envMap = pmremGenerator.fromEquirectangular(texture);
  texture.dispose();
  pmremGenerator.dispose();

  return envMap;
}
