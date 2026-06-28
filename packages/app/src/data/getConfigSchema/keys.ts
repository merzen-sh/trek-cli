export const getConfigSchemaKeys = {
  byScript: (name: string) => ["config-schema", name] as const,
};
