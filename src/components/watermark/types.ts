import type { ExifData, WorkspaceImage } from '../../types/app';

export interface WatermarkSvgProps {
  width: number;
  height: number;
  image: WorkspaceImage;
  imageHref: string;
  exifData: ExifData;
  styleTitle: string;
  brandName: string;
  captureTimeText: string;
  cameraTitle: string;
  brandLabel: string;
  parameterLine: string;
}
