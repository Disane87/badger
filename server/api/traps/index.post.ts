import { createTrap, getTrapBySlug, newId, updateTrap } from '../../utils/db'
import { buildCustomOgData, fetchOgData } from '../../utils/og'
import type { CustomPreview, TrapType } from '../../utils/types'

const VALID_TYPES: TrapType[] = ['redirect', 'decoy', 'pixel', 'clone', 'custom']

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    type?: TrapType
    target?: string
    note?: string
    slug?: string
    // custom-preview fields
    title?: string
    description?: string
    image?: string
    siteName?: string
    humanAction?: 'redirect' | 'html'
    bodyHtml?: string
  }>(event)

  const name = (body.name || '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  const type: TrapType = VALID_TYPES.includes(body.type as TrapType) ? (body.type as TrapType) : 'pixel'

  if (type === 'redirect' || type === 'clone') {
    if (!body.target || !/^https?:\/\//i.test(body.target)) {
      throw createError({ statusCode: 400, statusMessage: `${type} traps require a valid http(s) target URL` })
    }
  }

  let humanAction: 'redirect' | 'html' | undefined
  let custom: CustomPreview | undefined
  if (type === 'custom') {
    custom = {
      title: body.title?.trim() || undefined,
      description: body.description?.trim() || undefined,
      image: body.image?.trim() || undefined,
      siteName: body.siteName?.trim() || undefined
    }
    if (!custom.title && !custom.description && !custom.image) {
      throw createError({ statusCode: 400, statusMessage: 'custom traps need at least a title, description or image' })
    }
    humanAction = body.humanAction === 'html' ? 'html' : 'redirect'
    if (humanAction === 'redirect' && (!body.target || !/^https?:\/\//i.test(body.target))) {
      throw createError({ statusCode: 400, statusMessage: 'redirect action requires a valid http(s) target URL' })
    }
    if (humanAction === 'html' && !body.bodyHtml?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'HTML action requires a custom HTML body' })
    }
  }

  // Determine a unique slug
  let slug = body.slug ? slugify(body.slug) : slugify(name)
  if (!slug) slug = newId(8).toLowerCase()
  if (await getTrapBySlug(slug)) {
    slug = `${slug}-${newId(4).toLowerCase()}`
  }

  const trap = await createTrap({
    name,
    type,
    slug,
    target: type === 'redirect' || type === 'clone' || (type === 'custom' && humanAction === 'redirect') ? body.target : undefined,
    note: body.note?.trim() || undefined,
    custom: type === 'custom' ? custom : undefined,
    humanAction: type === 'custom' ? humanAction : undefined,
    bodyHtml: type === 'custom' && humanAction === 'html' ? body.bodyHtml : undefined
  })

  // For clone traps, fetch the target's OpenGraph metadata up front (best-effort).
  if (type === 'clone' && body.target) {
    trap.ogData = await fetchOgData(body.target)
    await updateTrap(trap)
  }

  // For custom traps, build the OpenGraph metadata from the authored fields.
  if (type === 'custom' && custom) {
    trap.ogData = buildCustomOgData(custom, humanAction === 'redirect' ? body.target : '')
    await updateTrap(trap)
  }

  return trap
})
