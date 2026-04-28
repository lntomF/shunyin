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

export function MinimalWhiteFooterTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  brandName,
  captureTimeText,
  parameterLine,
  exifData,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const footerHeight = Math.max(height - sourceHeight, clamp(Math.round(sourceHeight * 0.135), 88, scaledMax(158)));
  const photoHeight = height - footerHeight;
  const paddingX = clamp(Math.round(width * 0.045), 28, scaledMax(64));
  const leftWidth = width * 0.3;
  const centerWidth = width * 0.42;
  const rightWidth = width * 0.22;
  const labelSize = clamp(Math.round(width * 0.0078), 8, scaledMax(12));
  const cameraSize = clamp(Math.round(width * 0.017), 15, scaledMax(27));
  const detailSize = clamp(Math.round(width * 0.0115), 11, scaledMax(18));
  const smallSize = clamp(Math.round(width * 0.009), 9, scaledMax(13));
  const footerTop = photoHeight;
  const labelY = footerTop + footerHeight * 0.32;
  const mainY = footerTop + footerHeight * 0.58;
  const subY = footerTop + footerHeight * 0.78;
  const centerX = width * 0.52;
  const splitGap = clamp(Math.round(width * 0.018), 16, scaledMax(28));
  const cameraText = truncateText(cameraTitle, maxChars(leftWidth, cameraSize));
  const lensText = truncateText(compactValue(exifData.lens) ?? 'Lens unavailable', maxChars(centerWidth * 0.48, detailSize));
  const parameterText = truncateText(parameterLine, maxChars(centerWidth * 0.48, detailSize));
  const captureText = truncateText(captureTimeText, maxChars(rightWidth, smallSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#F6F4EF" />
      <image href={imageHref} x={0} y={0} width={width} height={photoHeight} preserveAspectRatio="none" />
      <rect x={0} y={photoHeight - 1.4} width={width} height={1.4} fill="#111111" fillOpacity="0.16" />
      <rect x={0} y={footerTop} width={width} height={footerHeight} fill="#F8F7F2" />
      <rect x={0} y={footerTop} width={width} height={footerHeight} fill="#FFFFFF" fillOpacity="0.34" />

      <text
        x={paddingX}
        y={labelY}
        fill="#9A948A"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        letterSpacing="0.14em"
      >
        CAMERA
      </text>
      <text
        x={paddingX}
        y={mainY}
        fill="#151515"
        fontSize={cameraSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0"
      >
        {cameraText}
      </text>

      <text
        x={centerX - splitGap}
        y={mainY}
        fill="#2B2925"
        fontSize={detailSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="650"
        letterSpacing="0"
        textAnchor="end"
      >
        {lensText}
      </text>
      <circle cx={centerX} cy={mainY - detailSize * 0.34} r={Math.max(2, detailSize * 0.13)} fill="#C8BFAF" />
      <text
        x={centerX + splitGap}
        y={mainY}
        fill="#121212"
        fontSize={detailSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="720"
        letterSpacing="0"
        textAnchor="start"
      >
        {parameterText}
      </text>
      <text
        x={centerX}
        y={subY}
        fill="#8B857B"
        fontSize={smallSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="520"
        letterSpacing="0.08em"
        textAnchor="middle"
      >
        PHOTOGRAPHIC WATERMARK FRAME
      </text>

      <text
        x={width - paddingX}
        y={labelY}
        fill="#9A948A"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        letterSpacing="0.14em"
        textAnchor="end"
      >
        {brandName}
      </text>
      <text
        x={width - paddingX}
        y={mainY}
        fill="#151515"
        fontSize={smallSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="620"
        letterSpacing="0"
        textAnchor="end"
      >
        {captureText}
      </text>
    </svg>
  );
}
