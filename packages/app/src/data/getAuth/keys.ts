export const authKeys = {
  status: (pin: string) => ["auth", "status", pin] as const,
};
