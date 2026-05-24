export const ALL_INTERESTS = [
  "coding","tech","web","startup",
  "yoga","wellness","fitness","sports","basketball","running",
  "music","poetry","arts","film","photography",
  "games","strategy","social","discussion",
  "outdoors","volunteering","sustainability",
  "food","coffee","reading","languages","travel",
] as const;

export type Interest = (typeof ALL_INTERESTS)[number];

export function overlapScore(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length;
}

export function sharedInterests(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}
