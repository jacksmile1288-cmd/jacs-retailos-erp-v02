import React from 'react';

/**
 * Helper to convert 6-digit hex color to rgba components
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { r, g, b };
};

/**
 * Returns multi-layer thick neon glow styles:
 * - Border: 2.5px solid [color]
 * - Box Shadow: 0 0 20px [color_alpha_70%], 0 0 40px [color_alpha_40%], inset 0 0 14px [color_alpha_25%]
 * Fully optimized for both Dark Mode and Light Mode with instant 150ms ease-out reactive transition.
 */
export const getThickNeonGlowStyle = (
  colorHex: string,
  isSelected: boolean,
  isLight: boolean,
  isHovered: boolean = false
): React.CSSProperties => {
  return getReactiveNeonGlowStyle(colorHex, isSelected, isHovered, isLight);
};

/**
 * Returns reactive neon glow style supporting active permanent glow and hover glow reactive state.
 * When hovered, gives sharp neon border + shadow-[0_0_18px_rgba(6,182,212,0.45)] / division accent.
 */
export const getReactiveNeonGlowStyle = (
  colorHex: string,
  isSelected: boolean,
  isHovered: boolean,
  isLight: boolean
): React.CSSProperties => {
  const { r, g, b } = hexToRgb(colorHex);

  if (isLight) {
    if (isSelected) {
      return {
        borderColor: '#E2E8F0',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transform: 'none',
        transition: 'all 150ms ease-out',
      };
    }

    if (isHovered) {
      return {
        borderColor: '#CBD5E1',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: '#F8FAFC',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transform: 'none',
        transition: 'all 150ms ease-out',
      };
    }

    return {
      borderColor: '#E2E8F0',
      borderWidth: '1px',
      borderStyle: 'solid',
      backgroundColor: '#FFFFFF',
      boxShadow: 'none',
      transform: 'none',
      transition: 'all 150ms ease-out',
    };
  }

  // DARK MODE: 100% original high-contrast neon glow aesthetics preserved
  if (isSelected) {
    const shadow70 = `rgba(${r}, ${g}, ${b}, 0.70)`;
    const shadow40 = `rgba(${r}, ${g}, ${b}, 0.40)`;
    const shadow25 = `rgba(${r}, ${g}, ${b}, 0.25)`;
    const bgTint = `rgba(${r}, ${g}, ${b}, 0.20)`;

    return {
      borderColor: colorHex,
      borderWidth: '2px',
      borderStyle: 'solid',
      backgroundColor: bgTint,
      boxShadow: `0 0 20px ${shadow70}, 0 0 40px ${shadow40}, inset 0 0 14px ${shadow25}`,
      transform: 'translateY(-2px)',
      transition: 'all 150ms ease-out',
    };
  }

  if (isHovered) {
    const shadowHover = `rgba(${r}, ${g}, ${b}, 0.65)`;
    const cyanGlow = 'rgba(6, 182, 212, 0.45)';
    const bgHover = `rgba(${r}, ${g}, ${b}, 0.16)`;

    return {
      borderColor: colorHex,
      borderWidth: '2px',
      borderStyle: 'solid',
      backgroundColor: bgHover,
      boxShadow: `0 0 18px ${cyanGlow}, 0 0 28px ${shadowHover}, inset 0 0 10px rgba(${r}, ${g}, ${b}, 0.20)`,
      transform: 'translateY(-2px)',
      transition: 'all 150ms ease-out',
    };
  }

  return {
    borderColor: '#1e293b',
    borderWidth: '1px',
    borderStyle: 'solid',
    backgroundColor: '#0f172a',
    boxShadow: 'none',
    transform: 'none',
    transition: 'all 150ms ease-out',
  };
};
