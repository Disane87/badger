import { getTrap, updateTrap } from '../../../utils/db'
import { fetchOgData } from '../../../utils/og'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const trap = await getTrap(id)
  if (!trap) throw createError({ statusCode: 404, statusMessage: 'Trap not found' })
  if (trap.type !== 'clone' || !trap.target) {
    throw createError({ statusCode: 400, statusMessage: 'Trap is not a clone trap' })
  }
  trap.ogData = await fetchOgData(trap.target)
  await updateTrap(trap)
  return trap
})
