import type { WatermarkSvgProps } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function PortraitGalleryCardTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  parameterLine,
}: WatermarkSvgProps) {
  const sourceWidth = Math.max(image.width ?? width, 1);
  const sourceHeight = Math.max(image.height ?? height, 1);
  const minEdge = Math.min(sourceWidth, sourceHeight);
  const sidePadding = clamp(Math.round(minEdge * 0.12), 44, 140);
  const topPadding = clamp(Math.round(minEdge * 0.08), 28, 96);
  const footerHeight = Math.max(height - sourceHeight - topPadding, clamp(Math.round(minEdge * 0.2), 110, 220));
  const imageX = (width - sourceWidth) / 2;
  const imageY = topPadding;
  const imageBottom = imageY + sourceHeight;
  const imageRadius = clamp(Math.round(minEdge * 0.055), 24, 40);
  const titleFontSize = clamp(Math.round(sourceWidth * 0.064), 34, 54);
  const parameterFontSize = clamp(Math.round(sourceWidth * 0.031), 18, 28);
  const titleGap = clamp(Math.round(footerHeight * 0.2), 18, 36);
  const parameterGap = clamp(Math.round(footerHeight * 0.08), 6, 14);
  const titleY = imageBottom + titleGap + titleFontSize * 0.72;
  const parameterY = titleY + parameterGap + parameterFontSize;
  const backgroundBlurStd = Math.max(width, height) * 0.036;
  const glowBlurStd = Math.max(width, height) * 0.022;
  const clipId = `portrait-gallery-photo-${Math.round(width)}-${Math.round(height)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="portrait-scene-bg" x1={0} y1={0} x2={width} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#0C0B0A" />
          <stop offset="1" stopColor="#090807" />
        </linearGradient>
        <linearGradient id="portrait-dark-vignette" x1={width / 2} y1={0} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#050505" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#050505" stopOpacity="0.26" />
          <stop offset="1" stopColor="#050505" stopOpacity="0.54" />
        </linearGradient>
        <linearGradient id="portrait-footer-fade" x1={width / 2} y1={imageBottom - footerHeight * 0.08} x2={width / 2} y2={height} gradientUnits="userSpaceOnUse">
          <stop stopColor="#090807" stopOpacity="0.08" />
          <stop offset="1" stopColor="#090807" stopOpacity="0.86" />
        </linearGradient>
        <radialGradient id="portrait-soft-warm" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${width * 0.5} ${height * 0.78}) rotate(90) scale(${footerHeight * 1.2} ${width * 0.55})`}>
          <stop stopColor="#7A5640" stopOpacity="0.1" />
          <stop offset="1" stopColor="#7A5640" stopOpacity="0" />
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
        opacity="0.38"
        filter="url(#portrait-bg-blur)"
      />
      <image
        href={imageHref}
        x={-sidePadding * 0.5}
        y={-topPadding * 0.35}
        width={width + sidePadding}
        height={height + topPadding * 0.7}
        preserveAspectRatio="xMidYMid slice"
        opacity="0.18"
        filter="url(#portrait-bg-glow)"
      />
      <rect width={width} height={height} fill="#070707" fillOpacity="0.34" />
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
          letterSpacing="0.01em"
          textAnchor="middle"
        >
          {cameraTitle}
        </text>
        <text
          x={width / 2}
          y={parameterY}
          fill="#E8DACC"
          fontSize={parameterFontSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="600"
          letterSpacing="0.02em"
          textAnchor="middle"
        >
          {parameterLine}
        </text>
      </g>
    </svg>
  );
}
