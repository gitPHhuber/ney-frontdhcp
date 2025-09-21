export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', { hour12: false });
