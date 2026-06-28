export const getScriptsKeys = {
  all: ["scripts"] as const,
  byName: (name: string) => ["scripts", name] as const,
};
