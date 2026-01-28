// app/vendedor/pedido/[idPedido].tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG } from "../../../config";

interface Producto {
  idProducto: number;
  nombreProducto: string;
  imagenProducto?: string;
}

interface DetallePedido {
  cantidad: number;
  subtotal: number;
  precio?: number;
  producto?: Producto;
  nombreProducto?: string;
}

interface Pedido {
  idPedido: number;
  numeroPedidoVendedor?: number;
  fechaPedido: string;
  estadoPedido: string;
  estadoPedidoVendedor: string;
  estadoPago: string;
  metodoPago: string;
  subtotal: number;
  iva: number;
  total: number;
  comprobanteUrl?: string;
  datosTarjeta?: string;
  consumidor?: {
    usuario?: {
      nombre: string;
      apellido: string;
    };
  };
  nombreCliente?: string;
  detalles?: DetallePedido[];
  productos?: DetallePedido[];
}

export default function VendedorPedidoDetalle() {
  const { idPedido } = useLocalSearchParams<{ idPedido: string }>();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [numeroPedidoVendedor, setNumeroPedidoVendedor] = useState<number | null>(null);

  useEffect(() => {
    cargarPedido();
  }, [idPedido]);

  const cargarPedido = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("user");

      if (!token || !userData) {
        Alert.alert("Error", "Sesión expirada");
        router.replace("/login");
        return;
      }

      const resPedido = await fetch(
        `${API_CONFIG.BASE_URL}/pedidos/vendedor/detalle/${idPedido}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!resPedido.ok) {
        throw new Error("No autorizado para ver el pedido");
      }

      const dataPedido = await resPedido.json();
      console.log("📦 Datos del pedido:", dataPedido);

      if (dataPedido.pedido) {
        setPedido(dataPedido.pedido);
        setNumeroPedidoVendedor(dataPedido.numeroPedidoVendedor || dataPedido.pedido.numeroPedidoVendedor);
        setDetalles(dataPedido.pedido.detalles || dataPedido.pedido.productos || []);
      } else {
        setPedido(dataPedido);
        setDetalles(dataPedido.detalles || dataPedido.productos || []);
      }
    } catch (error) {
      console.error("❌ Error cargando pedido:", error);
      Alert.alert("Error", "No se pudo cargar el pedido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cambiarEstado = async (nuevoEstado: string) => {
    Alert.alert(
      "Confirmar",
      `¿Cambiar estado a ${mapearNombreEstado(nuevoEstado)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setActualizando(true);
            try {
              const token = await AsyncStorage.getItem("authToken");
              if (!token) {
                Alert.alert("Error", "Sesión expirada");
                return;
              }

              const res = await fetch(
                `${API_CONFIG.BASE_URL}/pedidos/vendedor/${idPedido}/estado`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    estadoPedidoVendedor: nuevoEstado,
                  }),
                }
              );

              if (!res.ok) {
                throw new Error("Error al actualizar el estado");
              }

              Alert.alert("Éxito", "Estado actualizado correctamente");
              cargarPedido();
            } catch (error) {
              console.error("❌ Error:", error);
              Alert.alert("Error", "No se pudo actualizar el estado");
            } finally {
              setActualizando(false);
            }
          },
        },
      ]
    );
  };

  const obtenerEstadoParaMostrar = () => {
    if (!pedido) return "Cargando...";

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
        NUEVO: "Nuevo",
        EN_PROCESO: "En Proceso",
        DESPACHADO: "Despachado",
        ENTREGADO: "Entregado",
        CANCELADO: "Cancelado",
      };
      return estadoMap[pedido.estadoPedidoVendedor] || pedido.estadoPedidoVendedor || "Pendiente";
    }

    return pedido.estadoPedido || "Pendiente";
  };

  const obtenerColorEstado = (estado: string) => {
    const estados: Record<string, { bg: string; color: string; border: string }> = {
      "Nuevo": { bg: "#FFF9E6", color: "#F59E0B", border: "#F59E0B" },
      "En Proceso": { bg: "#DBEAFE", color: "#3B82F6", border: "#3B82F6" },
      "Despachado": { bg: "#F5F3FF", color: "#8B5CF6", border: "#8B5CF6" },
      "Entregado": { bg: "#D1FAE5", color: "#10B981", border: "#10B981" },
      "Cancelado": { bg: "#FEE2E2", color: "#EF4444", border: "#EF4444" },
      "Esperando pago": { bg: "#FEF3C7", color: "#F59E0B", border: "#F59E0B" },
      "Verificando pago": { bg: "#CFFAFE", color: "#0EA5E9", border: "#0EA5E9" },
      "Pago rechazado": { bg: "#FCE7F3", color: "#EC4899", border: "#EC4899" },
    };
    return estados[estado] || { bg: "#F1F5F9", color: "#64748b", border: "#cbd5e1" };
  };

  const mapearNombreEstado = (estado: string) => {
    const estadoMap: Record<string, string> = {
      NUEVO: "Nuevo",
      EN_PROCESO: "En Proceso",
      DESPACHADO: "Despachado",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
    };
    return estadoMap[estado] || estado;
  };

  const obtenerProximosEstados = () => {
    if (!pedido) return [];

    const estadoActual = pedido.estadoPedidoVendedor;

    if (pedido.estadoPedido === "CANCELADO" || pedido.estadoPago === "CANCELADO") {
      return [];
    }

    const estadosDisponibles: string[] = [];

    if (!estadoActual || estadoActual === "No asignado") {
      estadosDisponibles.push("NUEVO");
    } else {
      switch (estadoActual) {
        case "NUEVO":
          estadosDisponibles.push("EN_PROCESO", "CANCELADO");
          break;
        case "EN_PROCESO":
          estadosDisponibles.push("DESPACHADO", "CANCELADO");
          break;
        case "DESPACHADO":
          estadosDisponibles.push("ENTREGADO");
          break;
      }
    }

    return estadosDisponibles;
  };

  const tieneComprobante = () => {
    return (
      pedido &&
      pedido.metodoPago &&
      (pedido.metodoPago.toUpperCase().includes("TRANSFERENCIA") ||
        pedido.metodoPago.toUpperCase().includes("DEPOSITO")) &&
      pedido.comprobanteUrl
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarPedido();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Error cargando pedido</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Volver a pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estadoParaMostrar = obtenerEstadoParaMostrar();
  const colorEstado = obtenerColorEstado(estadoParaMostrar);
  const proximosEstados = obtenerProximosEstados();
  const esTransferencia = tieneComprobante();
  const debeMostrarSeccionEstado =
    pedido &&
    (proximosEstados.length > 0 ||
      (!pedido.estadoPedidoVendedor &&
        pedido.estadoPago !== "CANCELADO" &&
        pedido.estadoPedido !== "CANCELADO"));
  const numeroParaMostrar = numeroPedidoVendedor || pedido.numeroPedidoVendedor || pedido.idPedido;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        style={styles.scrollView}
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
        {/* Botón de volver */}
        <TouchableOpacity
          style={styles.volverButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.volverIcon}>←</Text>
          <Text style={styles.volverText}>Volver a Pedidos</Text>
        </TouchableOpacity>

        {/* Header del Pedido */}
        <View style={styles.headerCard}>
          <View style={styles.headerGradient} />
          
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>Detalle del Pedido</Text>
              <Text style={styles.headerTitle}>Pedido #{numeroParaMostrar}</Text>
              
              <View style={styles.headerInfo}>
                <View style={styles.infoChip}>
                  <Text style={styles.chipIcon}>📅</Text>
                  <Text style={styles.chipText}>
                    {new Date(pedido.fechaPedido).toLocaleDateString("es-EC", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                
                <View style={styles.infoChip}>
                  <Text style={styles.chipIcon}>👤</Text>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {pedido.consumidor?.usuario?.nombre || pedido.nombreCliente || "N/A"}{" "}
                    {pedido.consumidor?.usuario?.apellido || ""}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.estadoBadgeLarge, { backgroundColor: colorEstado.bg, borderColor: colorEstado.border }]}>
              <View style={[styles.estadoDotLarge, { backgroundColor: colorEstado.color }]} />
              <Text style={[styles.estadoTextLarge, { color: colorEstado.color }]}>
                {estadoParaMostrar}
              </Text>
            </View>
          </View>

          {/* Estados del pedido */}
          <View style={styles.estadosContainer}>
            <View style={styles.estadoInfo}>
              <Text style={styles.estadoLabel}>💳 ESTADO DEL PAGO</Text>
              <View
                style={[
                  styles.estadoValue,
                  {
                    backgroundColor:
                      pedido.estadoPago === "PAGADO"
                        ? "rgba(52, 211, 153, 0.2)"
                        : pedido.estadoPago === "PENDIENTE"
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                    borderColor:
                      pedido.estadoPago === "PAGADO"
                        ? "#34D399"
                        : pedido.estadoPago === "PENDIENTE"
                        ? "#F59E0B"
                        : "#EF4444",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.estadoValueText,
                    {
                      color:
                        pedido.estadoPago === "PAGADO"
                          ? "#34D399"
                          : pedido.estadoPago === "PENDIENTE"
                          ? "#F59E0B"
                          : "#EF4444",
                    },
                  ]}
                >
                  {pedido.estadoPago || "PENDIENTE"}
                </Text>
              </View>
            </View>

            <View style={styles.estadoInfo}>
              <Text style={styles.estadoLabel}>📦 ESTADO GENERAL</Text>
              <View style={styles.estadoValue}>
                <Text style={styles.estadoValueText}>{pedido.estadoPedido || "PENDIENTE"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Productos */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛒</Text>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Productos</Text>
              <Text style={styles.sectionSubtitle}>
                {detalles.length} producto{detalles.length !== 1 ? "s" : ""} en este pedido
              </Text>
            </View>
          </View>

          {detalles.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptyText}>Este pedido no contiene productos</Text>
            </View>
          ) : (
            <View style={styles.productsContainer}>
              {detalles.map((detalle, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productIndicator} />
                  
                  {detalle.producto?.imagenProducto && (
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{ uri: detalle.producto.imagenProducto }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {detalle.producto?.nombreProducto || detalle.nombreProducto || "Producto"}
                    </Text>
                    <View style={styles.productDetails}>
                      <View style={styles.productDetailChip}>
                        <Text style={styles.productDetailText}>
                          📦 Cantidad: {detalle.cantidad}
                        </Text>
                      </View>
                      <View style={styles.productDetailChip}>
                        <Text style={styles.productDetailText}>
                          💰 Precio: ${((detalle.subtotal || detalle.precio || 0) / detalle.cantidad).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.productPriceContainer}>
                    <Text style={styles.productPrice}>
                      ${(detalle.subtotal || detalle.precio || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Resumen */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenHeader}>
            <Text style={styles.resumenIcon}>💰</Text>
            <View>
              <Text style={styles.resumenTitle}>Resumen</Text>
              <Text style={styles.resumenSubtitle}>Detalle de pagos y costos</Text>
            </View>
          </View>

          <View style={styles.resumenContent}>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Subtotal:</Text>
              <Text style={styles.resumenValue}>${(pedido.subtotal || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>IVA (12%):</Text>
              <Text style={styles.resumenValue}>${(pedido.iva || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Método de pago:</Text>
              <View style={styles.metodoPagoBadge}>
                <Text style={styles.metodoPagoText}>{pedido.metodoPago || "No especificado"}</Text>
              </View>
            </View>

            <View style={styles.resumenDivider} />

            <View style={styles.resumenTotal}>
              <Text style={styles.resumenTotalLabel}>Total:</Text>
              <Text style={styles.resumenTotalValue}>${(pedido.total || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Cambiar Estado */}
        {debeMostrarSeccionEstado && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔄</Text>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Cambiar Estado</Text>
                <Text style={styles.sectionSubtitle}>Actualiza el estado del pedido</Text>
              </View>
            </View>

            <View style={styles.estadosButtons}>
              {proximosEstados.length > 0 ? (
                proximosEstados.map((estado) => {
                  const buttonColors: Record<string, { bg: string; icon: string }> = {
                    NUEVO: { bg: "#FF6B35", icon: "🆕" },
                    EN_PROCESO: { bg: "#3B82F6", icon: "⚙️" },
                    DESPACHADO: { bg: "#8B5CF6", icon: "🚚" },
                    ENTREGADO: { bg: "#10B981", icon: "✅" },
                    CANCELADO: { bg: "#EF4444", icon: "❌" },
                  };

                  const color = buttonColors[estado] || { bg: "#64748b", icon: "📋" };

                  return (
                    <TouchableOpacity
                      key={estado}
                      style={[styles.estadoButton, { backgroundColor: color.bg }]}
                      onPress={() => cambiarEstado(estado)}
                      disabled={actualizando}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.estadoButtonIcon}>{color.icon}</Text>
                      <Text style={styles.estadoButtonText}>
                        {estado === "NUEVO"
                          ? "Marcar como Nuevo"
                          : estado === "EN_PROCESO"
                          ? "Marcar como En Proceso"
                          : estado === "DESPACHADO"
                          ? "Marcar como Despachado"
                          : estado === "ENTREGADO"
                          ? "Marcar como Entregado"
                          : "Cancelar Pedido"}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                !pedido.estadoPedidoVendedor && (
                  <View>
                    <TouchableOpacity
                      style={[styles.estadoButton, { backgroundColor: "#FF6B35" }]}
                      onPress={() => cambiarEstado("NUEVO")}
                      disabled={actualizando}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.estadoButtonIcon}>🆕</Text>
                      <Text style={styles.estadoButtonText}>Marcar como Nuevo</Text>
                    </TouchableOpacity>
                    <Text style={styles.estadoHelperText}>
                      Asigna este pedido para comenzar a procesarlo
                    </Text>
                  </View>
                )
              )}
            </View>

            <View style={styles.estadoActualContainer}>
              <Text style={styles.estadoActualLabel}>📋 ESTADO ACTUAL</Text>
              <View style={styles.estadoActualBadge}>
                <Text style={styles.estadoActualText}>
                  {mapearNombreEstado(pedido.estadoPedidoVendedor) || "No asignado"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Comprobante */}
        {esTransferencia && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📄</Text>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Comprobante</Text>
                <Text style={styles.sectionSubtitle}>Verificación de pago</Text>
              </View>
            </View>

            <View style={styles.comprobanteInfo}>
              <View style={styles.comprobanteRow}>
                <Text style={styles.comprobanteLabel}>Método de Pago</Text>
                <Text style={styles.comprobanteValue}>{pedido.metodoPago}</Text>
              </View>
              {pedido.datosTarjeta && (
                <View style={styles.comprobanteRow}>
                  <Text style={styles.comprobanteLabel}>Datos de pago</Text>
                  <Text style={styles.comprobanteValue}>{pedido.datosTarjeta}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.toggleComprobanteButton}
              onPress={() => setMostrarComprobante(!mostrarComprobante)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleComprobanteIcon}>
                {mostrarComprobante ? "⬆️" : "⬇️"}
              </Text>
              <Text style={styles.toggleComprobanteText}>
                {mostrarComprobante ? "Ocultar Comprobante" : "Ver Comprobante"}
              </Text>
            </TouchableOpacity>

            {mostrarComprobante && pedido.comprobanteUrl && (
              <View style={styles.comprobanteImageContainer}>
                <Image
                  source={{ uri: pedido.comprobanteUrl }}
                  style={styles.comprobanteImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 30,
  },
  scrollView: {
    flex: 1,
  },
  volverButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  volverIcon: {
    fontSize: 20,
    color: "#FF6B35",
    marginRight: 10,
  },
  volverText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B35",
  },
  backButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },

  // Header Card
  headerCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#FF6B35",
  },
  headerTop: {
    marginBottom: 20,
  },
  headerLeft: {
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#FF6B35",
    fontWeight: "700",
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
  },
  headerInfo: {
    gap: 10,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    gap: 8,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    flex: 1,
  },
  estadoBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
    alignSelf: "flex-start",
  },
  estadoDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoTextLarge: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  estadosContainer: {
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(241, 245, 249, 0.8)",
  },
  estadoInfo: {
    gap: 8,
  },
  estadoLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  estadoValue: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(229, 231, 235, 0.4)",
    alignSelf: "flex-start",
  },
  estadoValueText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
  },

  // Section Card
  sectionCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 28,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  // Products
  emptyProducts: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(203, 213, 225, 0.5)",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  productsContainer: {
    gap: 12,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250, 252, 248, 0.8)",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.5)",
    position: "relative",
  },
  productIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  productDetails: {
    gap: 6,
  },
  productDetailChip: {
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    alignSelf: "flex-start",
  },
  productDetailText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  productPriceContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 53, 0.3)",
    backgroundColor: "rgba(255, 107, 53, 0.05)",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FF6B35",
  },

  // Resumen
  resumenCard: {
    backgroundColor: "#FF6B35",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  resumenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  resumenIcon: {
    fontSize: 28,
    color: "white",
  },
  resumenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    marginBottom: 4,
  },
  resumenSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
  },
  resumenContent: {
    gap: 12,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  resumenLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
  },
  metodoPagoBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  metodoPagoText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
  },
  resumenDivider: {
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginVertical: 8,
  },
  resumenTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  resumenTotalLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "white",
  },
  resumenTotalValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
  },

  // Estados Buttons
  estadosButtons: {
    gap: 12,
    marginBottom: 20,
  },
  estadoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  estadoButtonIcon: {
    fontSize: 18,
    color: "white",
  },
  estadoButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "white",
  },
  estadoHelperText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  estadoActualContainer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(241, 245, 249, 0.8)",
  },
  estadoActualLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  estadoActualBadge: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(229, 231, 235, 0.4)",
  },
  estadoActualText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1e293b",
  },

  // Comprobante
  comprobanteInfo: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.4)",
  },
  comprobanteRow: {
    gap: 6,
  },
  comprobanteLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  comprobanteValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "800",
  },
  toggleComprobanteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  toggleComprobanteIcon: {
    fontSize: 18,
    color: "white",
  },
  toggleComprobanteText: {
    fontSize: 15,
    fontWeight: "800",
    color: "white",
  },
  comprobanteImageContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(229, 231, 235, 0.6)",
    backgroundColor: "#f1f5f9",
  },
  comprobanteImage: {
    width: "100%",
    height: 400,
  },
  bottomSpacer: {
    height: 40,
  },
});