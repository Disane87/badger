import { deleteTrap, getTrap } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const trap = await getTrap(id)
  if (!trap) {
    throw createError({ statusCode: 404, statusMessage: 'Trap not found' })
  }
  await deleteTrap(id)
  return { ok: true }
})
