import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[]; // Nueva prop para roles permitidos
}

export default function AuthGuard({ 
  children, 
  requireAuth = false, 
  allowedRoles = [] // Por defecto vacío (todos los roles permitidos)
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userString = await AsyncStorage.getItem('user');
        const isGuest = await AsyncStorage.getItem('isGuest');
        
        const auth = !!(token && userString);
        setIsAuthenticated(auth);
        
        // Parsear usuario para obtener el rol
        let role = null;
        if (userString) {
          try {
            const user = JSON.parse(userString);
            // EN TU BACKEND EL CAMPO ES 'rol' NO 'role'
            role = user.rol || user.role; // Intenta ambos nombres
            setUserRole(role);
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
        
        console.log('🛡️ AuthGuard - requireAuth:', requireAuth, 'isAuth:', auth, 'Rol:', role, 'isGuest:', isGuest);
        
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
        
        // Verificar rol si se especificaron roles permitidos
        if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
          console.log(`🚫 Rol no permitido: ${role}, redirigiendo...`);
          
          // Redirigir según el rol A RUTAS QUE EXISTEN EN TU APP
          if (role === 'VENDEDOR' || role === 'seller') {
            // Usar ruta que existe: /vendedor/dashboard
            router.replace('/vendedor/dashboard');
          } else {
            // Usar ruta que existe: /(tabs) o /WelcomeScreen
            router.replace('/(tabs)');
          }
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