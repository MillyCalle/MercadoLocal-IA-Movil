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
  estaSincronizado: boolean;
  cargarFavoritos: () => Promise<void>;
  agregarFavorito: (idProducto: number) => Promise<void>;
  eliminarFavorito: (idFavorito: number) => Promise<void>;
  vaciarFavoritos: () => Promise<void>; // NUEVA FUNCIÓN
  esFavorito: (idProducto: number) => boolean;
  sincronizarConBackend: () => Promise<boolean>;
  limpiarFavoritosLocales: () => Promise<void>;
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

export const FavoritosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(true);
  const [estaSincronizado, setEstaSincronizado] = useState(true);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const cargarFavoritos = async () => {
    try {
      setLoadingFavoritos(true);
      
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        console.log("⚠️ Usuario no autenticado para favoritos");
        setFavoritos([]);
        setEstaSincronizado(false);
        setLoadingFavoritos(false);
        return;
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor || user.idUsuario;

      console.log("🔍 Cargando favoritos para consumidor:", idConsumidor);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/favoritos/listar/${idConsumidor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        console.log("⚠️ No se pudieron cargar favoritos");
        setFavoritos([]);
        setEstaSincronizado(false);
        setLoadingFavoritos(false);
        return;
      }

      const data = await response.json();
      console.log("✅ Favoritos cargados:", data.length);
      setFavoritos(data);
      setEstaSincronizado(true);
      
    } catch (error) {
      console.error("❌ [cargarFavoritos] Error:", error);
      setFavoritos([]);
      setEstaSincronizado(false);
    } finally {
      setLoadingFavoritos(false);
    }
  };

  const sincronizarConBackend = async (): Promise<boolean> => {
    try {
      setLoadingFavoritos(true);
      
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        console.log("⚠️ Usuario no autenticado");
        setEstaSincronizado(false);
        return false;
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor || user.idUsuario;

      console.log("🔄 Sincronizando favoritos...");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/favoritos/listar/${idConsumidor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        console.log("⚠️ Error sincronizando favoritos");
        setEstaSincronizado(false);
        return false;
      }

      const data = await response.json();
      console.log("✅ Favoritos sincronizados:", data.length);
      setFavoritos(data);
      setEstaSincronizado(true);
      return true;
      
    } catch (error) {
      console.error("❌ Error sincronizando con backend:", error);
      setEstaSincronizado(false);
      return false;
    } finally {
      setLoadingFavoritos(false);
    }
  };

  const agregarFavorito = async (idProducto: number) => {
    try {
      // VERIFICAR PRIMERO SI YA ES FAVORITO
      if (esFavorito(idProducto)) {
        console.log("ℹ️ Producto ya está en favoritos:", idProducto);
        return;
      }

      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        throw new Error("Debes iniciar sesión para agregar favoritos");
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor || user.idUsuario;

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
        
        if (errorText.includes("ya existe") || errorText.includes("duplicate") || errorText.includes("already")) {
          console.log("ℹ️ Producto ya estaba en favoritos en el servidor");
          await cargarFavoritos();
          return;
        }
        
        console.error("❌ Error al agregar favorito:", errorText);
        throw new Error("Error al agregar a favoritos");
      }

      console.log("✅ Favorito agregado exitosamente");
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
      setFavoritos(prev => prev.filter(f => f.idFavorito !== idFavorito));
      
    } catch (error: any) {
      console.error("❌ [eliminarFavorito] Error:", error.message);
      throw error;
    }
  };

  // NUEVA FUNCIÓN: Vaciar todos los favoritos
  const vaciarFavoritos = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userStr = await AsyncStorage.getItem("user");

      console.log("🗑️🗑️🗑️ Vaciando TODOS los favoritos...");

      // Limpiar estado local inmediatamente para mejor UX
      setFavoritos([]);
      setEstaSincronizado(false);

      // Si el usuario está autenticado, vaciar también en el backend
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          const idConsumidor = user.idConsumidor || user.idUsuario;

          console.log(`Eliminando favoritos del usuario ${idConsumidor} en backend...`);

          // Opción 1: Eliminar uno por uno (si no hay endpoint para vaciar todo)
          for (const fav of favoritos) {
            try {
              await fetch(
                `${API_CONFIG.BASE_URL}/favoritos/eliminar/${fav.idFavorito}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              console.log(`Eliminado favorito: ${fav.idFavorito}`);
            } catch (error) {
              console.error(`Error eliminando favorito ${fav.idFavorito}:`, error);
              // Continuamos con los siguientes
            }
          }

          console.log("✅ Todos los favoritos eliminados del backend");

        } catch (backendError) {
          console.error("Error al vaciar favoritos en backend:", backendError);
          // El estado local ya está vacío, así que continuamos
        }
      } else {
        console.log("Usuario no autenticado, solo se vacían favoritos locales");
      }

      console.log("✅✅✅ Favoritos completamente vaciados");

    } catch (error) {
      console.error("❌❌❌ Error al vaciar favoritos:", error);
      throw new Error("No se pudieron vaciar todos los favoritos");
    }
  };

  const esFavorito = (idProducto: number): boolean => {
    return favoritos.some((f) => f.idProducto === idProducto);
  };

  const limpiarFavoritosLocales = async () => {
    setFavoritos([]);
    setEstaSincronizado(false);
  };

  return (
    <FavoritosContext.Provider
      value={{
        favoritos,
        loadingFavoritos,
        estaSincronizado,
        cargarFavoritos,
        agregarFavorito,
        eliminarFavorito,
        vaciarFavoritos, // Exportamos la nueva función
        esFavorito,
        sincronizarConBackend,
        limpiarFavoritosLocales,
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