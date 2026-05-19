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

export function MinimalBlackFrameTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  brandName,
  parameterLine,
  captureTimeText,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const frame = clamp(Math.round(minEdge * 0.052), 28, scaledMax(84));
  const footer = clamp(Math.round(minEdge * 0.11), 74, scaledMax(160));
  const canvasWidth = sourceWidth + frame * 2;
  const canvasHeight = sourceHeight + frame + footer;
  const photoX = (width - sourceWidth) / 2;
  const photoY = frame;
  const labelSize = clamp(Math.round(sourceWidth * 0.0095), 8, scaledMax(14));
  const metaSize = clamp(Math.round(sourceWidth * 0.013), 11, scaledMax(20));
  const brandSize = clamp(Math.round(sourceWidth * 0.023), 18, scaledMax(36));
  const cameraText = truncateText(cameraTitle, maxChars(sourceWidth * 0.35, metaSize));
  const parameterText = truncateText(parameterLine, maxChars(sourceWidth * 0.32, metaSize));
  const dateText = truncateText(captureTimeText, maxChars(sourceWidth * 0.28, labelSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#080808" />
      <rect x={(width - canvasWidth) / 2} y={(height - canvasHeight) / 2} width={canvasWidth} height={canvasHeight} fill="#0C0C0C" />
      <image href={imageHref} x={photoX} y={photoY} width={sourceWidth} height={sourceHeight} preserveAspectRatio="none" />
      <rect x={photoX} y={photoY} width={sourceWidth} height={sourceHeight} stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth={Math.max(1, layoutScale)} />

      <text
        x={photoX}
        y={photoY + sourceHeight + footer * 0.36}
        fill="#8D8D8D"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="780"
        letterSpacing="0.18em"
      >
        {dateText}
      </text>
      <text
        x={photoX}
        y={photoY + sourceHeight + footer * 0.64}
        fill="#F2F2F2"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="680"
      >
        {cameraText}
      </text>

      <text
        x={width / 2}
        y={photoY + sourceHeight + footer * 0.62}
        fill="#FFFFFF"
        fontSize={brandSize}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="700"
        textAnchor="middle"
      >
        {truncateText(brandName, maxChars(sourceWidth * 0.3, brandSize))}
      </text>

      <text
        x={photoX + sourceWidth}
        y={photoY + sourceHeight + footer * 0.64}
        fill="#F2F2F2"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        textAnchor="end"
      >
        {parameterText}
      </text>
    </svg>
  );
}
