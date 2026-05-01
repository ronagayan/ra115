import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TOKENS } from '../config';

export default function useUser(userProp) {
  const location = useLocation();

  return useMemo(() => {
    if (userProp) return userProp;
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token === TOKENS.her) return 'her';
    if (token === TOKENS.him) return 'him';
    return null;
  }, [location.search, userProp]);
}
