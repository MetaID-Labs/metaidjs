declare interface Window {
  metaidwallet?: any;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare interface ObjTypes<T> {
  [key: string]: T;
  [key: number]: T;
}

declare var __env__: string;
