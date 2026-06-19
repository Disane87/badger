import { listAllHits } from '../utils/db'

export default defineEventHandler(async () => {
  return await listAllHits(200)
})
