export const releasesKeys = {
  all: ["releases"] as const,
  byTag: (tag: string) => ["releases", "tag", tag] as const,
};
