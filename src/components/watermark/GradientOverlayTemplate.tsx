import type { WatermarkSvgProps } from './types';
import { getWatermarkLayoutScale } from '../../utils/overlay';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function maxChars(width: number, fontSize: number) {
  return Math.max(8, Math.floor(width / (fontSize * 0.54)));
}

export function GradientOverlayTemplate({
  width,
  height,
  image,
  imageHref,
  coverTitle,
  cameraTitle,
  brandName,
  lensModel,
  parameterLine,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const padding = clamp(Math.round(minEdge * 0.055), 34, scaledMax(92));
  const titleSize = clamp(Math.round(sourceWidth * 0.058), 34, scaledMax(92));
  const metaSize = clamp(Math.round(sourceWidth * 0.015), 12, scaledMax(24));
  const labelSize = clamp(Math.round(sourceWidth * 0.0105), 9, scaledMax(16));
  const titleText = truncateText(coverTitle, maxChars(width * 0.68, titleSize));
  const cameraText = truncateText(cameraTitle, maxChars(width * 0.46, metaSize));
  const lensText = lensModel ? truncateText(lensModel, maxChars(width * 0.42, metaSize)) : null;
  const parameterText = truncateText(parameterLine, maxChars(width * 0.34, metaSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient-overlay-bottom" x1={width / 2} y1={height * 0.2} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#050505" stopOpacity="0" />
          <stop offset="0.58" stopColor="#050505" stopOpacity="0.22" />
          <stop offset="1" stopColor="#050505" stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id="gradient-overlay-accent" x1={0} y1={height} x2={width} y2={height * 0.45} gradientUnits="userSpaceOnUse">
          <stop stopColor="#146C63" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#B6682D" stopOpacity="0.24" />
          <stop offset="1" stopColor="#111111" stopOpacity="0" />
        </linearGradient>
        <filter id="gradient-text-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#111111" />
      <image href={imageHref} x={0} y={0} width={width} height={height} preserveAspectRatio="none" />
      <rect width={width} height={height} fill="url(#gradient-overlay-bottom)" />
      <rect width={width} height={height} fill="url(#gradient-overlay-accent)" />

      <g filter="url(#gradient-text-shadow)">
        <text
          x={padding}
          y={padding + labelSize}
          fill="#F7F3EA"
          fontSize={labelSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="780"
          letterSpacing="0.18em"
        >
          {brandName} / RELEASE
        </text>
        <text
          x={padding}
          y={height - padding - titleSize * 0.86}
          fill="#FFFFFF"
          fontSize={titleSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="840"
          letterSpacing="0"
        >
          {titleText}
        </text>
        <rect x={padding} y={height - padding - metaSize * 1.15} width={Math.max(42, width * 0.12)} height={Math.max(2, layoutScale * 2)} fill="#F7F3EA" fillOpacity="0.9" />
        <text
          x={padding}
          y={height - padding + metaSize * 0.28}
          fill="#F7F3EA"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="680"
        >
          {lensText ? `${cameraText} / ${lensText}` : cameraText}
        </text>
        <text
          x={width - padding}
          y={height - padding + metaSize * 0.28}
          fill="#F7F3EA"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="760"
          textAnchor="end"
        >
          {parameterText}
        </text>
      </g>
    </svg>
  );
}
