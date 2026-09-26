interface SocketLike {
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler?: (...args: unknown[]) => void): void;
  connected: boolean;
}

interface Window {
  /** socket.io client served by the SPX server at /js/socket.io.js */
  io?: () => SocketLike;
}
