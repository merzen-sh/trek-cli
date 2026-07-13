export const getConfigKeys = {
  byScript: (name: string, configType: string = "server") => ["config", name, configType] as const,
};
