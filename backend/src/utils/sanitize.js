const htmlEntityPattern = /&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi;
const tagPattern = /<[^>]*>/g;
const controlPattern = /[\u0000-\u001F\u007F]/g;

export const sanitizeText = (value) => {
  if (typeof value !== "string") return value;

  return value
    .replace(tagPattern, "")
    .replace(htmlEntityPattern, "")
    .replace(controlPattern, "")
    .trim();
};

export const sanitizedString = (schema) => schema.transform(sanitizeText);
