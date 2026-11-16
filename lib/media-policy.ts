export const postMediaLimits = {
  service: 3,
  offer: 3,
  arrival: 3,
  update: 2,
  event: 5,
  portfolio: 5,
} as const;
export function smallPhoto(src: string) {
  return src.replace(/\.webp$/, "-small.webp");
}
