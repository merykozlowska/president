interface DurableObjectState {
  blockConcurrencyWhile(callback: () => Promise<any>): Promise<any>
}
