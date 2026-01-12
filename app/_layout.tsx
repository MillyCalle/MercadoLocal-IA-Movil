import { Stack } from 'expo-router';
import { CarritoProvider } from './context/CarritoContext';

export default function RootLayout() {
  return (
    <CarritoProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="producto/[id]" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </CarritoProvider>
  );
}