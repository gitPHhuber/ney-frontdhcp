export const formatPassportDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', { hour12: false });
