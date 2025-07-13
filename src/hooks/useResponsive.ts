import { useState, useEffect } from "react";

export interface BlockConfig {
  blocksPerRow: number;
  blocksPerColumn: number;
  stopAtBlock: number; // New field - at which block to stop the curve
}

export interface ResponsiveConfig {
  mobile?: BlockConfig;
  tablet?: BlockConfig;
  desktop?: BlockConfig;
}

export const useResponsive = (customConfig?: ResponsiveConfig) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024
  );
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Updated config with stop points
  const defaultConfig: ResponsiveConfig = {
    mobile: {
      blocksPerRow: 4,
      blocksPerColumn: 4,
      stopAtBlock: 4,
    },
    tablet: {
      blocksPerRow: 6,
      blocksPerColumn: 4,
      stopAtBlock: 4,
    },
    desktop: {
      blocksPerRow: 8,
      blocksPerColumn: 4,
      stopAtBlock: 7,
    },
  };

  const config = {
    mobile: customConfig?.mobile || defaultConfig.mobile!,
    tablet: customConfig?.tablet || defaultConfig.tablet!,
    desktop: customConfig?.desktop || defaultConfig.desktop!,
  };

  const getBlockConfig = (): BlockConfig => {
    if (isMobile) return config.mobile;
    if (isTablet) return config.tablet;
    return config.desktop;
  };

  // New function to calculate stop position
  const getStopPosition = (chartWidth: number): number => {
    const blockConfig = getBlockConfig();
    const blockWidth = chartWidth / blockConfig.blocksPerRow;
    return blockWidth * blockConfig.stopAtBlock;
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    blockConfig: getBlockConfig(),
    getBlockConfig,
    getStopPosition, // New function
  };
};
