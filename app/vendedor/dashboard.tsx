import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG } from "../../config";

const { width, height } = Dimensions.get("window");
const API_BASE_URL = API_CONFIG.BASE_URL;

// TIPOS
interface User {
  nombre?: string;
  username?: string;
  email?: string;
  rol: string;
  idVendedor?: string;
  id?: string;
  _id?: string;
}

interface Estadisticas {
  ingresosTotales: number;
  pedidos: number;
  productosDisponibles: number;
}

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  estado: string;
  total: number;
  fecha?: string;
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

export default function DashboardVendedor() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Estadisticas>({
    ingresosTotales: 0,
    pedidos: 0,
    productosDisponibles: 0,
  });
  const [pedidosRecientes, setPedidosRecientes] = useState<Pedido[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const rol = await AsyncStorage.getItem("rol");
        const token = await AsyncStorage.getItem("authToken");
        
        if (!token || rol !== "VENDEDOR") {
          console.log("❌ No autorizado como vendedor");
          await AsyncStorage.clear();
          router.replace("/login");
          return;
        }
        
        console.log("✅ Usuario autorizado como vendedor");
        cargarDatos();
      } catch (error) {
        console.error("Error verificando rol:", error);
        router.replace("/login");
      }
    };
    
    checkAuth();
  }, []);

  const cargarDatos = async () => {
    try {
      setError(null);
      const userDataString = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");
      
      if (!userDataString || !token) {
        router.replace("/login");
        return;
      }

      const userData: User = JSON.parse(userDataString);
      setUser(userData);
      
      const vendedorId = userData.idVendedor || userData.id || userData._id;
      if (!vendedorId) {
        throw new Error("No se encontró ID del vendedor");
      }
      
      // Cargar estadísticas
      const statsData = await cargarEstadisticas(token, vendedorId);
      if (statsData) {
        setStats({
          ingresosTotales: statsData.ingresosTotales || statsData.ingresos || 0,
          pedidos: statsData.totalPedidos || statsData.pedidos || 0,
          productosDisponibles: statsData.productosDisponibles || statsData.productos || 0,
        });
      }
      
      // Cargar pedidos recientes
      await cargarPedidosRecientes(token, vendedorId);
      
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      setError(error.message || "Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cargarEstadisticas = async (token: string, vendedorId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendedor/${vendedorId}/estadisticas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Estadísticas cargadas:", data);
        return data;
      } else {
        console.log("⚠️ No se pudieron cargar estadísticas");
        return {
          ingresosTotales: 0,
          totalPedidos: 0,
          productosDisponibles: 0
        };
      }
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
      return {
        ingresosTotales: 0,
        totalPedidos: 0,
        productosDisponibles: 0
      };
    }
  };

  const getClienteNombre = (pedido: any): string => {
    if (pedido.clienteNombre) return pedido.clienteNombre;
    if (pedido.nombreCliente) return pedido.nombreCliente;
    if (pedido.cliente) {
      if (typeof pedido.cliente === 'string') return pedido.cliente;
      if (pedido.cliente.nombre) {
        return `${pedido.cliente.nombre || ''} ${pedido.cliente.apellido || ''}`.trim();
      }
    }
    return "Cliente";
  };

  const cargarPedidosRecientes = async (token: string, vendedorId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendedor/${vendedorId}/pedidos/recientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Pedidos recientes cargados:", data);
        
        let pedidosFormateados: Pedido[] = [];
        
        if (Array.isArray(data)) {
          pedidosFormateados = data.map((pedido: any) => ({
            id: pedido.id || pedido._id || pedido.idPedido || "N/A",
            numero: pedido.numero || pedido.id || pedido._id || "N/A",
            cliente: getClienteNombre(pedido),
            estado: pedido.estado || "PENDIENTE",
            total: pedido.total || pedido.montoTotal || pedido.precioTotal || 0,
            fecha: pedido.fecha || pedido.fechaCreacion || pedido.createdAt || new Date().toISOString(),
          }));
        }
        
        setPedidosRecientes(pedidosFormateados.slice(0, 3));
      } else {
        console.log("⚠️ No se pudieron cargar pedidos recientes");
        setPedidosRecientes([]);
      }
    } catch (error) {
      console.error("❌ Error cargando pedidos recientes:", error);
      setPedidosRecientes([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const navigateTo = (route: string) => {
    router.push(`./${route}`);
  };

  // Componente de Tarjeta de Estadística - Estilo actualizado
  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <View style={[styles.statCircle, { backgroundColor: color + '20' }]} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
        <View style={styles.loadingCircles}>
          <View style={[styles.loadingCircle, { backgroundColor: '#FF6B35' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#3498DB' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#9B59B6' }]} />
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
      >
        {/* Header con efectos visuales */}
        <View style={styles.header}>
          {/* Círculos flotantes de fondo */}
          <FloatingCircles />
          
          <View style={styles.headerTop}>
            <Text style={styles.headerIcon}>📊</Text>
            {user && (
              <View style={styles.userBadge}>
                <Text style={styles.userBadgeText}>👑 Vendedor</Text>
              </View>
            )}
          </View>
          
          {/* Título con efecto especial */}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Tablero Vendedor</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Resumen completo de tu negocio
          </Text>
          
          {user && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeIcon}>👋</Text>
              <Text style={styles.welcomeText}>
                ¡Hola, {user.nombre || user.username || user.email || "Vendedor"}!
              </Text>
            </View>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={24} color="#DA3E52" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={cargarDatos}>
              <Ionicons name="refresh" size={20} color="#DA3E52" />
            </TouchableOpacity>
          </View>
        )}

        {/* Estadísticas - Nuevo diseño */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <Text style={styles.sectionSubtitle}>
            Estado actual de tu negocio
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Ingresos Totales"
              value={`$${stats.ingresosTotales.toLocaleString('es-ES', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}`}
              icon="💰"
              color="#FF6B35"
              onPress={() => navigateTo("gestionar-pedidos")}
            />
            
            <StatCard
              title="Pedidos Activos"
              value={stats.pedidos.toLocaleString()}
              icon="📦"
              color="#3498DB"
              onPress={() => navigateTo("gestionar-pedidos")}
            />
            
            <StatCard
              title="Productos Disponibles"
              value={stats.productosDisponibles.toLocaleString()}
              icon="🛒"
              color="#2ECC71"
              onPress={() => navigateTo("gestionar-productos")}
            />
            
            <StatCard
              title="Ventas Hoy"
              value="0"
              icon="📈"
              color="#9B59B6"
              onPress={() => navigateTo("gestionar-pedidos")}
            />
          </View>
        </View>

        {/* Acciones Rápidas - Nuevo diseño */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <Text style={styles.sectionSubtitle}>
                Gestiona tu negocio rápidamente
              </Text>
            </View>
            <View style={styles.actionsIndicator}>
              <View style={[styles.indicatorDot, { backgroundColor: '#FF6B35' }]} />
              <View style={[styles.indicatorDot, { backgroundColor: '#FF6B35', opacity: 0.5 }]} />
              <View style={[styles.indicatorDot, { backgroundColor: '#FF6B35', opacity: 0.3 }]} />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.actionsScroll}
            contentContainerStyle={styles.actionsContainer}
          >
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#FF6B35' }]}
              onPress={() => navigateTo("agregar-producto")}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle-outline" size={32} color="white" />
              </View>
              <Text style={styles.actionTitle}>Agregar Producto</Text>
              <Text style={styles.actionDescription}>
                Añade nuevos productos a tu catálogo
              </Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#3498DB' }]}
              onPress={() => navigateTo("gestionar-productos")}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="cube-outline" size={32} color="white" />
              </View>
              <Text style={styles.actionTitle}>Gestionar Productos</Text>
              <Text style={styles.actionDescription}>
                Administra tu inventario y precios
              </Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#2ECC71' }]}
              onPress={() => navigateTo("gestionar-pedidos")}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="clipboard-outline" size={32} color="white" />
              </View>
              <Text style={styles.actionTitle}>Gestionar Pedidos</Text>
              <Text style={styles.actionDescription}>
                Controla los pedidos de tus clientes
              </Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Pedidos Recientes - Nuevo diseño */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Pedidos Recientes</Text>
              <Text style={styles.sectionSubtitle}>
                Últimos pedidos de tus clientes
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigateTo("gestionar-pedidos")}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
              <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
            </TouchableOpacity>
          </View>

          {pedidosRecientes.length > 0 ? (
            <View style={styles.pedidosContainer}>
              {pedidosRecientes.map((pedido) => (
                <TouchableOpacity
                  key={pedido.id}
                  style={styles.pedidoCard}
                  activeOpacity={0.8}
                  onPress={() => navigateTo("gestionar-pedidos")}
                >
                  <View style={styles.pedidoHeader}>
                    <View style={styles.pedidoNumberContainer}>
                      <Ionicons name="receipt-outline" size={20} color="#64748b" />
                      <Text style={styles.pedidoNumero}># {pedido.numero}</Text>
                    </View>
                    <View
                      style={[
                        styles.estadoBadge,
                        { 
                          backgroundColor: pedido.estado === "PENDIENTE" 
                            ? "#FEF3C7" 
                            : pedido.estado === "COMPLETADO" 
                              ? "#D1FAE5" 
                              : "#DBEAFE" 
                        }
                      ]}
                    >
                      <Text style={[
                        styles.estadoText,
                        { 
                          color: pedido.estado === "PENDIENTE" 
                            ? "#92400E" 
                            : pedido.estado === "COMPLETADO" 
                              ? "#065F46" 
                              : "#1E40AF" 
                        }
                      ]}>
                        {pedido.estado}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.pedidoCliente}>
                    <Ionicons name="person-outline" size={14} color="#64748b" /> {pedido.cliente}
                  </Text>
                  
                  {pedido.fecha && (
                    <Text style={styles.pedidoFecha}>
                      <Ionicons name="calendar-outline" size={14} color="#64748b" /> {new Date(pedido.fecha).toLocaleDateString('es-ES')}
                    </Text>
                  )}
                  
                  <View style={styles.pedidoFooter}>
                    <Text style={styles.pedidoTotalLabel}>Total:</Text>
                    <Text style={styles.pedidoTotal}>${pedido.total.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyStateText}>No hay pedidos recientes</Text>
              <Text style={styles.emptyStateSubtext}>
                Los pedidos nuevos aparecerán aquí
              </Text>
              <TouchableOpacity onPress={cargarDatos} style={styles.reintentarButton}>
                <Text style={styles.reintentarText}>🔄 Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sección de Análisis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Análisis de Rendimiento</Text>
              <Text style={styles.sectionSubtitle}>
                Estadísticas de tu negocio
              </Text>
            </View>
            <View style={styles.statsIndicator}>
              <Text style={styles.statsIndicatorText}>📈</Text>
            </View>
          </View>

          <View style={styles.analiticaCard}>
            <View style={styles.analiticaIconContainer}>
              <Ionicons name="stats-chart" size={48} color="#FF6B35" />
            </View>
            <Text style={styles.analiticaTitle}>
              Todo bajo control
            </Text>
            <Text style={styles.analiticaDescription}>
              Tu negocio está creciendo constantemente
            </Text>
            
            <View style={styles.analiticaStats}>
              <View style={styles.analiticaStat}>
                <Text style={styles.analiticaStatLabel}>Ingresos Totales</Text>
                <Text style={styles.analiticaStatValue}>
                  ${stats.ingresosTotales.toLocaleString('es-ES', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </Text>
              </View>
              
              <View style={styles.analiticaDivider} />
              
              <View style={styles.analiticaStat}>
                <Text style={styles.analiticaStatLabel}>Productos Activos</Text>
                <Text style={styles.analiticaStatValue}>
                  {stats.productosDisponibles}
                </Text>
              </View>
              
              <View style={styles.analiticaDivider} />
              
              <View style={styles.analiticaStat}>
                <Text style={styles.analiticaStatLabel}>Pedidos Totales</Text>
                <Text style={styles.analiticaStatValue}>
                  {stats.pedidos}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Llamado a la acción */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>¿Necesitas ayuda?</Text>
            <Text style={styles.ctaDescription}>
              Consulta nuestro centro de ayuda o contacta con soporte
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => navigateTo("perfil-vendedor")}
            >
              <Text style={styles.ctaButtonText}>Ir al Soporte →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espacio final */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // Loading
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
  
  // Header mejorado
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 30,
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
  userBadge: {
    backgroundColor: "#FFEAA7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#F9D94A",
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D35400",
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
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  welcomeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803d",
    fontFamily: "System",
  },
  
  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#DA3E52",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: "#DA3E52",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "System",
  },
  
  // Secciones
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
    fontWeight: "700",
    color: "#2C3E50",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    fontFamily: "System",
  },
  
  // Estadísticas
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
    fontFamily: "System",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2C3E50",
    fontFamily: "System",
  },
  statCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -20,
    right: -20,
    opacity: 0.2,
  },
  
  // Indicadores
  actionsIndicator: {
    flexDirection: "row",
    gap: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Acciones rápidas
  actionsScroll: {
    marginBottom: 10,
  },
  actionsContainer: {
    gap: 16,
  },
  actionCard: {
    width: 280,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIconContainer: {
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    fontFamily: "System",
  },
  actionDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
    fontFamily: "System",
    lineHeight: 18,
  },
  actionArrow: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  
  // Botón Ver todos
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2E8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  seeAllText: {
    fontSize: 13,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
    marginRight: 6,
  },
  
  // Pedidos
  pedidosContainer: {
    gap: 12,
  },
  pedidoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pedidoNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pedidoNumero: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C3E50",
    marginLeft: 8,
    fontFamily: "System",
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "System",
  },
  pedidoCliente: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontFamily: "System",
  },
  pedidoFecha: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 16,
    fontFamily: "System",
  },
  pedidoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  pedidoTotalLabel: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "System",
  },
  pedidoTotal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // Estado vacío
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    color: "#2C3E50",
    fontWeight: "600",
    fontFamily: "System",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
    fontFamily: "System",
  },
  reintentarButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
  },
  reintentarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "System",
  },
  
  // Indicador de estadísticas
  statsIndicator: {
    backgroundColor: "#FF6B35",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsIndicatorText: {
    fontSize: 20,
    color: "white",
  },
  
  // Tarjeta analítica
  analiticaCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  analiticaIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  analiticaTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "System",
  },
  analiticaDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "System",
  },
  analiticaStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  analiticaStat: {
    flex: 1,
    alignItems: "center",
  },
  analiticaStatLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
    fontFamily: "System",
  },
  analiticaStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    fontFamily: "System",
  },
  analiticaDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#f1f5f9",
  },
  
  // CTA (Call to Action)
  ctaSection: {
    paddingHorizontal: 20,
    marginTop: 30,
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
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "System",
  },
  ctaDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "System",
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
});