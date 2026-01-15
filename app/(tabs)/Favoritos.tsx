import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const { favoritos, loadingFavoritos, cargarFavoritos, eliminarFavorito } = useFavoritos();

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const handleEliminarFavorito = (idFavorito: number) => {
    Alert.alert(
      "Eliminar Favorito",
      "¿Estás seguro de que deseas eliminar este producto de tus favoritos?",
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
          onPress: async () => {
            try {
              for (const fav of favoritos) {
                await eliminarFavorito(fav.idFavorito);
              }
              Alert.alert("✅ Éxito", "Se han eliminado todos tus favoritos");
            } catch (error) {
              Alert.alert("Error", "No se pudieron vaciar los favoritos");
            }
          },
        },
      ]
    );
  };

  if (loadingFavoritos) {
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
        {/* Círculos flotantes de fondo - SOLO 4 COLORES: NARANJA, AMARILLO, ROJO, VERDE */}
        <FloatingCirclesFav />
        
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>❤️</Text>
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
      </View>

      {favoritos.length === 0 ? (
        // Favoritos vacío
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyTitle}>No tienes favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Explora nuestros productos y guarda tus favoritos
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/(tabs)/explorar" as any)}
          >
            <Text style={styles.exploreButtonText}>Explorar Productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={undefined}
        >
          {/* Botón vaciar */}
          <View style={styles.headerSection}>
            <View>
              <Text style={styles.sectionTitle}>Productos guardados</Text>
              <Text style={styles.sectionSubtitle}>
                {favoritos.length} {favoritos.length === 1 ? "producto" : "productos"}
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

          {/* Grid de productos */}
          <View style={styles.grid}>
            {favoritos.map((fav) => (
              <View key={fav.idFavorito} style={styles.card}>
                {/* Botón eliminar */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleEliminarFavorito(fav.idFavorito)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>

                {/* Imagen */}
                <TouchableOpacity
                  onPress={() => router.push(`/producto/${fav.idProducto}` as any)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: fav.imagenProducto }}
                    style={styles.cardImage}
                  />
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {fav.nombreProducto}
                  </Text>

                  {/* Precio */}
                  <View style={styles.priceContainer}>
                    <Text style={styles.cardPrice}>
                      ${fav.precioProducto.toFixed(2)}
                    </Text>
                  </View>

                  {/* Botón Ver Producto - COLOR NARANJA */}
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => router.push(`/producto/${fav.idProducto}` as any)}
                  >
                    <Text style={styles.viewButtonText}>Ver producto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
    backgroundColor: '#F39C12', // AMARILLO/NARANJA (stock bajo)
    top: 60,
    right: 30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#E74C3C', // ROJO (sin stock, favoritos)
    bottom: 40,
    left: 40,
  },
  circle4: {
    width: 60,
    height: 60,
    backgroundColor: '#2ECC71', // VERDE (stock normal)
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
    fontFamily: "System",
  },
  
  // Header mejorado
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    zIndex: 1,
  },
  headerIcon: {
    fontSize: 40,
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
    fontFamily: "System",
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B35', // NARANJA (mismo que explorar)
    borderRadius: 2,
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
    fontFamily: "System",
    zIndex: 1,
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
    fontFamily: "System",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "System",
  },
  
  // Botón Explorar - COLOR NARANJA
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
    fontFamily: "System",
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  
  // Header de sección
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
    fontFamily: "System",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    fontFamily: "System",
  },
  
  // Botón Vaciar - COLOR ROJO
  vaciarButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E74C3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vaciarButtonText: {
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "System",
  },
  
  // Grid y cards
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  
  // Card - IGUAL QUE EN EXPLORAR
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
  
  // Botón eliminar - COLOR ROJO
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButtonText: {
    color: "#E74C3C",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "System",
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
    fontFamily: "System",
  },
  
  priceContainer: {
    marginBottom: 12,
  },
  
  // Precio - COLOR NARANJA (igual que explorar)
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // Botón Ver Producto - COLOR NARANJA
  viewButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  viewButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "System",
  },
});