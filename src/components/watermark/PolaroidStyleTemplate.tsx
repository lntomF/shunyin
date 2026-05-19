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
  return Math.max(8, Math.floor(width / (fontSize * 0.52)));
}

export function PolaroidStyleTemplate({
  width,
  height,
  image,
  imageHref,
  coverTitle,
  cameraTitle,
  parameterLine,
  captureTimeText,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const side = clamp(Math.round(minEdge * 0.06), 34, scaledMax(86));
  const top = clamp(Math.round(minEdge * 0.06), 34, scaledMax(86));
  const bottom = clamp(Math.round(minEdge * 0.22), 126, scaledMax(280));
  const cardWidth = sourceWidth + side * 2;
  const cardHeight = sourceHeight + top + bottom;
  const cardX = (width - cardWidth) / 2;
  const cardY = (height - cardHeight) / 2;
  const photoX = cardX + side;
  const photoY = cardY + top;
  const titleSize = clamp(Math.round(sourceWidth * 0.03), 22, scaledMax(54));
  const metaSize = clamp(Math.round(sourceWidth * 0.013), 11, scaledMax(20));
  const labelSize = clamp(Math.round(sourceWidth * 0.01), 8, scaledMax(15));
  const titleText = truncateText(coverTitle, maxChars(sourceWidth * 0.62, titleSize));
  const metaText = truncateText(`${cameraTitle} / ${parameterLine}`, maxChars(sourceWidth * 0.72, metaSize));
  const dateText = truncateText(captureTimeText, maxChars(sourceWidth * 0.26, labelSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="polaroid-card-shadow" x="-10%" y="-10%" width="120%" height="124%">
          <feDropShadow dx="0" dy={Math.max(10, minEdge * 0.018)} stdDeviation={Math.max(18, minEdge * 0.02)} floodColor="#000000" floodOpacity="0.24" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#D8D1C6" />
      <rect width={width} height={height} fill="#FFFFFF" fillOpacity="0.18" />
      <g filter="url(#polaroid-card-shadow)" transform={`rotate(-1.2 ${width / 2} ${height / 2})`}>
        <rect x={cardX} y={cardY} width={cardWidth} height={cardHeight} rx={Math.max(4, layoutScale * 2)} fill="#FBFAF4" />
        <rect x={photoX - Math.max(1, layoutScale)} y={photoY - Math.max(1, layoutScale)} width={sourceWidth + Math.max(2, layoutScale * 2)} height={sourceHeight + Math.max(2, layoutScale * 2)} fill="#ECE8DE" />
        <image href={imageHref} x={photoX} y={photoY} width={sourceWidth} height={sourceHeight} preserveAspectRatio="none" />

        <text
          x={photoX}
          y={photoY + sourceHeight + bottom * 0.42}
          fill="#22211E"
          fontSize={titleSize}
          fontFamily="'Brush Script MT', 'Segoe Script', cursive"
          fontWeight="500"
        >
          {titleText}
        </text>
        <text
          x={photoX}
          y={photoY + sourceHeight + bottom * 0.68}
          fill="#6E665A"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="620"
        >
          {metaText}
        </text>
        <text
          x={photoX + sourceWidth}
          y={photoY + sourceHeight + bottom * 0.68}
          fill="#9A8F80"
          fontSize={labelSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="760"
          letterSpacing="0.12em"
          textAnchor="end"
        >
          {dateText}
        </text>
      </g>
    </svg>
  );
}
