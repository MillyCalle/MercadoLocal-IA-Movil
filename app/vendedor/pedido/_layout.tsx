// app/vendedor/pedido/_layout.tsx
import { Stack } from 'expo-router';

export default function PedidoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="[idPedido]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}