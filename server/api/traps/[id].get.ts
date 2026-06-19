import { getTrap, listHits } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const trap = await getTrap(id)
  if (!trap) {
    throw createError({ statusCode: 404, statusMessage: 'Trap not found' })
  }
  const hits = await listHits(id)
  return { trap, hits }
})
