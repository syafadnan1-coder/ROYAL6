/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.php?raw" {
  const content: string;
  export default content;
}

declare module "*.sql?raw" {
  const content: string;
  export default content;
}

declare module "*.htaccess?raw" {
  const content: string;
  export default content;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
