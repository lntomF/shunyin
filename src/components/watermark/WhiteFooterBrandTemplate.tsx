import type { WatermarkSvgProps } from './types';
import { getWatermarkLayoutScale } from '../../utils/overlay';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function WhiteFooterBrandTemplate({
  width,
  height,
  image,
  imageHref,
  cameraTitle,
  brandLabel,
  captureTimeText,
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
  const paddingX = clamp(Math.round(width * 0.04), 22, scaledMax(52));
  const topLineY = photoHeight - 1.5;
  const dividerOneX = width * 0.315;
  const dividerTwoX = width * 0.735;
  const dividerTop = photoHeight + footerHeight * 0.24;
  const dividerHeight = footerHeight * 0.52;
  const brandFontSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.04), 66, scaledMax(170))
    : clamp(Math.round(width * 0.048), 34, scaledMax(72));
  const leftTitleSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.017), 28, scaledMax(72))
    : clamp(Math.round(width * 0.014), 13, scaledMax(22));
  const leftMetaSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.012), 20, scaledMax(50))
    : clamp(Math.round(width * 0.0088), 9, scaledMax(13));
  const rightMainSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.014), 24, scaledMax(60))
    : clamp(Math.round(width * 0.012), 12, scaledMax(19));
  const rightSubSize = isPortrait
    ? clamp(Math.round(sourceHeight * 0.011), 18, scaledMax(46))
    : clamp(Math.round(width * 0.0085), 8, scaledMax(12));
  const leftBlockY = photoHeight + footerHeight * 0.4;
  const brandY = photoHeight + footerHeight * 0.58;
  const rightBlockY = photoHeight + footerHeight * 0.4;
  const leftMetaY = leftBlockY + leftMetaSize + clamp(Math.round(footerHeight * 0.1), 7, scaledMax(12));
  const rightSubY = rightBlockY + rightSubSize + clamp(Math.round(footerHeight * 0.1), 7, scaledMax(12));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#080808" />
      <image href={imageHref} x={0} y={0} width={width} height={photoHeight} preserveAspectRatio="none" />
      <rect x={0} y={photoHeight} width={width} height={footerHeight} fill="#F7F6F2" />
      <rect x={0} y={topLineY} width={width} height={1.5} fill="#111111" fillOpacity="0.22" />
      <rect x={dividerOneX} y={dividerTop} width={1.2} height={dividerHeight} fill="#D9D4CB" />
      <rect x={dividerTwoX} y={dividerTop} width={1.2} height={dividerHeight} fill="#D9D4CB" />

      <text
        x={paddingX}
        y={leftBlockY}
        fill="#181818"
        fontSize={leftTitleSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
      >
        {cameraTitle}
      </text>
      {lensModel && (
        <text
          x={paddingX}
          y={leftMetaY}
          fill="#8B8B8B"
          fontSize={leftMetaSize}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="500"
        >
          {lensModel}
        </text>
      )}

      <text
        x={width * 0.53}
        y={brandY}
        fill="#CF1010"
        fontSize={brandFontSize}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="-0.03em"
        textAnchor="middle"
      >
        {brandLabel}
      </text>

      <text
        x={width - paddingX}
        y={rightBlockY}
        fill="#181818"
        fontSize={rightMainSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        letterSpacing="0.01em"
        textAnchor="end"
      >
        {parameterLine}
      </text>
      <text
        x={width - paddingX}
        y={rightSubY}
        fill="#8B8B8B"
        fontSize={rightSubSize}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="500"
        textAnchor="end"
      >
        {captureTimeText}
      </text>
    </svg>
  );
}
