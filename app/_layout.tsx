import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CarritoProvider } from './context/CarritoContext';
import { FavoritosProvider } from './context/FavoritosContext';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔄 Verificando autenticación...');
        
        // Obtener todos los estados posibles
        const token = await AsyncStorage.getItem('authToken');
        const user = await AsyncStorage.getItem('user');
        const isGuest = await AsyncStorage.getItem('isGuest');
        
        const isAuthenticated = !!(token && user);
        const currentRoute = segments[0];
        
        console.log('📊 Estado:', {
          isGuest,
          isAuthenticated,
          currentRoute,
          segments
        });
        
        // Lógica de control de acceso
        
        // 1. Si es INVITADO
        if (isGuest === 'true') {
          console.log('🎭 Usuario es INVITADO');
          
          // Si está en pantallas de auth (login/register), dejarlo ahí
          if (currentRoute === 'login' || currentRoute === 'register') {
            console.log('👤 Invitado en pantalla de auth - permitir');
            setIsLoading(false);
            return;
          }
          
          // Si está en WelcomeScreen, dejarlo ahí
          if (currentRoute === 'WelcomeScreen') {
            console.log('👤 Invitado en WelcomeScreen - permitir');
            setIsLoading(false);
            return;
          }
          
          // Si ya está en tabs, dejarlo ahí
          if (currentRoute === '(tabs)') {
            console.log('✅ Invitado ya está en tabs');
            setIsLoading(false);
            return;
          }
          
          // Si llega aquí y no está en rutas permitidas, redirigir a explorar
          console.log('➡️ Invitado redirigido a explorar');
          router.replace('/(tabs)/explorar');
          return;
        }
        
        // 2. Si está AUTENTICADO (usuario normal)
        if (isAuthenticated) {
          console.log('🔐 Usuario AUTENTICADO');
          
          // Si está en WelcomeScreen, login o register, redirigir a tabs
          if (currentRoute === 'WelcomeScreen' || currentRoute === 'login' || currentRoute === 'register') {
            console.log('➡️ Usuario autenticado en auth, redirigiendo a tabs');
            router.replace('/(tabs)');
            return;
          }
          
          // Si ya está en tabs, dejarlo ahí
          if (currentRoute === '(tabs)') {
            console.log('✅ Usuario autenticado ya está en tabs');
            setIsLoading(false);
            return;
          }
          
          setIsLoading(false);
          return;
        }
        
        // 3. Si NO está autenticado y NO es invitado
        console.log('👤 Usuario NO autenticado y NO invitado');
        
        // Permitir acceso a rutas públicas
        const publicRoutes = ['WelcomeScreen', 'login', 'register'];
        
        if (currentRoute && !publicRoutes.includes(currentRoute)) {
          console.log('🚫 Acceso no autorizado, redirigiendo a WelcomeScreen');
          router.replace('/WelcomeScreen');
          return;
        }
        
      } catch (error) {
        console.error('❌ Error en checkAuth:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ CheckAuth finalizado');
      }
    };

    // Ejecutar cuando cambien los segments
    checkAuth();
  }, [segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FBF7' }}>
        <ActivityIndicator size="large" color="#5A8F48" />
      </View>
    );
  }

  return (
    <CarritoProvider>
      <FavoritosProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="WelcomeScreen" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          
          {/* Producto detalle */}
          <Stack.Screen name="producto/[id]" />
          
          {/* 🛒 Flujo de compra/pedidos */}
          <Stack.Screen name="checkout" />
          <Stack.Screen name="pedidodetalle" />
          <Stack.Screen name="mispedidos" />
          
          {/* 📱 Pantallas de consumidor */}
          <Stack.Screen name="consumidor/MisPedidos" />
          <Stack.Screen name="consumidor/PedidoDetalle" />
          <Stack.Screen name="consumidor/Factura" />
        </Stack>
      </FavoritosProvider>
    </CarritoProvider>
  );
}