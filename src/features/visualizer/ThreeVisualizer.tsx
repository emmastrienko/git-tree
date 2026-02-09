'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VisualizerNode } from '@/types';

interface ThreeVisualizerProps {
  tree: VisualizerNode;
  isFetching?: boolean;
}

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({ tree }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 5000);
    camera.position.set(0, 500, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.domElement.style.display = 'block'; // Prevent baseline spacing
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0x6366f1, 1);
    light.position.set(100, 500, 100);
    scene.add(light);

    const branchGroups: THREE.Group[] = [];

    const createBranch = (
      node: VisualizerNode, 
      depth: number,
      index: number
    ): THREE.Group => {
      const isTrunk = node.type === 'trunk';
      const val = node.relativeAhead ?? node.ahead;
      
      // Use 2D-like length scaling
      const length = isTrunk ? 800 : (Math.log10(val + 1) * 100 + 80) * Math.pow(0.92, depth);
      const radius = isTrunk ? 14 : Math.max(1.5, 8 - depth * 2);

      const group = new THREE.Group();
      branchGroups.push(group);

      // Create Curved Mesh matching 2D Quadratic Curve
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(0, length, 0);
      
      // Slight "bend" like 2D: Mid point offset is small and consistent
      const curveIntensity = isTrunk ? 0 : 20; 
      const mid = new THREE.Vector3(curveIntensity, length * 0.5, 0);
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geometry = new THREE.TubeGeometry(curve, 12, radius, 8, false);
      
      const color = node.hasConflicts ? '#f43f5e' : (isTrunk ? '#475569' : '#6366f1');
      const material = new THREE.MeshStandardMaterial({ 
        color, 
        transparent: node.isMerged, 
        opacity: node.isMerged ? 0.3 : 1 
      });

      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);

      // Tip Dot (Leaf)
      if (!isTrunk) {
        const dotGeo = new THREE.SphereGeometry(radius * 1.5, 12, 12);
        const dotMat = new THREE.MeshBasicMaterial({ color });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(end);
        group.add(dot);

        // Labels for ALL branches
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 512;
        canvas.height = 128;
        ctx.fillStyle = '#f1f5f9';
        // Adjust font size based on depth for better hierarchy
        const fontSize = Math.max(24, 40 - depth * 6);
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.name, 256, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
          map: texture,
          sizeAttenuation: true,
          depthTest: false, // Ensure labels are visible through geometry
          transparent: true
        }));
        
        // Scale labels based on depth, but keep them legible
        const scale = Math.max(120, 220 - depth * 40);
        sprite.position.set(0, length + 50, 0); // Increased offset
        sprite.scale.set(scale, scale / 4, 1);
        sprite.renderOrder = 100 + depth; // Higher render order for labels
        group.add(sprite);
      }

      // Recursive Children (Matching 2D Logic)
      if (isTrunk) {
        const children = [...(node.children || [])].sort((a, b) => b.behind - a.behind);
        children.forEach((child, i) => {
          const ratio = 1 - (child.behind / (node.metadata?.maxBehind || 1));
          const childBranch = createBranch(child, depth + 1, i);
          
          // Distribution along trunk
          childBranch.position.set(0, length * (0.2 + ratio * 0.75), 0);
          
          // 2D Spread logic converted to 3D
          // phi = the plane of growth around the trunk
          const phi = (i * 137.5) * (Math.PI / 180); 
          // theta = the sprout angle (mimicking 2D's 0.5 * side)
          const theta = 0.5; 
          
          childBranch.rotation.y = phi;
          childBranch.rotation.z = theta;
          
          group.add(childBranch);
        });
      } else {
        const childCount = node.children?.length || 0;
        node.children?.forEach((child, i) => {
          const childBranch = createBranch(child, depth + 1, i);
          childBranch.position.copy(end);
          
          // Unified Curl Logic: Constant spread/angle regardless of depth
          const spread = 0.6; 
          const angle = childCount === 1 ? 0.25 : ((i / (childCount - 1)) - 0.5) * spread;
          
          // Stay in the same plane and curl in Z
          childBranch.rotation.z = angle;
          
          group.add(childBranch);
        });
      }

      return group;
    };

    const rootGroup = createBranch(tree, 0, 0);
    rootGroup.position.y = -300;
    scene.add(rootGroup);

    const animate = (time: number) => {
      const t = time * 0.001;
      requestAnimationFrame(animate);
      
      // Wind Effect (Slightly sway child rotations)
      branchGroups.forEach((group, i) => {
        if (group.rotation.z !== 0) {
           // Mimic 2D swaying of mid-points/rotation
           group.rotation.x = Math.sin(t + i) * 0.01;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [tree]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
};