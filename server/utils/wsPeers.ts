import type { Peer } from 'crossws'

// Module-level singleton — shared across all Nitro request handlers in the same process
export const wsPeers = new Set<Peer>()

export function broadcast(message: object) {
  const data = JSON.stringify(message)
  for (const peer of wsPeers) {
    peer.send(data)
  }
}
