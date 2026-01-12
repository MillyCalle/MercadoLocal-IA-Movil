import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_CONFIG } from "../../config";

interface Favorito {
  idFavorito: number;
  idProducto: number;
  nombreProducto: string;
  precioProducto: number;
  imagenProducto: string;
}

interface FavoritosContextType {
  favoritos: Favorito[];
  loadingFavoritos: boolean;
  cargarFavoritos: () => Promise<void>;
  agregarFavorito: (idProducto: number) => Promise<void>;
  eliminarFavorito: (idFavorito: number) => Promise<void>;
  esFavorito: (idProducto: number) => boolean;
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

export const FavoritosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(true);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const cargarFavoritos = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        console.log("⚠️ Usuario no autenticado para favoritos");
        setFavoritos([]);
        setLoadingFavoritos(false);
        return;
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor;

      console.log("🔍 Cargando favoritos para consumidor:", idConsumidor);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/favoritos/listar/${idConsumidor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        console.log("⚠️ No se pudieron cargar favoritos");
        setFavoritos([]);
        setLoadingFavoritos(false);
        return;
      }

      const data = await response.json();
      console.log("✅ Favoritos cargados:", data.length);
      setFavoritos(data);
      
    } catch (error) {
      console.error("❌ [cargarFavoritos] Error:", error);
      setFavoritos([]);
    } finally {
      setLoadingFavoritos(false);
    }
  };

  const agregarFavorito = async (idProducto: number) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        throw new Error("Debes iniciar sesión para agregar favoritos");
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor;

      console.log("💚 Agregando producto a favoritos:", idProducto);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/favoritos/agregar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            idConsumidor,
            idProducto,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error al agregar favorito:", errorText);
        throw new Error("Error al agregar a favoritos");
      }

      console.log("✅ Favorito agregado");
      await cargarFavoritos();
      
    } catch (error: any) {
      console.error("❌ [agregarFavorito] Error:", error.message);
      throw error;
    }
  };

  const eliminarFavorito = async (idFavorito: number) => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        throw new Error("No autorizado");
      }

      console.log("🗑️ Eliminando favorito:", idFavorito);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/favoritos/eliminar/${idFavorito}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error al eliminar favorito:", errorText);
        throw new Error("Error al eliminar de favoritos");
      }

      console.log("✅ Favorito eliminado");
      await cargarFavoritos();
      
    } catch (error: any) {
      console.error("❌ [eliminarFavorito] Error:", error.message);
      throw error;
    }
  };

  const esFavorito = (idProducto: number): boolean => {
    return favoritos.some((f) => f.idProducto === idProducto);
  };

  return (
    <FavoritosContext.Provider
      value={{
        favoritos,
        loadingFavoritos,
        cargarFavoritos,
        agregarFavorito,
        eliminarFavorito,
        esFavorito,
      }}
    >
      {children}
    </FavoritosContext.Provider>
  );
};

export const useFavoritos = () => {
  const context = useContext(FavoritosContext);
  if (!context) {
    throw new Error("useFavoritos debe usarse dentro de FavoritosProvider");
  }
  return context;
};