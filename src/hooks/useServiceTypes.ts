import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServiceTypes, createServiceType } from '../api/service_type'

const KEY = ['service-types']

export function useServiceTypes() {
  return useQuery({
    queryKey: KEY,
    queryFn: getServiceTypes,
  })
}

export function useCreateServiceType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createServiceType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}