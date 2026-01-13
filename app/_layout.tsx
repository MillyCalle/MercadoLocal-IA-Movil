import { Stack } from 'expo-router';
import { CarritoProvider } from './context/CarritoContext';
import { FavoritosProvider } from './context/FavoritosContext';

export default function RootLayout() {
  return (
    <CarritoProvider>
      <FavoritosProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Tabs principales */}
          <Stack.Screen name="(tabs)" />
          
          {/* Autenticación */}
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          
          {/* Producto detalle */}
          <Stack.Screen name="producto/[id]" />
          
          {/* 🛒 Flujo de compra/pedidos */}
          <Stack.Screen 
            name="checkout" 
            options={{ 
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          
          <Stack.Screen 
            name="pedidodetalle" 
            options={{ 
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          
          <Stack.Screen 
            name="mispedidos" 
            options={{ 
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
        </Stack>
      </FavoritosProvider>
    </CarritoProvider>
  );
}