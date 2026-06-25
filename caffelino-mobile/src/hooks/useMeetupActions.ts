import { useCallback, useState } from 'react';

export function useMeetupActions() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const openCreate = useCallback(() => setShowCreate(true), []);
  const openJoin = useCallback(() => setShowJoin(true), []);
  const closeCreate = useCallback(() => setShowCreate(false), []);
  const closeJoin = useCallback(() => setShowJoin(false), []);

  return {
    showCreate,
    showJoin,
    openCreate,
    openJoin,
    closeCreate,
    closeJoin,
  };
}
