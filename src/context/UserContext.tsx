import React, { createContext, useContext } from 'react';

export interface UserContextType {
  user: any;
  role: string;
}

export const UserContext = createContext<UserContextType>({ user: null, role: '' });

export const useUser = () => useContext(UserContext);
