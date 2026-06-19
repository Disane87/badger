import { getTrap, updateTrap } from '../../utils/db'
import { buildCustomOgData, fetchOgData } from '../../utils/og'
import type { CustomPreview } from '../../utils/types'

/**
 * Edit an existing trap. `type` and `slug` are immutable (the tracking URL must
 * stay stable), so only behaviour/preview fields can change here.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const trap = await getTrap(id)
  if (!trap) {
    throw createError({ statusCode: 404, statusMessage: 'Trap not found' })
  }

  const body = await readBody<{
    name?: string
    target?: string
    note?: string
    title?: string
    description?: string
    image?: string
    siteName?: string
    humanAction?: 'redirect' | 'html'
    bodyHtml?: string
  }>(event)

  const name = (body.name ?? trap.name).trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }
  trap.name = name
  trap.note = body.note?.trim() || undefined

  if (trap.type === 'redirect' || trap.type === 'clone') {
    const target = (body.target ?? trap.target ?? '').trim()
    if (!/^https?:\/\//i.test(target)) {
      throw createError({ statusCode: 400, statusMessage: `${trap.type} traps require a valid http(s) target URL` })
    }
    const targetChanged = target !== trap.target
    trap.target = target
    // Re-clone the preview if a clone trap's target moved.
    if (trap.type === 'clone' && targetChanged) {
      trap.ogData = await fetchOgData(target)
    }
  }

  if (trap.type === 'custom') {
    const custom: CustomPreview = {
      title: body.title?.trim() || undefined,
      description: body.description?.trim() || undefined,
      image: body.image?.trim() || undefined,
      siteName: body.siteName?.trim() || undefined
    }
    if (!custom.title && !custom.description && !custom.image) {
      throw createError({ statusCode: 400, statusMessage: 'custom traps need at least a title, description or image' })
    }
    const humanAction = body.humanAction === 'html' ? 'html' : 'redirect'
    if (humanAction === 'redirect') {
      const target = (body.target ?? trap.target ?? '').trim()
      if (!/^https?:\/\//i.test(target)) {
        throw createError({ statusCode: 400, statusMessage: 'redirect action requires a valid http(s) target URL' })
      }
      trap.target = target
      trap.bodyHtml = undefined
    } else {
      if (!body.bodyHtml?.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'HTML action requires a custom HTML body' })
      }
      trap.target = undefined
      trap.bodyHtml = body.bodyHtml
    }
    trap.custom = custom
    trap.humanAction = humanAction
    trap.ogData = buildCustomOgData(custom, humanAction === 'redirect' ? trap.target : '')
  }

  return await updateTrap(trap)
})
