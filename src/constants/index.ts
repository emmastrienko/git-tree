// GitHub API constants
export const GITHUB_PER_PAGE = 100;
export const MAX_BRANCH_PAGES = 10;
export const MAX_PR_PAGES = 5;
export const MAX_FETCH_PAGES = 50;

// Enrichment and Animation
export const ENRICH_CHUNK_SIZE = 20;
export const ANIMATION_STEP = 0.02;

// Time Constants (in milliseconds)
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
export const TWO_YEARS_MS = 2 * 365 * ONE_DAY_MS;

// Tree Visualizer Constants
export const INITIAL_SCALE = 0.8;
export const ZOOM_SPEED = 0.001;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
export const SMOOTH_LIMIT_STEP = 0.2;
export const CANVAS_WIDTH = 1400;
export const CANVAS_HEIGHT = 1000;
export const TRUNK_WIDTH = 18;
export const SHADOW_BLUR_NORMAL = 20;
export const SHADOW_BLUR_HIGHLIGHT = 30;

// Tree Layout Constants
export const TREE_LAYOUT = {
  trunkLength: 250,
  branchLengthBase: 80,
  branchLengthFactor: 100,
  branchShrinkage: 0.92,
  trunkBaseY: 100,
  branchSpread: 1.8,
  leafSpread: 0.7,
  leafShrinkage: 0.8,
};

// Three.js Visualizer Constants
export const THREE_TREE_LAYOUT = {
  trunkLength: 800,
  trunkRadius: 16,
  minRadius: 2,
  branchBaseAngle: 0.6,
};

export const THREE_CAMERA = {
  fov: 75,
  near: 0.1,
  far: 10000,
  initialPos: { x: 0, y: 800, z: 1500 },
};

export const THREE_LIGHTS = {
  ambientIntensity: 0.6,
  directIntensity: 1.2,
  sunPos: { x: 500, y: 1000, z: 500 },
};

export const THREE_ANIMATION = {
  rotationIntensity: 0.015,
  dampingFactor: 0.05,
};

export const THREE_LOD = {
  labelMaxDepth: 1,
  labelVisibleDist: 2500,
};

// Layout Thresholds
export const TREE_NODE_PROGRESS_THRESHOLD = 0.8;
export const COLOR_RATIO_LEVELS = {
  VERY_HIGH: 0.8,
  HIGH: 0.6,
  MEDIUM: 0.4,
  LOW: 0.2,
};
