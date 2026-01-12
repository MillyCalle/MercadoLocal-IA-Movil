import { Stack } from 'expo-router';
import { CarritoProvider } from './context/CarritoContext';
import { FavoritosProvider } from './context/FavoritosContext';

export default function RootLayout() {
  return (
    <CarritoProvider>
      <FavoritosProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="producto/[id]" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack>
      </FavoritosProvider>
    </CarritoProvider>
  );
}