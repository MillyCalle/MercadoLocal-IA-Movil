import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function VendedorLayout() {
  const [isVendedor, setIsVendedor] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    verificarVendedor();
  }, []);

  const verificarVendedor = async () => {
    try {
      const rol = await AsyncStorage.getItem("rol");
      const token = await AsyncStorage.getItem("authToken");
      const userDataString = await AsyncStorage.getItem("user");
      
      console.log("🔍 Verificando vendedor:");
      console.log("📱 Token:", token ? "Sí" : "No");
      console.log("👤 Rol:", rol);
      console.log("👤 User data:", userDataString);
      
      if (!token || rol !== "VENDEDOR") {
        console.log("❌ No es vendedor, redirigiendo a login...");
        setIsVendedor(false);
        // Limpiar datos y redirigir
        await AsyncStorage.clear();
        router.replace("/login");
      } else {
        console.log("✅ Usuario autorizado como vendedor");
        setIsVendedor(true);
      }
    } catch (error) {
      console.error("❌ Error verificando vendedor:", error);
      setIsVendedor(false);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FBF7' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!isVendedor) {
    // No renderizar nada mientras redirige
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#ECF2E3',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#9AAA98',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. INICIO */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* 2. PRODUCTOS */}
      <Tabs.Screen
        name="gestionar-productos"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* 3. PEDIDOS */}
      <Tabs.Screen
        name="gestionar-pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* 4. PERFIL - CORREGIDO: Ahora usa mi-perfil.tsx directamente */}
      <Tabs.Screen
        name="mi-perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
        // ❌ ELIMINA EL LISTENER que redirige al profile de consumidores
        // Este listener ya no es necesario porque ahora mi-perfil.tsx es el perfil del vendedor
      />
      
      {/* 5. AYUDA */}
      <Tabs.Screen
        name="ayuda"
        options={{
          title: 'Ayuda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* RUTAS SIN TABS (pantallas completas) */}
      <Tabs.Screen
        name="agregar-producto"
        options={{
          href: null, // No aparece en tabs
        }}
      />
      <Tabs.Screen
        name="editar-producto"
        options={{
          href: null, // No aparece en tabs
        }}
      />
      
      {/* ARCHIVOS DUPLICADOS QUE DEBEN ESTAR OCULTOS */}
      <Tabs.Screen
        name="VendedorPerfil"
        options={{
          href: null, // Esto oculta "VendedorP..." del navbar
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Esto oculta cualquier otro profile duplicado
        }}
      />
    </Tabs>
  );
}