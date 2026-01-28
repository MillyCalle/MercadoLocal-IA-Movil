// app/vendedor/gestionar-pedidos.tsx (versión mejorada con mejor distribución)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG } from "../../config";

const { width } = Dimensions.get('window');

interface Pedido {
  idPedido: number;
  idPedidoVendedor: number;
  nombreCliente: string;
  total: number;
  fecha: string;
  estadoPedido: string;
  estadoPedidoVendedor: string;
  estadoPago: string;
  estadoSeguimiento: string;
}

export default function GestionarPedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("TODOS");
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    completados: 0,
    enProceso: 0,
    pendientesPago: 0,
    cancelados: 0,
    totalVentas: 0,
  });

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("user");
      
      if (!token || !userData) {
        Alert.alert("Error", "Sesión expirada");
        router.replace("/login");
        return;
      }

      const user = JSON.parse(userData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/pedidos/vendedor/${user.idVendedor}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Error al cargar pedidos");

      const data = await response.json();

      // Normalizar los datos
      const pedidosNormalizados: Pedido[] = data
        .sort((a: any, b: any) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime())
        .map((p: any) => ({
          idPedido: p.idPedido,
          idPedidoVendedor: p.idPedidoVendedor,
          nombreCliente: p.consumidor?.usuario
            ? `${p.consumidor.usuario.nombre} ${p.consumidor.usuario.apellido}`
            : "Cliente sin nombre",
          total: p.total || 0,
          fecha: p.fechaPedido,
          estadoPedido: p.estadoPedido,
          estadoPedidoVendedor: p.estadoPedidoVendedor,
          estadoPago: p.estadoPago,
          estadoSeguimiento: p.estadoSeguimientoPedido
        }));

      setPedidos(pedidosNormalizados);
      calcularEstadisticas(pedidosNormalizados);
    } catch (error) {
      console.error("❌ Error cargando pedidos:", error);
      Alert.alert("Error", "No se pudieron cargar los pedidos");
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  const calcularEstadisticas = (pedidosList: Pedido[]) => {
    const total = pedidosList.length;
    const completados = pedidosList.filter(p => obtenerEstadoParaMostrar(p) === "Entregado").length;
    const enProceso = pedidosList.filter(p => ["Nuevo", "En Proceso", "Despachado"].includes(obtenerEstadoParaMostrar(p))).length;
    const pendientesPago = pedidosList.filter(p => obtenerEstadoParaMostrar(p) === "Esperando pago").length;
    const cancelados = pedidosList.filter(p => obtenerEstadoParaMostrar(p) === "Cancelado").length;
    const totalVentas = pedidosList.filter(p => p.estadoPago === "PAGADO").reduce((sum, p) => sum + p.total, 0);

    setEstadisticas({
      total,
      completados,
      enProceso,
      pendientesPago,
      cancelados,
      totalVentas,
    });
  };

  const obtenerEstadoParaMostrar = (pedido: Pedido) => {
    if (pedido.estadoPedido === "CANCELADO" || pedido.estadoPago === "CANCELADO") {
      return "Cancelado";
    }
    
    if (pedido.estadoPago === "PENDIENTE") {
      return "Esperando pago";
    }
    
    if (pedido.estadoPago === "EN_VERIFICACION") {
      return "Verificando pago";
    }
    
    if (pedido.estadoPago === "RECHAZADO") {
      return "Pago rechazado";
    }
    
    if (pedido.estadoPago === "PAGADO") {
      const estadoMap: Record<string, string> = {
        "NUEVO": "Nuevo",
        "EN_PROCESO": "En Proceso",
        "DESPACHADO": "Despachado",
        "ENTREGADO": "Entregado",
        "CANCELADO": "Cancelado"
      };
      return estadoMap[pedido.estadoPedidoVendedor] || pedido.estadoPedidoVendedor;
    }
    
    return pedido.estadoPedido || "Pendiente";
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      "Nuevo": "#F59E0B",
      "En Proceso": "#3B82F6",
      "Despachado": "#10B981",
      "Entregado": "#059669",
      "Cancelado": "#EF4444",
      "Esperando pago": "#D97706",
      "Verificando pago": "#0E7490",
      "Pago rechazado": "#B91C1C",
      "Pendiente": "#64748B"
    };
    return colores[estado] || "#64748B";
  };

  const obtenerBgColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      "Nuevo": "#FFF9E6",
      "En Proceso": "#DBEAFE",
      "Despachado": "#D1FAE5",
      "Entregado": "#DCFCE7",
      "Cancelado": "#FEE2E2",
      "Esperando pago": "#FEF3C7",
      "Verificando pago": "#CFFAFE",
      "Pago rechazado": "#FEE2E2",
      "Pendiente": "#F1F5F9"
    };
    return colores[estado] || "#F1F5F9";
  };

  const filtrarPedidos = () => {
    let pedidosFiltrados = pedidos;
    
    if (selectedFilter !== "TODOS") {
      pedidosFiltrados = pedidosFiltrados.filter(p => 
        obtenerEstadoParaMostrar(p) === selectedFilter
      );
    }
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      pedidosFiltrados = pedidosFiltrados.filter(p =>
        p.nombreCliente.toLowerCase().includes(query) ||
        p.idPedido.toString().includes(query) ||
        p.idPedidoVendedor.toString().includes(query)
      );
    }
    
    return pedidosFiltrados;
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarPedidos();
  };

  const handleVerDetalles = (pedido: Pedido) => {
    router.push(`/vendedor/pedido/${pedido.idPedido}` as any);
  };

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    const fechaFormateada = fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: fecha.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined
    });
    
    const tiempoFormateado = fecha.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (fecha.toDateString() === hoy.toDateString()) {
      return `Hoy, ${tiempoFormateado}`;
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return `Ayer, ${tiempoFormateado}`;
    }
    
    return fechaFormateada;
  };

  const renderTarjetaPedido = ({ item, index }: { item: Pedido, index: number }) => {
    const estado = obtenerEstadoParaMostrar(item);
    const colorEstado = obtenerColorEstado(estado);
    const bgColorEstado = obtenerBgColorEstado(estado);

    return (
      <TouchableOpacity
        style={[styles.card, index === 0 && { marginTop: 10 }]}
        onPress={() => handleVerDetalles(item)}
        activeOpacity={0.9}
      >
        {/* Indicador lateral de color */}
        <View style={[styles.cardIndicator, { backgroundColor: colorEstado }]} />
        
        {/* Encabezado del pedido */}
        <View style={styles.cardHeader}>
          <View style={styles.pedidoHeaderLeft}>
            <View style={styles.numeroPedidoContainer}>
              <Text style={styles.numeroLabel}>Pedido</Text>
              <Text style={styles.pedidoNumero}>#{item.idPedidoVendedor || item.idPedido}</Text>
            </View>
            <Text style={styles.clienteNombre} numberOfLines={1}>
              👤 {item.nombreCliente}
            </Text>
          </View>
          
          <View style={[styles.estadoBadge, { backgroundColor: bgColorEstado }]}>
            <View style={[styles.estadoDot, { backgroundColor: colorEstado }]} />
            <Text style={[styles.estadoText, { color: colorEstado }]}>
              {estado.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Información del pedido */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>📅 FECHA</Text>
              <Text style={styles.infoValue}>{formatFecha(item.fecha)}</Text>
            </View>
            
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>💰 TOTAL</Text>
              <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Estado del pago */}
          {item.estadoPago && (
            <View style={styles.pagoContainer}>
              {item.estadoPago === "PAGADO" ? (
                <View style={[styles.pagoBadge, styles.pagoVerificado]}>
                  <Text style={styles.pagoBadgeText}>✅ Pago confirmado</Text>
                </View>
              ) : item.estadoPago === "PENDIENTE" ? (
                <View style={[styles.pagoBadge, styles.pagoPendiente]}>
                  <Text style={styles.pagoBadgeText}>⏳ Pago pendiente</Text>
                </View>
              ) : item.estadoPago === "EN_VERIFICACION" ? (
                <View style={[styles.pagoBadge, styles.pagoVerificando]}>
                  <Text style={styles.pagoBadgeText}>🔍 Verificando pago</Text>
                </View>
              ) : (
                <View style={[styles.pagoBadge, styles.pagoProblema]}>
                  <Text style={styles.pagoBadgeText}>⚠️ Pago rechazado</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Botón de acciones */}
        <TouchableOpacity
          style={styles.detallesButton}
          onPress={() => handleVerDetalles(item)}
        >
          <Text style={styles.detallesButtonText}>🔍 Ver detalles completos</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEstadisticas = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Resumen General</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContent}
      >
        {[
          { icon: "📦", value: estadisticas.total, label: "Total Pedidos", color: "#FF6B35", bgColor: "#FFF2E8" },
          { icon: "💰", value: `$${estadisticas.totalVentas.toFixed(0)}`, label: "Ventas", color: "#3B82F6", bgColor: "#EFF6FF" },
          { icon: "✅", value: estadisticas.completados, label: "Completados", color: "#10B981", bgColor: "#ECFDF5" },
          { icon: "⚙️", value: estadisticas.enProceso, label: "En Proceso", color: "#8B5CF6", bgColor: "#F5F3FF" },
        ].map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
            </View>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedFilter !== "TODOS" ? "No hay resultados" : "No hay pedidos"}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedFilter !== "TODOS" 
          ? "No se encontraron pedidos con los filtros aplicados"
          : "Los pedidos de tus clientes aparecerán aquí"
        }
      </Text>
      {(searchQuery || selectedFilter !== "TODOS") && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setSearchQuery("");
            setSelectedFilter("TODOS");
          }}
        >
          <Text style={styles.resetButtonText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (cargando && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header con círculos decorativos */}
      <View style={styles.header}>
        {/* Círculos decorativos de fondo */}
        <View style={styles.circlesContainer}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
          <View style={[styles.circle, styles.circle4]} />
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>Panel de Pedidos</Text>
          <Text style={styles.headerTitle}>Gestión de Pedidos</Text>
          <Text style={styles.headerDescription}>
            Resumen completo de tu negocio
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pedido o cliente..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {["TODOS", "Nuevo", "En Proceso", "Despachado", "Entregado", "Cancelado"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Pedidos */}
      <View style={styles.pedidosContainer}>
        {filtrarPedidos().length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.resultCountContainer}>
              <Text style={styles.resultCount}>
                {filtrarPedidos().length} pedido{filtrarPedidos().length !== 1 ? 's' : ''} encontrado{filtrarPedidos().length !== 1 ? 's' : ''}
              </Text>
            </View>
            <FlatList
              data={filtrarPedidos()}
              renderItem={renderTarjetaPedido}
              keyExtractor={(item) => `${item.idPedidoVendedor}-${item.idPedido}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#FF6B35"]}
                  tintColor="#FF6B35"
                />
              }
              ListFooterComponent={<View style={styles.listFooter} />}
            />
          </>
        )}
      </View>
    </SafeAreaView>
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
    color: "#64748b",
    fontWeight: "500",
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    position: "relative",
    overflow: "hidden",
  },
  circlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.12,
  },
  circle1: {
    width: 120,
    height: 120,
    backgroundColor: "#FFB4A2",
    top: -40,
    left: -20,
  },
  circle2: {
    width: 100,
    height: 100,
    backgroundColor: "#A7F3D0",
    bottom: -30,
    left: 30,
  },
  circle3: {
    width: 90,
    height: 90,
    backgroundColor: "#BFDBFE",
    top: -20,
    right: -10,
  },
  circle4: {
    width: 80,
    height: 80,
    backgroundColor: "#DDD6FE",
    bottom: -20,
    right: 40,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
    zIndex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "#FF6B35",
    marginBottom: 6,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 6,
  },
  headerDescription: {
    fontSize: 13,
    color: "#8B5CF6",
    fontWeight: "500",
    opacity: 0.8,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    zIndex: 1,
  },
  refreshIcon: {
    fontSize: 18,
  },
  
  // Estadísticas
  statsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statsContent: {
    paddingVertical: 4,
  },
  statCard: {
    width: 140,
    height: 130,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  
  // Búsqueda
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    fontSize: 16,
    color: "#94a3b8",
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
  clearIcon: {
    fontSize: 18,
    color: "#94a3b8",
    padding: 4,
  },
  
  // Filtros
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  filterChipTextActive: {
    color: "white",
  },
  
  // Lista de Pedidos
  pedidosContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  resultCountContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  listFooter: {
    height: 100,
  },
  
  // Tarjeta de Pedido
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  cardIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 8,
  },
  pedidoHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  numeroPedidoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  numeroLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginRight: 6,
  },
  pedidoNumero: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
  },
  clienteNombre: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 90,
    justifyContent: 'center',
  },
  estadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },
  totalText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FF6B35",
  },
  pagoContainer: {
    marginTop: 4,
  },
  pagoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pagoBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pagoVerificado: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  pagoPendiente: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  pagoVerificando: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
  },
  pagoProblema: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  detallesButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  detallesButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  
  // Estado vacío
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
});