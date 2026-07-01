declare global {
  interface Window {
    __TREK_CLI__?: {
      App: {
        version: string;
      };
    };
  }
}

export {};
