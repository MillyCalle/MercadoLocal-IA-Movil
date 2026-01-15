import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config";
import { useCarrito } from "../context/CarritoContext";

// TIPOS
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
  idCategoria?: number;
  idSubcategoria?: number;
  promedioValoracion?: number;
  totalValoraciones?: number;
  idVendedor?: number;
}

interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
}

interface Subcategoria {
  idSubcategoria: number;
  nombreSubcategoria: string;
  idCategoria: number;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

// Componente para los círculos flotantes del fondo
const FloatingCircles = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

export default function ExploreTab() {
  const router = useRouter();
  const { agregarCarrito, items } = useCarrito();

  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");

  // Estados del carrito local (para modo invitado)
  const [carritoLocal, setCarritoLocal] = useState<ItemCarrito[]>([]);
  const [totalCarrito, setTotalCarrito] = useState(0);

  // VERIFICAR MODO INVITADO
  useEffect(() => {
    const checkGuestMode = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const user = await AsyncStorage.getItem("user");
        
        if (!token && !user) {
          setIsGuestMode(true);
          console.log("👤 Usuario en modo invitado");
          
          const savedCart = await AsyncStorage.getItem("guestCart");
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCarritoLocal(parsedCart);
            calcularTotalCarrito(parsedCart);
          }
        } else {
          setIsGuestMode(false);
          console.log("👤 Usuario autenticado");
        }
      } catch (error) {
        console.log("Error checking guest mode:", error);
      }
    };

    checkGuestMode();
  }, []);

  // DETECTAR CATEGORÍA DESDE HOME
  useFocusEffect(
    useCallback(() => {
      const loadCategoryFilter = async () => {
        try {
          const savedCategory = await AsyncStorage.getItem("searchCategory");
          if (savedCategory) {
            console.log("🎯 Categoría detectada desde home:", savedCategory);
            
            const categoriaEncontrada = categorias.find(
              (cat) => cat.nombreCategoria.toLowerCase() === savedCategory.toLowerCase()
            );

            if (categoriaEncontrada) {
              setFiltroCategoria(String(categoriaEncontrada.idCategoria));
              setFiltroSubcategoria("");
            } else {
              setBusqueda(savedCategory);
            }

            await AsyncStorage.removeItem("searchCategory");
          }
        } catch (error) {
          console.log("Error loading category:", error);
        }
      };

      if (categorias.length > 0) {
        loadCategoryFilter();
      }
    }, [categorias])
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      await Promise.all([
        cargarProductos(),
        cargarCategorias(),
        cargarSubcategorias(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/productos/listar`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Error al cargar productos");
      const data: Producto[] = await response.json();
      setProductos(data);
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      Alert.alert("Error", "No se pudieron cargar los productos");
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/categorias/listar`);
      const data: Categoria[] = await response.json();
      setCategorias(data);
    } catch (error) {
      console.log("Error cargando categorías:", error);
    }
  };

  const cargarSubcategorias = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/subcategorias/listar`);
      const data: Subcategoria[] = await response.json();
      setSubcategorias(data);
    } catch (error) {
      console.log("Error cargando subcategorías:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  // CALCULAR TOTAL DEL CARRITO LOCAL
  const calcularTotalCarrito = (cart: ItemCarrito[]) => {
    const total = cart.reduce((sum, item) => {
      return sum + (item.producto.precioProducto * item.cantidad);
    }, 0);
    setTotalCarrito(total);
  };

  // FUNCIÓN PARA AGREGAR AL CARRITO LOCAL (MODO INVITADO)
  const handleAgregarCarritoLocal = async (producto: Producto) => {
    try {
      const existingIndex = carritoLocal.findIndex(
        item => item.producto.idProducto === producto.idProducto
      );
      
      let nuevoCarrito: ItemCarrito[];
      
      if (existingIndex >= 0) {
        nuevoCarrito = [...carritoLocal];
        nuevoCarrito[existingIndex].cantidad += 1;
      } else {
        nuevoCarrito = [...carritoLocal, { producto, cantidad: 1 }];
      }
      
      setCarritoLocal(nuevoCarrito);
      calcularTotalCarrito(nuevoCarrito);
      
      await AsyncStorage.setItem("guestCart", JSON.stringify(nuevoCarrito));
      
      Alert.alert(
        "✅ ¡Agregado!",
        `${producto.nombreProducto} agregado al carrito`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error("Error agregando al carrito local:", error);
      Alert.alert("Error", "No se pudo agregar al carrito");
    }
  };

  // FUNCIÓN PARA AGREGAR AL CARRITO (MODO AUTENTICADO)
  const handleAgregarCarrito = async (producto: Producto) => {
    if (producto.stockProducto <= 0) {
      Alert.alert("Sin stock", "Este producto no está disponible por el momento");
      return;
    }

    if (isGuestMode) {
      await handleAgregarCarritoLocal(producto);
    } else {
      try {
        console.log("📤 Agregando producto al carrito:", producto.idProducto);
        
        await agregarCarrito(producto.idProducto, 1);

        Alert.alert(
          "✅ ¡Agregado!", 
          `${producto.nombreProducto} agregado al carrito`,
          [{ text: "OK" }]
        );
        
      } catch (error: any) {
        console.error("❌ Error agregando al carrito:", error);
        
        let errorMessage = "No se pudo agregar el producto al carrito";
        if (error.message.includes("Debes iniciar sesión") || 
            error.message.includes("No autorizado") ||
            error.message.includes("403")) {
          Alert.alert(
            "Inicia sesión",
            "Debes iniciar sesión para agregar productos al carrito",
            [
              { text: "Ahora no" },
              { 
                text: "Iniciar sesión", 
                onPress: () => router.push("/login")
              }
            ]
          );
        } else {
          Alert.alert("Error", error.message || errorMessage, [{ text: "OK" }]);
        }
      }
    }
  };

  // VER CARRITO
  const verCarrito = () => {
    if (isGuestMode) {
      if (carritoLocal.length === 0) {
        Alert.alert("Carrito vacío", "Agrega productos al carrito primero");
        return;
      }
      router.push("/carrito" as any);
    } else {
      router.push("/carrito" as any);
    }
  };

  // VER DETALLE DEL PRODUCTO
  const handleProductoPress = (producto: Producto) => {
    router.push(`/producto/${producto.idProducto}` as any);
  };

  // FILTROS
  const productosFiltrados = productos.filter((p) => {
    const cumpleBusqueda = p.nombreProducto
      .toLowerCase()
      .includes(busqueda.toLowerCase()) ||
      (p.nombreCategoria && p.nombreCategoria.toLowerCase().includes(busqueda.toLowerCase())) ||
      (p.nombreSubcategoria && p.nombreSubcategoria.toLowerCase().includes(busqueda.toLowerCase()));
    
    const cumpleCategoria = filtroCategoria
      ? p.idCategoria === parseInt(filtroCategoria)
      : true;
    const cumpleSubcategoria = filtroSubcategoria
      ? p.idSubcategoria === parseInt(filtroSubcategoria)
      : true;
    return cumpleBusqueda && cumpleCategoria && cumpleSubcategoria;
  });

  // Renderizar producto
  const renderProducto = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductoPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imagenProducto }}
        style={styles.productImage}
        resizeMode="cover"
      />

      {item.stockProducto > 0 ? (
        <View
          style={[
            styles.stockBadge,
            item.stockProducto <= 10 && styles.stockBadgeLow,
          ]}
        >
          <Text style={styles.stockText}>
            {item.stockProducto > 10 ? "✓" : "⚡"}
          </Text>
        </View>
      ) : (
        <View style={styles.stockBadgeOut}>
          <Text style={styles.stockText}>✗</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nombreProducto}
        </Text>

        <Text style={styles.productCategory} numberOfLines={1}>
          {item.nombreSubcategoria || item.nombreCategoria || "Sin categoría"}
        </Text>

        {/* Valoración */}
        {item.promedioValoracion !== undefined && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStars}>
              {"⭐".repeat(Math.round(item.promedioValoracion))}
            </Text>
            <Text style={styles.ratingText}>
              ({item.totalValoraciones || 0})
            </Text>
          </View>
        )}

        <View style={styles.productFooter}>
          <View>
            <Text style={styles.productPrice}>${item.precioProducto.toFixed(2)}</Text>
            {item.unidadMedida && (
              <Text style={styles.productUnit}>{item.unidadMedida}</Text>
            )}
          </View>

          {/* BOTÓN DE CARRITO ACTUALIZADO - COLOR NARANJA */}
          <TouchableOpacity
            style={[
              styles.addButton,
              item.stockProducto <= 0 && styles.addButtonDisabled
            ]}
            onPress={() => handleAgregarCarrito(item)}
            disabled={item.stockProducto <= 0}
          >
            <Text style={styles.addButtonText}>
              {item.stockProducto > 0 ? "+" : "✗"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con efectos visuales */}
      <View style={styles.header}>
        {/* Círculos flotantes de fondo */}
        <FloatingCircles />
        
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>🛒</Text>
          {isGuestMode && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Modo Invitado</Text>
            </View>
          )}
        </View>
        
        {/* Título con efecto especial */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Explorar Productos</Text>
          <View style={styles.titleUnderline} />
        </View>
        
        <Text style={styles.headerSubtitle}>
          {isGuestMode 
            ? "Explora productos. Inicia sesión para comprar." 
            : "Encuentra lo que necesitas"}
        </Text>
        
        {isGuestMode && (
          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginPromptText}>
              👤 Inicia sesión para comprar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Búsqueda y filtros */}
      <ScrollView
        style={styles.content}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B35"]}
          />
        }
      >
        <View style={styles.filtersContainer}>
          {/* Búsqueda */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos frescos..."
              placeholderTextColor="#94a3b8"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda("")}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros de categoría */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !filtroCategoria && styles.filterChipActive,
              ]}
              onPress={() => {
                setFiltroCategoria("");
                setFiltroSubcategoria("");
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !filtroCategoria && styles.filterChipTextActive,
                ]}
              >
                🌿 Todas
              </Text>
            </TouchableOpacity>

            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.idCategoria}
                style={[
                  styles.filterChip,
                  filtroCategoria === String(cat.idCategoria) &&
                    styles.filterChipActive,
                ]}
                onPress={() => {
                  setFiltroCategoria(String(cat.idCategoria));
                  setFiltroSubcategoria("");
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filtroCategoria === String(cat.idCategoria) &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {cat.nombreCategoria}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subcategorías */}
          {filtroCategoria && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChipSmall,
                  !filtroSubcategoria && styles.filterChipActive,
                ]}
                onPress={() => setFiltroSubcategoria("")}
              >
                <Text
                  style={[
                    styles.filterChipTextSmall,
                    !filtroSubcategoria && styles.filterChipTextActive,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>

              {subcategorias
                .filter((s) => s.idCategoria === parseInt(filtroCategoria))
                .map((sub) => (
                  <TouchableOpacity
                    key={sub.idSubcategoria}
                    style={[
                      styles.filterChipSmall,
                      filtroSubcategoria === String(sub.idSubcategoria) &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFiltroSubcategoria(String(sub.idSubcategoria))
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipTextSmall,
                        filtroSubcategoria === String(sub.idSubcategoria) &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {sub.nombreSubcategoria}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}

          {/* Botón limpiar filtros */}
          {(busqueda || filtroCategoria || filtroSubcategoria) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setBusqueda("");
                setFiltroCategoria("");
                setFiltroSubcategoria("");
              }}
            >
              <Text style={styles.clearFiltersText}>✕ Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultados */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>

        {/* Grid de productos */}
        {productosFiltrados.length > 0 ? (
          <FlatList
            data={productosFiltrados}
            renderItem={renderProducto}
            keyExtractor={(item) => String(item.idProducto)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptyText}>
              {busqueda 
                ? `No encontramos productos con "${busqueda}"`
                : "Intenta ajustar tus filtros de búsqueda"}
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // Efectos de círculos flotantes
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
    backgroundColor: '#FF6B35',
    top: 20,
    left: 20,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: '#3498DB',
    top: 60,
    right: 30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#9B59B6',
    bottom: 40,
    left: 40,
  },
  circle4: {
    width: 60,
    height: 60,
    backgroundColor: '#2ECC71',
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
  guestBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78350f",
    fontFamily: "System",
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
    backgroundColor: '#FF6B35',
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
  loginPrompt: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    zIndex: 1,
  },
  loginPromptText: {
    color: "#15803d",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "System",
  },
  
  content: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: "white",
    padding: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "System",
  },
  clearIcon: {
    fontSize: 18,
    color: "#94a3b8",
    padding: 5,
  },
  filterChip: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    fontFamily: "System",
  },
  filterChipTextActive: {
    color: "white",
  },
  filterChipSmall: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipTextSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    fontFamily: "System",
  },
  clearFiltersButton: {
    backgroundColor: "#fee",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#fcc",
  },
  clearFiltersText: {
    color: "#c33",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "System",
  },
  resultsContainer: {
    padding: 15,
  },
  resultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    fontFamily: "System",
  },
  gridContainer: {
    paddingHorizontal: 15,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "48%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  productImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f1f5f9",
  },
  stockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#2ECC71",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  stockBadgeLow: {
    backgroundColor: "#F39C12",
  },
  stockBadgeOut: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E74C3C",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  stockText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "System",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
    minHeight: 36,
    fontFamily: "System",
  },
  productCategory: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
    fontFamily: "System",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingStars: {
    fontSize: 10,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: "System",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "System",
  },
  productUnit: {
    fontSize: 9,
    color: "#94a3b8",
    fontFamily: "System",
  },
  
  // BOTÓN DE CARRITO ACTUALIZADO - COLOR NARANJA
  addButton: {
    backgroundColor: "#FF6B35",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#9ca3af",
  },
  addButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
    fontFamily: "System",
  },
  
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    fontFamily: "System",
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "System",
  },
});