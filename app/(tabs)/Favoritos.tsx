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
              Alert.alert("Éxito", "Se han eliminado todos tus favoritos");
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
        <ActivityIndicator size="large" color="#DA3E52" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>❤️</Text>
        <Text style={styles.headerTitle}>Mis Favoritos</Text>
        <Text style={styles.headerSubtitle}>
          {favoritos.length > 0
            ? `Tienes ${favoritos.length} producto${favoritos.length > 1 ? "s" : ""} guardado${favoritos.length > 1 ? "s" : ""}`
            : "Guarda tus productos favoritos"}
        </Text>
      </View>

      {favoritos.length === 0 ? (
        // Favoritos vacío
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💔</Text>
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

                  <Text style={styles.cardPrice}>
                    ${fav.precioProducto.toFixed(2)}
                  </Text>

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
    backgroundColor: "#F9FBF7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FBF7",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#DA3E52",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D3E2B",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7F69",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7F69",
    textAlign: "center",
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: "#5A8F48",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
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
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2D3E2B",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7F69",
    marginTop: 4,
  },
  vaciarButton: {
    backgroundColor: "#FFF0F2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#DA3E52",
  },
  vaciarButtonText: {
    color: "#DA3E52",
    fontSize: 14,
    fontWeight: "700",
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
    borderWidth: 2,
    borderColor: "#ECF2E3",
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#DA3E52",
  },
  deleteButtonText: {
    color: "#DA3E52",
    fontSize: 16,
    fontWeight: "700",
  },
  cardImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#F9FBF7",
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 8,
    minHeight: 36,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#5A8F48",
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: "#5A8F48",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
});