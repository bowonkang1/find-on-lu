//sets the MIME types for HEIC files 
const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

function hasHeicMimeType(file: File): boolean {
  if (!file.type) return false;
  return HEIC_MIME_TYPES.has(file.type.toLowerCase());
}

function hasHeicExtension(file: File): boolean {
  const parts = file.name.toLowerCase().split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  return HEIC_EXTENSIONS.has(ext);
}

export function isHeicFile(file: File): boolean {
  return hasHeicMimeType(file) || hasHeicExtension(file);
}

type Heic2AnyConverter = (options: {
  blob: Blob;
  toType: string;
  quality?: number;
}) => Promise<Blob | Blob[]>;

export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2anyModule = await import("heic2any");
  const converter = (heic2anyModule.default || heic2anyModule) as Heic2AnyConverter;

  const converted = await converter({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  return new File([convertedBlob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
