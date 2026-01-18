import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { API_CONFIG } from "../../config";

interface Producto {
  idProducto: number;
  nombreProducto: string;
  imagenProducto: string;
}

interface DetallePedido {
  idDetalle: number;
  cantidad: number;
  subtotal: number;
  producto: Producto;
}

interface Pedido {
  idPedido: number;
  fechaPedido: string;
  estadoPedido: string;
  subtotal: number;
  iva: number;
  total: number;
  metodoPago?: string;
}

// 🔥 COMPONENTE DE CÍRCULOS FLOTANTES - EXACTO COMO EXPLORAR
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

export default function PedidoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados del formulario de pago
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [comprobante, setComprobante] = useState<any>(null);
  const [numTarjeta, setNumTarjeta] = useState("");
  const [cvv, setCvv] = useState("");
  const [fechaTarjeta, setFechaTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  // Animaciones
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    cargarPedido();
    startAnimations();
  }, [id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const cargarPedido = async () => {
    const token = await AsyncStorage.getItem("authToken");
    
    if (!token) {
      router.push("/login" as any);
      return;
    }

    try {
      setLoading(true);
      
      const resPedido = await fetch(`${API_CONFIG.BASE_URL}/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resPedido.ok) throw new Error("No se pudo cargar el pedido");
      const dataPedido = await resPedido.json();

      const resDetalles = await fetch(`${API_CONFIG.BASE_URL}/pedidos/${id}/detalles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resDetalles.ok) throw new Error("No se pudieron cargar los detalles");
      const dataDetalles = await resDetalles.json();

      setPedido(dataPedido);
      setDetalles(dataDetalles);
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPedido();
  }, []);

  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setComprobante(file);
        
        Alert.alert("✅ Archivo seleccionado", file.name || "Comprobante cargado");
      }
    } catch (error) {
      console.error("Error seleccionando archivo:", error);
      Alert.alert("❌ Error", "No se pudo seleccionar el archivo");
    }
  };

  const validarFormulario = (): boolean => {
    if (metodoPago === "EFECTIVO") {
      if (montoEfectivo && parseFloat(montoEfectivo) < pedido!.total) {
        Alert.alert("❌ Error", "El monto debe ser mayor o igual al total del pedido");
        return false;
      }
      return true;
    }

    if (metodoPago === "TRANSFERENCIA") {
      if (!comprobante) {
        Alert.alert("❌ Error", "Debes subir el comprobante de transferencia");
        return false;
      }
    }

    if (metodoPago === "TARJETA") {
      if (!numTarjeta || numTarjeta.replace(/\s/g, "").length < 15) {
        Alert.alert("❌ Error", "Número de tarjeta inválido");
        return false;
      }
      if (!cvv || cvv.length < 3) {
        Alert.alert("❌ Error", "CVV inválido");
        return false;
      }
      if (!fechaTarjeta) {
        Alert.alert("❌ Error", "Fecha de expiración requerida");
        return false;
      }
      if (!titular.trim()) {
        Alert.alert("❌ Error", "Nombre del titular requerido");
        return false;
      }
    }

    return true;
  };

  const finalizarCompra = async () => {
    if (!validarFormulario()) return;

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      router.push("/login" as any);
      return;
    }

    if (metodoPago === "EFECTIVO") {
      Alert.alert(
        "⚠️ Pago en Efectivo",
        `• Total a pagar: $${pedido!.total.toFixed(2)}\n` +
        `• Pagarás al recibir el pedido\n` +
        `• El vendedor preparará tu pedido de inmediato\n\n` +
        `¿Confirmas tu pedido?`,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Confirmar", 
            onPress: async () => await procesarPago(token),
            style: "default"
          },
        ]
      );
      return;
    } else {
      Alert.alert(
        "Confirmar pedido",
        `¿Confirmar pedido por $${pedido!.total.toFixed(2)} con ${metodoPago}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Confirmar", 
            onPress: async () => await procesarPago(token),
            style: "default"
          },
        ]
      );
      return;
    }
  };

  const procesarPago = async (token: string) => {
    setFinalizando(true);

    try {
      let body;
      let headers: any = { Authorization: `Bearer ${token}` };

      if (metodoPago === "EFECTIVO") {
        headers["Content-Type"] = "application/json";
        const montoFinal = montoEfectivo && parseFloat(montoEfectivo) >= pedido!.total
          ? parseFloat(montoEfectivo)
          : pedido!.total;
        
        body = JSON.stringify({
          metodoPago: "EFECTIVO",
          montoEfectivo: montoFinal
        });
        
      } else if (metodoPago === "TRANSFERENCIA") {
        const formData = new FormData();
        formData.append("metodoPago", "TRANSFERENCIA");
        
        if (comprobante) {
          const fileUri = comprobante.uri;
          const fileName = comprobante.name || "comprobante.jpg";
          const fileType = comprobante.mimeType || "image/jpeg";

          formData.append("comprobante", {
            uri: Platform.OS === "ios" ? fileUri.replace("file://", "") : fileUri,
            name: fileName,
            type: fileType,
          } as any);
        }
        
        body = formData;
        
      } else if (metodoPago === "TARJETA") {
        const formData = new FormData();
        formData.append("metodoPago", "TARJETA");
        formData.append("numTarjeta", numTarjeta.replace(/\s/g, ""));
        formData.append("cvv", cvv);
        formData.append("fechaTarjeta", fechaTarjeta);
        formData.append("titular", titular);
        
        body = formData;
      }

      const url = `${API_CONFIG.BASE_URL}/pedidos/finalizar/${id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: body,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "No se pudo finalizar el pedido");
      }

      const data = await res.json();

      if (metodoPago === "EFECTIVO") {
        Alert.alert(
          "🎉 ¡Pedido confirmado!",
          `Pagarás $${pedido!.total.toFixed(2)} en efectivo al recibir tu pedido.\n` +
          `El vendedor está preparando tu orden.`
        );
      } else {
        Alert.alert("🎉 ¡Compra finalizada con éxito!");
      }

      await cargarPedido();

    } catch (err: any) {
      console.error("❌ Error completo:", err);
      Alert.alert("❌ Error al finalizar pedido", err.message);
    } finally {
      setFinalizando(false);
    }
  };

  const confirmarSalir = () => {
    if (!pedido) return;

    const pedidoFinalizado =
      pedido.estadoPedido === "COMPLETADO" ||
      pedido.estadoPedido === "PENDIENTE_VERIFICACION" ||
      pedido.estadoPedido === "PROCESANDO";

    if (pedidoFinalizado) {
      router.back();
      return;
    }

    Alert.alert(
      "Cancelar pedido",
      "¿Estás seguro de cancelar este pedido? Los productos volverán al carrito.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("authToken");
            try {
              await fetch(`${API_CONFIG.BASE_URL}/pedidos/${pedido.idPedido}/cancelar`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              });
              router.back();
            } catch (err) {
              console.error("Error cancelando pedido:", err);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <FloatingCircles />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando detalles del pedido...</Text>
      </View>
    );
  }

  if (error || !pedido) {
    return (
      <View style={styles.errorContainer}>
        <FloatingCircles />
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Error al cargar pedido</Text>
        <Text style={styles.errorText}>
          {error || "No se encontró el pedido"}
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => cargarPedido()}
          >
            <Text style={styles.primaryButtonText}>🔄 Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const estadoColors: Record<string, { color: string, icon: string }> = {
    PENDIENTE: { color: "#FF6B35", icon: "⏳" },
    PENDIENTE_VERIFICACION: { color: "#F4B419", icon: "🔍" },
    PROCESANDO: { color: "#3498DB", icon: "⚙️" },
    COMPLETADO: { color: "#2ECC71", icon: "✅" },
    CANCELADO: { color: "#E74C3C", icon: "❌" },
    ENVIADO: { color: "#9B59B6", icon: "🚚" },
  };

  const pedidoFinalizado =
    pedido.estadoPedido === "COMPLETADO" ||
    pedido.estadoPedido === "PENDIENTE_VERIFICACION" ||
    pedido.estadoPedido === "PROCESANDO";

  const estadoInfo = estadoColors[pedido.estadoPedido] || { 
    color: "#6B7F69", 
    icon: "❓"
  };

  return (
    <ScrollView 
      style={styles.container} 
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
      {/* 🔥 HEADER IDÉNTICO AL EXPLORAR */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }]
          }
        ]}
      >
        <FloatingCircles />
        
        {/* Botón de volver con diseño del explorar */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={confirmarSalir}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonCircle}>
            <Text style={styles.backButtonIcon}>←</Text>
          </View>
          <Text style={styles.backButtonText}>
            {pedidoFinalizado ? "Volver" : "Cancelar"}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {/* Avatar del pedido con efectos como explorar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: estadoInfo.color }]}>
              <Text style={styles.avatarText}>#{pedido.idPedido}</Text>
            </View>
            
            {/* Badge de estado como en explorar */}
            <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color }]}>
              <Text style={styles.estadoBadgeIcon}>{estadoInfo.icon}</Text>
              <Text style={styles.estadoBadgeText}>{pedido.estadoPedido}</Text>
            </View>
          </View>

          {/* Título con efectos igual que explorar */}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Detalle de Pago</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Pedido #{pedido.idPedido}
          </Text>
          
          {/* Info badges con diseño de explorar */}
          <View style={styles.infoBadgesContainer}>
            <View style={styles.infoBadge}>
              <View style={styles.infoBadgeIconContainer}>
                <Text style={styles.infoBadgeIcon}>📅</Text>
              </View>
              <Text style={styles.infoBadgeText}>
                {new Date(pedido.fechaPedido).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>

            {pedido.metodoPago && (
              <View style={styles.infoBadge}>
                <View style={styles.infoBadgeIconContainer}>
                  <Text style={styles.infoBadgeIcon}>
                    {pedido.metodoPago === "EFECTIVO" && "💵"}
                    {pedido.metodoPago === "TRANSFERENCIA" && "🏦"}
                    {pedido.metodoPago === "TARJETA" && "💳"}
                  </Text>
                </View>
                <Text style={styles.infoBadgeText}>{pedido.metodoPago}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* 🔥 SECCIÓN DE PRODUCTOS CON ESTILO DE EXPLORAR */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos en tu pedido</Text>
          <Text style={styles.sectionSubtitle}>Artículos seleccionados</Text>
        </View>
        
        {detalles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptyText}>Este pedido no contiene productos</Text>
          </View>
        ) : (
          <View style={styles.productsCard}>
            {detalles.map((detalle, index) => (
              <View key={detalle.idDetalle || index} style={styles.productItem}>
                {/* Imagen con diseño de producto explorar */}
                <View style={styles.productImageContainer}>
                  {detalle.producto?.imagenProducto ? (
                    <Image
                      source={{ uri: detalle.producto.imagenProducto }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.productImagePlaceholderIcon}>🛍️</Text>
                      <Text style={styles.productImagePlaceholderText}>Producto</Text>
                    </View>
                  )}
                  
                  {/* Badge de cantidad como stock en explorar */}
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>x{detalle.cantidad}</Text>
                  </View>
                </View>

                {/* Info del producto como en explorar */}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {detalle.producto?.nombreProducto || "Producto"}
                  </Text>
                  
                  <View style={styles.productMeta}>
                    <Text style={styles.productPriceUnit}>
                      ${(detalle.subtotal / detalle.cantidad).toFixed(2)} c/u
                    </Text>
                  </View>
                </View>

                {/* Precio total con diseño de explorar */}
                <View style={styles.productPriceContainer}>
                  <Text style={styles.productPrice}>${detalle.subtotal.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 🔥 RESUMEN DE PAGO CON ESTILO DE EXPLORAR */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen de compra</Text>
          <Text style={styles.sectionSubtitle}>Detalles financieros</Text>
        </View>
        
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLabelContainer}>
              <Text style={styles.paymentIcon}>💰</Text>
              <Text style={styles.paymentLabel}>Subtotal</Text>
            </View>
            <Text style={styles.paymentValue}>${pedido.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <View style={styles.paymentLabelContainer}>
              <Text style={styles.paymentIcon}>🧾</Text>
              <Text style={styles.paymentLabel}>IVA (12%)</Text>
            </View>
            <Text style={styles.paymentValue}>${pedido.iva.toFixed(2)}</Text>
          </View>

          {pedidoFinalizado && pedido.metodoPago && (
            <View style={styles.paymentRow}>
              <View style={styles.paymentLabelContainer}>
                <Text style={styles.paymentIcon}>
                  {pedido.metodoPago === "EFECTIVO" && "💵"}
                  {pedido.metodoPago === "TRANSFERENCIA" && "🏦"}
                  {pedido.metodoPago === "TARJETA" && "💳"}
                </Text>
                <Text style={styles.paymentLabel}>Método de pago</Text>
              </View>
              <Text style={styles.paymentValue}>{pedido.metodoPago}</Text>
            </View>
          )}

          <View style={styles.paymentDivider} />

          <View style={styles.paymentTotalRow}>
            <View style={styles.paymentLabelContainer}>
              <Text style={[styles.paymentIcon, styles.paymentTotalIcon]}>💵</Text>
              <Text style={styles.paymentTotalLabel}>Total</Text>
            </View>
            <Text style={styles.paymentTotal}>${pedido.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* 🔥 MÉTODO DE PAGO CON ESTILO DE EXPLORAR */}
      {!pedidoFinalizado && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <Text style={styles.sectionSubtitle}>Selecciona cómo deseas pagar</Text>
          </View>
          
          <View style={styles.paymentMethodCard}>
            {/* Selector de método con estilo de filtros explorar */}
            <View style={styles.paymentMethods}>
              {["EFECTIVO", "TRANSFERENCIA", "TARJETA"].map((metodo, index) => (
                <TouchableOpacity
                  key={metodo}
                  style={[
                    styles.paymentMethodButton,
                    metodoPago === metodo && styles.paymentMethodButtonActive,
                  ]}
                  onPress={() => setMetodoPago(metodo)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.paymentMethodIconContainer,
                    metodoPago === metodo && styles.paymentMethodIconContainerActive
                  ]}>
                    <Text style={[
                      styles.paymentMethodIcon,
                      metodoPago === metodo && styles.paymentMethodIconActive
                    ]}>
                      {metodo === "EFECTIVO" && "💵"}
                      {metodo === "TRANSFERENCIA" && "🏦"}
                      {metodo === "TARJETA" && "💳"}
                    </Text>
                  </View>
                  <Text style={[
                    styles.paymentMethodText,
                    metodoPago === metodo && styles.paymentMethodTextActive
                  ]}>
                    {metodo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Formulario según método */}
            {metodoPago === "EFECTIVO" && (
              <View style={styles.formContainer}>
                <View style={styles.alertBox}>
                  <View style={styles.alertIconContainer}>
                    <Text style={styles.alertIcon}>💵</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Pago contra entrega</Text>
                    <Text style={styles.alertText}>
                      Pagarás ${pedido.total.toFixed(2)} en efectivo cuando recibas tu pedido.
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>Monto que entregarás (opcional):</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputCurrency}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`Mínimo: ${pedido.total.toFixed(2)}`}
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                    value={montoEfectivo}
                    onChangeText={setMontoEfectivo}
                  />
                </View>
                {montoEfectivo && parseFloat(montoEfectivo) >= pedido.total && (
                  <View style={styles.changeContainer}>
                    <View style={styles.changeIconContainer}>
                      <Text style={styles.changeIcon}>🔄</Text>
                    </View>
                    <Text style={styles.changeText}>
                      Cambio: ${(parseFloat(montoEfectivo) - pedido.total).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {metodoPago === "TRANSFERENCIA" && (
              <View style={styles.formContainer}>
                <View style={styles.alertBox}>
                  <View style={styles.alertIconContainer}>
                    <Text style={styles.alertIcon}>🏦</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Transferencia Bancaria</Text>
                    <Text style={styles.alertText}>
                      Transfiere ${pedido.total.toFixed(2)} a nuestra cuenta y sube el comprobante.
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>Comprobante de transferencia:</Text>
                <TouchableOpacity
                  style={[styles.fileUploadButton, comprobante && styles.fileUploadButtonSuccess]}
                  onPress={seleccionarArchivo}
                  activeOpacity={0.7}
                >
                  <View style={styles.fileUploadContent}>
                    <Text style={styles.fileUploadIcon}>
                      {comprobante ? "✅" : "📎"}
                    </Text>
                    <View>
                      <Text style={styles.fileUploadText}>
                        {comprobante ? comprobante.name || "Archivo cargado" : "Seleccionar archivo"}
                      </Text>
                      <Text style={styles.fileUploadSubtext}>
                        {comprobante ? "Toca para cambiar" : "PNG, JPG o PDF (Max 5MB)"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {metodoPago === "TARJETA" && (
              <View style={styles.formContainer}>
                <View style={styles.alertBox}>
                  <View style={styles.alertIconContainer}>
                    <Text style={styles.alertIcon}>💳</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Pago con Tarjeta</Text>
                    <Text style={styles.alertText}>
                      Ingresa los datos de tu tarjeta para completar el pago seguro.
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>Número de tarjeta:</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>💳</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={numTarjeta}
                    onChangeText={(text) => {
                      const formatted = text
                        .replace(/\s/g, "")
                        .replace(/(\d{4})/g, "$1 ")
                        .trim();
                      setNumTarjeta(formatted);
                    }}
                    maxLength={19}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={styles.columnInput}>
                    <Text style={styles.inputLabel}>Fecha de expiración:</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>📅</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/AA"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={fechaTarjeta}
                        onChangeText={setFechaTarjeta}
                        maxLength={5}
                      />
                    </View>
                  </View>

                  <View style={styles.columnInput}>
                    <Text style={styles.inputLabel}>CVV:</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={cvv}
                        onChangeText={setCvv}
                        secureTextEntry
                        maxLength={4}
                      />
                    </View>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Nombre del titular:</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Como aparece en la tarjeta"
                    placeholderTextColor="#94a3b8"
                    value={titular}
                    onChangeText={setTitular}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* 🔥 BOTÓN DE FINALIZAR CON ESTILO DEL EXPLORAR */}
            <TouchableOpacity
              style={[styles.finalizarButton, finalizando && styles.finalizarButtonDisabled]}
              onPress={finalizarCompra}
              disabled={finalizando}
              activeOpacity={0.8}
            >
              <View style={styles.finalizarButtonContent}>
                <View style={styles.finalizarButtonIconContainer}>
                  <Text style={styles.finalizarButtonIcon}>
                    {finalizando ? "⏳" : "✔"}
                  </Text>
                </View>
                <Text style={styles.finalizarButtonText}>
                  {finalizando ? "Procesando..." : "Finalizar Compra"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🔥 FOOTER CON ESTILO DEL EXPLORAR */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerIconContainer}>
            <Text style={styles.footerIcon}>🔒</Text>
          </View>
          <View>
            <Text style={styles.footerTitle}>Proceso de Pago Seguro</Text>
            <Text style={styles.footerBrand}>MercadoLocal</Text>
          </View>
        </View>
        <Text style={styles.footerSubtitle}>
          Tus pagos están protegidos con encriptación de nivel bancario
        </Text>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Pedido #{pedido.idPedido} • MercadoLocal</Text>
          <Text style={styles.versionSubtext}>© 2024 Todos los derechos reservados</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// 🔥 ESTILOS IDÉNTICOS AL EXPLORAR
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // 🔥 LOADING SCREEN
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    position: 'relative',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
  },
  
  // 🔥 ERROR SCREEN
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
    position: 'relative',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    fontFamily: "System",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "System",
  },
  errorButtons: {
    flexDirection: "row",
    gap: 12,
  },
  
  // 🔥 CÍRCULOS FLOTANTES - IGUAL QUE EXPLORAR
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
  
  // 🔥 HEADER - IDÉNTICO AL EXPLORAR
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  backButtonIcon: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "700",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
    fontFamily: "System",
    marginLeft: 8,
  },
  
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
  },
  
  estadoBadge: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "white",
  },
  estadoBadgeIcon: {
    fontSize: 12,
    marginRight: 6,
    color: "white",
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
  },
  
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C3E50",
    textAlign: 'center',
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "System",
  },
  
  infoBadgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoBadgeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoBadgeIcon: {
    fontSize: 14,
    color: "#64748b",
  },
  infoBadgeText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
  },
  
  // 🔥 SECCIONES
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "System",
  },
  
  // 🔥 PRODUCTOS - ESTILO DE EXPLORAR
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "System",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    fontFamily: "System",
  },
  
  productsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  productItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: 'center',
  },
  productImageContainer: {
    marginRight: 16,
    position: 'relative',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE4D6",
  },
  productImagePlaceholderIcon: {
    fontSize: 20,
    color: "#FF6B35",
  },
  productImagePlaceholderText: {
    fontSize: 9,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
  },
  quantityBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: "#FF6B35",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  quantityBadgeText: {
    fontSize: 11,
    color: "white",
    fontWeight: "700",
    fontFamily: "System",
    paddingHorizontal: 6,
  },
  
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
    fontFamily: "System",
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  productPriceUnit: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
  },
  
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // 🔥 PAGO
  paymentCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  paymentLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentIcon: {
    fontSize: 18,
    color: "#FF6B35",
  },
  paymentTotalIcon: {
    fontSize: 22,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
  },
  paymentValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
    fontFamily: "System",
  },
  
  paymentDivider: {
    height: 2,
    backgroundColor: "#f1f5f9",
    marginVertical: 16,
  },
  
  paymentTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
  },
  paymentTotalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
  },
  paymentTotal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // 🔥 BOTONES
  primaryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "System",
  },
  secondaryButton: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  secondaryButtonText: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "System",
  },
  
  // 🔥 MÉTODO DE PAGO
  paymentMethodCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentMethodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    marginHorizontal: 4,
  },
  paymentMethodButtonActive: {
    backgroundColor: 'white',
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentMethodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMethodIconContainerActive: {
    backgroundColor: '#FFF2E8',
  },
  paymentMethodIcon: {
    fontSize: 20,
    color: '#64748b',
  },
  paymentMethodIconActive: {
    color: '#FF6B35',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },
  paymentMethodTextActive: {
    color: '#FF6B35',
  },
  
  formContainer: {
    marginTop: 10,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertIcon: {
    fontSize: 20,
    color: '#0369A1',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
    fontFamily: 'System',
  },
  alertText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontFamily: 'System',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  inputCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    marginRight: 8,
    fontFamily: 'System',
  },
  inputIcon: {
    fontSize: 20,
    color: '#94a3b8',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'System',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  columnInput: {
    flex: 1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  changeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  changeIcon: {
    fontSize: 16,
    color: '#166534',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    fontFamily: 'System',
  },
  fileUploadButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fileUploadButtonSuccess: {
    borderColor: '#2ECC71',
    backgroundColor: '#F0FFF4',
  },
  fileUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileUploadIcon: {
    fontSize: 24,
    color: '#94a3b8',
    marginRight: 12,
  },
  fileUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'System',
    marginBottom: 2,
  },
  fileUploadSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'System',
  },
  
  // 🔥 BOTÓN FINALIZAR - ESTILO DEL EXPLORAR
  finalizarButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finalizarButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
  },
  finalizarButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalizarButtonIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  finalizarButtonIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  finalizarButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'System',
  },
  
  // 🔥 FOOTER - ESTILO DEL EXPLORAR
  footer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  footerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  footerIcon: {
    fontSize: 24,
    color: "white",
  },
  footerTitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  footerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "System",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    width: '100%',
  },
  versionText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    fontFamily: "System",
  },
  versionSubtext: {
    fontSize: 11,
    color: "#cbd5e1",
    marginTop: 4,
    fontFamily: "System",
  },
});