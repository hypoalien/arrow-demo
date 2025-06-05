interface ImageCapture {
  grabFrame(): Promise<ImageBitmap>;
}

interface ImageCaptureConstructor {
  new (videoTrack: MediaStreamTrack): ImageCapture;
}

declare var ImageCapture: ImageCaptureConstructor;
