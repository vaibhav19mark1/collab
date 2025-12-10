export const generateColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Hue: Allow full range 0-360
  const h = Math.abs(hash % 360);
  // Saturation: Keep it high (65-90%) for vibrant colors
  const s = 65 + (Math.abs(hash) % 25);
  // Lightness: Keep it medium-dark (35-55%) for good contrast with white text
  const l = 35 + (Math.abs(hash) % 20);

  return hslToHex(h, s, l);
};

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
