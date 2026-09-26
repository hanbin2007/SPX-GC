import { useEffect, useState } from 'react';
import { fetchSession } from '@/api/client';

export function useSession() {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => { fetchSession().then(setUser); }, []);
  return user;
}
