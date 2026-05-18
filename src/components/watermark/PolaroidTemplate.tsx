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
  return Math.max(8, Math.floor(width / (fontSize * 0.56)));
}

export function PolaroidTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  lensModel,
  parameterLine,
  captureTimeText,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const isPortrait = sourceHeight > sourceWidth * 1.12;

  const sidePadding = clamp(Math.round(minEdge * 0.06), 40, scaledMax(96));
  const topPadding = clamp(Math.round(minEdge * 0.06), 40, scaledMax(96));
  const bottomPadding = Math.max(
    clamp(Math.round(minEdge * (isPortrait ? 0.22 : 0.2)), isPortrait ? 140 : 120, scaledMax(isPortrait ? 280 : 240)),
    height - sourceHeight - topPadding
  );

  const photoX = (width - sourceWidth) / 2;
  const photoY = topPadding;
  const photoBottom = photoY + sourceHeight;
  const captionTop = photoBottom + bottomPadding * 0.18;

  const handwritingSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.026), 42, scaledMax(104))
    : clamp(Math.round(sourceWidth * 0.022), 20, scaledMax(34));

  const metaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.014), 22, scaledMax(56))
    : clamp(Math.round(sourceWidth * 0.012), 11, scaledMax(18));

  const smallSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.011), 18, scaledMax(46))
    : clamp(Math.round(sourceWidth * 0.01), 9, scaledMax(14));

  const cameraText = truncateText(cameraTitle, maxChars(sourceWidth * 0.7, handwritingSize));
  const lensText = lensModel ? truncateText(lensModel, maxChars(sourceWidth * 0.6, metaSize)) : null;
  const parameterText = truncateText(parameterLine, maxChars(sourceWidth * 0.5, metaSize));
  const dateText = truncateText(captureTimeText, maxChars(sourceWidth * 0.4, smallSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="polaroid-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#1A1A1A" floodOpacity="0.25" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#E8E4DC" />

      <rect
        x={photoX - sidePadding}
        y={photoY - topPadding}
        width={sourceWidth + sidePadding * 2}
        height={sourceHeight + topPadding + bottomPadding}
        fill="#FEFDFB"
        filter="url(#polaroid-shadow)"
      />

      <image
        href={imageHref}
        x={photoX}
        y={photoY}
        width={sourceWidth}
        height={sourceHeight}
        preserveAspectRatio="xMidYMid slice"
      />

      <rect
        x={photoX}
        y={photoY}
        width={sourceWidth}
        height={sourceHeight}
        stroke="#D8D4CC"
        strokeWidth={1}
        fill="none"
      />

      <text
        x={photoX + sourceWidth / 2}
        y={captionTop + handwritingSize}
        fill="#2C2C2C"
        fontSize={handwritingSize}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="400"
        fontStyle="italic"
        letterSpacing="0"
        textAnchor="middle"
      >
        {cameraText}
      </text>

      {lensText && (
        <text
          x={photoX + sourceWidth / 2}
          y={captionTop + handwritingSize + metaSize * 1.6}
          fill="#5A5A5A"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="500"
          letterSpacing="0"
          textAnchor="middle"
        >
          {lensText}
        </text>
      )}

      <text
        x={photoX + sourceWidth / 2}
        y={photoBottom + bottomPadding - smallSize * 1.8}
        fill="#6A6A6A"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="600"
        letterSpacing="0.02em"
        textAnchor="middle"
      >
        {parameterText}
      </text>

      <text
        x={photoX + sourceWidth / 2}
        y={photoBottom + bottomPadding - smallSize * 0.5}
        fill="#8A8A8A"
        fontSize={smallSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="500"
        letterSpacing="0.08em"
        textAnchor="middle"
      >
        {dateText}
      </text>
    </svg>
  );
}
