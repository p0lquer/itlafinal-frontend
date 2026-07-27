import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServiceTypes, createServiceType } from '../api/service_type'

const KEY = ['service-types']

export const  useServiceTypes = () => {
  return useQuery({
    queryKey: KEY,
    queryFn: getServiceTypes,
  })
}

export const useCreateServiceType = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createServiceType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}


export default { useServiceTypes,
  useCreateServiceType,
}
