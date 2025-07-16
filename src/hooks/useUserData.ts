import { useQuery } from '@tanstack/react-query';
import { fetchUserData } from '../lib/users';

export const useUserData = (uid: string) => {
  return useQuery({
    queryKey: ['user', uid],
    queryFn: () => fetchUserData(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  });
};
