export { CounterTs } from './counter'

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await handleRequest(request, env)
    } catch (e: any) {
      return new Response(e.message)
    }
  },
}

async function handleRequest(request: Request, env: Env) {
  const id = env.COUNTER.idFromName('A')
  const obj = env.COUNTER.get(id)
  const resp = await obj.fetch(request.url)
  const count = parseInt(await resp.text())
  const wasOdd = count % 2 ? 'is odd' : 'is even'

  return new Response(`${count} ${wasOdd}`)
}

interface Env {
  COUNTER: DurableObjectNamespace
}
