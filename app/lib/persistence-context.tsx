'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PersistenceCtx {
  lastSync: string | null;
  isRecovering: boolean;
  errorDetail: string | null;
  backupData: (key: string, data: any) => void;
  getBackup: (key: string) => any | null;
  setError: (msg: string | null) => void;
  setRecovering: (val: boolean) => void;
}

const Ctx = createContext<PersistenceCtx | null>(null);

export function PersistenceProvider({ children }: { children: React.ReactNode }) {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    setLastSync(localStorage.getItem('gbms_last_sync'));
  }, []);

  const backupData = (key: string, data: any) => {
    if (!data) return;
    localStorage.setItem(`gbms_backup_${key}`, JSON.stringify(data));
    const now = new Date().toISOString();
    localStorage.setItem('gbms_last_sync', now);
    setLastSync(now);
  };

  const getBackup = (key: string) => {
    const raw = localStorage.getItem(`gbms_backup_${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  return (
    <Ctx.Provider value={{ 
      lastSync, 
      isRecovering, 
      errorDetail, 
      backupData, 
      getBackup, 
      setError: setErrorDetail,
      setRecovering: setIsRecovering
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePersistence() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePersistence must be used within PersistenceProvider");
  return c;
}
