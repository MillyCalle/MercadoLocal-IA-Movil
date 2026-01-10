import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

// 🔥 TIPOS
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

export default function ExploreTab() {
  const router = useRouter();

  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");

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

  // 🔥 FILTROS
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

  // 🔥 AGREGAR AL CARRITO
  const handleAgregarCarrito = async (producto: Producto) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para agregar productos al carrito",
          [
            { text: "Cancelar" },
            { text: "Iniciar sesión", onPress: () => router.push("/login") },
          ]
        );
        return;
      }

      const user = JSON.parse(userStr);

      const response = await fetch(`${API_CONFIG.BASE_URL}/carrito/agregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idUsuario: user.idUsuario,
          idProducto: producto.idProducto,
          cantidad: 1,
        }),
      });

      if (!response.ok) throw new Error("Error al agregar al carrito");

      Alert.alert("¡Agregado!", `${producto.nombreProducto} agregado al carrito`);
    } catch (error) {
      console.error("Error agregando al carrito:", error);
      Alert.alert("Error", "No se pudo agregar el producto al carrito");
    }
  };

  // 🔥 VER DETALLE
  const handleProductoPress = (producto: Producto) => {
    // @ts-ignore
    router.push(`/producto/${producto.idProducto}`);
  };

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

      {item.stockProducto > 0 && (
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
            <Text style={styles.productPrice}>${item.precioProducto}</Text>
            {item.unidadMedida && (
              <Text style={styles.productUnit}>{item.unidadMedida}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAgregarCarrito(item)}
          >
            <Text style={styles.addButtonText}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b8e4e" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🛒</Text>
        <Text style={styles.headerTitle}>Explorar Productos</Text>
        <Text style={styles.headerSubtitle}>
          Encuentra lo que necesitas
        </Text>
      </View>

      {/* Búsqueda y filtros */}
      <ScrollView
        style={styles.content}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6b8e4e"]}
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

          {/* Subcategorías (si hay categoría seleccionada) */}
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
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3a5a40",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
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
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
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
    backgroundColor: "#6b8e4e",
    borderColor: "#6b8e4e",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
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
  },
  resultsContainer: {
    padding: 15,
  },
  resultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
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
    borderRadius: 12,
    width: "48%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: "#6b8e4e",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  stockBadgeLow: {
    backgroundColor: "#f59e0b",
  },
  stockText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
  },
  productCategory: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
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
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b8e4e",
  },
  productUnit: {
    fontSize: 9,
    color: "#94a3b8",
  },
  addButton: {
    backgroundColor: "#6b8e4e",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
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
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});