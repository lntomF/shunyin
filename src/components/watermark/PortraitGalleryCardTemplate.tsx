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

export function PortraitGalleryCardTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  brandName,
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
  const sidePadding = Math.max((width - sourceWidth) / 2, clamp(Math.round(minEdge * 0.12), 44, scaledMax(140)));
  const topPadding = clamp(Math.round(minEdge * 0.08), 28, scaledMax(96));
  const footerHeight = Math.max(
    height - sourceHeight - topPadding,
    clamp(Math.round(minEdge * (isPortrait ? 0.24 : 0.22)), isPortrait ? 132 : 118, scaledMax(isPortrait ? 270 : 240)),
  );
  const photoX = (width - sourceWidth) / 2;
  const photoY = topPadding;
  const titleSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.023), 34, scaledMax(88))
    : clamp(Math.round(sourceWidth * 0.019), 16, scaledMax(30));
  const metaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.015), 22, scaledMax(58))
    : clamp(Math.round(sourceWidth * 0.012), 10, scaledMax(18));
  const labelSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.011), 16, scaledMax(44))
    : clamp(Math.round(sourceWidth * 0.009), 8, scaledMax(13));
  const footerTop = photoY + sourceHeight;
  const cameraText = truncateText(cameraTitle, maxChars(sourceWidth * 0.68, titleSize));
  const metaText = truncateText(lensModel ? `${lensModel} / ${parameterLine}` : parameterLine, maxChars(sourceWidth * 0.78, metaSize));
  const dateText = truncateText(captureTimeText, maxChars(sourceWidth * 0.32, labelSize));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="gallery-bg-blur" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation={Math.max(14, minEdge * 0.025)} />
        </filter>
        <filter id="gallery-photo-shadow" x="-8%" y="-8%" width="116%" height="122%">
          <feDropShadow dx="0" dy={Math.max(12, minEdge * 0.018)} stdDeviation={Math.max(16, minEdge * 0.018)} floodColor="#000000" floodOpacity="0.32" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#151515" />
      <image href={imageHref} x={-sidePadding} y={-topPadding} width={width + sidePadding * 2} height={height + topPadding * 2} preserveAspectRatio="xMidYMid slice" filter="url(#gallery-bg-blur)" opacity="0.48" />
      <rect width={width} height={height} fill="#F6F0E6" fillOpacity="0.86" />
      <rect x={sidePadding * 0.5} y={topPadding * 0.5} width={width - sidePadding} height={height - topPadding} rx={Math.max(12, minEdge * 0.012)} stroke="#FFFFFF" strokeOpacity="0.42" strokeWidth={Math.max(1, layoutScale)} />

      <g filter="url(#gallery-photo-shadow)">
        <rect x={photoX - 1} y={photoY - 1} width={sourceWidth + 2} height={sourceHeight + 2} fill="#FFFFFF" />
        <image href={imageHref} x={photoX} y={photoY} width={sourceWidth} height={sourceHeight} preserveAspectRatio="none" />
      </g>

      <text
        x={width / 2}
        y={footerTop + footerHeight * 0.34}
        fill="#1D1B18"
        fontSize={titleSize}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="700"
        textAnchor="middle"
      >
        {cameraText}
      </text>
      <text
        x={width / 2}
        y={footerTop + footerHeight * 0.58}
        fill="#5C554B"
        fontSize={metaSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="640"
        letterSpacing="0"
        textAnchor="middle"
      >
        {metaText}
      </text>
      <text
        x={photoX}
        y={footerTop + footerHeight * 0.82}
        fill="#8E8373"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="760"
        letterSpacing="0.16em"
      >
        {brandName} GALLERY
      </text>
      <text
        x={photoX + sourceWidth}
        y={footerTop + footerHeight * 0.82}
        fill="#8E8373"
        fontSize={labelSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="680"
        letterSpacing="0.08em"
        textAnchor="end"
      >
        {dateText}
      </text>
    </svg>
  );
}
