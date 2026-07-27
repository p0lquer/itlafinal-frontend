import client from "./clients";
import type { ServiceType } from "../types";


export const getServiceTypes = async (): Promise<ServiceType[]> => {
  const { data } = await client.get<ServiceType[]>('/service-types')
  return data
}

export const createServiceType = async (payload: {
    name: string
    description?: string
}): Promise<ServiceType> => {
  const { data } = await client.post<ServiceType>('/service-types', payload)
  return data
}
