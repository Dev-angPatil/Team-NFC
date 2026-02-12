const env = import.meta.env as unknown as Record<string, string | undefined>

function parseAppId(rawValue: string | undefined, key: string): number | null {
  if (!rawValue) {
    return null
  }

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }

  return value
}

export function getIdentityAppId(): number | null {
  return parseAppId(env.VITE_IDENTITY_APP_ID, 'VITE_IDENTITY_APP_ID')
}

export function getPermissionAppId(): number | null {
  return parseAppId(env.VITE_PERMISSION_APP_ID, 'VITE_PERMISSION_APP_ID')
}

export function getDefaultEventAssetId(): number | null {
  return parseAppId(env.VITE_DEFAULT_EVENT_ASSET_ID, 'VITE_DEFAULT_EVENT_ASSET_ID')
}
