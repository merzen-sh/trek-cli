export const getConfigSchemaKeys = {
  byScript: (name: string) => ["config", name] as const,
};
