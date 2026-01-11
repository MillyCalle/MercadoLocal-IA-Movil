import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { API_CONFIG, getCurrentNetwork } from "../../config";

const { width, height } = Dimensions.get("window");

interface Producto {
  idProducto: number;
  nombreProducto: string;
  descripcionProducto?: string;
  precioProducto: number;
  stockProducto: number;
  imagenProducto: string;
  unidadMedida?: string;
  nombreVendedor?: string;
  nombreCategoria?: string;
  nombreSubcategoria?: string;
}

export default function HomeTab() {
  const [userName, setUserName] = useState("Usuario");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const router = useRouter();

  // 🔥 Limpiar búsqueda cuando regresas a esta pantalla
  useFocusEffect(
    useCallback(() => {
      setSearchQuery(""); // Limpia el campo de búsqueda
      return () => {};
    }, [])
  );

  useEffect(() => {
    loadUserData();
    loadProductos();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.nombre || "Usuario");
      }
    } catch (error) {
      console.log("Error loading user:", error);
    }
  };

  const loadProductos = async () => {
    try {
      console.log("🌐 Red:", getCurrentNetwork().name);
      console.log("🔄 Cargando productos:", `${API_CONFIG.BASE_URL}/productos/top`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${API_CONFIG.BASE_URL}/productos/top`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }

      const data: Producto[] = await response.json();
      console.log("✅ Productos cargados:", data.length);
      setProductos(data);
    } catch (error: any) {
      console.error("❌ Error cargando productos:", error);

      if (error.name === "AbortError") {
        Alert.alert("Error", "Tiempo agotado al cargar productos");
      } else if (error.message.includes("Network")) {
        Alert.alert(
          "Sin conexión",
          `No se pudo conectar al backend.\n\nRed: ${getCurrentNetwork().name}`,
          [
            { text: "Cancelar" },
            { text: "Reintentar", onPress: loadProductos }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadProductos();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace("/");
            } catch (error) {
              console.log("Error al cerrar sesión:", error);
            }
          },
        },
      ]
    );
  };

  // 🔥 BÚSQUEDA - Va a Explore
  const handleSearch = () => {
    // Simplemente navegar a explore
    router.push("/(tabs)/explorar" as any);
  };

  // 🔥 VER TODOS - Va a Explore sin filtros
  const handleVerTodos = async () => {
    try {
      // Limpiar cualquier filtro previo
      await AsyncStorage.removeItem("searchCategory");
    } catch (error) {
      console.log("Error limpiando filtros:", error);
    }
    router.push("/(tabs)/explorar" as any);
  };

  // 🔥 BUSCAR POR CATEGORÍA - Va a Explore y guarda la categoría seleccionada
  const handleBuscarCategoria = async (categoria: string) => {
    try {
      // Guardar la categoría seleccionada para que Explore la use
      await AsyncStorage.setItem("searchCategory", categoria);
      console.log("📦 Guardando categoría:", categoria);
      // Navegar a Explore
      router.push("/(tabs)/explorar" as any);
    } catch (error) {
      console.log("Error guardando categoría:", error);
      // Navegar de todas formas
      router.push("/(tabs)/explorar" as any);
    }
  };

  // 🔥 VER DETALLE DE PRODUCTO - Abre modal
  const handleProductoPress = (producto: Producto) => {
    setSelectedProduct(producto);
  };

  // 🔥 Renderizar grid de productos con 2 columnas
  const renderProductGrid = () => {
    const pairs = [];
    for (let i = 0; i < productos.length; i += 2) {
      pairs.push(productos.slice(i, i + 2));
    }

    return pairs.map((pair, pairIndex) => (
      <View key={pairIndex} style={styles.productRow}>
        {pair.map((producto) => (
          <TouchableOpacity
            key={producto.idProducto}
            style={styles.productCard}
            onPress={() => handleProductoPress(producto)}
            activeOpacity={0.8}
          >
            <View style={styles.productImageContainer}>
              <Image
                source={{ uri: producto.imagenProducto }}
                style={styles.productImage}
                resizeMode="cover"
              />
              
              {/* Badge de stock */}
              {producto.stockProducto > 0 && producto.stockProducto <= 5 && (
                <View style={styles.stockBadgeLowStock}>
                  <Text style={styles.stockBadgeText}>
                    ⚡ Últimos {producto.stockProducto}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {producto.nombreProducto}
              </Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>${producto.precioProducto}</Text>
                {producto.unidadMedida && (
                  <Text style={styles.productUnit}>/{producto.unidadMedida}</Text>
                )}
              </View>

              {producto.nombreVendedor && (
                <View style={styles.vendorRow}>
                  <Text style={styles.vendorIcon}>🌾</Text>
                  <Text style={styles.vendorName} numberOfLines={1}>
                    {producto.nombreVendedor}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Espacio vacío si es impar */}
        {pair.length === 1 && <View style={styles.productCard} />}
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b8e4e" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
        <Text style={styles.loadingSubtext}>{getCurrentNetwork().name}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6b8e4e"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userName} 👋</Text>
            <Text style={styles.subtitle}>¿Qué estás buscando hoy?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🔥 Barra de búsqueda - Va a pestaña Explore */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push("/(tabs)/explorar" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Buscar productos frescos...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categorías rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleBuscarCategoria("Verduras")}
            >
              <Text style={styles.categoryIcon}>🥬</Text>
              <Text style={styles.categoryText}>Verduras</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleBuscarCategoria("Frutas")}
            >
              <Text style={styles.categoryIcon}>🍎</Text>
              <Text style={styles.categoryText}>Frutas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleBuscarCategoria("Panadería")}
            >
              <Text style={styles.categoryIcon}>🥖</Text>
              <Text style={styles.categoryText}>Panadería</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleBuscarCategoria("Carnes")}
            >
              <Text style={styles.categoryIcon}>🥩</Text>
              <Text style={styles.categoryText}>Carnes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleBuscarCategoria("Lácteos")}
            >
              <Text style={styles.categoryIcon}>🧀</Text>
              <Text style={styles.categoryText}>Lácteos</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 🔥 PRODUCTOS desde el backend - GRID */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos disponibles</Text>
            {/* 🔥 BOTÓN "VER TODOS" - Va a Explore */}
            <TouchableOpacity onPress={handleVerTodos}>
              <Text style={styles.seeAllText}>Ver todos →</Text>
            </TouchableOpacity>
          </View>

          {productos.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <Text style={styles.noProductsText}>
                📦 No hay productos disponibles
              </Text>
              <Text style={styles.noProductsSubtext}>
                Verifica tu conexión al backend
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadProductos}
              >
                <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {renderProductGrid()}
            </View>
          )}
        </View>

        {/* Banner promocional */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.promoBanner} onPress={handleVerTodos}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>🎉 Ofertas del día</Text>
              <Text style={styles.promoSubtitle}>
                Hasta 30% de descuento en productos seleccionados
              </Text>
              <View style={styles.promoButton}>
                <Text style={styles.promoButtonText}>Ver ofertas</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>

        {/* INFO DE RED (DEV) */}
        <TouchableOpacity
          style={styles.devInfo}
          onPress={() => {
            Alert.alert(
              "⚙️ Configuración de Red",
              `Red: ${getCurrentNetwork().name}\nIP: ${getCurrentNetwork().ip}\nPuerto: ${getCurrentNetwork().port}\n\nPara cambiar, edita config.ts`,
              [{ text: "OK" }]
            );
          }}
        >
          <Text style={styles.devText}>🌐 {getCurrentNetwork().name}</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* 🔥 MODAL DE PRODUCTO - Igual que en el hub */}
      <Modal
        visible={selectedProduct !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProduct && (
                <>
                  {/* Botón cerrar */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedProduct(null)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>

                  {/* Imagen */}
                  <View style={styles.modalImageSection}>
                    <Image
                      source={{ uri: selectedProduct.imagenProducto }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                    
                    {selectedProduct.stockProducto > 0 && (
                      <View style={[
                        styles.modalStockBadge,
                        { backgroundColor: selectedProduct.stockProducto > 10 ? "#6b8e4e" : "#F5C744" }
                      ]}>
                        <Text style={styles.modalStockText}>
                          {selectedProduct.stockProducto > 10
                            ? `✓ ${selectedProduct.stockProducto} disponibles`
                            : `⚡ Solo ${selectedProduct.stockProducto} disponibles`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Información */}
                  <View style={styles.modalInfo}>
                    {/* Categorías */}
                    <View style={styles.categoryRow}>
                      {selectedProduct.nombreCategoria && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryTextBadge}>
                            {selectedProduct.nombreCategoria}
                          </Text>
                        </View>
                      )}
                      {selectedProduct.nombreSubcategoria && (
                        <View style={[styles.categoryBadge, { backgroundColor: "#F4E8C1" }]}>
                          <Text style={styles.categoryTextBadge}>
                            {selectedProduct.nombreSubcategoria}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Nombre */}
                    <Text style={styles.modalProductName}>
                      {selectedProduct.nombreProducto}
                    </Text>

                    {/* Precio */}
                    <View style={styles.modalPriceRow}>
                      <Text style={styles.modalPrice}>
                        ${selectedProduct.precioProducto}
                      </Text>
                      <Text style={styles.modalUnit}>
                        {selectedProduct.unidadMedida || "por unidad"}
                      </Text>
                    </View>

                    <View style={styles.modalDecorLine} />

                    {/* Descripción */}
                    {selectedProduct.descripcionProducto && (
                      <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionTitle}>DESCRIPCIÓN</Text>
                        <Text style={styles.descriptionText}>
                          {selectedProduct.descripcionProducto}
                        </Text>
                      </View>
                    )}

                    {/* Vendedor */}
                    {selectedProduct.nombreVendedor && (
                      <View style={styles.vendorCard}>
                        <View style={styles.vendorAvatar}>
                          <Text style={styles.vendorAvatarText}>🌾</Text>
                        </View>
                        <View style={styles.vendorInfoModal}>
                          <Text style={styles.vendorLabel}>VENDIDO POR</Text>
                          <Text style={styles.vendorNameModal}>
                            {selectedProduct.nombreVendedor}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Botón */}
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        setSelectedProduct(null);
                        // @ts-ignore
                        router.push(`/producto/${selectedProduct.idProducto}`);
                      }}
                    >
                      <Text style={styles.modalButtonIcon}>🛒</Text>
                      <Text style={styles.modalButtonText}>Ver Producto Completo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
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
    color: "#6b8e4e",
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "white",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3a5a40",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6b8e4e",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  searchContainer: {
    padding: 20,
    paddingTop: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#94a3b8",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  seeAllText: {
    fontSize: 14,
    color: "#6b8e4e",
    fontWeight: "600",
  },
  categoryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginRight: 12,
    width: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  noProductsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noProductsText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 8,
  },
  noProductsSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6b8e4e",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  productsGrid: {
    marginTop: 8,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    width: (width - 52) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    height: 140,
    backgroundColor: "#f1f5f9",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  stockBadgeLowStock: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#F5C744",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b8e4e",
  },
  productUnit: {
    fontSize: 10,
    color: "#94a3b8",
    marginLeft: 4,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafcf8",
    padding: 6,
    borderRadius: 8,
  },
  vendorIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  vendorName: {
    fontSize: 11,
    color: "#6b8e4e",
    fontWeight: "600",
    flex: 1,
  },
  promoBanner: {
    backgroundColor: "#6b8e4e",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  promoContent: {
    gap: 8,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  promoSubtitle: {
    fontSize: 14,
    color: "#e8f5e9",
  },
  promoButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  promoButtonText: {
    color: "#6b8e4e",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: "#fee",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcc",
  },
  logoutText: {
    color: "#c33",
    fontWeight: "600",
    fontSize: 16,
  },
  devInfo: {
    backgroundColor: "rgba(107, 142, 78, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 10,
  },
  devText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  // 🔥 ESTILOS DEL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  modalImageSection: {
    height: 280,
    backgroundColor: "#faf7ef",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalStockBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalStockText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  modalInfo: {
    padding: 24,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: "#ECF2E3",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryTextBadge: {
    color: "#3a5a40",
    fontSize: 11,
    fontWeight: "600",
  },
  modalProductName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 12,
    lineHeight: 30,
  },
  modalPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: "#5A8F48",
  },
  modalUnit: {
    fontSize: 14,
    color: "#6B7F69",
    marginLeft: 8,
  },
  modalDecorLine: {
    width: 60,
    height: 3,
    backgroundColor: "#6b8e4e",
    borderRadius: 2,
    marginBottom: 24,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: "#6B7F69",
    lineHeight: 24,
  },
  vendorCard: {
    flexDirection: "row",
    backgroundColor: "#FAFCF8",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ECF2E3",
    marginBottom: 24,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6b8e4e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vendorAvatarText: {
    fontSize: 24,
  },
  vendorInfoModal: {
    flex: 1,
    justifyContent: "center",
  },
  vendorLabel: {
    fontSize: 10,
    color: "#6B7F69",
    fontWeight: "600",
    marginBottom: 2,
  },
  vendorNameModal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  modalButton: {
    backgroundColor: "#5A8F48",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: "#5A8F48",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  }, });