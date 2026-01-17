import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { API_CONFIG } from "../../config";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const router = useRouter();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // 🔥 Limpiar cuando regresas a esta pantalla
  useFocusEffect(
    useCallback(() => {
      return () => { };
    }, [])
  );

  useEffect(() => {
    loadUserData();
    loadProductos();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

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
      const response = await fetch(`${API_CONFIG.BASE_URL}/productos/top`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }

      const data: Producto[] = await response.json();
      setProductos(data);
    } catch (error: any) {
      console.error("❌ Error cargando productos:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los productos en este momento",
        [
          { text: "Cancelar" },
          { text: "Reintentar", onPress: loadProductos }
        ]
      );
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

  // 🔥 BUSCAR POR CATEGORÍA
  const handleBuscarCategoria = async (categoria: string) => {
    try {
      await AsyncStorage.setItem("searchCategory", categoria);
      router.push("/(tabs)/explorar" as any);
    } catch (error) {
      console.log("Error guardando categoría:", error);
      router.push("/(tabs)/explorar" as any);
    }
  };

  // 🔥 VER DETALLE DE PRODUCTO
  const handleProductoPress = (producto: Producto) => {
    setSelectedProduct(producto);
  };

  // 🔥 Categorías con iconos mejorados
  const categorias = [
    { id: 1, name: "Verduras", icon: "🥬", color: "#2ECC71" },
    { id: 2, name: "Frutas", icon: "🍎", color: "#E74C3C" },
    { id: 3, name: "Panadería", icon: "🥖", color: "#F39C12" },
    { id: 4, name: "Carnes", icon: "🥩", color: "#E74C3C" },
    { id: 5, name: "Lácteos", icon: "🧀", color: "#3498DB" },
    { id: 6, name: "Orgánicos", icon: "🌿", color: "#27AE60" },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
        <View style={styles.loadingCircles}>
          <View style={[styles.loadingCircle, { backgroundColor: '#FF6B35' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#3498DB' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#9B59B6' }]} />
        </View>
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
            colors={["#FF6B35"]}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 🔥 HEADER CON GRADIENTE */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Efecto de partículas en el fondo */}
          <View style={styles.headerParticles}>
            {[...Array(15)].map((_, i) => (
              <View 
                key={i}
                style={[
                  styles.particle,
                  {
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: Math.random() * 10 + 5,
                    height: Math.random() * 10 + 5,
                    opacity: Math.random() * 0.3 + 0.1,
                  }
                ]}
              />
            ))}
          </View>

          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.welcomeText}>Bienvenido,</Text>
              <Text style={styles.userName}>{userName} 👋</Text>
              <Text style={styles.subtitle}>¿Qué vas a comprar hoy?</Text>
            </View>

            <TouchableOpacity 
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
                <View style={styles.avatarRing} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 🔥 BARRA DE BÚSQUEDA FLOTANTE */}
          <Animated.View 
            style={[
              styles.searchContainer,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => router.push("/(tabs)/explorar" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.searchIconContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchPlaceholder}>
                  Buscar productos frescos...
                </Text>
                <Text style={styles.searchHint}>
                  Toca para explorar todos los productos
                </Text>
              </View>
              <View style={styles.searchArrow}>
                <Text style={styles.searchArrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* 🔥 CATEGORÍAS INTERACTIVAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explora por Categoría</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explorar" as any)}>
              <Text style={styles.seeAllText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categorias.map((cat, index) => (
              <Animated.View
                key={cat.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryCard,
                    { 
                      backgroundColor: cat.color,
                      shadowColor: cat.color,
                    }
                  ]}
                  onPress={() => handleBuscarCategoria(cat.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryIconContainer}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  </View>
                  <Text style={styles.categoryText}>{cat.name}</Text>
                  <View style={styles.categoryGlow} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* 🔥 PRODUCTOS DESTACADOS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Productos Destacados</Text>
              <Text style={styles.sectionSubtitle}>
                Productos frescos y de calidad
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/(tabs)/explorar" as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllButtonText}>Ver todos</Text>
              <Text style={styles.seeAllArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {productos.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <Text style={styles.noProductsIcon}>📦</Text>
              <Text style={styles.noProductsText}>
                No hay productos disponibles
              </Text>
              <Text style={styles.noProductsSubtext}>
                Intenta nuevamente en unos momentos
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadProductos}
              >
                <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            >
              {productos.map((producto, index) => (
                <Animated.View
                  key={producto.idProducto}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim }
                    ]
                  }}
                >
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => handleProductoPress(producto)}
                    activeOpacity={0.9}
                  >
                    {/* Badge de destacado */}
                    {index < 3 && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>⭐ Destacado</Text>
                      </View>
                    )}

                    {/* Imagen del producto */}
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{ uri: producto.imagenProducto }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay} />

                      {/* Badge de stock */}
                      {producto.stockProducto > 0 && (
                        <View style={[
                          styles.stockBadge,
                          producto.stockProducto <= 5 && styles.stockBadgeLow
                        ]}>
                          <Text style={styles.stockBadgeText}>
                            {producto.stockProducto > 10 ? "✓ Stock" : `⚡ ${producto.stockProducto} u.`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Información del producto */}
                    <View style={styles.productInfo}>
                      <View style={styles.productHeader}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {producto.nombreProducto}
                        </Text>
                        {producto.nombreCategoria && (
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>
                              {producto.nombreCategoria}
                            </Text>
                          </View>
                        )}
                      </View>

                      {producto.nombreVendedor && (
                        <View style={styles.vendorInfo}>
                          <View style={styles.vendorIconContainer}>
                            <Text style={styles.vendorIcon}>🌾</Text>
                          </View>
                          <Text style={styles.vendorName} numberOfLines={1}>
                            {producto.nombreVendedor}
                          </Text>
                        </View>
                      )}

                      <View style={styles.productFooter}>
                        <View>
                          <Text style={styles.productPrice}>
                            ${producto.precioProducto.toFixed(2)}
                          </Text>
                          {producto.unidadMedida && (
                            <Text style={styles.productUnit}>
                              / {producto.unidadMedida}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity 
                          style={styles.viewButton}
                          onPress={() => handleProductoPress(producto)}
                        >
                          <Text style={styles.viewButtonText}>Ver</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Efecto de brillo al pasar el dedo */}
                    <View style={styles.cardGlow} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 🔥 BENEFICIOS DE LA APP */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>¿Por qué comprar con nosotros?</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon}>🚚</Text>
              </View>
              <Text style={styles.benefitTitle}>Envío Directo</Text>
              <Text style={styles.benefitDescription}>
                Coordinación directa con el productor
              </Text>
            </View>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon}>🌱</Text>
              </View>
              <Text style={styles.benefitTitle}>100% Natural</Text>
              <Text style={styles.benefitDescription}>
                Productos frescos y orgánicos
              </Text>
            </View>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon}>⭐</Text>
              </View>
              <Text style={styles.benefitTitle}>Calidad</Text>
              <Text style={styles.benefitDescription}>
                Productos seleccionados
              </Text>
            </View>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon}>💚</Text>
              </View>
              <Text style={styles.benefitTitle}>Comunidad</Text>
              <Text style={styles.benefitDescription}>
                Apoyo a productores locales
              </Text>
            </View>
          </View>
        </View>

        {/* 🔥 LLAMADO A LA ACCIÓN */}
        <View style={styles.ctaContainer}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>¿Listo para explorar?</Text>
            <Text style={styles.ctaDescription}>
              Descubre todos nuestros productos frescos y de temporada
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => router.push("/(tabs)/explorar" as any)}
            >
              <Text style={styles.ctaButtonText}>Explorar Productos →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 🔥 MODAL DE PRODUCTO MEJORADO */}
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
                  {/* Botón cerrar mejorado */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedProduct(null)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.closeButtonInner}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Imagen con efecto */}
                  <View style={styles.modalImageSection}>
                    <Image
                      source={{ uri: selectedProduct.imagenProducto }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                    <View style={styles.modalImageGradient} />

                    {selectedProduct.stockProducto > 0 && (
                      <View style={[
                        styles.modalStockBadge,
                        { backgroundColor: selectedProduct.stockProducto > 10 ? "#2ECC71" : "#F39C12" }
                      ]}>
                        <Text style={styles.modalStockText}>
                          {selectedProduct.stockProducto > 10
                            ? `✓ ${selectedProduct.stockProducto} disponibles`
                            : `⚡ Solo ${selectedProduct.stockProducto} disponibles`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Información del producto */}
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
                        <View style={[styles.categoryBadge, { backgroundColor: "#FFEAA7" }]}>
                          <Text style={[styles.categoryTextBadge, { color: "#E17055" }]}>
                            {selectedProduct.nombreSubcategoria}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Nombre */}
                    <Text style={styles.modalProductName}>
                      {selectedProduct.nombreProducto}
                    </Text>

                    {/* Precio con efecto */}
                    <View style={styles.modalPriceContainer}>
                      <View style={styles.modalPriceRow}>
                        <Text style={styles.modalPrice}>
                          ${selectedProduct.precioProducto}
                        </Text>
                        <Text style={styles.modalUnit}>
                          {selectedProduct.unidadMedida || "por unidad"}
                        </Text>
                      </View>
                      <View style={styles.priceDecoration} />
                    </View>

                    {/* Descripción */}
                    {selectedProduct.descripcionProducto && (
                      <View style={styles.descriptionSection}>
                        <View style={styles.descriptionHeader}>
                          <Text style={styles.descriptionIcon}>📝</Text>
                          <Text style={styles.descriptionTitle}>DESCRIPCIÓN</Text>
                        </View>
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
                          <View style={styles.vendorAvatarRing} />
                        </View>
                        <View style={styles.vendorInfoModal}>
                          <Text style={styles.vendorLabel}>VENDIDO POR</Text>
                          <Text style={styles.vendorNameModal}>
                            {selectedProduct.nombreVendedor}
                          </Text>
                          <Text style={styles.vendorStatus}>🌱 Vendedor verificado</Text>
                        </View>
                      </View>
                    )}

                    {/* Botones de acción */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalButtonSecondary}
                        onPress={() => setSelectedProduct(null)}
                      >
                        <Text style={styles.modalButtonSecondaryText}>Cerrar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalButtonPrimary}
                        onPress={() => {
                          setSelectedProduct(null);
                          router.push(`/producto/${selectedProduct.idProducto}` as any);
                        }}
                      >
                        <Text style={styles.modalButtonIcon}>🛒</Text>
                        <Text style={styles.modalButtonText}>Ver Producto Completo</Text>
                      </TouchableOpacity>
                    </View>
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
  
  // 🔥 LOADING SCREEN
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
  loadingCircles: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  loadingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  
  // 🔥 HEADER CON GRADIENTE
  header: {
    backgroundColor: "white",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    paddingTop: 60,
    paddingBottom: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  headerParticles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FF6B35',
    borderRadius: 50,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  greetingContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontFamily: "System",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    position: 'relative',
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "System",
  },
  
  // 🔥 BARRA DE BÚSQUEDA MEJORADA
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchIconContainer: {
    backgroundColor: "#FF6B35",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 20,
    color: "white",
  },
  searchTextContainer: {
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "System",
  },
  searchHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
    fontFamily: "System",
  },
  searchArrow: {
    backgroundColor: "#f1f5f9",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchArrowIcon: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "700",
  },
  
  // 🔥 SECCIONES
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    fontFamily: "System",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "700",
    fontFamily: "System",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2E8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  seeAllButtonText: {
    fontSize: 13,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
    marginRight: 6,
  },
  seeAllArrow: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "700",
  },
  
  // 🔥 CATEGORÍAS INTERACTIVAS
  categoriesContainer: {
    paddingRight: 20,
    gap: 12,
  },
  categoryCard: {
    width: 110,
    height: 140,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    fontFamily: "System",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    zIndex: -1,
  },
  
  // 🔥 PRODUCTOS DESTACADOS
  productsContainer: {
    paddingRight: 20,
    gap: 16,
  },
  productCard: {
    width: 280,
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7A6400",
    fontFamily: "System",
  },
  productImageContainer: {
    height: 180,
    backgroundColor: "#f1f5f9",
    position: 'relative',
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.1))',
  },
  stockBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#2ECC71",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "white",
  },
  stockBadgeLow: {
    backgroundColor: "#F39C12",
  },
  stockBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "System",
  },
  productInfo: {
    padding: 20,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
    flex: 1,
    marginRight: 10,
    lineHeight: 24,
  },
  categoryTag: {
    backgroundColor: "#ECF2E3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3a5a40",
    fontFamily: "System",
  },
  vendorInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  vendorIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  vendorIcon: {
    fontSize: 14,
    color: "white",
  },
  vendorName: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    fontFamily: "System",
    flex: 1,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  productUnit: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
    fontFamily: "System",
  },
  viewButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "System",
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  
  // 🔥 NO PRODUCTOS
  noProductsContainer: {
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: "white",
    borderRadius: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  noProductsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noProductsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    fontFamily: "System",
  },
  noProductsSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
    fontFamily: "System",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "System",
  },
  
  // 🔥 BENEFICIOS
  benefitsContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    marginBottom: 20,
    textAlign: "center",
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  benefitCard: {
    width: (width - 52) / 2,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 12,
  },
  benefitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 28,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    marginBottom: 8,
    textAlign: "center",
  },
  benefitDescription: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "System",
    textAlign: "center",
    lineHeight: 16,
  },
  
  // 🔥 CTA (CALL TO ACTION)
  ctaContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  ctaCard: {
    backgroundColor: "#FF6B35",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
    marginBottom: 12,
    textAlign: "center",
  },
  ctaDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "System",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // 🔥 MODAL MEJORADO
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.92,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  closeButtonInner: {
    backgroundColor: "white",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "System",
  },
  modalImageSection: {
    height: 320,
    backgroundColor: "#faf7ef",
    justifyContent: "center",
    alignItems: "center",
    position: 'relative',
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'linear-gradient(transparent, rgba(255,255,255,0.8))',
  },
  modalStockBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalStockText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "System",
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryTextBadge: {
    color: "#3a5a40",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "System",
  },
  modalProductName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 16,
    lineHeight: 34,
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  modalPriceContainer: {
    marginBottom: 24,
  },
  modalPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  modalPrice: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FF6B35",
    fontFamily: "System",
  },
  modalUnit: {
    fontSize: 16,
    color: "#6B7F69",
    marginLeft: 8,
    fontFamily: "System",
  },
  priceDecoration: {
    width: 80,
    height: 4,
    backgroundColor: "#FF6B35",
    borderRadius: 2,
    marginTop: 12,
    opacity: 0.5,
  },
  descriptionSection: {
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 16,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  descriptionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2D3E2B",
    letterSpacing: 1,
    fontFamily: "System",
  },
  descriptionText: {
    fontSize: 15,
    color: "#6B7F69",
    lineHeight: 24,
    fontFamily: "System",
  },
  vendorCard: {
    flexDirection: "row",
    backgroundColor: "#FAFCF8",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ECF2E3",
    marginBottom: 24,
    alignItems: "center",
  },
  vendorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: 'relative',
  },
  vendorAvatarRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  vendorAvatarText: {
    fontSize: 28,
  },
  vendorInfoModal: {
    flex: 1,
  },
  vendorLabel: {
    fontSize: 11,
    color: "#6B7F69",
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  vendorNameModal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D3E2B",
    fontFamily: "System",
    marginBottom: 4,
  },
  vendorStatus: {
    fontSize: 12,
    color: "#27AE60",
    fontWeight: "600",
    fontFamily: "System",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "System",
  },
  modalButtonPrimary: {
    flex: 2,
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "System",
  },
});