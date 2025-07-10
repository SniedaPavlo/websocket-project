import { useState, useEffect } from "react";

export interface BlockConfig {
  blocksPerRow: number;
  blocksPerColumn: number;
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

  //don't change values!
  const defaultConfig: ResponsiveConfig = {
    mobile: { blocksPerRow: 7, blocksPerColumn: 4 },
    tablet: { blocksPerRow: 7, blocksPerColumn: 4 },
    desktop: { blocksPerRow: 10, blocksPerColumn: 4 },
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

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    blockConfig: getBlockConfig(),
    getBlockConfig,
  };
};
