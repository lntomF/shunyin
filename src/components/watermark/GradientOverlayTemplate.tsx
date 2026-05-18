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
  return Math.max(8, Math.floor(width / (fontSize * 0.55)));
}

export function GradientOverlayTemplate({
  width,
  height,
  imageHref,
  image,
  cameraTitle,
  coverTitle,
  lensModel,
  parameterLine,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const isPortrait = sourceHeight > sourceWidth * 1.12;

  const padding = isPortrait
    ? clamp(Math.round(sourceHeight * 0.04), 48, scaledMax(120))
    : clamp(Math.round(width * 0.035), 28, scaledMax(70));

  const titleSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.042), 64, scaledMax(168))
    : clamp(Math.round(width * 0.038), 36, scaledMax(72));

  const metaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.018), 28, scaledMax(72))
    : clamp(Math.round(width * 0.015), 14, scaledMax(22));

  const smallSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.013), 20, scaledMax(52))
    : clamp(Math.round(width * 0.011), 10, scaledMax(16));

  const titleText = truncateText(coverTitle, maxChars(width * 0.7, titleSize));
  const cameraText = truncateText(cameraTitle, maxChars(width * 0.5, metaSize));
  const lensText = lensModel ? truncateText(lensModel, maxChars(width * 0.45, smallSize)) : null;
  const parameterText = truncateText(parameterLine, maxChars(width * 0.4, smallSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient-overlay-bottom" x1={width / 2} y1={height * 0.5} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000000" stopOpacity="0.3" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gradient-overlay-top" x1={width / 2} y1={0} x2={width / 2} y2={height * 0.35} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <filter id="gradient-text-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={width} height={height} fill="#000000" />
      <image href={imageHref} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      <rect width={width} height={height} fill="url(#gradient-overlay-bottom)" />
      <rect width={width} height={height} fill="url(#gradient-overlay-top)" />

      <g filter="url(#gradient-text-glow)">
        <text
          x={padding}
          y={padding + titleSize * 0.8}
          fill="#FFFFFF"
          fontSize={titleSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="900"
          letterSpacing="-0.02em"
        >
          {titleText}
        </text>

        <line
          x1={padding}
          y1={padding + titleSize * 1.1}
          x2={padding + width * 0.15}
          y2={padding + titleSize * 1.1}
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeOpacity="0.9"
        />

        <text
          x={padding}
          y={height - padding - metaSize * 2.2}
          fill="#FFFFFF"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="700"
          letterSpacing="0"
        >
          {cameraText}
        </text>

        {lensText && (
          <text
            x={padding}
            y={height - padding - smallSize * 1.8}
            fill="#FFFFFF"
            fontSize={smallSize}
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="600"
            letterSpacing="0"
            fillOpacity="0.9"
          >
            {lensText}
          </text>
        )}

        <text
          x={width - padding}
          y={height - padding - smallSize * 0.5}
          fill="#FFFFFF"
          fontSize={smallSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="700"
          letterSpacing="0.05em"
          fillOpacity="0.95"
          textAnchor="end"
        >
          {parameterText}
        </text>
      </g>
    </svg>
  );
}
