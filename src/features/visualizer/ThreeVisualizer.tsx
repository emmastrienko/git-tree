'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VisualizerNode } from '@/types';

const THEME = {
  background: '#020617',
  primary: '#6366f1',
  trunk: '#334155',
  conflict: '#f43f5e',
  text: '#f1f5f9',
  ambientIntensity: 0.6,
  directIntensity: 1.2,
};

const TREE_LAYOUT = {
  trunkLength: 800,
  trunkRadius: 16,
  minRadius: 2,
  branchBaseAngle: 0.6,
  labelScaleBase: 250,
};

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({ tree, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const lastTreeId = useRef<string>('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(THEME.background);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 10000);
    if (!cameraRef.current) {
      camera.position.set(0, 800, 1500);
    } else {
      camera.position.copy(cameraRef.current.position);
      camera.quaternion.copy(cameraRef.current.quaternion);
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    if (controlsRef.current) {
      controls.target.copy(controlsRef.current.target);
    }
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, THEME.ambientIntensity));
    const sun = new THREE.DirectionalLight(new THREE.Color(0xffffff), THEME.directIntensity);
    sun.position.set(500, 1000, 500);
    scene.add(sun);

    const animatedGroups: THREE.Group[] = [];
    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    let isDisposed = false;

    // --- Tree Generation ---
    const buildBranch = (node: VisualizerNode, depth = 0): THREE.Group => {
      const isTrunk = node.type === 'trunk';
      const val = node.relativeAhead ?? node.ahead;
      
      const length = isTrunk ? TREE_LAYOUT.trunkLength : (Math.log10(val + 1) * 100 + 80) * Math.pow(0.92, depth);
      const radius = isTrunk ? TREE_LAYOUT.trunkRadius : Math.max(TREE_LAYOUT.minRadius, 10 - depth * 2.5);
      const dotSize = 15; // Uniform size for all points

      const group = new THREE.Group();
      if (!isTrunk) animatedGroups.push(group);

      // Branch Geometry - Optimized segments (8 tubular, 6 radial)
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(isTrunk ? 0 : 30, length * 0.5, 0),
        new THREE.Vector3(0, length, 0)
      );
      
      const geo = new THREE.TubeGeometry(curve, 8, radius, 6, false);
      const color = node.hasConflicts ? THEME.conflict : (isTrunk ? THEME.trunk : THEME.primary);
      const mat = new THREE.MeshStandardMaterial({ 
        color, 
        transparent: node.isMerged, 
        opacity: node.isMerged ? 0.3 : 1,
        roughness: 0.5,
        metalness: 0.1
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { node }; 
      group.add(mesh);
      disposables.push(geo, mat);

      if (!isTrunk) {
        // Tip Marker - Uniform Size & Optimized segments
        const tipGeo = new THREE.SphereGeometry(dotSize, 12, 12);
        const tipMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.1 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, length, 0);
        tip.userData = { node };
        group.add(tip);
        disposables.push(tipGeo, tipMat);

        // Label Sprite - Only show for top levels to save massive RAM
        if (depth <= 2) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = 256; canvas.height = 64; // Halved resolution
          ctx.fillStyle = THEME.text;
          ctx.font = `bold ${Math.max(24, 40 - depth * 6)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(node.name, 128, 32);
          
          const tex = new THREE.CanvasTexture(canvas);
          const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
          const sprite = new THREE.Sprite(spriteMat);
          const scale = Math.max(120, 200 - depth * 40);
          sprite.position.set(0, length + 25, 0);
          sprite.scale.set(scale, scale / 4, 1);
          group.add(sprite);
          disposables.push(tex, spriteMat);
        }
      }

      // Recursive growth
      const children = node.children || [];
      children.forEach((child, i) => {
        const childBranch = buildBranch(child, depth + 1);
        
        if (isTrunk) {
          const ratio = 1 - (child.behind / (node.metadata?.maxBehind || 1));
          childBranch.position.set(0, length * (0.2 + ratio * 0.75), 0);
          childBranch.rotation.y = (i * 137.5) * (Math.PI / 180); // Fibonacci phyllotaxis
          childBranch.rotation.z = TREE_LAYOUT.branchBaseAngle;
        } else {
          childBranch.position.set(0, length, 0);
          const angle = children.length === 1 ? 0.3 : ((i / (children.length - 1)) - 0.5) * 0.8;
          childBranch.rotation.z = angle;
        }
        group.add(childBranch);
      });

      return group;
    };

    const root = buildBranch(tree);
    root.position.y = -600;
    scene.add(root);

    // --- Interaction ---
    const getTargetNode = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData?.node) return { node: obj.userData.node as VisualizerNode, x: clientX - rect.left, y: clientY - rect.top };
          obj = obj.parent;
        }
      }
      return null;
    };

    let startPos = { x: 0, y: 0 };
    
    const onMove = (e: MouseEvent) => {
      container.style.cursor = getTargetNode(e.clientX, e.clientY) ? 'pointer' : 'grab';
    };

    const onDown = (e: MouseEvent) => {
      startPos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const onUp = (e: MouseEvent) => {
      container.style.cursor = 'grab';
      if (Math.abs(e.clientX - startPos.x) < 5 && Math.abs(e.clientY - startPos.y) < 5) {
        const hit = getTargetNode(e.clientX, e.clientY);
        if (hit && onSelect) onSelect(hit.node, { x: hit.x, y: hit.y });
      }
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mousedown', onDown);
    container.addEventListener('mouseup', onUp);

    // --- Loop ---
    let frameId: number;
    const animate = (time: number) => {
      if (isDisposed) return;
      frameId = requestAnimationFrame(animate);
      const t = time * 0.001;
      
      animatedGroups.forEach((group, i) => {
        group.rotation.x = Math.sin(t + i) * 0.015;
      });

      controls.update();
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mousedown', onDown);
      container.removeEventListener('mouseup', onUp);
      
      disposables.forEach(asset => asset.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [tree, onSelect]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden touch-none" />;
};

interface ThreeVisualizerProps {
  tree: VisualizerNode;
  isFetching?: boolean;
  onSelect?: (node: VisualizerNode, pos: { x: number; y: number }) => void;
}