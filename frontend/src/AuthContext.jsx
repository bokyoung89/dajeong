import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, supabaseUrl } from './supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase 설정이 안되어 있으면 로딩을 바로 끝내고 경고를 표시합니다.
    if (!supabaseUrl) {
      console.warn('Supabase URL이 설정되지 않았습니다. .env 파일을 확인하거나 frontend/src/supabaseClient.js 파일을 수정해주세요.');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { session, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
