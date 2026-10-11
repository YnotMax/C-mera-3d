import * as THREE from 'three';
import {
  createRubberGripTexture,
  createRubberBumpMap,
  createFrontBezelTexture,
  createZoomMarkingsTexture,
  createDistanceScaleTexture,
  createSwitchPanelTexture,
  createCameraSensorTexture,
} from './ProceduralTextures';
import { LENS_PARTS_INFO } from './LensData';

/**
 * Construtor 3D de alta fidelidade para a lente profissional 70-200mm f/2.8 L IS USM.
 * Inclui vidros ópticos físicos espessos com iridescência multicamadas (anti-reflective coating),
 * colar de tripé Arca-Swiss, anéis chanfrados usinados, diafragma mecânico, cinemática de foco e zoom.
 */

export interface PartMeshMap {
  [partId: string]: THREE.Group;
}

export class LensModelBuilder {
  public rootGroup: THREE.Group;
  public partsMap: PartMeshMap = {};
  public apertureBlades: THREE.Mesh[] = [];
  public isUnitMesh: THREE.Group | null = null;
  public zoomGroupMesh: THREE.Group | null = null;
  public zoomRingGroup: THREE.Group | null = null;
  public focusRingGroup: THREE.Group | null = null;
  public distanceDrumMesh: THREE.Mesh | null = null;
  public clippingPlane: THREE.Plane;
  private cutawayMaterials: THREE.Material[] = [];
  private glassMaterials: THREE.MeshPhysicalMaterial[] = [];

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'camera_lens_pro';

    // Plano de corte para corte lateral transversal (corta no semiplano X > 0)
    this.clippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 1000);

    this.buildAllComponents();
  }

  private buildAllComponents() {
    this.buildFrontBezel();
    this.buildRedRing();
    this.buildFrontGlassElement();
    this.buildGroup1Doublet();
    this.buildFocusRing();
    this.buildDistanceWindow();
    this.buildUSMMotor();
    this.buildZoomCams();
    this.buildApertureMechanism();
    this.buildISStabilizer();
    this.buildRearZoomGroup();
    this.buildZoomRing();
    this.buildTripodCollar();
    this.buildSwitchPanel();
    this.buildRearMount();
    this.buildGoldContacts();
    this.buildCameraSensor();
  }

  private registerPart(partId: string, group: THREE.Group, baseZ: number) {
    const info = LENS_PARTS_INFO[partId];
    if (!info) return;

    group.name = partId;
    group.userData = {
      partId: info.id,
      name: info.name,
      category: info.category,
      basePosition: new THREE.Vector3(0, 0, baseZ),
      explodePosition: new THREE.Vector3(0, 0, baseZ + info.explodeOffset),
    };
    group.position.copy(group.userData.basePosition);

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.partId = partId;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.partsMap[partId] = group;
    this.rootGroup.add(group);
  }

  private createChassisMaterial(color = 0x18181b, roughness = 0.28, metalness = 0.88): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      clippingPlanes: [this.clippingPlane],
      clipShadows: true,
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(mat);
    return mat;
  }

  private createOpticalGlassMaterial(coatingColor = 0xa7f3d0, iridescenceHue = 0x10b981): THREE.MeshPhysicalMaterial {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.98,
      opacity: 1.0,
      transparent: true,
      roughness: 0.02,
      metalness: 0.02,
      ior: 1.524,
      thickness: 18,
      attenuationDistance: 60,
      attenuationColor: new THREE.Color(coatingColor),
      reflectivity: 0.85,
      specularColor: new THREE.Color(coatingColor),
      specularIntensity: 1.0,
      iridescence: 0.85,
      iridescenceIOR: 1.33,
      iridescenceThicknessRange: [100, 420],
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.glassMaterials.push(mat);
    this.cutawayMaterials.push(mat);
    return mat;
  }

  // 1. ARO FRONTAL, ROSCA DE FILTRO E BAIONETA DE PARA-SOL
  private buildFrontBezel() {
    const group = new THREE.Group();
    const baseZ = -135;

    const bezelMat = this.createChassisMaterial(0x19191c, 0.28, 0.9);
    const textTex = createFrontBezelTexture();
    const textMat = new THREE.MeshStandardMaterial({
      map: textTex,
      roughness: 0.35,
      metalness: 0.75,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(textMat);

    const outerBezelGeo = new THREE.CylinderGeometry(44.2, 44.2, 18, 64, 1, true);
    outerBezelGeo.rotateX(Math.PI / 2);
    const outerBezel = new THREE.Mesh(outerBezelGeo, bezelMat);
    group.add(outerBezel);

    const diskGeo = new THREE.RingGeometry(37, 44.2, 64);
    const frontDisk = new THREE.Mesh(diskGeo, textMat);
    frontDisk.position.z = -9;
    group.add(frontDisk);

    const threadMat = this.createChassisMaterial(0x121214, 0.4, 0.92);
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.TorusGeometry(38.2, 0.35, 8, 48);
      const ring = new THREE.Mesh(ringGeo, threadMat);
      ring.position.z = -8 + i * 1.4;
      group.add(ring);
    }

    const bayonetHoodMat = this.createChassisMaterial(0x27272a, 0.25, 0.95);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const hoodLugGeo = new THREE.BoxGeometry(3, 1.8, 5);
      const lug = new THREE.Mesh(hoodLugGeo, bayonetHoodMat);
      lug.position.set(Math.cos(angle) * 44.4, Math.sin(angle) * 44.4, -4);
      lug.rotation.z = angle;
      group.add(lug);
    }

    this.registerPart('front_bezel', group, baseZ);
  }

  // 2. FAIXA VERMELHA DISTINTIVA (SÉRIE L)
  private buildRedRing() {
    const group = new THREE.Group();
    const baseZ = -123;

    const redMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      roughness: 0.16,
      metalness: 0.95,
      emissive: 0x490510,
      emissiveIntensity: 0.22,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(redMat);

    const redRingGeo = new THREE.CylinderGeometry(44.4, 44.4, 4.5, 64, 1, false);
    redRingGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(redRingGeo, redMat);
    group.add(ringMesh);

    const silverMat = this.createChassisMaterial(0xe2e8f0, 0.12, 0.98);
    const edge1Geo = new THREE.TorusGeometry(44.4, 0.35, 12, 64);
    const edge1 = new THREE.Mesh(edge1Geo, silverMat);
    edge1.position.z = -2.3;
    group.add(edge1);

    const edge2 = edge1.clone();
    edge2.position.z = 2.3;
    group.add(edge2);

    this.registerPart('red_ring', group, baseZ);
  }

  // 3. ELEMENTO FRONTAL DE VIDRO (FLUORITA / ED)
  private buildFrontGlassElement() {
    const group = new THREE.Group();
    const baseZ = -118;

    const glassMat = this.createOpticalGlassMaterial(0x86efac, 0x10b981);

    const glassGeo = new THREE.SphereGeometry(37, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.38);
    glassGeo.scale(1, 1, 0.32);
    glassGeo.rotateX(Math.PI);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    group.add(glassMesh);

    const holderMat = this.createChassisMaterial(0x1a1a1d, 0.35, 0.9);
    const holderGeo = new THREE.CylinderGeometry(41, 41, 14, 48, 1, true);
    holderGeo.rotateX(Math.PI / 2);
    const holder = new THREE.Mesh(holderGeo, holderMat);
    group.add(holder);

    this.registerPart('front_element', group, baseZ);
  }

  // 4. DUBLETE ACROMÁTICO (CROWN + FLINT)
  private buildGroup1Doublet() {
    const group = new THREE.Group();
    const baseZ = -92;

    const crownGlassMat = this.createOpticalGlassMaterial(0x6ee7b7, 0x059669);
    const flintGlassMat = this.createOpticalGlassMaterial(0x93c5fd, 0x3b82f6);

    const lens1Geo = new THREE.SphereGeometry(33, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.35);
    lens1Geo.scale(1, 1, 0.28);
    const lens1 = new THREE.Mesh(lens1Geo, crownGlassMat);
    lens1.position.z = -4;
    group.add(lens1);

    const lens2Geo = new THREE.SphereGeometry(33, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.32);
    lens2Geo.scale(1, 1, 0.25);
    lens2Geo.rotateX(Math.PI);
    const lens2 = new THREE.Mesh(lens2Geo, flintGlassMat);
    lens2.position.z = 4;
    group.add(lens2);

    const cellMat = this.createChassisMaterial(0x27272a, 0.28, 0.92);
    const cellGeo = new THREE.CylinderGeometry(36, 36, 16, 48, 1, true);
    cellGeo.rotateX(Math.PI / 2);
    const cell = new THREE.Mesh(cellGeo, cellMat);
    group.add(cell);

    this.registerPart('group1_doublet', group, baseZ);
  }

  // 5. ANEL DE FOCO MANUAL EM BORRACHA RANHURADA
  private buildFocusRing() {
    const group = new THREE.Group();
    const baseZ = -68;

    const rubberTex = createRubberGripTexture(8, 4);
    const rubberBump = createRubberBumpMap(8, 4);
    const rubberMat = new THREE.MeshStandardMaterial({
      map: rubberTex,
      bumpMap: rubberBump,
      bumpScale: 0.8,
      roughness: 0.85,
      metalness: 0.08,
      color: 0x222225,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(rubberMat);

    const ringGeo = new THREE.CylinderGeometry(44.0, 44.0, 26, 64, 1, true);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, rubberMat);
    group.add(ring);

    const collarMat = this.createChassisMaterial(0x19191c, 0.25, 0.92);
    const collar1Geo = new THREE.CylinderGeometry(44.2, 44.0, 2, 48, 1, false);
    collar1Geo.rotateX(Math.PI / 2);
    const collar1 = new THREE.Mesh(collar1Geo, collarMat);
    collar1.position.z = -14;
    group.add(collar1);

    const collar2 = collar1.clone();
    collar2.position.z = 14;
    group.add(collar2);

    this.focusRingGroup = group;
    this.registerPart('focus_ring', group, baseZ);
  }

  // 6. JANELA DE ESCALA DE DISTÂNCIA
  private buildDistanceWindow() {
    const group = new THREE.Group();
    const baseZ = -44;

    const barrelMat = this.createChassisMaterial(0x18181b, 0.3, 0.9);
    const barrelGeo = new THREE.CylinderGeometry(43.7, 43.7, 20, 64, 1, true);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    group.add(barrel);

    const distTex = createDistanceScaleTexture();
    const drumMat = new THREE.MeshStandardMaterial({
      map: distTex,
      roughness: 0.35,
      metalness: 0.4,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(drumMat);

    const drumGeo = new THREE.CylinderGeometry(41.8, 41.8, 14, 48, 1, true);
    drumGeo.rotateX(Math.PI / 2);
    const drum = new THREE.Mesh(drumGeo, drumMat);
    group.add(drum);
    this.distanceDrumMesh = drum;

    const windowGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      roughness: 0.08,
      transparent: true,
      opacity: 0.7,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(windowGlassMat);

    const windowPlateGeo = new THREE.CylinderGeometry(43.8, 43.8, 13, 32, 1, true, -Math.PI * 0.22, Math.PI * 0.44);
    windowPlateGeo.rotateX(Math.PI / 2);
    const windowPlate = new THREE.Mesh(windowPlateGeo, windowGlassMat);
    group.add(windowPlate);

    this.registerPart('distance_window', group, baseZ);
  }

  // 7. MOTOR ULTRASSÔNICO USM (PIEZOELÉTRICO)
  private buildUSMMotor() {
    const group = new THREE.Group();
    const baseZ = -22;

    const statorMat = this.createChassisMaterial(0x94a3b8, 0.22, 0.92);
    const statorGeo = new THREE.CylinderGeometry(39.8, 39.8, 12, 48, 1, true);
    statorGeo.rotateX(Math.PI / 2);
    const stator = new THREE.Mesh(statorGeo, statorMat);
    group.add(stator);

    const toothGeo = new THREE.BoxGeometry(1.2, 2.5, 10);
    const toothCount = 40;
    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, statorMat);
      tooth.position.set(Math.cos(angle) * 39.2, Math.sin(angle) * 39.2, 0);
      tooth.rotation.z = angle;
      group.add(tooth);
    }

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.96,
      roughness: 0.18,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(copperMat);

    const coilRingGeo = new THREE.TorusGeometry(37.2, 1.3, 12, 48);
    const coil1 = new THREE.Mesh(coilRingGeo, copperMat);
    coil1.position.z = -3;
    group.add(coil1);

    const coil2 = coil1.clone();
    coil2.position.z = 3;
    group.add(coil2);

    const rotorMat = this.createChassisMaterial(0x475569, 0.28, 0.9);
    const rotorGeo = new THREE.CylinderGeometry(40.8, 40.8, 4, 48, 1, true);
    rotorGeo.rotateX(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.z = 7;
    group.add(rotor);

    this.registerPart('usm_motor', group, baseZ);
  }

  // 8. CAMES HELICOIDAIS E TRILHOS DO ZOOM
  private buildZoomCams() {
    const group = new THREE.Group();
    const baseZ = 2;

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(brassMat);

    const barrelGeo = new THREE.CylinderGeometry(38.8, 38.8, 26, 48, 1, true);
    barrelGeo.rotateX(Math.PI / 2);
    const camBarrel = new THREE.Mesh(barrelGeo, brassMat);
    group.add(camBarrel);

    const pinMat = this.createChassisMaterial(0xf1f5f9, 0.12, 0.96);
    const slotCount = 3;
    for (let s = 0; s < slotCount; s++) {
      const baseAngle = (s / slotCount) * Math.PI * 2;
      for (let step = -10; step <= 10; step += 2) {
        const angle = baseAngle + (step / 10) * 0.48;
        const radius = 38.9;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const pinGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.0, 12);
        pinGeo.rotateZ(Math.PI / 2);
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(x, y, step);
        pin.rotation.z = angle;
        group.add(pin);
      }
    }

    this.registerPart('zoom_cams', group, baseZ);
  }

  // 9. MECANISMO DO DIAFRAGMA (9 LÂMINAS CIRCULARES)
  private buildApertureMechanism() {
    const group = new THREE.Group();
    const baseZ = 25;

    const irisRingMat = this.createChassisMaterial(0x18181b, 0.32, 0.88);
    const ringGeo = new THREE.CylinderGeometry(38.2, 38.2, 8, 48, 1, true);
    ringGeo.rotateX(Math.PI / 2);
    const irisRing = new THREE.Mesh(ringGeo, irisRingMat);
    group.add(irisRing);

    const plateGeo = new THREE.RingGeometry(24, 38.0, 48);
    const plateFront = new THREE.Mesh(plateGeo, irisRingMat);
    plateFront.position.z = -3.8;
    group.add(plateFront);

    const plateBack = plateFront.clone();
    plateBack.position.z = 3.8;
    group.add(plateBack);

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x121214,
      metalness: 0.92,
      roughness: 0.22,
      side: THREE.DoubleSide,
      clippingPlanes: [this.clippingPlane],
    });
    this.cutawayMaterials.push(bladeMat);

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.bezierCurveTo(4, 12, 16, 20, 26, 18);
    bladeShape.bezierCurveTo(24, 10, 16, 4, 8, 0);
    bladeShape.closePath();

    const bladeGeo = new THREE.ShapeGeometry(bladeShape);
    bladeGeo.scale(0.88, 0.88, 0.88);

    const bladeCount = 9;
    const pivotRadius = 25;

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2;
      const bladeContainer = new THREE.Group();
      bladeContainer.position.set(
        Math.cos(angle) * pivotRadius,
        Math.sin(angle) * pivotRadius,
        (i - 4.5) * 0.15
      );
      bladeContainer.rotation.z = angle + Math.PI * 0.35;

      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.userData = {
        pivotAngle: angle,
        baseRotZ: angle + Math.PI * 0.35,
      };

      bladeContainer.add(bladeMesh);
      group.add(bladeContainer);
      this.apertureBlades.push(bladeMesh);

      const pivotPinGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 12);
      pivotPinGeo.rotateX(Math.PI / 2);
      const pivotPin = new THREE.Mesh(pivotPinGeo, irisRingMat);
      bladeContainer.add(pivotPin);
    }

    this.registerPart('aperture_mechanism', group, baseZ);
  }

  // 10. ESTABILIZADOR ÓPTICO DE IMAGEM (IS)
  private buildISStabilizer() {
    const group = new THREE.Group();
    const baseZ = 55;

    const isLensMat = this.createOpticalGlassMaterial(0xa5f3fc, 0x0284c7);
    const lensGeo = new THREE.SphereGeometry(22, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.35);
    lensGeo.scale(1, 1, 0.22);
    const lens = new THREE.Mesh(lensGeo, isLensMat);
    group.add(lens);

    const cageMat = this.createChassisMaterial(0x334155, 0.28, 0.92);
    const cageGeo = new THREE.CylinderGeometry(26, 26, 7, 36, 1, true);
    cageGeo.rotateX(Math.PI / 2);
    const cage = new THREE.Mesh(cageGeo, cageMat);
    group.add(cage);

    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.95,
      roughness: 0.18,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(coilMat);

    const magnetMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.92,
      roughness: 0.15,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(magnetMat);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = Math.cos(angle) * 31;
      const y = Math.sin(angle) * 31;

      const coilGeo = new THREE.CylinderGeometry(2.5, 2.5, 5, 16);
      const coilMesh = new THREE.Mesh(coilGeo, coilMat);
      coilMesh.position.set(x, y, 0);
      coilMesh.rotation.z = angle + Math.PI / 2;
      group.add(coilMesh);

      const magnetGeo = new THREE.BoxGeometry(3, 4, 5);
      const magnetMesh = new THREE.Mesh(magnetGeo, magnetMat);
      magnetMesh.position.set(Math.cos(angle) * 35.5, Math.sin(angle) * 35.5, 0);
      magnetMesh.rotation.z = angle;
      group.add(magnetMesh);

      const springGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
      springGeo.rotateX(Math.PI / 2);
      const spring = new THREE.Mesh(springGeo, coilMat);
      spring.position.set(Math.cos(angle + 0.3) * 29, Math.sin(angle + 0.3) * 29, 0);
      group.add(spring);
    }

    this.isUnitMesh = group;
    this.registerPart('is_stabilizer', group, baseZ);
  }

  // 11. GRUPO ÓPTICO TRASEIRO (FOCO INTERNO)
  private buildRearZoomGroup() {
    const group = new THREE.Group();
    const baseZ = 85;

    const glassMat = this.createOpticalGlassMaterial(0xc4b5fd, 0x8b5cf6);
    const rearLensGeo = new THREE.SphereGeometry(24, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.4);
    rearLensGeo.scale(1, 1, 0.25);
    rearLensGeo.rotateX(Math.PI);
    const rearLens = new THREE.Mesh(rearLensGeo, glassMat);
    group.add(rearLens);

    const sleeveMat = this.createChassisMaterial(0x18181b, 0.35, 0.88);
    const sleeveGeo = new THREE.CylinderGeometry(28, 28, 14, 36, 1, true);
    sleeveGeo.rotateX(Math.PI / 2);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    group.add(sleeve);

    this.zoomGroupMesh = group;
    this.registerPart('rear_zoom_group', group, baseZ);
  }

  // 12. ANEL DE ZOOM COM NÚMEROS BRANCOS (70, 100, 135, 200mm)
  private buildZoomRing() {
    const group = new THREE.Group();
    const baseZ = 108;

    const rubberTex = createRubberGripTexture(10, 5);
    const rubberBump = createRubberBumpMap(10, 5);
    const rubberMat = new THREE.MeshStandardMaterial({
      map: rubberTex,
      bumpMap: rubberBump,
      bumpScale: 0.8,
      roughness: 0.86,
      metalness: 0.06,
      color: 0x222225,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(rubberMat);

    const ringGeo = new THREE.CylinderGeometry(44.4, 44.4, 28, 64, 1, true);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, rubberMat);
    group.add(ring);

    const markingsTex = createZoomMarkingsTexture();
    const markingsMat = new THREE.MeshStandardMaterial({
      map: markingsTex,
      roughness: 0.32,
      metalness: 0.85,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(markingsMat);

    const markingsGeo = new THREE.CylinderGeometry(44.6, 44.6, 10, 64, 1, true);
    markingsGeo.rotateX(Math.PI / 2);
    const markings = new THREE.Mesh(markingsGeo, markingsMat);
    markings.position.z = -16;
    group.add(markings);

    this.zoomRingGroup = group;
    this.registerPart('zoom_ring', group, baseZ);
  }

  // 13. COLAR DE TRIPÉ COM BASE ARCA-SWISS
  private buildTripodCollar() {
    const group = new THREE.Group();
    const baseZ = 130;

    const collarMat = this.createChassisMaterial(0x27272a, 0.28, 0.92);
    const ringGeo = new THREE.CylinderGeometry(45.2, 45.2, 14, 64, 1, true);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, collarMat);
    group.add(ring);

    const footMat = this.createChassisMaterial(0x1e2024, 0.32, 0.9);
    const footGeo = new THREE.BoxGeometry(22, 16, 42);
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(0, -54, 0);
    group.add(foot);

    const stemGeo = new THREE.BoxGeometry(16, 12, 28);
    const stem = new THREE.Mesh(stemGeo, collarMat);
    stem.position.set(0, -46, 0);
    group.add(stem);

    const knobGeo = new THREE.CylinderGeometry(7, 7, 10, 32);
    knobGeo.rotateZ(Math.PI / 2);
    const knob = new THREE.Mesh(knobGeo, collarMat);
    knob.position.set(48, -25, 0);
    group.add(knob);

    this.registerPart('tripod_collar', group, baseZ);
  }

  // 14. PAINEL DE INTERRUPTORES (AF/MF, IS ON/OFF, LIMITER, MODES)
  private buildSwitchPanel() {
    const group = new THREE.Group();
    const baseZ = 144;

    const panelTex = createSwitchPanelTexture();
    const panelMat = new THREE.MeshStandardMaterial({
      map: panelTex,
      roughness: 0.35,
      metalness: 0.75,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(panelMat);

    const plateGeo = new THREE.CylinderGeometry(44.8, 44.8, 26, 32, 1, true, Math.PI * 0.75, Math.PI * 0.45);
    plateGeo.rotateX(Math.PI / 2);
    const plate = new THREE.Mesh(plateGeo, panelMat);
    group.add(plate);

    const switchKnobMat = this.createChassisMaterial(0x0f172a, 0.25, 0.95);
    for (let i = 0; i < 4; i++) {
      const knobGeo = new THREE.BoxGeometry(3, 1.8, 3.8);
      const knob = new THREE.Mesh(knobGeo, switchKnobMat);
      knob.position.set(-45.0, 7 - i * 4.8, 0);
      group.add(knob);
    }

    this.registerPart('switch_panel', group, baseZ);
  }

  // 15. ENCAIXE DE BAIONETA EM AÇO INOX E GAXETA
  private buildRearMount() {
    const group = new THREE.Group();
    const baseZ = 160;

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.98,
      roughness: 0.1,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(steelMat);

    const flangeGeo = new THREE.CylinderGeometry(36, 42.5, 10, 64, 1, false);
    flangeGeo.rotateX(Math.PI / 2);
    const flange = new THREE.Mesh(flangeGeo, steelMat);
    group.add(flange);

    const lugGeo = new THREE.BoxGeometry(6, 4, 3);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const lug = new THREE.Mesh(lugGeo, steelMat);
      lug.position.set(Math.cos(angle) * 32, Math.sin(angle) * 32, 5);
      lug.rotation.z = angle;
      group.add(lug);
    }

    const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const dotGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(0, 42.6, -2);
    group.add(dot);

    const gasketMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.95,
      metalness: 0.05,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(gasketMat);

    const gasketGeo = new THREE.TorusGeometry(39.2, 0.85, 12, 48);
    const gasket = new THREE.Mesh(gasketGeo, gasketMat);
    gasket.position.z = -1;
    group.add(gasket);

    this.registerPart('rear_mount', group, baseZ);
  }

  // 16. CONTATOS ELETRÔNICOS EM OURO 24K
  private buildGoldContacts() {
    const group = new THREE.Group();
    const baseZ = 168;

    const blockMat = this.createChassisMaterial(0x18181b, 0.45, 0.6);
    const blockGeo = new THREE.CylinderGeometry(28, 28, 5, 24, 1, true, -Math.PI * 0.35, Math.PI * 0.7);
    blockGeo.rotateX(Math.PI / 2);
    const block = new THREE.Mesh(blockGeo, blockMat);
    group.add(block);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.98,
      roughness: 0.1,
      emissive: 0x92400e,
      emissiveIntensity: 0.3,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(goldMat);

    const pinCount = 8;
    for (let i = 0; i < pinCount; i++) {
      const angle = -Math.PI * 0.28 + (i / (pinCount - 1)) * (Math.PI * 0.56);
      const x = Math.cos(angle) * 26.5;
      const y = Math.sin(angle) * 26.5;

      const pinGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.5, 12);
      pinGeo.rotateX(Math.PI / 2);
      const pin = new THREE.Mesh(pinGeo, goldMat);
      pin.position.set(x, y, 2);
      group.add(pin);
    }

    this.registerPart('gold_contacts', group, baseZ);
  }

  // 17. SENSOR DIGITAL CMOS FULL-FRAME (35mm)
  private buildCameraSensor() {
    const group = new THREE.Group();
    const baseZ = 195;

    const chamberMat = this.createChassisMaterial(0x111113, 0.38, 0.82);
    const chamberGeo = new THREE.BoxGeometry(60, 48, 14);
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    group.add(chamber);

    const sensorTex = createCameraSensorTexture();
    const sensorMat = new THREE.MeshStandardMaterial({
      map: sensorTex,
      metalness: 0.75,
      roughness: 0.2,
      emissive: 0x064e3b,
      emissiveIntensity: 0.25,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(sensorMat);

    const dieGeo = new THREE.PlaneGeometry(36, 24);
    const sensorDie = new THREE.Mesh(dieGeo, sensorMat);
    sensorDie.position.z = -6.8;
    sensorDie.rotateY(Math.PI);
    group.add(sensorDie);

    const irCutMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transmission: 0.88,
      roughness: 0.05,
      transparent: true,
      opacity: 0.5,
      reflectivity: 0.9,
      clippingPlanes: [this.clippingPlane],
      side: THREE.DoubleSide,
    });
    this.cutawayMaterials.push(irCutMat);

    const irGlassGeo = new THREE.PlaneGeometry(37, 25);
    const irGlass = new THREE.Mesh(irGlassGeo, irCutMat);
    irGlass.position.z = -6.5;
    group.add(irGlass);

    this.registerPart('camera_sensor', group, baseZ);
  }

  public updateAperture(apertureNormalized: number) {
    const bladeAngleOffset = (1.0 - apertureNormalized) * 0.75;
    this.apertureBlades.forEach((blade) => {
      blade.rotation.z = blade.userData.baseRotZ - bladeAngleOffset;
    });
  }

  public updateExplosion(progress: number) {
    Object.values(this.partsMap).forEach((group) => {
      const basePos = group.userData.basePosition as THREE.Vector3;
      const expPos = group.userData.explodePosition as THREE.Vector3;
      if (basePos && expPos) {
        group.position.lerpVectors(basePos, expPos, progress);
      }
    });
  }

  public updateZoom(focalLength: number) {
    const factor = (focalLength - 70) / (200 - 70);
    if (this.zoomGroupMesh) {
      this.zoomGroupMesh.position.z = (this.zoomGroupMesh.userData.basePosition.z || 85) - factor * 14;
    }
    if (this.zoomRingGroup) {
      this.zoomRingGroup.rotation.z = factor * 1.2;
    }
  }

  public updateFocus(distance: number) {
    // distance: 1.2 até 10 (infinito)
    const factor = distance === Infinity ? 1.0 : (Math.min(distance, 10) - 1.2) / (10 - 1.2);
    if (this.focusRingGroup) {
      this.focusRingGroup.rotation.z = factor * 2.1;
    }
    if (this.distanceDrumMesh) {
      this.distanceDrumMesh.rotation.z = factor * 2.1;
    }
  }

  public setCutaway(enabled: boolean, cutAngle: number = 0) {
    if (enabled) {
      const cosA = Math.cos(cutAngle);
      const sinA = Math.sin(cutAngle);
      this.clippingPlane.normal.set(cosA, sinA, 0);
      this.clippingPlane.constant = 0;
    } else {
      this.clippingPlane.normal.set(1, 0, 0);
      this.clippingPlane.constant = 1000;
    }
  }

  public highlightPart(partId: string | null) {
    Object.entries(this.partsMap).forEach(([id, group]) => {
      const isTarget = id === partId;
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            if (isTarget) {
              if (!mesh.userData.originalEmissive) {
                mesh.userData.originalEmissive = mat.emissive.clone();
                mesh.userData.originalEmissiveIntensity = mat.emissiveIntensity;
              }
              mat.emissive.setHex(0x38bdf8);
              mat.emissiveIntensity = 0.65;
            } else if (mesh.userData.originalEmissive) {
              mat.emissive.copy(mesh.userData.originalEmissive);
              mat.emissiveIntensity = mesh.userData.originalEmissiveIntensity;
              delete mesh.userData.originalEmissive;
            }
          }
        }
      });
    });
  }
}
