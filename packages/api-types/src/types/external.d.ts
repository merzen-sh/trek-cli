export interface OrderProduct {
  id: string;
  name: string;
  thumbnail: string;
}

export interface Order {
  id: string;
  tokenKey: string;
  active: boolean;
  createdAt: string;
  product: OrderProduct;
}

export interface GetOrdersResponse {
  orders: Order[];
}

export interface ScriptManifest {
  fx_version: string;
  games: string[];
  fields: Record<string, string | boolean | string[]>[];
}

export interface Script {
  name: string;
  path: string;
  version: string | null;
  author: string | null;
  description: string | null;
  manifest: ScriptManifest;
}

export interface OrderWithInstallStatus extends Order {
  is_installed: boolean;
}

export interface ExternalPaths {
  "/api/orders": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      responses: {
        200: {
          content: {
            "application/json": GetOrdersResponse;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
