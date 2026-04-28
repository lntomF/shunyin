import type { WatermarkSvgProps } from './types';
import { getWatermarkLayoutScale } from '../../utils/overlay';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function compactValue(value: string) {
  const trimmed = value.trim();
  return trimmed && trimmed !== '--' ? trimmed : undefined;
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

export function FilmBorderTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  brandName,
  parameterLine,
  exifData,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const sidePadding = Math.max((width - sourceWidth) / 2, clamp(Math.round(minEdge * 0.07), 46, scaledMax(108)));
  const topPadding = clamp(Math.round(minEdge * 0.055), 34, scaledMax(88));
  const bottomPadding = Math.max(height - sourceHeight - topPadding, clamp(Math.round(minEdge * 0.16), 96, scaledMax(210)));
  const photoX = (width - sourceWidth) / 2;
  const photoY = topPadding;
  const photoBottom = photoY + sourceHeight;
  const captionTop = photoBottom + bottomPadding * 0.26;
  const labelSize = clamp(Math.round(sourceWidth * 0.011), 10, scaledMax(16));
  const mainSize = clamp(Math.round(sourceWidth * 0.02), 16, scaledMax(30));
  const metaSize = clamp(Math.round(sourceWidth * 0.014), 12, scaledMax(20));
  const holeCount = clamp(Math.floor(sourceHeight / 120), 5, 11);
  const holeWidth = clamp(Math.round(sidePadding * 0.28), 12, scaledMax(24));
  const holeHeight = clamp(Math.round(sourceHeight * 0.055), 34, scaledMax(58));
  const holeGap = sourceHeight / holeCount;
  const leftHoleX = photoX - sidePadding * 0.62;
  const rightHoleX = photoX + sourceWidth + sidePadding * 0.34;
  const lensText = truncateText(compactValue(exifData.lens) ?? 'Lens unavailable', maxChars(sourceWidth * 0.38, metaSize));
  const cameraText = truncateText(cameraTitle, maxChars(sourceWidth * 0.38, mainSize));
  const parameterText = truncateText(parameterLine, maxChars(sourceWidth * 0.34, metaSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="film-photo-shadow" x="-8%" y="-8%" width="116%" height="124%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#4A3521" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#F1E8D9" />
      <rect x={0} y={0} width={width} height={height} fill="#FFFDF6" fillOpacity="0.5" />

      {Array.from({ length: holeCount }).map((_, index) => {
        const holeY = photoY + index * holeGap + (holeGap - holeHeight) / 2;
        return (
          <g key={index}>
            <rect x={leftHoleX} y={holeY} width={holeWidth} height={holeHeight} rx={holeWidth * 0.28} fill="#D8CCB8" />
            <rect x={rightHoleX} y={holeY} width={holeWidth} height={holeHeight} rx={holeWidth * 0.28} fill="#D8CCB8" />
          </g>
        );
      })}

      <rect x={photoX - 4} y={photoY - 4} width={sourceWidth + 8} height={sourceHeight + 8} fill="#12100D" filter="url(#film-photo-shadow)" />
      <image href={imageHref} x={photoX} y={photoY} width={sourceWidth} height={sourceHeight} preserveAspectRatio="none" />
      <rect x={photoX} y={photoY} width={sourceWidth} height={sourceHeight} stroke="#221A12" strokeOpacity="0.24" strokeWidth={2} />

      <text
        x={photoX}
        y={captionTop}
        fill="#8F7F67"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0.18em"
      >
        COLOR NEGATIVE / FRAME 01
      </text>
      <text
        x={photoX}
        y={captionTop + mainSize * 1.35}
        fill="#1C1711"
        fontSize={mainSize}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="0"
      >
        {cameraText}
      </text>
      <text
        x={photoX}
        y={captionTop + mainSize * 1.35 + metaSize * 1.45}
        fill="#5F5548"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="620"
        letterSpacing="0"
      >
        {lensText}
      </text>

      <text
        x={photoX + sourceWidth}
        y={captionTop + mainSize * 1.35}
        fill="#1C1711"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0"
        textAnchor="end"
      >
        {parameterText}
      </text>
      <text
        x={photoX + sourceWidth}
        y={captionTop + mainSize * 1.35 + metaSize * 1.45}
        fill="#8F7F67"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0.16em"
        textAnchor="end"
      >
        {brandName} FILM STOCK
      </text>
    </svg>
  );
}
