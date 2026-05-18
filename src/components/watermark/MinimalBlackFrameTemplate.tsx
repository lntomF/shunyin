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

export function MinimalBlackFrameTemplate({
  width,
  height,
  imageHref,
  image,
  cameraTitle,
  lensModel,
  parameterLine,
  brandName,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const isPortrait = sourceHeight > sourceWidth * 1.12;

  const framePadding = isPortrait
    ? clamp(Math.round(sourceHeight * 0.045), 48, scaledMax(120))
    : clamp(Math.round(Math.min(width, height) * 0.05), 32, scaledMax(80));

  const innerPadding = framePadding * 0.4;
  const photoX = framePadding;
  const photoY = framePadding;
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding * 2;

  const brandSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.016), 22, scaledMax(64))
    : clamp(Math.round(width * 0.014), 12, scaledMax(20));

  const metaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.012), 18, scaledMax(48))
    : clamp(Math.round(width * 0.01), 9, scaledMax(14));

  const cameraText = truncateText(cameraTitle, maxChars(photoWidth * 0.5, metaSize));
  const lensText = lensModel ? truncateText(lensModel, maxChars(photoWidth * 0.4, metaSize)) : null;
  const parameterText = truncateText(parameterLine, maxChars(photoWidth * 0.35, metaSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#0A0A0A" />

      <image
        href={imageHref}
        x={photoX}
        y={photoY}
        width={photoWidth}
        height={photoHeight}
        preserveAspectRatio="xMidYMid slice"
      />

      <rect
        x={photoX}
        y={photoY}
        width={photoWidth}
        height={photoHeight}
        stroke="#FFFFFF"
        strokeWidth={1}
        strokeOpacity="0.15"
        fill="none"
      />

      <text
        x={photoX + innerPadding}
        y={photoY + innerPadding + brandSize * 0.75}
        fill="#FFFFFF"
        fontSize={brandSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="800"
        letterSpacing="0.12em"
      >
        {brandName}
      </text>

      <text
        x={photoX + innerPadding}
        y={photoY + photoHeight - innerPadding - metaSize * 1.8}
        fill="#FFFFFF"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="600"
        letterSpacing="0"
        fillOpacity="0.95"
      >
        {cameraText}
      </text>

      {lensText && (
        <text
          x={photoX + innerPadding}
          y={photoY + photoHeight - innerPadding - metaSize * 0.5}
          fill="#FFFFFF"
          fontSize={metaSize * 0.85}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="500"
          letterSpacing="0"
          fillOpacity="0.75"
        >
          {lensText}
        </text>
      )}

      <text
        x={photoX + photoWidth - innerPadding}
        y={photoY + photoHeight - innerPadding - metaSize * 0.5}
        fill="#FFFFFF"
        fontSize={metaSize * 0.85}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="600"
        letterSpacing="0.02em"
        fillOpacity="0.85"
        textAnchor="end"
      >
        {parameterText}
      </text>
    </svg>
  );
}
