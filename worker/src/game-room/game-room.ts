interface Session {
  ws: WebSocket;
}

export class GameRoom {
  state: DurableObjectState;
  sessions: Session[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
    // this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/websocket": {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("expected websocket", { status: 400 });
        }

        const { 0: clientWs, 1: serverWs } = new WebSocketPair();

        await this.handleSession(serverWs);

        return new Response(null, { status: 101, webSocket: clientWs });
      }

      default:
        return new Response("Not found", { status: 404 });
    }
  }

  async handleSession(ws: WebSocket): Promise<void> {
    ws.accept();
    const session = { ws };
    this.sessions.push(session);
    ws.addEventListener("message", async (msg) => {
      console.log("GOT MESSAGE 🎉", msg);
      // try {
      //   const data = JSON.parse(msg.data)
      // } catch (e) {}
    });
  }
}
