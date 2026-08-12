import client from './clients'
import type { ServiceType } from '../types'

type ApiServiceType = Partial<ServiceType> & {
  ID?: number; Name?: string; Description?: string; BasePrice?: number
  PricePerWeight?: number; PricePerPiece?: number
}

const normalizeServiceType = (value: ApiServiceType): ServiceType => ({
  id: value.id ?? value.ID ?? 0,
  name: value.name ?? value.Name ?? '',
  description: value.description ?? value.Description ?? '',
  base_price: value.base_price ?? value.BasePrice ?? 0,
  price_per_weight: value.price_per_weight ?? value.PricePerWeight ?? 0,
  price_per_piece: value.price_per_piece ?? value.PricePerPiece ?? 0,
  Name: value.name ?? value.Name ?? '',
})

const unwrapList = (data: unknown): ApiServiceType[] => {
  if (Array.isArray(data)) return data as ApiServiceType[]
  if (data && typeof data === 'object') {
    const body = data as { service_types?: ApiServiceType[]; data?: ApiServiceType[]; items?: ApiServiceType[] }
    return body.service_types ?? body.data ?? body.items ?? []
  }
  return []
}

export const getServiceTypes = async (): Promise<ServiceType[]> => {
  const { data } = await client.get('/service-types')
  return unwrapList(data).map(normalizeServiceType)
}

export const createServiceType = async (payload: {
  name: string
  description?: string
  base_price: number
  price_per_weight: number
  price_per_piece: number
}): Promise<ServiceType> => {
  const { data } = await client.post('/service-types', payload)
  const body = data as ApiServiceType & { service_type?: ApiServiceType }
  return normalizeServiceType(body.service_type ?? body)
}
