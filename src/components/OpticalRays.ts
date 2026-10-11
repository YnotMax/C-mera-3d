import * as THREE from 'three';

/**
 * Simulação física e volumétrica avançada dos feixes de luz refratados através da lente.
 * Apresenta refração pela Lei de Snell em múltiplos comprimentos de onda,
 * cones de luz volumétricos com mistura aditiva, corte pelo diafragma de 9 lâminas
 * e bokeh poligonal cáustico sobre o sensor CMOS.
 */

export interface RayPath {
  color: THREE.Color;
  points: THREE.Vector3[];
  wavelength: string;
  marginal: boolean;
}

export class OpticalRaySystem {
  public group: THREE.Group;
  private rayLinesGroup: THREE.Group;
  private volumetricConesGroup: THREE.Group;
  private particleGroup: THREE.Points;
  private bokehSensorMesh: THREE.Mesh;
  private bokehMaterial: THREE.MeshBasicMaterial;

  private particlePositions: Float32Array;
  private particleProgress: Float32Array;
  private particleColors: Float32Array;
  private totalParticles = 280;
  private rayPaths: RayPath[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'optical_rays_system';

    this.volumetricConesGroup = new THREE.Group();
    this.group.add(this.volumetricConesGroup);

    this.rayLinesGroup = new THREE.Group();
    this.group.add(this.rayLinesGroup);

    // Sistema de partículas de fótons
    const particleGeometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.totalParticles * 3);
    this.particleProgress = new Float32Array(this.totalParticles);
    this.particleColors = new Float32Array(this.totalParticles * 3);

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleGroup = new THREE.Points(particleGeometry, particleMaterial);
    this.group.add(this.particleGroup);

    // Bokeh poligonal (9 lados correspondente às 9 lâminas) no sensor CMOS
    const bokehShape = new THREE.Shape();
    const sides = 9;
    const rBokeh = 14;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * rBokeh;
      const y = Math.sin(a) * rBokeh;
      if (i === 0) bokehShape.moveTo(x, y);
      else bokehShape.lineTo(x, y);
    }
    bokehShape.closePath();

    const bokehGeo = new THREE.ShapeGeometry(bokehShape);
    this.bokehMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.bokehSensorMesh = new THREE.Mesh(bokehGeo, this.bokehMaterial);
    this.bokehSensorMesh.position.set(0, 0, 195);
    this.group.add(this.bokehSensorMesh);

    this.buildRayPaths(1.0, 70, Infinity);
  }

  /**
   * Recalcula a geometria dos feixes e cones de luz conforme a abertura, distância focal e foco
   */
  public buildRayPaths(apertureNormalized: number = 1.0, focalLength: number = 70, focusDistance: number = Infinity) {
    while (this.rayLinesGroup.children.length > 0) {
      const obj = this.rayLinesGroup.children[0] as THREE.Line;
      this.rayLinesGroup.remove(obj);
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }

    while (this.volumetricConesGroup.children.length > 0) {
      const obj = this.volumetricConesGroup.children[0] as THREE.Mesh;
      this.volumetricConesGroup.remove(obj);
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }

    this.rayPaths = [];

    // Bandas espectrais com dispersão cromática real (n azul > n vermelho)
    const spectralBands = [
      { color: new THREE.Color(0xff2a55), name: '650nm (Vermelho)', nOffset: -0.018 },
      { color: new THREE.Color(0xff9900), name: '589nm (Âmbar)', nOffset: -0.009 },
      { color: new THREE.Color(0x22ee77), name: '532nm (Verde)', nOffset: 0.0 },
      { color: new THREE.Color(0x00d4ff), name: '486nm (Ciano)', nOffset: 0.01 },
      { color: new THREE.Color(0x4361ee), name: '435nm (Azul Violeta)', nOffset: 0.022 },
    ];

    const irisMaxRadius = 24 * (0.16 + 0.84 * apertureNormalized);

    const zStart = -240;
    const zFront = -120;
    const zGroup1 = -90;
    const zZoom = -20;
    const zIris = 25;
    const zIS = 55;
    const zRear = 85;
    const zSensor = 195;

    // Divergência de entrada baseada na distância de foco (infinito = colimado paralelo)
    const divergenceFactor = focusDistance < 5 ? (5 - focusDistance) * 0.04 : 0.0;

    // Cones volumétricos semitransparentes de luz
    this.createVolumetricBeams(irisMaxRadius);

    const rayDistributions = [
      { r: 0, a: 0, marginal: false },
      { r: 10, a: 0, marginal: false },
      { r: 10, a: Math.PI * 0.5, marginal: false },
      { r: 10, a: Math.PI, marginal: false },
      { r: 10, a: -Math.PI * 0.5, marginal: false },
      { r: 20, a: Math.PI * 0.25, marginal: false },
      { r: 20, a: -Math.PI * 0.25, marginal: false },
      { r: 20, a: Math.PI * 0.75, marginal: false },
      { r: 20, a: -Math.PI * 0.75, marginal: false },
      { r: 28, a: 0, marginal: true },
      { r: 28, a: Math.PI * 0.5, marginal: true },
      { r: 28, a: Math.PI, marginal: true },
      { r: 28, a: -Math.PI * 0.5, marginal: true },
      { r: 34, a: Math.PI * 0.35, marginal: true },
      { r: 34, a: -Math.PI * 0.65, marginal: true },
    ];

    let pIdx = 0;

    spectralBands.forEach((band) => {
      rayDistributions.forEach((dist) => {
        const cosA = Math.cos(dist.a);
        const sinA = Math.sin(dist.a);

        // Pontos de entrada com divergência
        const inR = dist.r * (1.0 + divergenceFactor);
        const p0 = new THREE.Vector3(inR * cosA, inR * sinA, zStart);
        const p1 = new THREE.Vector3(dist.r * cosA, dist.r * sinA, zFront);

        // Refração no Elemento Frontal
        const r1 = dist.r * (0.86 - band.nOffset * 0.6);
        const p2 = new THREE.Vector3(r1 * cosA, r1 * sinA, zGroup1);

        // Refração no Dublete
        const r2 = r1 * (0.76 - band.nOffset * 0.7);
        const p3 = new THREE.Vector3(r2 * cosA, r2 * sinA, zZoom);

        // Diafragma de 9 lâminas
        const rIris = r2 * (0.62 - band.nOffset * 0.5);
        const isBlocked = Math.abs(rIris) > irisMaxRadius;

        const p4 = new THREE.Vector3(
          Math.min(rIris, irisMaxRadius) * cosA,
          Math.min(rIris, irisMaxRadius) * sinA,
          zIris
        );

        if (isBlocked) {
          const pts = [p0, p1, p2, p3, p4];
          this.createRayLine(pts, band.color.clone().multiplyScalar(0.22), 0.18);
          return;
        }

        // Estabilizador IS
        const rIS = rIris * (0.78 - band.nOffset * 0.4);
        const p5 = new THREE.Vector3(rIS * cosA, rIS * sinA, zIS);

        // Grupo Traseiro
        const rRear = rIS * 0.65;
        const p6 = new THREE.Vector3(rRear * cosA, rRear * sinA, zRear);

        // Ponto focal no sensor
        const sensorDisp = band.nOffset * 4.2;
        const pFocus = new THREE.Vector3(sensorDisp * cosA, sensorDisp * sinA, zSensor);

        const pts = [p0, p1, p2, p3, p4, p5, p6, pFocus];
        this.rayPaths.push({
          color: band.color,
          points: pts,
          wavelength: band.name,
          marginal: dist.marginal,
        });

        this.createRayLine(pts, band.color, 0.88);

        // Partículas
        if (pIdx < this.totalParticles) {
          this.particleProgress[pIdx] = Math.random();
          this.particleColors[pIdx * 3] = band.color.r;
          this.particleColors[pIdx * 3 + 1] = band.color.g;
          this.particleColors[pIdx * 3 + 2] = band.color.b;
          pIdx++;
        }
      });
    });

    // Atualiza escala e brilho do bokeh poligonal no sensor
    const bokehScale = 0.25 + 0.75 * apertureNormalized;
    this.bokehSensorMesh.scale.set(bokehScale, bokehScale, bokehScale);
    this.bokehMaterial.opacity = 0.4 + 0.55 * (1.0 - apertureNormalized);

    const colAttr = this.particleGroup.geometry.getAttribute('color') as THREE.BufferAttribute;
    if (colAttr) colAttr.needsUpdate = true;
  }

  private createVolumetricBeams(irisRadius: number) {
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Cilindro de entrada colimado
    const inCylGeo = new THREE.CylinderGeometry(34, 34, 120, 32, 1, true);
    inCylGeo.rotateX(Math.PI / 2);
    const inCyl = new THREE.Mesh(inCylGeo, beamMat);
    inCyl.position.z = -180;
    this.volumetricConesGroup.add(inCyl);

    // Cone convergente interno
    const cone1Geo = new THREE.CylinderGeometry(irisRadius, 34, 145, 32, 1, true);
    cone1Geo.rotateX(Math.PI / 2);
    const cone1 = new THREE.Mesh(cone1Geo, beamMat);
    cone1.position.z = -47.5;
    this.volumetricConesGroup.add(cone1);

    // Cone convergente final afunilando para o sensor
    const cone2Geo = new THREE.CylinderGeometry(1.5, irisRadius, 170, 32, 1, true);
    cone2Geo.rotateX(Math.PI / 2);
    const cone2 = new THREE.Mesh(cone2Geo, beamMat);
    cone2.position.z = 110;
    this.volumetricConesGroup.add(cone2);
  }

  private createRayLine(points: THREE.Vector3[], color: THREE.Color, opacity: number) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    this.rayLinesGroup.add(line);
  }

  public update(delta: number, speedMultiplier: number = 1.0) {
    if (this.rayPaths.length === 0) return;

    const posAttr = this.particleGroup.geometry.getAttribute('position') as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < this.totalParticles; i++) {
      const pathIdx = i % this.rayPaths.length;
      const path = this.rayPaths[pathIdx];

      this.particleProgress[i] = (this.particleProgress[i] + delta * 0.5 * speedMultiplier) % 1.0;
      const progress = this.particleProgress[i];

      const pts = path.points;
      const segCount = pts.length - 1;
      const scaledP = progress * segCount;
      const segIdx = Math.min(Math.floor(scaledP), segCount - 1);
      const segFrac = scaledP - segIdx;

      const pA = pts[segIdx];
      const pB = pts[segIdx + 1];

      pos[i * 3] = pA.x + (pB.x - pA.x) * segFrac;
      pos[i * 3 + 1] = pA.y + (pB.y - pA.y) * segFrac;
      pos[i * 3 + 2] = pA.z + (pB.z - pA.z) * segFrac;
    }

    posAttr.needsUpdate = true;
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
