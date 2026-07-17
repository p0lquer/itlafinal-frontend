import client from "./clients";


export interface ServiceType {
  ID: string
  Name: string
  Description: string
  Created_at: string

}

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
