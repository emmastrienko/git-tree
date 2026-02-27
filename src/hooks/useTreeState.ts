import { useState, useRef, useCallback, useEffect } from 'react';
import { ViewMode, VisualizerNode } from '@/types';

export const useTreeState = () => {
  const [branchData, setBranchData] = useState<{tree: VisualizerNode | null, items: any[]}>({tree: null, items: []});
  const [prData, setPrData] = useState<{tree: VisualizerNode | null, items: any[]}>({tree: null, items: []});
  
  const branchItemsRef = useRef<any[]>([]);
  const prItemsRef = useRef<any[]>([]);
  const fetchingNodes = useRef<Set<string>>(new Set());
  
  const [activeMode, setActiveMode] = useState<ViewMode>('branches');
  const currentModeRef = useRef<ViewMode>('branches');
  
  const stateTracker = useRef<{
    repo: string | null,
    hasBranches: boolean,
    hasPrs: boolean,
    enrichedModes: Set<ViewMode>,
    base: string | null,
    baseSha: string | null
  }>({ repo: null, hasBranches: false, hasPrs: false, enrichedModes: new Set(), base: null, baseSha: null });

  useEffect(() => {
    branchItemsRef.current = branchData.items;
  }, [branchData.items]);

  useEffect(() => {
    prItemsRef.current = prData.items;
  }, [prData.items]);

  const resetState = useCallback((newRepo: boolean) => {
    if (newRepo) {
      stateTracker.current.repo = null;
      stateTracker.current.hasBranches = false;
      stateTracker.current.hasPrs = false;
      stateTracker.current.enrichedModes.clear();
      stateTracker.current.base = null;
      stateTracker.current.baseSha = null;
    }
  }, []);

  const clearModeState = useCallback((mode: ViewMode) => {
    if (mode === 'branches') {
      setBranchData({ tree: null, items: [] });
      branchItemsRef.current = [];
      stateTracker.current.hasBranches = false;
      stateTracker.current.enrichedModes.delete('branches');
    } else {
      setPrData({ tree: null, items: [] });
      prItemsRef.current = [];
      stateTracker.current.hasPrs = false;
      stateTracker.current.enrichedModes.delete('pr');
    }
  }, []);

  return {
    branchData, setBranchData,
    prData, setPrData,
    branchItemsRef, prItemsRef,
    fetchingNodes,
    activeMode, setActiveMode,
    currentModeRef,
    stateTracker,
    resetState,
    clearModeState
  };
};
