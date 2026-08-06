import client from "./clients";
import type { ServiceType } from "../types";


export const getServiceTypes = async (): Promise<ServiceType[]> => {
  const { data } = await client.get<ServiceType[]>('/service-types')
  return data
}

export const createServiceType = async (payload: {
    Name: string
    Description?: string
    BasePrice: number
    PricePerWeight: number
    PricePerPiece: number
}): Promise<ServiceType> => {
  const { data } = await client.post<ServiceType>('/service-types', payload)
  return data
}
