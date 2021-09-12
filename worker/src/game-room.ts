export class GameRoom {
  state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
    // this.env = env
  }

  async fetch(request: Request) {
    const url = new URL(request.url)
    switch (url.pathname) {
      default:
        return new Response('Not found', { status: 404 })
    }
  }
}
