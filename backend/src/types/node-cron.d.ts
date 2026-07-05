declare module 'node-cron' {
  export function schedule(expression: string, callback: () => void): any;
  const cron: {
    schedule: typeof schedule;
  };
  export default cron;
}
