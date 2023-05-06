declare global {
  interface Window {}
}

declare module '*.json' {
  const value: any
  export default value
}
