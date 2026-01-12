import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_CONFIG } from "../../config";

interface ItemCarrito {
  idCarrito: number;
  idProducto: number;
  nombreProducto: string;
  precioProducto: number;
  cantidad: number;
  imagenProducto: string;
  stockProducto: number;
}

interface CarritoContextType {
  items: ItemCarrito[];
  totalItems: number;
  loading: boolean;
  cargarCarrito: () => Promise<void>;
  agregarCarrito: (idProducto: number, cantidad: number) => Promise<void>;
  actualizarCantidad: (idCarrito: number, cantidad: number) => Promise<void>;
  eliminarItem: (idCarrito: number) => Promise<void>;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export const CarritoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        setItems([]);
        return;
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor;

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/carrito/${idConsumidor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        setItems([]);
        return;
      }

      const data = await response.json();
      
      // El backend devuelve CarritoResponse con estructura: { idCarrito, items, mensaje }
      setItems(data.items || []);
      
    } catch (error) {
      console.error("❌ [cargarCarrito] Error:", error);
      setItems([]);
    }
  };

  const agregarCarrito = async (idProducto: number, cantidad: number) => {
    try {
      console.log("🎯 [agregarCarrito] Agregando producto:", idProducto, "cantidad:", cantidad);
      
      setLoading(true);

      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        console.error("❌ [agregarCarrito] Usuario no autenticado");
        throw new Error("Debes iniciar sesión");
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor || user.idUsuario;

      // 🚀 El BACKEND ahora maneja todo:
      // - Verifica si el producto ya existe
      // - Si existe: actualiza la cantidad
      // - Si no existe: crea nuevo item
      const response = await fetch(`${API_CONFIG.BASE_URL}/carrito/agregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idConsumidor,
          idProducto,
          cantidad,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [agregarCarrito] Error del servidor:", errorText);
        throw new Error("Error al agregar al carrito");
      }

      const result = await response.json();
      console.log("✅ [agregarCarrito] Respuesta del backend:", result.mensaje);

      // Recargar el carrito para obtener el estado actualizado
      await cargarCarrito();
      
      console.log("✅ [agregarCarrito] Carrito actualizado correctamente");
      
    } catch (error: any) {
      console.error("❌ [agregarCarrito] Error:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const actualizarCantidad = async (idCarrito: number, cantidad: number) => {
    try {
      console.log("🔄 [actualizarCantidad] idCarrito:", idCarrito, "cantidad:", cantidad);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No autorizado");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/carrito/item/${idCarrito}/cantidad?cantidad=${cantidad}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [actualizarCantidad] Error:", errorText);
        throw new Error("Error al actualizar cantidad");
      }

      console.log("✅ [actualizarCantidad] Cantidad actualizada");
      await cargarCarrito();
      
    } catch (error) {
      console.error("❌ [actualizarCantidad] Error:", error);
      throw error;
    }
  };

  const eliminarItem = async (idCarrito: number) => {
    try {
      console.log("🗑️ [eliminarItem] idCarrito:", idCarrito);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No autorizado");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/carrito/item/${idCarrito}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [eliminarItem] Error:", errorText);
        throw new Error("Error al eliminar del carrito");
      }

      console.log("✅ [eliminarItem] Item eliminado");
      await cargarCarrito();
      
    } catch (error) {
      console.error("❌ [eliminarItem] Error:", error);
      throw error;
    }
  };

  return (
    <CarritoContext.Provider
      value={{
        items,
        totalItems,
        loading,
        cargarCarrito,
        agregarCarrito,
        actualizarCantidad,
        eliminarItem,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  }
  return context;
};  