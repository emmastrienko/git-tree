'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VisualizerNode } from '@/types';

const THEME = {
  background: '#020617',
  primary: '#3b82f6',
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

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({ 
  tree, 
  onSelect, 
  hoveredNodeName, 
  filterAuthor,
  onHover,
  isDimmed 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

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

    // --- File Garden Generation ---
    const buildFileGarden = (node: VisualizerNode, depth = 0): THREE.Group => {
      const group = new THREE.Group();
      const length = 100 * Math.pow(0.8, depth);
      const radius = Math.max(0.5, 4 - depth * 0.8);

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(10, length * 0.5, 0),
        new THREE.Vector3(0, length, 0)
      );
      
      const geo = new THREE.TubeGeometry(curve, 8, radius, 6, false);
      const mat = new THREE.MeshStandardMaterial({ 
        color: `hsl(215, 20%, ${40 + depth * 10}%)`, 
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      disposables.push(geo, mat);

      if (node.type === 'file') {
        const size = Math.log10((node.metadata?.additions || 0) + 1) * 5 + 3;
        const leafGeo = new THREE.SphereGeometry(size, 8, 8);
        const leafMat = new THREE.MeshStandardMaterial({ color: '#60a5fa', emissive: '#60a5fa', emissiveIntensity: 0.2 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0, length, 0);
        group.add(leaf);
        disposables.push(leafGeo, leafMat);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 256; canvas.height = 64; 
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(node.name, 10, 40);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.6 });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(size + 20, length, 0);
        sprite.scale.set(100, 25, 1);
        group.add(sprite);
        disposables.push(tex, spriteMat);
      }

      node.children?.forEach((child, i) => {
        const childBranch = buildFileGarden(child, depth + 1);
        childBranch.position.set(0, length, 0);
        const angle = node.children.length === 1 ? 0.3 : ((i / (node.children.length - 1)) - 0.5) * 1.5;
        childBranch.rotation.z = angle;
        group.add(childBranch);
      });

      return group;
    };

    // --- Tree Generation ---
    const buildBranch = (node: VisualizerNode, depth = 0, rootMeta: any = null): THREE.Group => {
      const isTrunk = node.type === 'trunk';
      
      const isHighlighted = hoveredNodeName === node.name || (filterAuthor && node.author?.login === filterAuthor);
      const isOtherHighlighted = (hoveredNodeName && hoveredNodeName !== node.name) || (filterAuthor && node.author?.login !== filterAuthor);
      
      const val = node.relativeAhead ?? node.ahead;
      const length = isTrunk ? TREE_LAYOUT.trunkLength : (Math.log10(val + 1) * 100 + 80) * Math.pow(0.92, depth);
      const radius = isTrunk ? TREE_LAYOUT.trunkRadius : Math.max(TREE_LAYOUT.minRadius, 10 - depth * 2.5);
      const dotSize = isHighlighted ? 25 : 15; 

      const group = new THREE.Group();
      if (!isTrunk) animatedGroups.push(group);

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(isTrunk ? 0 : 30, length * 0.5, 0),
        new THREE.Vector3(0, length, 0)
      );
      
      const geo = new THREE.TubeGeometry(curve, 8, isHighlighted ? radius + 4 : radius, 6, false);
      
      let branchColor = isTrunk ? THEME.trunk : THEME.primary;
      let emissiveIntensity = isHighlighted ? 0.8 : 0.05;

      const meta = rootMeta || tree.metadata;
      const isPR = node.metadata?.prNumber;

      if (isPR) {
        const status = node.metadata.status;
        if (status === 'APPROVED') branchColor = '#22c55e';
        else if (status === 'CHANGES_REQUESTED') branchColor = '#f43f5e';
        else branchColor = '#eab308';
        if (!isHighlighted) emissiveIntensity = 0.3;
      } else if (node.hasConflicts) {
        branchColor = THEME.conflict;
      } else if (node.lastUpdated && meta?.newestTimestamp) {
        const current = new Date(node.lastUpdated).getTime();
        const newest = meta.newestTimestamp;
        const oldest = meta.oldestTimestamp;
        const range = Math.max(newest - oldest, 1);
        const ratio = Math.max(0, Math.min(1, (current - oldest) / range));
        
        if (ratio > 0.8) {
          branchColor = '#60a5fa'; 
          if (!isHighlighted) emissiveIntensity = 0.5;
        } 
        else if (ratio > 0.6) branchColor = '#3b82f6';
        else if (ratio > 0.4) branchColor = '#2563eb';
        else if (ratio > 0.2) branchColor = '#1d4ed8';
        else branchColor = '#172554';
      }

      if (isHighlighted) branchColor = '#ffffff';
      if (node.isMerged && !isHighlighted) branchColor = '#1e293b';

      const mat = new THREE.MeshStandardMaterial({ 
        color: branchColor, 
        transparent: true, 
        opacity: (isOtherHighlighted && isDimmed) ? 0.05 : (node.isMerged && !isHighlighted ? 0.3 : 1),
        roughness: 0.5,
        metalness: 0.1
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { node }; 
      group.add(mesh);
      disposables.push(geo, mat);

      if (!isTrunk) {
        const tipGeo = new THREE.SphereGeometry(dotSize, 12, 12);
        const tipMat = new THREE.MeshStandardMaterial({ 
          color: branchColor, 
          emissive: branchColor, 
          emissiveIntensity: (isOtherHighlighted && isDimmed) ? 0 : emissiveIntensity,
          transparent: true,
          opacity: (isOtherHighlighted && isDimmed) ? 0.05 : 1
        });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, length, 0);
        tip.userData = { node };
        group.add(tip);
        disposables.push(tipGeo, tipMat);

        if (node.fileTree) {
          const fileGarden = buildFileGarden(node.fileTree);
          fileGarden.position.set(0, length, 0);
          group.add(fileGarden);
        }

        const shouldShowLabel = isHighlighted || (!isDimmed && depth <= 2);
        
        if (shouldShowLabel) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = 256; canvas.height = 64; 
          ctx.fillStyle = isHighlighted ? '#ffffff' : THEME.text;
          ctx.font = `bold ${isHighlighted ? 32 : Math.max(24, 40 - depth * 6)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(node.name, 128, 32);
          const tex = new THREE.CanvasTexture(canvas);
          const spriteMat = new THREE.SpriteMaterial({ 
            map: tex, 
            transparent: true, 
            depthTest: !isHighlighted,
            opacity: isHighlighted ? 1 : 0.8
          });
          const sprite = new THREE.Sprite(spriteMat);
          const scale = isHighlighted ? 300 : Math.max(120, 200 - depth * 40);
          sprite.position.set(0, length + 25, 0);
          sprite.scale.set(scale, scale / 4, 1);
          sprite.renderOrder = isHighlighted ? 999 : 0;
          group.add(sprite);
          disposables.push(tex, spriteMat);
        }
      }

      const children = node.children || [];
      children.forEach((child, i) => {
        const childBranch = buildBranch(child, depth + 1, meta);
        if (isTrunk) {
          const ratio = 1 - (child.behind / (meta?.maxBehind || 1));
          childBranch.position.set(0, length * (0.2 + ratio * 0.75), 0);
          childBranch.rotation.y = (i * 137.5) * (Math.PI / 180);
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
      const hit = getTargetNode(e.clientX, e.clientY);
      container.style.cursor = hit ? 'pointer' : 'grab';
      if (!isDimmed) {
        const newHoverName = hit ? hit.node.name : null;
        if (newHoverName !== hoveredNodeName) onHover?.(newHoverName);
      }
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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [tree, onSelect, hoveredNodeName, isDimmed, filterAuthor]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden touch-none" />;
};

interface ThreeVisualizerProps {
  tree: VisualizerNode;
  isFetching?: boolean;
  hoveredNodeName?: string | null;
  filterAuthor?: string | null;
  isDimmed?: boolean;
  onHover?: (name: string | null) => void;
  onSelect?: (node: VisualizerNode, pos: { x: number; y: number }) => void;
}