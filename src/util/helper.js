export const renderImage = (imageData) => {
  if (!imageData) {
    return "/default-avatar.png";
  }

  if (imageData.startsWith("http") || imageData.startsWith("/")) {
    return imageData;
  }

  return `data:image/jp2;base64,${imageData}`;
};
