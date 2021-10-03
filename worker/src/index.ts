import { handleApiRequest } from "./api/handler";

export { GameRoom } from "./game-room/game-room";

interface Env {
  rooms: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.slice(1).split("/");

  switch (path[0]) {
    case "api":
      return handleApiRequest(path.slice(1), request, env);
    default:
      return new Response(null, { status: 404 });
  }
}
