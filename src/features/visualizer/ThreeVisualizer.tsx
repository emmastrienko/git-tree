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

interface ThreeVisualizerProps {
  tree: VisualizerNode;
  isFetching?: boolean;
  hoveredNodeName?: string | null;
  filterAuthor?: string | null;
  isDimmed?: boolean;
  onHover?: (name: string | null) => void;
  onSelect?: (node: VisualizerNode, pos: { x: number; y: number }) => void;
}

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({ 
  tree, 
  onSelect, 
  hoveredNodeName, 
  filterAuthor,
  onHover,
  isDimmed 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesMap = useRef<Map<string, {
    mesh: THREE.Mesh;
    tip?: THREE.Mesh;
    label?: THREE.Sprite;
    node: VisualizerNode;
  }>>(new Map());
  const animatedGroupsRef = useRef<THREE.Group[]>([]);
  const disposablesRef = useRef<(THREE.BufferGeometry | THREE.Material | THREE.Texture)[]>([]);

  const getNodeStyles = (node: VisualizerNode, rootMeta: any, isHighlighted: boolean) => {
    let color = node.type === 'trunk' ? THEME.trunk : THEME.primary;
    let emissiveIntensity = isHighlighted ? 0.8 : 0.05;

    const pr = node.metadata?.prNumber;
    if (pr) {
      const status = node.metadata.status;
      color = status === 'APPROVED' ? '#22c55e' : (status === 'CHANGES_REQUESTED' ? '#f43f5e' : '#eab308');
      if (!isHighlighted) emissiveIntensity = 0.3;
    } else if (node.hasConflicts) {
      color = THEME.conflict;
    } else if (node.lastUpdated && rootMeta?.newestTimestamp) {
      const current = new Date(node.lastUpdated).getTime();
      const range = Math.max(rootMeta.newestTimestamp - rootMeta.oldestTimestamp, 1);
      const ratio = Math.max(0, Math.min(1, (current - rootMeta.oldestTimestamp) / range));
      
      if (ratio > 0.8) {
        color = '#60a5fa'; 
        if (!isHighlighted) emissiveIntensity = 0.5;
      } 
      else if (ratio > 0.6) color = '#3b82f6';
      else if (ratio > 0.4) color = '#2563eb';
      else if (ratio > 0.2) color = '#1d4ed8';
      else color = '#172554';
    }

    if (isHighlighted) color = '#ffffff';
    if (node.isMerged && !isHighlighted) color = '#1e293b';

    return { color, emissiveIntensity };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(THEME.background);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 10000);
    camera.position.set(0, 800, 1500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, THEME.ambientIntensity));
    const sun = new THREE.DirectionalLight(0xffffff, THEME.directIntensity);
    sun.position.set(500, 1000, 500);
    scene.add(sun);

    const animGroups: THREE.Group[] = [];
    const assets: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    nodesMap.current.clear();

    const buildFileGarden = (node: VisualizerNode, depth = 0): THREE.Group => {
      const group = new THREE.Group();
      const len = 100 * Math.pow(0.8, depth);
      const rad = Math.max(0.5, 4 - depth * 0.8);
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, len * 0.5, 0), new THREE.Vector3(0, len, 0));
      const geo = new THREE.TubeGeometry(curve, 8, rad, 6, false);
      const mat = new THREE.MeshStandardMaterial({ color: `hsl(215, 20%, ${40 + depth * 10}%)`, transparent: true, opacity: 0.8 });
      group.add(new THREE.Mesh(geo, mat));
      assets.push(geo, mat);

      if (node.type === 'file') {
        const size = Math.log10((node.metadata?.additions || 0) + 1) * 5 + 3;
        const leafGeo = new THREE.SphereGeometry(size, 8, 8);
        const leafMat = new THREE.MeshStandardMaterial({ color: '#60a5fa', emissive: '#60a5fa', emissiveIntensity: 0.2 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0, len, 0);
        group.add(leaf);
        assets.push(leafGeo, leafMat);
      }

      node.children?.forEach((child, i) => {
        const childBranch = buildFileGarden(child, depth + 1);
        childBranch.position.set(0, len, 0);
        childBranch.rotation.z = node.children.length === 1 ? 0.3 : ((i / (node.children.length - 1)) - 0.5) * 1.5;
        group.add(childBranch);
      });
      return group;
    };

    const buildBranch = (node: VisualizerNode, depth = 0, rootMeta: any = null): THREE.Group => {
      const isTrunk = node.type === 'trunk';
      const val = node.relativeAhead ?? node.ahead;
      const len = isTrunk ? TREE_LAYOUT.trunkLength : (Math.log10(val + 1) * 100 + 80) * Math.pow(0.92, depth);
      const rad = isTrunk ? TREE_LAYOUT.trunkRadius : Math.max(TREE_LAYOUT.minRadius, 10 - depth * 2.5);

      const group = new THREE.Group();
      if (!isTrunk) animGroups.push(group);

      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(isTrunk ? 0 : 30, len * 0.5, 0), new THREE.Vector3(0, len, 0));
      const geo = new THREE.TubeGeometry(curve, 8, rad, 6, false);
      const { color, emissiveIntensity } = getNodeStyles(node, rootMeta || tree.metadata, false);
      const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: node.isMerged ? 0.3 : 1, roughness: 0.5, metalness: 0.1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { node };
      group.add(mesh);
      assets.push(geo, mat);

      let tip: THREE.Mesh | undefined;
      let label: THREE.Sprite | undefined;

      if (!isTrunk) {
        const tipGeo = new THREE.SphereGeometry(15, 12, 12);
        const tipMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, transparent: true });
        tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, len, 0);
        tip.userData = { node };
        group.add(tip);
        assets.push(tipGeo, tipMat);

        if (node.fileTree) {
          const garden = buildFileGarden(node.fileTree);
          garden.position.set(0, len, 0);
          group.add(garden);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 256; canvas.height = 64; 
        ctx.fillStyle = THEME.text;
        ctx.font = `bold ${Math.max(24, 40 - depth * 6)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.name, 128, 32);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8, visible: depth <= 2 });
        label = new THREE.Sprite(spriteMat);
        const scale = Math.max(120, 200 - depth * 40);
        label.position.set(0, len + 25, 0);
        label.scale.set(scale, scale / 4, 1);
        label.userData = { baseScale: scale, depth };
        group.add(label);
        assets.push(tex, spriteMat);
      }

      nodesMap.current.set(node.name, { mesh, tip, label, node });

      const children = node.children || [];
      const meta = rootMeta || tree.metadata;
      children.forEach((child, i) => {
        const childBranch = buildBranch(child, depth + 1, meta);
        if (isTrunk) {
          const ratio = 1 - (child.behind / (meta?.maxBehind || 1));
          childBranch.position.set(0, len * (0.2 + ratio * 0.75), 0);
          childBranch.rotation.y = (i * 137.5) * (Math.PI / 180);
          childBranch.rotation.z = TREE_LAYOUT.branchBaseAngle;
        } else {
          childBranch.position.set(0, len, 0);
          childBranch.rotation.z = children.length === 1 ? 0.3 : ((i / (children.length - 1)) - 0.5) * 0.8;
        }
        group.add(childBranch);
      });
      return group;
    };

    const root = buildBranch(tree);
    root.position.y = -600;
    scene.add(root);
    animatedGroupsRef.current = animGroups;
    disposablesRef.current = assets;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getTarget = (clientX: number, clientY: number) => {
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

    let isDown = false;
    let start = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const hit = getTarget(e.clientX, e.clientY);
      container.style.cursor = isDown ? 'grabbing' : (hit ? 'pointer' : 'grab');
      if (!isDown) {
        const next = hit ? hit.node.name : null;
        if (next !== hoveredNodeName) onHover?.(next);
      }
    };
    const onDown = (e: MouseEvent) => { isDown = true; start = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: MouseEvent) => {
      isDown = false;
      if (Math.abs(e.clientX - start.x) < 5 && Math.abs(e.clientY - start.y) < 5) {
        const hit = getTarget(e.clientX, e.clientY);
        if (hit && onSelect) onSelect(hit.node, { x: hit.x, y: hit.y });
      }
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mousedown', onDown);
    container.addEventListener('mouseup', onUp);

    let frame: number;
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      const t = time * 0.001;
      animGroups.forEach((g, i) => { g.rotation.x = Math.sin(t + i) * 0.015; });
      controls.update();
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mousedown', onDown);
      container.removeEventListener('mouseup', onUp);
      assets.forEach(a => a.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [tree]);


  // --- Dynamic Updates ---
  useEffect(() => {
    if (!sceneRef.current) return;
    nodesMap.current.forEach((data, name) => {
      const { mesh, tip, label, node } = data;
      const isHighlighted = hoveredNodeName === name || (filterAuthor && node.author?.login === filterAuthor);
      const isOtherHighlighted = (hoveredNodeName && hoveredNodeName !== name) || (filterAuthor && node.author?.login !== filterAuthor);
      const { color, emissiveIntensity } = getNodeStyles(node, tree.metadata, isHighlighted);
      
      const meshMat = mesh.material as THREE.MeshStandardMaterial;
      meshMat.color.set(color);
      meshMat.opacity = (isOtherHighlighted && isDimmed) ? 0.05 : (node.isMerged && !isHighlighted ? 0.3 : 1);
      
      if (tip) {
        const tipMat = tip.material as THREE.MeshStandardMaterial;
        tipMat.color.set(color);
        tipMat.emissive.set(color);
        tipMat.emissiveIntensity = (isOtherHighlighted && isDimmed) ? 0 : emissiveIntensity;
        tipMat.opacity = (isOtherHighlighted && isDimmed) ? 0.05 : 1;
        const s = isHighlighted ? 1.6 : 1;
        tip.scale.set(s, s, s);
      }
      if (label) {
        const labelMat = label.material as THREE.SpriteMaterial;
        labelMat.visible = isHighlighted || (!isDimmed && label.userData.depth <= 2);
        labelMat.opacity = isHighlighted ? 1 : 0.8;
        label.renderOrder = isHighlighted ? 999 : 0;
        const scale = isHighlighted ? 300 : label.userData.baseScale;
        label.scale.set(scale, scale / 4, 1);
      }
    });
  }, [hoveredNodeName, filterAuthor, isDimmed, tree.metadata]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden touch-none" />;
};