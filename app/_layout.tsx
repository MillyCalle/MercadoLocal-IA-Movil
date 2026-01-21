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
        const rol = await AsyncStorage.getItem('rol');
        
        const isAuthenticated = !!(token && user);
        const currentRoute = segments[0];
        const subRoute = segments[1]; // Obtener subruta
        
        console.log('📊 Estado:', {
          isGuest,
          isAuthenticated,
          currentRoute,
          subRoute,
          segments,
          rol
        });
        
        // 🎭 1. Si es INVITADO
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
          
          // Si está en rutas de vendedor, no permitir
          if (currentRoute === 'vendedor') {
            console.log('🚫 Invitado intentando acceder a vendedor');
            router.replace('/WelcomeScreen');
            return;
          }
          
          // Si llega aquí y no está en rutas permitidas, redirigir a explorar
          console.log('➡️ Invitado redirigido a explorar');
          router.replace('/(tabs)/explorar');
          return;
        }
        
        // 🔐 2. Si está AUTENTICADO
        if (isAuthenticated) {
          console.log(`🔐 Usuario AUTENTICADO como ${rol || 'sin rol'}`);
          
          // 📦 2.1 Si es VENDEDOR
          if (rol === 'VENDEDOR') {
            console.log('👨‍🌾 Usuario es VENDEDOR');
            
            // EXCEPCIÓN: Si está intentando acceder al perfil del vendedor, permitirlo
            if (currentRoute === 'vendedor' && subRoute === 'mi-perfil') {
              console.log('✅ Vendedor accediendo a su perfil - PERMITIR');
              setIsLoading(false);
              return;
            }
            
            // Si está en rutas de consumidor, redirigir a vendedor
            if (currentRoute === '(tabs)' || currentRoute === 'consumidor') {
              console.log('➡️ Vendedor en rutas de consumidor, redirigiendo a dashboard vendedor');
              router.replace('/vendedor/dashboard');
              return;
            }
            
            // Si está en rutas públicas de auth, redirigir a vendedor
            if (currentRoute === 'WelcomeScreen' || currentRoute === 'login' || currentRoute === 'register') {
              console.log('➡️ Vendedor en auth, redirigiendo a dashboard vendedor');
              router.replace('/vendedor/dashboard');
              return;
            }
            
            // Si ya está en rutas de vendedor, permitir
            if (currentRoute === 'vendedor') {
              console.log('✅ Vendedor ya está en rutas vendedor');
              setIsLoading(false);
              return;
            }
            
            // Si llega aquí, redirigir a dashboard vendedor
            console.log('➡️ Vendedor redirigido a dashboard');
            router.replace('/vendedor/dashboard');
            return;
          }
          
          // 🛒 2.2 Si es CONSUMIDOR o cualquier otro rol (excepto VENDEDOR)
          console.log('🛒 Usuario es CONSUMIDOR o similar');
          
          // Si está en rutas de vendedor, redirigir a tabs
          if (currentRoute === 'vendedor') {
            console.log('🚫 Consumidor intentando acceder a vendedor, redirigiendo a tabs');
            router.replace('/(tabs)');
            return;
          }
          
          // Si está en WelcomeScreen, login o register, redirigir a tabs
          if (currentRoute === 'WelcomeScreen' || currentRoute === 'login' || currentRoute === 'register') {
            console.log('➡️ Consumidor en auth, redirigiendo a tabs');
            router.replace('/(tabs)');
            return;
          }
          
          // Si ya está en tabs, dejarlo ahí
          if (currentRoute === '(tabs)') {
            console.log('✅ Consumidor ya está en tabs');
            setIsLoading(false);
            return;
          }
          
          setIsLoading(false);
          return;
        }
        
        // 👤 3. Si NO está autenticado y NO es invitado
        console.log('👤 Usuario NO autenticado y NO invitado');
        
        // Permitir acceso a rutas públicas
        const publicRoutes = ['WelcomeScreen', 'login', 'register'];
        
        // Bloquear acceso a rutas protegidas
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
        <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#5A8F48', opacity: 0.6 }} />
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#6B8E6E', opacity: 0.6 }} />
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#8FAC96', opacity: 0.6 }} />
        </View>
      </View>
    );
  }

  return (
    <CarritoProvider>
      <FavoritosProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Rutas públicas */}
          <Stack.Screen name="WelcomeScreen" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          
          {/* Rutas de consumidor */}
          <Stack.Screen name="(tabs)" />
          
          {/* Rutas de vendedor */}
          <Stack.Screen name="vendedor" />
          
          {/* Producto detalle (compartido) */}
          <Stack.Screen name="producto/[id]" />
          
          {/* 🛒 Flujo de compra/pedidos (consumidor) */}
          <Stack.Screen name="checkout" />
          <Stack.Screen name="pedidodetalle" />
          <Stack.Screen name="mispedidos" />
          
          {/* 📱 Pantallas de consumidor específicas */}
          <Stack.Screen name="consumidor/MisPedidos" />
          <Stack.Screen name="consumidor/PedidoDetalle" />
          <Stack.Screen name="consumidor/Factura" />
        </Stack>
      </FavoritosProvider>
    </CarritoProvider>
  );
}