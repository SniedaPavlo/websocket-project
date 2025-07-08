// Main components
export { Chart } from "./components/Chart";
export { PriceDisplay } from "./components/PriceDisplay";
export { BlockGrid } from "./components/BlockGrid";

// Hooks
export { useSolPrice } from "./hooks/useSolPrice";
export { useResponsive } from "./hooks/useResponsive";

// Services
export { BananaZoneAPI } from "./services/httpService";

// Types
export type { PriceData, ChartBlock } from "./types";

// Utils
export {
  generateBlocks,
  normalizePrice,
  getMinMaxPrice,
} from "./utils/chartUtils";
export { COLORS, BREAKPOINTS, HTTP_CONFIG } from "./utils/constants";

// Complete chart widget
export { default as SolPriceChart } from "./SolPriceChart";
