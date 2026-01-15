import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const user = await AsyncStorage.getItem('user');
        const isGuest = await AsyncStorage.getItem('isGuest');
        
        const auth = !!(token && user);
        setIsAuthenticated(auth);
        
        console.log('🛡️ AuthGuard - requireAuth:', requireAuth, 'isAuth:', auth, 'isGuest:', isGuest);
        
        // Si es invitado, permitir acceso siempre
        if (isGuest === 'true') {
          console.log('👋 Usuario invitado permitido');
          setIsLoading(false);
          return;
        }
        
        // Si requiere autenticación pero no está autenticado
        if (requireAuth && !auth) {
          console.log('🔒 Acceso denegado, redirigiendo a WelcomeScreen');
          router.replace('/WelcomeScreen');
          return;
        }
        
      } catch (error) {
        console.error('Error en AuthGuard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5A8F48" />
      </View>
    );
  }

  return <>{children}</>;
}