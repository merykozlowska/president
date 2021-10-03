interface Env {
  rooms: DurableObjectNamespace;
}

export async function handleApiRequest(
  path: string[],
  request: Request,
  env: Env
): Promise<Response> {
  switch (path[0]) {
    case "game": {
      if (!path[1]) {
        if (request.method === "POST") {
          const id = env.rooms.newUniqueId();
          return new Response(JSON.stringify({ id: id.toString() }), {
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        return new Response("Method not allowed", { status: 405 });
      }

      const name = path[1];
      let id;
      if (name.match(/^[0-9a-f]{64}$/)) {
        id = env.rooms.idFromString(name);
      } else if (name.length <= 32) {
        id = env.rooms.idFromName(name);
      } else {
        return new Response("Name too long", { status: 404 });
      }

      const roomObject = env.rooms.get(id);

      const newUrl = new URL(request.url);
      newUrl.pathname = "/" + path.slice(2).join("/");
      return roomObject.fetch(newUrl.toString(), request);
    }

    default:
      return new Response("Not found", { status: 404 });
  }
}
