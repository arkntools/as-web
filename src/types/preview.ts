export enum PreviewType {
  None,
  Text,
  Image,
  ImageList,
  Spine,
  Audio,
}

export interface PreviewImageListDetailItem {
  key: string;
  name: string;
}

export interface PreviewImageListDetail {
  type: PreviewType.ImageList;
  detail: PreviewImageListDetailItem[];
}

export type PreviewDetail = { type: Exclude<PreviewType, PreviewType.ImageList> } | PreviewImageListDetail;
