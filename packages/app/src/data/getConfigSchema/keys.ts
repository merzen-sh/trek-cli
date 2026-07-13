export const getConfigSchemaKeys = {
  byScript: (name: string, configType: string = "server") => ["config-schema", name, configType] as const,
};
