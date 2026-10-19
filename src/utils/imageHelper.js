export const DEFAULT_PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
];

export const parseImages = (imagesField) => {
  if (!imagesField) return [];
  if (Array.isArray(imagesField)) return imagesField;
  if (typeof imagesField === "string") {
    try {
      const parsed = JSON.parse(imagesField);
      return Array.isArray(parsed) ? parsed : [imagesField];
    } catch (e) {
      return [imagesField];
    }
  }
  return [];
};

export const getImageUrl = (imagePath, propertyId = 0) => {
  const fallback = DEFAULT_PROPERTY_IMAGES[Math.abs(Number(propertyId) || 0) % DEFAULT_PROPERTY_IMAGES.length];
  if (!imagePath || typeof imagePath !== "string") return fallback;
  if (imagePath.startsWith("data:") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = (import.meta.env.VITE_API_URL || "https://upms-backend.onrender.com").replace(/\/api\/?$/, "");
  const clean = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  if (clean.startsWith("storage/")) {
    return `${baseUrl}/${clean}`;
  }
  return `${baseUrl}/storage/${clean}`;
};
