import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LensModelBuilder } from './components/LensModel';
import { OpticalRaySystem } from './components/OpticalRays';
import { LENS_PARTS_INFO, LensPartInfo } from './components/LensData';
import { createStudioEnvironment } from './components/StudioEnvironment';
import { soundEffects } from './components/AudioEffects';
import { SensorViewfinder } from './components/SensorViewfinder';
import { downloadStandaloneHTML } from './components/StandaloneHtmlGenerator';
import {
  Sparkles,
  Scissors,
  Layers,
  CircleDot,
  RotateCcw,
  Eye,
  Camera,
  Download,
  Info,
  Maximize2,
  ChevronRight,
  Sun,
  Activity,
  Volume2,
  VolumeX,
  Sliders,
  Compass,
  Focus,
  Gauge,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados principais
  const [exploded, setExploded] = useState(false);
  const [explosionProgress, setExplosionProgress] = useState(0);
  const [cutawayActive, setCutawayActive] = useState(true);
  const [cutawayAngle, setCutawayAngle] = useState(0); // em radianos
  const [raysVisible, setRaysVisible] = useState(true);
  const [animateIris, setAnimateIris] = useState(true);
  const [apertureValue, setApertureValue] = useState(1.0); // 1.0 = f/2.8, 0.0 = f/22
  const [focalLength, setFocalLength] = useState(70); // 70 a 200mm
  const [focusDistance, setFocusDistance] = useState<number>(Infinity); // 1.2m a Infinity
  const [autoRotate, setAutoRotate] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualMode, setVisualMode] = useState<'studio' | 'optics'>('studio');
  const [hoveredPart, setHoveredPart] = useState<LensPartInfo | null>(null);
  const [selectedPart, setSelectedPart] = useState<LensPartInfo | null>(null);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [showPartList, setShowPartList] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [floatingPins, setFloatingPins] = useState<{ id: string; name: string; x: number; y: number }[]>([]);

  // Referências Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lensModelRef = useRef<LensModelBuilder | null>(null);
  const raySystemRef = useRef<OpticalRaySystem | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const targetExplosionRef = useRef(0);
  const currentExplosionRef = useRef(0);
  const irisTimeRef = useRef(0);
  const hoveredPartIdRef = useRef<string | null>(null);

  // Alvo de interpolação suave da câmera
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Inicialização Three.js e Estúdio
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b10);
    sceneRef.current = scene;

    // 2. Câmera
    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 2500);
    camera.position.set(240, 110, 270);
    cameraRef.current = camera;

    // 3. Renderizador WebGL
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Mapa de Ambiente HDR de Estúdio
    const studioEnv = createStudioEnvironment(renderer);
    scene.environment = studioEnv.texture;

    // 5. Piso do Estúdio com Sombra de Contato Suave
    const shadowGeo = new THREE.PlaneGeometry(350, 350);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070a,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -68;
    scene.add(shadowPlane);

    // 6. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 70;
    controls.maxDistance = 750;
    controls.target.set(0, 0, 10);
    controlsRef.current = controls;

    // 7. Iluminação de estúdio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(160, 240, 180);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.9);
    rimLight.position.set(-200, -80, -200);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfcd34d, 0.95);
    fillLight.position.set(120, -140, -100);
    scene.add(fillLight);

    const frontSpot = new THREE.PointLight(0xa7f3d0, 1.4, 400);
    frontSpot.position.set(0, 70, -160);
    scene.add(frontSpot);

    // 8. Modelo 3D da Lente
    const lensBuilder = new LensModelBuilder();
    scene.add(lensBuilder.rootGroup);
    lensModelRef.current = lensBuilder;

    // 9. Sistema de Raios de Luz Óptica
    const raySystem = new OpticalRaySystem();
    scene.add(raySystem.group);
    raySystemRef.current = raySystem;

    lensBuilder.setCutaway(true, 0);

    // 10. Raycaster
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerLeave = () => {
      mouseRef.current.set(-999, -999);
      hoveredPartIdRef.current = null;
      setHoveredPart(null);
      setScreenPos(null);
      lensBuilder.highlightPart(null);
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener('mousemove', onPointerMove);
    containerEl.addEventListener('mouseleave', onPointerLeave);

    // 11. Loop de renderização
    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      controls.update();

      // Interpolação suave de voo da câmera quando uma peça é focada
      if (targetCamPosRef.current && targetLookAtRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        controls.target.lerp(targetLookAtRef.current, 0.08);
        if (camera.position.distanceTo(targetCamPosRef.current) < 1.0) {
          targetCamPosRef.current = null;
          targetLookAtRef.current = null;
        }
      }

      // Interpolação de explosão
      const current = currentExplosionRef.current;
      const target = targetExplosionRef.current;
      const step = (target - current) * 0.1;
      if (Math.abs(step) > 0.0001) {
        currentExplosionRef.current += step;
        lensBuilder.updateExplosion(currentExplosionRef.current);
      }

      // Animação cíclica do diafragma
      if (animateIris) {
        irisTimeRef.current += delta * 0.65;
        const currentAperture = 0.55 + 0.45 * Math.sin(irisTimeRef.current);
        lensBuilder.updateAperture(currentAperture);
        raySystem.buildRayPaths(currentAperture, focalLength, focusDistance);
        setApertureValue(currentAperture);
      }

      // Atualiza fótons de luz
      if (raysVisible) {
        raySystem.update(delta, 1.0);
      }

      // Detecção de Hover com Raycasting
      if (cameraRef.current) {
        raycaster.setFromCamera(mouseRef.current, cameraRef.current);
        const interactiveMeshes: THREE.Mesh[] = [];
        lensBuilder.rootGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && child.userData.partId) {
            interactiveMeshes.push(child as THREE.Mesh);
          }
        });

        const intersects = raycaster.intersectObjects(interactiveMeshes, false);
        let targetId: string | null = null;
        let hitPoint: THREE.Vector3 | null = null;

        if (intersects.length > 0) {
          targetId = intersects[0].object.userData.partId;
          hitPoint = intersects[0].point;
        }

        if (targetId !== hoveredPartIdRef.current) {
          hoveredPartIdRef.current = targetId;
          lensBuilder.highlightPart(targetId);

          if (targetId && LENS_PARTS_INFO[targetId]) {
            setHoveredPart(LENS_PARTS_INFO[targetId]);
            soundEffects.playHoverBlip();
          } else {
            setHoveredPart(null);
            setScreenPos(null);
          }
        }

        if (hitPoint && targetId && containerRef.current) {
          const projected = hitPoint.clone().project(cameraRef.current);
          const rect = containerRef.current.getBoundingClientRect();
          const x = ((projected.x + 1) / 2) * rect.width;
          const y = ((-projected.y + 1) / 2) * rect.height;
          setScreenPos({ x, y });
        }

        // Atualiza coordenadas dos pins 3D na vista explodida
        if (currentExplosionRef.current > 0.25 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const keyPartIds = [
            'front_element',
            'group1_doublet',
            'usm_motor',
            'zoom_cams',
            'aperture_mechanism',
            'is_stabilizer',
            'rear_zoom_group',
            'tripod_collar',
            'rear_mount',
            'camera_sensor',
          ];

          const pins = keyPartIds
            .map((id) => {
              const partGroup = lensBuilder.partsMap[id];
              if (!partGroup) return null;
              const worldPos = new THREE.Vector3();
              partGroup.getWorldPosition(worldPos);
              worldPos.y += 46;
              const projected = worldPos.project(cameraRef.current!);
              if (projected.z > 1) return null;
              const x = ((projected.x + 1) / 2) * rect.width;
              const y = ((-projected.y + 1) / 2) * rect.height;
              return {
                id,
                name: LENS_PARTS_INFO[id]?.name.split(' (')[0] || id,
                x,
                y,
              };
            })
            .filter(Boolean) as { id: string; name: string; x: number; y: number }[];

          setFloatingPins(pins);
        } else {
          setFloatingPins([]);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      containerEl.removeEventListener('mousemove', onPointerMove);
      containerEl.removeEventListener('mouseleave', onPointerLeave);
      controls.dispose();
      renderer.dispose();
      studioEnv.dispose();
      if (containerEl.contains(renderer.domElement)) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    soundEffects.enabled = nextSound;
  };

  const handleToggleExplode = () => {
    const nextState = !exploded;
    setExploded(nextState);
    targetExplosionRef.current = nextState ? 1.0 : 0.0;
    setExplosionProgress(nextState ? 1.0 : 0.0);
    soundEffects.playExplodeSwoosh(nextState);
  };

  const handleExplosionSlider = (val: number) => {
    setExplosionProgress(val);
    targetExplosionRef.current = val;
    setExploded(val > 0.05);
  };

  const handleToggleCutaway = () => {
    const nextCutaway = !cutawayActive;
    setCutawayActive(nextCutaway);
    if (lensModelRef.current) {
      lensModelRef.current.setCutaway(nextCutaway, cutawayAngle);
    }
    soundEffects.playLatchClick();
  };

  const handleCutawayAngleSlider = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    setCutawayAngle(rad);
    if (lensModelRef.current && cutawayActive) {
      lensModelRef.current.setCutaway(true, rad);
    }
  };

  const handleToggleRays = () => {
    const nextRays = !raysVisible;
    setRaysVisible(nextRays);
    if (raySystemRef.current) {
      raySystemRef.current.setVisible(nextRays);
    }
    soundEffects.playApertureClick();
  };

  const handleZoomChange = (mm: number) => {
    setFocalLength(mm);
    if (lensModelRef.current) {
      lensModelRef.current.updateZoom(mm);
    }
    if (raySystemRef.current) {
      raySystemRef.current.buildRayPaths(apertureValue, mm, focusDistance);
    }
    soundEffects.playHoverBlip();
  };

  const handleFocusChange = (distanceMeters: number) => {
    setFocusDistance(distanceMeters);
    if (lensModelRef.current) {
      lensModelRef.current.updateFocus(distanceMeters);
    }
    if (raySystemRef.current) {
      raySystemRef.current.buildRayPaths(apertureValue, focalLength, distanceMeters);
    }
    soundEffects.playUSMServo();
  };

  // Seleção de Abertura f-stop direta
  const handleFStopClick = (fStopNum: number) => {
    setAnimateIris(false);
    // Mapeamento f/2.8 -> 1.0, f/22 -> 0.0
    const fStops = [2.8, 4.0, 5.6, 8.0, 11.0, 16.0, 22.0];
    const idx = fStops.indexOf(fStopNum);
    const normalized = idx >= 0 ? 1.0 - idx / 6 : 1.0;
    setApertureValue(normalized);

    if (lensModelRef.current) {
      lensModelRef.current.updateAperture(normalized);
    }
    if (raySystemRef.current) {
      raySystemRef.current.buildRayPaths(normalized, focalLength, focusDistance);
    }
    soundEffects.playApertureClick();
  };

  const handleVisualModeChange = (mode: 'studio' | 'optics') => {
    setVisualMode(mode);
    if (!sceneRef.current || !lensModelRef.current) return;

    if (mode === 'studio') {
      sceneRef.current.background = new THREE.Color(0x090b10);
      setRaysVisible(true);
      lensModelRef.current.setCutaway(cutawayActive, cutawayAngle);
    } else if (mode === 'optics') {
      sceneRef.current.background = new THREE.Color(0x020306);
      setRaysVisible(true);
      lensModelRef.current.setCutaway(true, 0);
      setCutawayActive(true);
    }
    soundEffects.playLatchClick();
  };

  const handleToggleAutoRotate = () => {
    const nextAuto = !autoRotate;
    setAutoRotate(nextAuto);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = nextAuto;
      controlsRef.current.autoRotateSpeed = 1.2;
    }
  };

  // Voo suave da câmera até o componente selecionado
  const handleFlyToPart = (part: LensPartInfo) => {
    setSelectedPart(part);
    setHoveredPart(part);

    if (lensModelRef.current) {
      lensModelRef.current.highlightPart(part.id);
      const partGroup = lensModelRef.current.partsMap[part.id];
      if (partGroup && cameraRef.current && controlsRef.current) {
        const worldPos = new THREE.Vector3();
        partGroup.getWorldPosition(worldPos);

        targetLookAtRef.current = worldPos.clone();
        targetCamPosRef.current = new THREE.Vector3(
          worldPos.x + 90,
          worldPos.y + 40,
          worldPos.z + 120
        );
      }
    }
    soundEffects.playHoverBlip();
  };

  const applyCameraPreset = (preset: 'overview' | 'crossSection' | 'front' | 'mount' | 'exploded') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (preset) {
      case 'overview':
        camera.position.set(240, 110, 270);
        controls.target.set(0, 0, 10);
        break;
      case 'crossSection':
        camera.position.set(320, 10, 15);
        controls.target.set(0, 0, 15);
        if (!cutawayActive) handleToggleCutaway();
        break;
      case 'front':
        camera.position.set(70, 40, -280);
        controls.target.set(0, 0, -110);
        break;
      case 'mount':
        camera.position.set(-110, -60, 320);
        controls.target.set(0, 0, 150);
        break;
      case 'exploded':
        camera.position.set(380, 160, 20);
        controls.target.set(0, 0, 20);
        if (!exploded) handleToggleExplode();
        break;
    }
    controls.update();
    soundEffects.playHoverBlip();
  };

  const displayFStop = (2.8 * Math.pow(Math.SQRT2, (1.0 - apertureValue) * 6)).toFixed(1);
  const activePart = hoveredPart || selectedPart;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Container WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cabeçalho Superior Esquerdo - Dados da Lente */}
      <header className="absolute top-5 left-6 z-20 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-[10px] font-mono tracking-widest uppercase font-bold text-sky-400 bg-sky-950/80 border border-sky-500/30 rounded">
            Óptica de Precisão 3D
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/30 rounded">
            Série L · Faixa Vermelha
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded">
            {focalLength}mm f/{displayFStop}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
          CANON EF 70-200mm f/2.8 L IS USM
        </h1>
        <p className="text-xs text-slate-400 font-mono tracking-wide">
          Refração Espectral de Snell · 9 Lâminas · Motor Piezoelétrico · Estabilizador IS 4-Stops
        </p>
      </header>

      {/* Controles do Topo Direito */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2">
        <button
          onClick={handleToggleSound}
          className={`p-2 rounded-lg border backdrop-blur-md transition-all ${
            soundEnabled
              ? 'bg-slate-900/80 border-slate-700/60 text-sky-400 hover:bg-slate-800'
              : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
          title={soundEnabled ? 'Silenciar áudio' : 'Ativar áudio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <div className="flex items-center p-0.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => handleVisualModeChange('studio')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              visualMode === 'studio' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Estúdio
          </button>
          <button
            onClick={() => handleVisualModeChange('optics')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              visualMode === 'optics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Laser Óptico
          </button>
        </div>

        <button
          onClick={() => setShowPartList(!showPartList)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border backdrop-blur-md transition-all ${
            showPartList
              ? 'bg-sky-600/90 border-sky-400 text-white shadow-lg shadow-sky-500/20'
              : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Peças (17)</span>
        </button>

        <button
          onClick={downloadStandaloneHTML}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-lg shadow-emerald-950/40 backdrop-blur-md transition-all"
          title="Baixar arquivo único HTML autônomo com Three.js embutido para usar sem internet"
        >
          <Download className="w-4 h-4" />
          <span>Exportar HTML Único</span>
        </button>
      </div>

      {/* Etiquetas Flutuantes 3D com Linhas de Chamada na Vista Explodida */}
      {floatingPins.map((pin) => (
        <div
          key={pin.id}
          className="absolute z-10 pointer-events-auto transition-transform duration-75 cursor-pointer group"
          style={{
            left: `${pin.x}px`,
            top: `${pin.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={() => handleFlyToPart(LENS_PARTS_INFO[pin.id])}
        >
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-slate-900/95 border border-sky-400/60 text-sky-200 group-hover:bg-sky-500 group-hover:text-white shadow-xl shadow-black/90 backdrop-blur-md transition-all whitespace-nowrap">
              {pin.name}
            </div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-sky-400 to-transparent opacity-80" />
          </div>
        </div>
      ))}

      {/* Retículo de Mira sobre a peça com hover */}
      {screenPos && activePart && (
        <div
          className="absolute z-10 pointer-events-none transition-transform duration-75"
          style={{
            left: `${screenPos.x}px`,
            top: `${screenPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-8 h-8 rounded-full border-2 border-sky-400/80 animate-ping opacity-60" />
          <div className="absolute inset-0 m-auto w-3 h-3 bg-sky-400 rounded-full shadow-[0_0_12px_#38bdf8]" />
        </div>
      )}

      {/* Painel Flutuante Lateral HUD com Detalhes da Peça */}
      {activePart && (
        <aside className="absolute top-20 right-6 z-20 w-88 bg-slate-900/90 backdrop-blur-xl border border-sky-500/40 rounded-xl p-5 shadow-2xl shadow-black/80 transition-all duration-200 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
              {activePart.category}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Offset: {activePart.explodeOffset}mm
            </span>
          </div>

          <h3 className="text-base font-bold text-white mb-2 leading-tight flex items-center gap-1.5">
            {activePart.name}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {activePart.functionDescription}
          </p>

          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-start gap-2">
            <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{activePart.specs}</span>
          </div>
        </aside>
      )}

      {/* Lista Suspensa de Todos os Componentes da Lente */}
      {showPartList && (
        <div className="absolute top-16 right-6 z-30 w-92 max-h-[75vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-xl p-4 shadow-2xl shadow-black/90">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Componentes da Lente (17 Grupos)
            </h4>
            <button
              onClick={() => setShowPartList(false)}
              className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            {Object.values(LENS_PARTS_INFO).map((part) => {
              const isSelected = (hoveredPart?.id || selectedPart?.id) === part.id;
              return (
                <button
                  key={part.id}
                  onClick={() => handleFlyToPart(part)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-sky-600/30 border border-sky-400/60 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-slate-100 group-hover:text-sky-300 truncate">
                      {part.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {part.category} · Eixo Z: {part.explodeOffset}mm
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Régua de Presets de Câmera na Lateral Esquerda */}
      <div className="absolute top-32 left-6 z-20 flex flex-col gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1 px-1 font-bold">
          Câmeras
        </span>
        <button
          onClick={() => applyCameraPreset('overview')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 backdrop-blur-md text-left transition-all flex items-center gap-2"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span>Visão Geral</span>
        </button>
        <button
          onClick={() => applyCameraPreset('crossSection')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 backdrop-blur-md text-left transition-all flex items-center gap-2"
        >
          <Scissors className="w-3.5 h-3.5 text-emerald-400" />
          <span>Corte Lateral</span>
        </button>
        <button
          onClick={() => applyCameraPreset('front')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 backdrop-blur-md text-left transition-all flex items-center gap-2"
        >
          <CircleDot className="w-3.5 h-3.5 text-rose-400" />
          <span>Elemento Frontal</span>
        </button>
        <button
          onClick={() => applyCameraPreset('mount')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 backdrop-blur-md text-left transition-all flex items-center gap-2"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Sensor & Baioneta</span>
        </button>
        <button
          onClick={() => applyCameraPreset('exploded')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 backdrop-blur-md text-left transition-all flex items-center gap-2"
        >
          <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Vista Explodida</span>
        </button>
      </div>

      {/* Visor Simulado do Sensor CMOS */}
      <SensorViewfinder
        focalLength={focalLength}
        apertureValue={apertureValue}
        focusDistance={focusDistance}
      />

      {/* Painel Inferior de Cinemática Fotográfica (Zoom, Foco & Abertura) */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-5 px-6 py-2 rounded-2xl bg-slate-900/85 border border-slate-800 backdrop-blur-xl text-xs font-mono text-slate-300 shadow-2xl max-w-[94vw]">
        {/* Controle Focal Zoom */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Zoom:</span>
          <div className="flex gap-1">
            {[70, 100, 135, 200].map((mm) => (
              <button
                key={mm}
                onClick={() => handleZoomChange(mm)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  focalLength === mm
                    ? 'bg-sky-500 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mm}mm
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* Controle de Foco Manual */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Focus className="w-3 h-3 text-sky-400" /> Foco:
          </span>
          <div className="flex gap-1">
            {[
              { label: '1.2m', val: 1.2 },
              { label: '2.5m', val: 2.5 },
              { label: '5.0m', val: 5.0 },
              { label: '∞ Inf', val: Infinity },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => handleFocusChange(f.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  focusDistance === f.val
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* Seleção Direta de f-Stop */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Abertura:</span>
          <div className="flex gap-1">
            {[2.8, 4.0, 8.0, 16.0, 22.0].map((f) => (
              <button
                key={f}
                onClick={() => handleFStopClick(f)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  Math.abs(parseFloat(displayFStop) - f) < 0.6
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                f/{f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de Ações Principais (Explodir, Corte Lateral, Feixes, etc.) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-2xl shadow-2xl shadow-black/80 max-w-[94vw]">
        {/* Botão Explodir */}
        <button
          onClick={handleToggleExplode}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
            exploded
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/50'
          }`}
          title="Desliza todas as peças ao longo do eixo da lente com suas etiquetas de nome"
        >
          <Maximize2 className="w-4 h-4" />
          <span>{exploded ? 'Montar Lente' : 'Explodir Lente'}</span>
        </button>

        {/* Botão Corte Lateral */}
        <button
          onClick={handleToggleCutaway}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            cutawayActive
              ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Ativar/desativar corte transversal revelando a ótica e os mecanismos internos"
        >
          <Scissors className="w-4 h-4" />
          <span>Corte Lateral</span>
        </button>

        {/* Botão Feixes de Luz */}
        <button
          onClick={handleToggleRays}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            raysVisible
              ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-md shadow-indigo-950'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Exibir os feixes espectrais refratados que atravessam as lentes até o sensor"
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Feixes de Luz</span>
        </button>

        {/* Botão Animação do Diafragma */}
        <button
          onClick={() => setAnimateIris(!animateIris)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            animateIris
              ? 'bg-amber-600/90 border-amber-400 text-white shadow-md shadow-amber-950'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Controlar abertura e fechamento automático das 9 lâminas do diafragma"
        >
          <CircleDot className="w-4 h-4" />
          <span>{animateIris ? 'Pausar Íris' : 'Animar Íris'}</span>
        </button>

        {/* Botão Rotação Automática */}
        <button
          onClick={handleToggleAutoRotate}
          className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
            autoRotate
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Giro contínuo 360° da lente"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Slider de Explosão Fina */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Exp</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explosionProgress}
            onChange={(e) => handleExplosionSlider(parseFloat(e.target.value))}
            className="w-18 accent-sky-400 cursor-pointer"
            title="Ajuste contínuo da distância de explosão"
          />
        </div>
      </div>

      {/* Dicas de navegação no rodapé */}
      <footer className="absolute bottom-5 left-6 z-10 pointer-events-none text-[11px] font-mono text-slate-500 hidden md:block">
        Arraste para orbitar 360° · Roda do mouse para zoom · Passe o cursor sobre peças para inspecionar
      </footer>
    </div>
  );
}
