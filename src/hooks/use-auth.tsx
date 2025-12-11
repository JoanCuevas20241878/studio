'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import type { UserProfile } from '@/types';

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user && firestore) {
      setProfileLoading(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          // This case might happen if the user document is not created yet
          // or was deleted. We can create a temporary profile from auth data.
           const tempProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            name: user.displayName || 'New User',
            createdAt: Timestamp.now(),
          };
          setUserProfile(tempProfile);
        }
        setProfileLoading(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setProfileLoading(false);
      });

      return () => unsubscribe();
    } else if (!isUserLoading) {
      // User is not logged in or auth is still loading
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user, isUserLoading, firestore]);

  const loading = isUserLoading || profileLoading;

  return (
    <AuthContext.Provider value={{ userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
