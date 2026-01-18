import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFavoritos } from "../context/FavoritosContext";

// Componente para los círculos flotantes del fondo - SOLO 4 COLORES CORRECTOS
const FloatingCirclesFav = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

export default function Favoritos() {
  const router = useRouter();
  const { 
    favoritos, 
    loadingFavoritos, 
    cargarFavoritos, 
    eliminarFavorito,
    sincronizarConBackend,
    estaSincronizado
  } = useFavoritos();
  
  const [refreshing, setRefreshing] = useState(false);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarFavoritos();
  }, []);

  const verificarAutenticacion = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const user = await AsyncStorage.getItem("user");
    setUsuarioAutenticado(!!(token && user));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarFavoritos();
    } catch (error) {
      console.error("Error refrescando:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEliminarFavorito = (idFavorito: number, nombreProducto: string) => {
    Alert.alert(
      "Eliminar Favorito",
      `¿Estás seguro de que deseas eliminar "${nombreProducto}" de tus favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarFavorito(idFavorito);
              Alert.alert("✅ Eliminado", "Producto eliminado de favoritos");
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el favorito");
            }
          },
        },
      ]
    );
  };

  const handleVaciarFavoritos = () => {
    if (favoritos.length === 0) return;

    Alert.alert(
      "Vaciar Favoritos",
      "¿Estás seguro de que deseas vaciar todos tus favoritos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Vaciar",
          style: "destructive",
          onPress: () => {
            Alert.alert("Atención", "Para vaciar favoritos, elimina uno por uno");
          },
        },
      ]
    );
  };

  const handleSincronizar = async () => {
    try {
      setRefreshing(true);
      const sincronizado = await sincronizarConBackend();
      
      if (sincronizado) {
        Alert.alert("✅ Sincronizado", "Tus favoritos están actualizados");
      } else {
        Alert.alert("⚠️ Sin conexión", "No se pudo sincronizar con el servidor");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo sincronizar los favoritos");
    } finally {
      setRefreshing(false);
    }
  };

  if (loadingFavoritos && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con efectos visuales */}
      <View style={styles.header}>
        <FloatingCirclesFav />
        
        {/* ENCABEZADO CON CORAZÓN CENTRADO */}
        <View style={styles.headerTop}>
          {/* Corazón centrado */}
          <Text style={styles.headerIcon}>❤️</Text>
          
          {/* Botón de sincronización solo si está autenticado y no sincronizado */}
          {usuarioAutenticado && !estaSincronizado && (
            <TouchableOpacity 
              style={styles.sincronizarButton}
              onPress={handleSincronizar}
            >
              <Text style={styles.sincronizarButtonText}>🔄</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Título con efecto especial */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Mis Favoritos</Text>
          <View style={styles.titleUnderline} />
        </View>
        
        <Text style={styles.headerSubtitle}>
          {favoritos.length > 0
            ? `Tienes ${favoritos.length} producto${favoritos.length > 1 ? "s" : ""} guardado${favoritos.length > 1 ? "s" : ""}`
            : "Guarda tus productos favoritos"}
        </Text>
        
        {/* Indicador de sincronización */}
        {usuarioAutenticado && (
          <View style={styles.sincronizacionContainer}>
            <Text style={[
              styles.sincronizacionText,
              estaSincronizado ? styles.sincronizado : styles.noSincronizado
            ]}>
              {estaSincronizado ? "✅ Sincronizado" : "🔄 Necesita sincronizar"}
            </Text>
          </View>
        )}
      </View>

      {favoritos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyTitle}>No tienes favoritos</Text>
          <Text style={styles.emptySubtitle}>
            {usuarioAutenticado 
              ? "Explora nuestros productos y guarda tus favoritos"
              : "Inicia sesión para sincronizar tus favoritos"}
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => usuarioAutenticado ? router.push("/(tabs)/explorar") : router.push("/login")}
          >
            <Text style={styles.exploreButtonText}>
              {usuarioAutenticado ? "Explorar Productos" : "Iniciar Sesión"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
        >
          {!usuarioAutenticado && favoritos.length > 0 && (
            <View style={styles.mensajeSincronizacion}>
              <Text style={styles.mensajeSincronizacionText}>
                ⚠️ Inicia sesión para sincronizar tus favoritos entre dispositivos
              </Text>
              <TouchableOpacity 
                style={styles.botonIniciarSesion}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.botonIniciarSesionText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerSection}>
            <View>
              <Text style={styles.sectionTitle}>Productos guardados</Text>
              <Text style={styles.sectionSubtitle}>
                {favoritos.length} {favoritos.length === 1 ? "producto" : "productos"}
                {usuarioAutenticado && !estaSincronizado && " (no sincronizado)"}
              </Text>
            </View>
            {favoritos.length > 0 && (
              <TouchableOpacity
                style={styles.vaciarButton}
                onPress={handleVaciarFavoritos}
              >
                <Text style={styles.vaciarButtonText}>🗑️ Vaciar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.grid}>
            {favoritos.map((fav) => (
              <View key={fav.idFavorito} style={styles.card}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleEliminarFavorito(fav.idFavorito, fav.nombreProducto)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/producto/${fav.idProducto}`)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: fav.imagenProducto }}
                    style={styles.cardImage}
                  />
                </TouchableOpacity>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {fav.nombreProducto}
                  </Text>

                  <View style={styles.priceContainer}>
                    <Text style={styles.cardPrice}>
                      ${fav.precioProducto.toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => router.push(`/producto/${fav.idProducto}`)}
                  >
                    <Text style={styles.viewButtonText}>Ver producto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.espacioFinal} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // Efectos de círculos flotantes - SOLO 4 COLORES: NARANJA, AMARILLO, ROJO, VERDE
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.15,
  },
  circle1: {
    width: 120,
    height: 120,
    backgroundColor: '#FF6B35', // NARANJA PRINCIPAL
    top: 20,
    left: 20,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: '#F39C12', // AMARILLO/NARANJA
    top: 60,
    right: 30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#E74C3C', // ROJO
    bottom: 40,
    left: 40,
  },
  circle4: {
    width: 60,
    height: 60,
    backgroundColor: '#2ECC71', // VERDE
    bottom: 80,
    right: 50,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  
  // Header mejorado - CORAZÓN CENTRADO
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    alignItems: "center",
    overflow: 'hidden',
    position: 'relative',
  },
  
  // CORAZÓN CENTRADO - CAMBIO IMPORTANTE
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // CENTRADO (no space-between)
    width: '100%',
    marginBottom: 12,
    zIndex: 1,
    position: 'relative',
  },
  
  headerIcon: {
    fontSize: 40,
  },
  
  // Botón de sincronización a la derecha
  sincronizarButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  
  sincronizarButtonText: {
    fontSize: 20,
    color: 'white',
  },
  
  // Título con efectos
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C3E50",
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginTop: 6,
  },
  
  headerSubtitle: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
    zIndex: 1,
  },
  
  // Indicador de sincronización
  sincronizacionContainer: {
    marginTop: 8,
    zIndex: 1,
  },
  
  sincronizacionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  sincronizado: {
    color: '#2ECC71',
  },
  
  noSincronizado: {
    color: '#F39C12',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
    color: "#9CA3AF",
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  
  exploreButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 20,
  },
  
  mensajeSincronizacion: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F4B419',
    alignItems: 'center',
  },
  
  mensajeSincronizacionText: {
    color: '#B45309',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  
  botonIniciarSesion: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  
  botonIniciarSesionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  
  vaciarButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  
  vaciarButtonText: {
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "600",
  },
  
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  
  card: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
  },
  
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#E74C3C",
  },
  
  deleteButtonText: {
    color: "#E74C3C",
    fontSize: 16,
    fontWeight: "700",
  },
  
  cardImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f1f5f9",
  },
  
  cardInfo: {
    padding: 12,
  },
  
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    minHeight: 36,
  },
  
  priceContainer: {
    marginBottom: 12,
  },
  
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B35",
  },
  
  viewButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  
  viewButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  
  espacioFinal: {
    height: 40,
  },
});