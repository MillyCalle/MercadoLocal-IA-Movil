// app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const rol = await AsyncStorage.getItem("rol");
        const token = await AsyncStorage.getItem("authToken");
        
        console.log("🔍 Verificando rol en tabs consumidor:");
        console.log("📱 Token:", token ? "Sí" : "No");
        console.log("👤 Rol:", rol);
        
        // SI ES VENDEDOR, REDIRIGIR A SU DASHBOARD
        if (token && rol === "VENDEDOR") {
          console.log("🔧 Usuario es vendedor, redirigiendo a dashboard vendedor...");
          router.replace("/vendedor/dashboard");
        }
      } catch (error) {
        console.error("❌ Error verificando rol:", error);
      }
    };
    
    checkUserRole();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="explorar"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />

      <Tabs.Screen
        name="Favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />

      {/* 🎯 PERFIL DE CONSUMIDOR */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />

      {/* 🆕 VendedorPerfil - OCULTAR DEL NAVBAR (es una pantalla modal/detalle) */}
      <Tabs.Screen
        name="VendedorPerfil"
        options={{
          href: null, // Esto oculta del navbar
        }}
      />
    </Tabs>
  );
}