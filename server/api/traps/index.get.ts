import { listTraps } from '../../utils/db'

export default defineEventHandler(async () => {
  return await listTraps()
})
