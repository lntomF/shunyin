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

export function MagazineCoverTemplate({
  width,
  height,
  imageHref,
  image,
  cameraTitle,
  coverTitle,
  parameterLine,
  lensModel,
  captureTimeText,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const isPortrait = sourceHeight > sourceWidth * 1.12;
  const padding = isPortrait
    ? clamp(Math.round(sourceHeight * 0.038), 54, scaledMax(150))
    : clamp(Math.round(Math.min(width, height) * 0.055), 34, scaledMax(86));
  const mastheadSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.07), 100, scaledMax(300))
    : clamp(Math.round(width * 0.105), 58, scaledMax(138));
  const issueSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.014), 18, scaledMax(56))
    : clamp(Math.round(width * 0.012), 10, scaledMax(17));
  const coverTitleSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.034), 52, scaledMax(140))
    : clamp(Math.round(width * 0.048), 30, scaledMax(72));
  const metaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.019), 30, scaledMax(78))
    : clamp(Math.round(width * 0.016), 13, scaledMax(23));
  const smallSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.014), 18, scaledMax(56))
    : clamp(Math.round(width * 0.0105), 9, scaledMax(15));
  const mastheadText = truncateText(coverTitle, maxChars(width * 0.72, mastheadSize));
  const lensText = lensModel ? truncateText(lensModel, maxChars(width * 0.54, metaSize)) : null;
  const cameraText = truncateText(cameraTitle.toUpperCase(), maxChars(width * 0.62, coverTitleSize));
  const parameterText = truncateText(parameterLine, maxChars(width * 0.46, metaSize));
  const issueText = truncateText(captureTimeText, maxChars(width * 0.24, smallSize));
  const sideLabelX = width - padding * 0.55;
  const sideLabelY = height - padding;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="magazine-top-shade" x1={width / 2} y1={0} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#000000" stopOpacity="0.5" />
          <stop offset="0.32" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="0.68" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.68" />
        </linearGradient>
        <linearGradient id="magazine-left-shade" x1={0} y1={height / 2} x2={width} y2={height / 2} gradientUnits="userSpaceOnUse">
          <stop stopColor="#000000" stopOpacity="0.48" />
          <stop offset="0.5" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.32" />
        </linearGradient>
        <filter id="magazine-text-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#0B0B0B" />
      <image href={imageHref} x={0} y={0} width={width} height={height} preserveAspectRatio="none" />
      <rect width={width} height={height} fill="url(#magazine-top-shade)" />
      <rect width={width} height={height} fill="url(#magazine-left-shade)" />

      <g filter="url(#magazine-text-shadow)">
        <text
          x={padding}
          y={padding + mastheadSize * 0.78}
          fill="#FFF8EA"
          fontSize={mastheadSize}
          fontFamily="Georgia, Times New Roman, serif"
          fontWeight="700"
          letterSpacing="-0.01em"
        >
          {mastheadText}
        </text>
        <text
          x={padding}
          y={padding + mastheadSize + issueSize * 1.45}
          fill="#FFF8EA"
          fontSize={issueSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="760"
          letterSpacing="0.18em"
        >
          PHOTO FIELD NOTE / LOCAL ISSUE
        </text>
        <text
          x={padding}
          y={height - padding - coverTitleSize * 1.4}
          fill="#FFFFFF"
          fontSize={coverTitleSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="820"
          letterSpacing="-0.01em"
        >
          {cameraText}
        </text>
        <rect x={padding} y={height - padding - metaSize * 1.05} width={width * 0.18} height={2} fill="#FFF8EA" fillOpacity="0.82" />
        {lensText && (
          <text
            x={padding}
            y={height - padding + metaSize * 0.25}
            fill="#FFF8EA"
            fontSize={metaSize}
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="680"
            letterSpacing="0"
          >
            {lensText}
          </text>
        )}
        <text
          x={width - padding}
          y={height - padding + metaSize * 0.25}
          fill="#FFF8EA"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="760"
          letterSpacing="0"
          textAnchor="end"
        >
          {parameterText}
        </text>
        <text
          x={width - padding}
          y={padding + smallSize}
          fill="#FFF8EA"
          fontSize={smallSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="700"
          letterSpacing="0.14em"
          textAnchor="end"
        >
          {issueText}
        </text>
        <text
          x={sideLabelX}
          y={sideLabelY}
          fill="#FFF8EA"
          fontSize={smallSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="760"
          letterSpacing="0.18em"
          textAnchor="start"
          transform={`rotate(-90 ${sideLabelX} ${sideLabelY})`}
        >
          WATERMARK EDITOR
        </text>
      </g>
    </svg>
  );
}
