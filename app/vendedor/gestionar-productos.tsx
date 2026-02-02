import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_CONFIG } from '../../config';

const { width } = Dimensions.get('window');
const API_BASE_URL = API_CONFIG.BASE_URL;

// TIPOS
interface User {
  idVendedor?: string;
  id?: string;
  idUsuario?: string;
  _id?: string;
  nombre?: string;
  username?: string;
  email?: string;
  rol: string;
}

interface Producto {
  idProducto: string;
  nombreProducto: string;
  descripcionProducto: string;
  precioProducto: number;
  stockProducto: number;
  imagenProducto: string;
  estado: string;
  unidad: string;
  fechaCreacion?: string;
  categoria?: {
    nombreCategoria: string;
  };
  subcategoria?: {
    nombreSubcategoria: string;
  };
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

export default function GestionarProductos() {
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Verificar autenticación y cargar datos
  useEffect(() => {
    verificarVendedorYCargar();
  }, []);

  const verificarVendedorYCargar = async () => {
    try {
      const rol = await AsyncStorage.getItem('rol');
      const token = await AsyncStorage.getItem('authToken');
      const userDataString = await AsyncStorage.getItem('user');

      if (!token || rol !== 'VENDEDOR') {
        Alert.alert('Acceso restringido', 'Debes ser vendedor para ver los productos');
        await AsyncStorage.clear();
        router.replace('/login');
        return;
      }

      const userData: User = JSON.parse(userDataString || '{}');
      setUser(userData);
      await cargarProductos(token, userData);
    } catch (error) {
      console.error('Error verificando vendedor:', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async (token: string, userData: User) => {
    try {
      const vendedorId = userData.idVendedor || userData.idUsuario || userData.id || userData._id;
      if (!vendedorId) {
        throw new Error('No se encontró ID del vendedor');
      }

      const response = await fetch(
        `${API_BASE_URL}/productos/vendedor/${vendedorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Productos cargados:', data);
        setProductos(Array.isArray(data) ? data : data.data || []);
      } else {
        throw new Error('Error al cargar productos');
      }
    } catch (error: any) {
      console.error('❌ Error cargando productos:', error);
      setError('Error al cargar los productos');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    verificarVendedorYCargar();
  };

  // Función auxiliar para obtener el ID del usuario
  const getUserId = (user: User | null): string | undefined => {
    if (!user) return undefined;
    return user.idUsuario || user.idVendedor || user.id || user._id;
  };

  // Filtrar productos según búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.nombreProducto.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.descripcionProducto?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Función para formatear precio
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  // Función para obtener color según estado
  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'disponible':
      case 'activo':
        return '#10B981'; // Verde
      case 'agotado':
        return '#EF4444'; // Rojo
      case 'pendiente':
        return '#F59E0B'; // Amarillo
      default:
        return '#6B7280'; // Gris
    }
  };

  // Función para obtener icono según estado
  const getEstadoIcono = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'disponible':
      case 'activo':
        return '✅';
      case 'agotado':
        return '🛑';
      case 'pendiente':
        return '⏳';
      default:
        return '❓';
    }
  };

  // Componente de Tarjeta de Producto - SOLO VISUALIZACIÓN
  const ProductoCard = ({ producto }: { producto: Producto }) => (
    <View style={styles.productoCard}>
      {/* Imagen del Producto */}
      <View style={styles.productoImageContainer}>
        {producto.imagenProducto ? (
          <Image
            source={{ uri: producto.imagenProducto }}
            style={styles.productoImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productoImagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color="#94a3b8" />
          </View>
        )}
        
        {/* Badge de Estado */}
        <View style={[
          styles.estadoBadge,
          { backgroundColor: getEstadoColor(producto.estado) + '20' }
        ]}>
          <Text style={[
            styles.estadoBadgeText,
            { color: getEstadoColor(producto.estado) }
          ]}>
            {getEstadoIcono(producto.estado)} {producto.estado || 'No especificado'}
          </Text>
        </View>
      </View>

      {/* Información del Producto */}
      <View style={styles.productoInfo}>
        <View style={styles.productoHeader}>
          <Text style={styles.productoNombre} numberOfLines={2}>
            {producto.nombreProducto}
          </Text>
          
          {/* 📊 Info rápida */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={14} color="#FF6B35" />
              <Text style={styles.statText}>${formatPrecio(producto.precioProducto)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={14} color="#3498DB" />
              <Text style={styles.statText}>{producto.stockProducto} {producto.unidad}</Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        {producto.descripcionProducto && (
          <Text style={styles.productoDescripcion} numberOfLines={3}>
            {producto.descripcionProducto}
          </Text>
        )}

        {/* Categorías */}
        <View style={styles.categoriasContainer}>
          {producto.categoria && (
            <View style={styles.categoriaBadge}>
              <Text style={styles.categoriaText}>{producto.categoria.nombreCategoria}</Text>
            </View>
          )}
          {producto.subcategoria && (
            <View style={styles.subcategoriaBadge}>
              <Text style={styles.subcategoriaText}>{producto.subcategoria.nombreSubcategoria}</Text>
            </View>
          )}
        </View>

        {/* Botón VER DETALLE (solo visualización) */}
        <TouchableOpacity
          style={styles.verDetalleButton}
          onPress={() => {
            Alert.alert(
              'Solo Visualización',
              'Esta función está en modo de solo visualización.',
              [{ text: 'Entendido', style: 'default' }]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={18} color="#64748b" />
          <Text style={styles.verDetalleText}>Ver Detalle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
        <View style={styles.loadingCircles}>
          <View style={[styles.loadingCircle, { backgroundColor: '#FF6B35' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#3498DB' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#2ECC71' }]} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#FF6B35"]}
            tintColor="#FF6B35"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <FloatingCircles />
          
          <View style={styles.headerTop}>
            <Text style={styles.headerIcon}>📦</Text>
            {user && (
              <View style={styles.userBadge}>
                <Text style={styles.userBadgeText}>👑 Vendedor</Text>
              </View>
            )}
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Mis Productos</Text>
            <View style={styles.titleUnderline} />
          </View>

          <Text style={styles.headerSubtitle}>
            Visualización de tu catálogo de productos
          </Text>

          {/* Contador de Productos */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{productos.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {productos.filter(p => p.estado?.toLowerCase() === 'disponible').length}
              </Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                {productos.filter(p => p.estado?.toLowerCase() === 'agotado').length}
              </Text>
              <Text style={styles.statLabel}>Agotados</Text>
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={24} color="#E74C3C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              placeholderTextColor="#94a3b8"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Info de solo visualización */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#FF6B35" />
            <Text style={styles.infoText}>Modo solo visualización</Text>
          </View>
        </View>

        {/* Lista de Productos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {busqueda ? `Resultados (${productosFiltrados.length})` : 'Todos los Productos'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {productos.length} productos en total
            </Text>
          </View>

          {productosFiltrados.length > 0 ? (
            <View style={styles.productosGrid}>
              {productosFiltrados.map((producto) => (
                <ProductoCard key={producto.idProducto} producto={producto} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyStateTitle}>
                {busqueda ? 'No se encontraron productos' : 'No hay productos'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {busqueda 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Tus productos aparecerán aquí'}
              </Text>
              
              {/* Botón de recargar */}
              <TouchableOpacity 
                style={styles.reloadButton}
                onPress={onRefresh}
              >
                <Ionicons name="refresh-outline" size={20} color="#FF6B35" />
                <Text style={styles.reloadButtonText}>Recargar productos</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Información Final */}
        <View style={styles.finalInfo}>
          <Ionicons name="eye-outline" size={24} color="#64748b" />
          <Text style={styles.finalInfoTitle}>Modo Solo Visualización</Text>
          <Text style={styles.finalInfoText}>
            Esta pantalla muestra todos tus productos. Para editar o eliminar productos, 
            contacta con el administrador del sistema.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* No hay botón flotante de agregar producto */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
    fontFamily: 'System',
  },
  loadingCircles: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  loadingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
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
    backgroundColor: '#2ECC71',
    bottom: 40,
    left: 40,
  },
  circle4: {
    width: 60,
    height: 60,
    backgroundColor: '#9B59B6',
    bottom: 80,
    right: 50,
  },

  // Header
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  headerIcon: {
    fontSize: 40,
  },
  userBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
    fontFamily: 'System',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    fontFamily: 'System',
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
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'System',
    zIndex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'System',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#e5e7eb',
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee',
    borderWidth: 1,
    borderColor: '#fcc',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#c33',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'System',
  },

  // Búsqueda
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
    fontFamily: 'System',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2E8',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  infoText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Sección
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'System',
  },

  // Grid de productos
  productosGrid: {
    gap: 16,
  },

  // Tarjeta de producto
  productoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productoImageContainer: {
    height: 200,
    position: 'relative',
  },
  productoImage: {
    width: '100%',
    height: '100%',
  },
  productoImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estadoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  estadoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'System',
  },
  productoInfo: {
    padding: 20,
  },
  productoHeader: {
    marginBottom: 12,
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'System',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },
  productoDescripcion: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'System',
  },
  categoriasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoriaBadge: {
    backgroundColor: '#E9D5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoriaText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    fontFamily: 'System',
  },
  subcategoriaBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subcategoriaText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: 'System',
  },
  verDetalleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  verDetalleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },

  // Empty State
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2E8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  reloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    fontFamily: 'System',
  },

  // Información final
  finalInfo: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  finalInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  finalInfoText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
});

// Necesitamos agregar el import de TextInput
import { TextInput } from 'react-native';

