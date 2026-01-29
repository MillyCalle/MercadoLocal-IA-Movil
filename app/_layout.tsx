// app/_layout.tsx - CORREGIR PARA QUE RECONOZCA LA NUEVA RUTA
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
        
        const token = await AsyncStorage.getItem('authToken');
        const user = await AsyncStorage.getItem('user');
        const isGuest = await AsyncStorage.getItem('isGuest');
        const rol = await AsyncStorage.getItem('rol');
        
        const isAuthenticated = !!(token && user);
        const currentRoute = segments[0];
        const subRoute = segments[1];
        
        console.log('📊 Estado:', {
          isGuest,
          isAuthenticated,
          currentRoute,
          subRoute,
          segments,
          rol
        });
        
        // 🆕 RUTAS COMPLETAMENTE PÚBLICAS (sin autenticación)
        const publicRoutes = [
          'WelcomeScreen',
          'login', 
          'register',
        ];
        
        // 🆕 RUTAS ESPECIALES PÚBLICAS (con patrón dinámico)
        const isProductoDetalle = currentRoute === 'producto' && subRoute;
        const isVendedorPerfil = currentRoute === '(tabs)' && subRoute === 'VendedorPerfil'; // ¡CAMBIO AQUÍ!
        
        console.log('🔍 Verificación especial:', {
          isProductoDetalle,
          isVendedorPerfil
        });
        
        // 🆕 PERMITIR ACCESO A RUTAS PÚBLICAS ESPECIALES
        if (publicRoutes.includes(currentRoute) || isProductoDetalle || isVendedorPerfil) {
          console.log('🔓 RUTA PÚBLICA - Acceso permitido sin autenticación');
          setIsLoading(false);
          return;
        }
        
        // 🎭 1. Si es INVITADO
        if (isGuest === 'true') {
          console.log('🎭 Usuario es INVITADO');
          
          // Si está en tabs, dejarlo ahí
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
        
        // 🔐 2. Si está AUTENTICADO
        if (isAuthenticated) {
          console.log(`🔐 Usuario AUTENTICADO como ${rol || 'sin rol'}`);
          
          // 📦 2.1 Si es VENDEDOR
          if (rol === 'VENDEDOR') {
            console.log('👨‍🌾 Usuario es VENDEDOR');
            
            // Si está en rutas de consumidor, redirigir a vendedor
            if (currentRoute === '(tabs)' || currentRoute === 'consumidor') {
              console.log('➡️ Vendedor en rutas de consumidor, redirigiendo a dashboard vendedor');
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
          
          // 🛒 2.2 Si es CONSUMIDOR o cualquier otro rol
          console.log('🛒 Usuario es CONSUMIDOR o similar');
          
          // ✅ PERMITIR ACCESO A VendedorPerfil incluso a consumidores autenticados
          if (isVendedorPerfil) {
            console.log('✅ Consumidor autenticado accediendo a VendedorPerfil - PERMITIR');
            setIsLoading(false);
            return;
          }
          
          // Si ya está en tabs, dejarlo ahí
          if (currentRoute === '(tabs)') {
            console.log('✅ Consumidor ya está en tabs');
            setIsLoading(false);
            return;
          }
          
          // Si está en otras rutas permitidas para autenticados
          setIsLoading(false);
          return;
        }
        
        // 👤 3. Si NO está autenticado y NO es invitado
        console.log('👤 Usuario NO autenticado y NO invitado');
        
        // Si no es ruta pública y no está autenticado, redirigir a WelcomeScreen
        console.log('🚫 Acceso no autorizado, redirigiendo a WelcomeScreen');
        router.replace('/WelcomeScreen');
        
      } catch (error) {
        console.error('❌ Error en checkAuth:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ CheckAuth finalizado');
      }
    };

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
          
          {/* 🆕 Producto detalle - RUTA PÚBLICA */}
          <Stack.Screen 
            name="producto/[id]" 
          />
          
          {/* ❌ ELIMINAR esta línea - VendedorPerfil ya NO está en carpeta vendedor */}
          {/* <Stack.Screen name="vendedor/VendedorPerfil" /> */}
          
          {/* Rutas de consumidor */}
          <Stack.Screen name="(tabs)" />
          
          {/* Rutas de vendedor */}
          <Stack.Screen name="vendedor" />
          
          {/* Rutas de consumidor específicas */}
          <Stack.Screen name="consumidor/CheckoutUnificado" />
          <Stack.Screen name="consumidor/EditarPerfil" />
          <Stack.Screen name="consumidor/Factura" />
          <Stack.Screen name="consumidor/MisPedidos" />
          <Stack.Screen name="consumidor/Pedido" />
          <Stack.Screen name="consumidor/PedidoDetalle" />
        </Stack>
      </FavoritosProvider>
    </CarritoProvider>
  );
}