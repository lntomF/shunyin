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

export function WhiteFooterBrandTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  brandName,
  lensModel,
  parameterLine,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const isPortrait = sourceHeight > sourceWidth * 1.12;
  const footerHeight = Math.max(
    height - sourceHeight,
    clamp(Math.round(isPortrait ? sourceWidth * 0.16 : sourceHeight * 0.12), isPortrait ? 104 : 76, scaledMax(isPortrait ? 210 : 132)),
  );
  const photoHeight = height - footerHeight;
  const paddingX = clamp(Math.round(width * 0.052), 28, scaledMax(74));
  const labelSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.01), 15, scaledMax(40))
    : clamp(Math.round(width * 0.0076), 8, scaledMax(12));
  const brandSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.028), 38, scaledMax(112))
    : clamp(Math.round(width * 0.025), 20, scaledMax(40));
  const metaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.015), 22, scaledMax(62))
    : clamp(Math.round(width * 0.011), 10, scaledMax(17));
  const brandText = truncateText(brandName, maxChars(width * 0.32, brandSize));
  const cameraText = truncateText(cameraTitle, maxChars(width * 0.28, metaSize));
  const lensText = lensModel ? truncateText(lensModel, maxChars(width * 0.28, metaSize)) : null;
  const parameterText = truncateText(parameterLine, maxChars(width * 0.25, metaSize));
  const footerTop = photoHeight;
  const centerY = footerTop + footerHeight * 0.56;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#FFFFFF" />
      <image href={imageHref} x={0} y={0} width={width} height={photoHeight} preserveAspectRatio="none" />
      <rect x={0} y={photoHeight - Math.max(2, layoutScale)} width={width} height={Math.max(2, layoutScale)} fill="#FFFFFF" />
      <rect x={0} y={footerTop} width={width} height={footerHeight} fill="#FFFFFF" />

      <text
        x={paddingX}
        y={footerTop + footerHeight * 0.36}
        fill="#9B9B9B"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0.18em"
      >
        CAMERA
      </text>
      <text
        x={paddingX}
        y={centerY}
        fill="#171717"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
      >
        {cameraText}
      </text>
      {lensText && (
        <text
          x={paddingX}
          y={footerTop + footerHeight * 0.76}
          fill="#666666"
          fontSize={metaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="560"
        >
          {lensText}
        </text>
      )}

      <text
        x={width / 2}
        y={footerTop + footerHeight * 0.64}
        fill="#111111"
        fontSize={brandSize}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="700"
        textAnchor="middle"
      >
        {brandText}
      </text>

      <text
        x={width - paddingX}
        y={footerTop + footerHeight * 0.36}
        fill="#9B9B9B"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0.18em"
        textAnchor="end"
      >
        EXPOSURE
      </text>
      <text
        x={width - paddingX}
        y={centerY}
        fill="#171717"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="780"
        textAnchor="end"
      >
        {parameterText}
      </text>
    </svg>
  );
}
