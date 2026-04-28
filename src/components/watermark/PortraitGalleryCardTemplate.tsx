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

export function PortraitGalleryCardTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  lensModel,
  parameterLine,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);
  const scaledMax = (value: number) => Math.round(value * layoutScale);
  const isPortrait = sourceHeight > sourceWidth * 1.12;
  const sidePadding = clamp(Math.round(minEdge * 0.12), 44, scaledMax(140));
  const topPadding = clamp(Math.round(minEdge * 0.08), 28, scaledMax(96));
  const footerHeight = Math.max(
    height - sourceHeight - topPadding,
    clamp(Math.round(minEdge * (isPortrait ? 0.24 : 0.22)), isPortrait ? 132 : 118, scaledMax(isPortrait ? 270 : 240)),
  );
  const imageX = (width - sourceWidth) / 2;
  const imageY = topPadding;
  const imageBottom = imageY + sourceHeight;
  const imageRadius = clamp(Math.round(minEdge * 0.055), 24, scaledMax(40));
  const titleFontSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.045), 72, scaledMax(190))
    : clamp(Math.round(sourceWidth * 0.054), 30, scaledMax(50));
  const parameterFontSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.022), 34, scaledMax(92))
    : clamp(Math.round(sourceWidth * 0.026), 16, scaledMax(24));
  const lensFontSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.018), 30, scaledMax(76))
    : clamp(Math.round(sourceWidth * 0.021), 14, scaledMax(22));
  const titleGap = clamp(Math.round(footerHeight * 0.16), 16, scaledMax(30));
  const rowGap = clamp(Math.round(footerHeight * 0.14), 14, scaledMax(26));
  const rowCenterGap = clamp(Math.round(sourceWidth * 0.026), 18, scaledMax(34));
  const titleY = imageBottom + titleGap + titleFontSize * 0.72;
  const infoRowY = titleY + rowGap + parameterFontSize;
  const backgroundBlurStd = Math.max(width, height) * 0.036;
  const glowBlurStd = Math.max(width, height) * 0.03;
  const clipId = `portrait-gallery-photo-${Math.round(width)}-${Math.round(height)}`;
  const lensText = lensModel ? truncateText(lensModel, Math.max(18, Math.floor(sourceWidth * 0.36 / (lensFontSize * 0.55)))) : null;
  const parameterText = truncateText(parameterLine, Math.max(18, Math.floor(sourceWidth * 0.36 / (parameterFontSize * 0.55))));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="portrait-scene-bg" x1={0} y1={0} x2={width} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#18110E" />
          <stop offset="0.46" stopColor="#101522" />
          <stop offset="1" stopColor="#080708" />
        </linearGradient>
        <linearGradient id="portrait-dark-vignette" x1={width / 2} y1={0} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#030303" stopOpacity="0.02" />
          <stop offset="0.52" stopColor="#030303" stopOpacity="0.08" />
          <stop offset="1" stopColor="#030303" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="portrait-footer-fade" x1={width / 2} y1={imageBottom - footerHeight * 0.08} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#070605" stopOpacity="0.02" />
          <stop offset="0.52" stopColor="#080706" stopOpacity="0.38" />
          <stop offset="1" stopColor="#070605" stopOpacity="0.72" />
        </linearGradient>
        <radialGradient id="portrait-soft-warm" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${width * 0.5} ${height * 0.78}) rotate(90) scale(${footerHeight * 1.2} ${width * 0.55})`}>
          <stop stopColor="#D08A5C" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7A5640" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="portrait-soft-cool" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${width * 0.2} ${height * 0.18}) rotate(52) scale(${width * 0.55} ${height * 0.46})`}>
          <stop stopColor="#8BB7FF" stopOpacity="0.24" />
          <stop offset="1" stopColor="#8BB7FF" stopOpacity="0" />
        </radialGradient>
        <filter id="portrait-bg-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={backgroundBlurStd} />
        </filter>
        <filter id="portrait-bg-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={glowBlurStd} />
        </filter>
        <filter id="portrait-photo-shadow" x="-14%" y="-10%" width="128%" height="136%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000000" floodOpacity="0.34" />
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.16" />
        </filter>
        <filter id="portrait-text-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#000000" floodOpacity="0.45" />
        </filter>
        <clipPath id={clipId}>
          <rect x={imageX} y={imageY} width={sourceWidth} height={sourceHeight} rx={imageRadius} />
        </clipPath>
      </defs>

      <rect width={width} height={height} fill="url(#portrait-scene-bg)" />
      <image
        href={imageHref}
        x={-sidePadding}
        y={-topPadding}
        width={width + sidePadding * 2}
        height={height + topPadding * 2}
        preserveAspectRatio="xMidYMid slice"
        opacity="0.92"
        filter="url(#portrait-bg-blur)"
      />
      <image
        href={imageHref}
        x={-sidePadding * 0.5}
        y={-topPadding * 0.35}
        width={width + sidePadding}
        height={height + topPadding * 0.7}
        preserveAspectRatio="xMidYMid slice"
        opacity="0.48"
        filter="url(#portrait-bg-glow)"
      />
      <rect width={width} height={height} fill="#070707" fillOpacity="0.06" />
      <rect width={width} height={height} fill="url(#portrait-soft-cool)" />
      <rect width={width} height={height} fill="url(#portrait-dark-vignette)" />
      <rect x={0} y={imageBottom - footerHeight * 0.12} width={width} height={footerHeight * 1.12} fill="url(#portrait-footer-fade)" />
      <rect x={0} y={imageBottom - footerHeight * 0.08} width={width} height={footerHeight * 0.95} fill="url(#portrait-soft-warm)" />

      <g filter="url(#portrait-photo-shadow)">
        <image
          href={imageHref}
          x={imageX}
          y={imageY}
          width={sourceWidth}
          height={sourceHeight}
          preserveAspectRatio="none"
          clipPath={`url(#${clipId})`}
        />
      </g>
      <rect x={imageX} y={imageY} width={sourceWidth} height={sourceHeight} rx={imageRadius} stroke="#F5EBDD" strokeOpacity="0.08" />

      <g filter="url(#portrait-text-shadow)">
        <text
          x={width / 2}
          y={titleY}
          fill="#F6EEE6"
          fontSize={titleFontSize}
          fontFamily="Georgia, Times New Roman, serif"
          fontStyle="italic"
          fontWeight="700"
          letterSpacing="0"
          textAnchor="middle"
        >
          {cameraTitle}
        </text>
        {lensText && (
          <text
            x={width / 2 - rowCenterGap}
            y={infoRowY}
            fill="#E8DACC"
            fontSize={parameterFontSize}
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="600"
            letterSpacing="0"
            textAnchor="end"
          >
            {lensText}
          </text>
        )}
        {lensText && <circle cx={width / 2} cy={infoRowY - parameterFontSize * 0.34} r={Math.max(2, parameterFontSize * 0.11)} fill="#F6EEE6" fillOpacity="0.34" />}
        <text
          x={lensText ? width / 2 + rowCenterGap : width / 2}
          y={infoRowY}
          fill="#FFF6ED"
          fontSize={parameterFontSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="650"
          letterSpacing="0"
          textAnchor={lensText ? 'start' : 'middle'}
        >
          {parameterText}
        </text>
      </g>
    </svg>
  );
}
