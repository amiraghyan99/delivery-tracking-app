import { wsPeers } from '../utils/wsPeers'

export default defineWebSocketHandler({
  open(peer) {
    wsPeers.add(peer)
  },
  close(peer) {
    wsPeers.delete(peer)
  },
  error(peer) {
    wsPeers.delete(peer)
  }
})
