import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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

export default function PedidoDetalle() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario de pago
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [comprobante, setComprobante] = useState<any>(null);
  const [numTarjeta, setNumTarjeta] = useState("");
  const [cvv, setCvv] = useState("");
  const [fechaTarjeta, setFechaTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    cargarPedido();
  }, [id]);

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

      if (!resPedido.ok) {
        throw new Error("No se pudo cargar el pedido");
      }

      const dataPedido = await resPedido.json();

      const resDetalles = await fetch(`${API_CONFIG.BASE_URL}/pedidos/${id}/detalles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resDetalles.ok) {
        throw new Error("No se pudieron cargar los detalles");
      }

      const dataDetalles = await resDetalles.json();

      setPedido(dataPedido);
      setDetalles(dataDetalles);
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });

      // ✅ CORRECCIÓN: La nueva API usa 'canceled' en lugar de 'type'
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setComprobante(file);
        Alert.alert("Archivo seleccionado", file.name || "Comprobante cargado");
      }
    } catch (error) {
      console.error("Error seleccionando archivo:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  const validarFormulario = (): boolean => {
    if (metodoPago === "EFECTIVO") {
      if (montoEfectivo && parseFloat(montoEfectivo) < pedido!.total) {
        Alert.alert("Error", "El monto debe ser mayor o igual al total del pedido");
        return false;
      }
      return true;
    }

    if (metodoPago === "TRANSFERENCIA") {
      if (!comprobante) {
        Alert.alert("Error", "Debes subir el comprobante de transferencia");
        return false;
      }
    }

    if (metodoPago === "TARJETA") {
      if (!numTarjeta || numTarjeta.replace(/\s/g, "").length < 15) {
        Alert.alert("Error", "Número de tarjeta inválido");
        return false;
      }
      if (!cvv || cvv.length < 3) {
        Alert.alert("Error", "CVV inválido");
        return false;
      }
      if (!fechaTarjeta) {
        Alert.alert("Error", "Fecha de expiración requerida");
        return false;
      }
      if (!titular.trim()) {
        Alert.alert("Error", "Nombre del titular requerido");
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
        "⚠️ IMPORTANTE - Pago en Efectivo",
        `• Total a pagar: $${pedido!.total.toFixed(2)}\n` +
        `• Pagarás al recibir el pedido\n` +
        `• Una vez confirmado, NO PODRÁS CANCELAR\n` +
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
      let headers: any = {
        Authorization: `Bearer ${token}`,
      };

      // 🔥 MANEJO CORRECTO SEGÚN MÉTODO DE PAGO
      if (metodoPago === "EFECTIVO") {
        headers["Content-Type"] = "application/json";
        
        const montoFinal = montoEfectivo && parseFloat(montoEfectivo) >= pedido!.total
          ? parseFloat(montoEfectivo)
          : pedido!.total;
        
        body = JSON.stringify({
          metodoPago: "EFECTIVO",
          montoEfectivo: montoFinal
        });
        
        console.log("💵 EFECTIVO - Enviando:", {
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
          
          console.log("🏦 TRANSFERENCIA - Archivo:", fileName);
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
        console.log("💳 TARJETA - Datos enviados");
      }

      const url = `${API_CONFIG.BASE_URL}/pedidos/finalizar/${id}`;
      console.log("🔵 URL:", url);
      console.log("🔵 Método de pago:", metodoPago);

      const res = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: body,
      });

      console.log("📥 Status de respuesta:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del servidor:", errorText);
        throw new Error(errorText || "No se pudo finalizar el pedido");
      }

      const data = await res.json();
      console.log("✅ Respuesta exitosa:", data);

      // ✅ Éxito - Mostrar mensaje apropiado según el método de pago
      if (metodoPago === "EFECTIVO") {
        Alert.alert(
          "🎉 ¡Pedido confirmado!",
          `Pagarás $${pedido!.total.toFixed(2)} en efectivo al recibir tu pedido.\n` +
          `El vendedor está preparando tu orden.`
        );
      } else {
        Alert.alert("🎉 ¡Compra finalizada con éxito!");
      }

      // Recargar el pedido actualizado
      await cargarPedido();

    } catch (err: any) {
      console.error("❌ Error completo:", err);
      Alert.alert("Error al finalizar pedido", err.message);
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

    // ⚠️ SOLO checkout + pendiente puede cancelar
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
        <ActivityIndicator size="large" color="#6b8e4e" />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </View>
    );
  }

  if (error || !pedido) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Error al cargar pedido</Text>
        <Text style={styles.errorText}>{error || "No se encontró el pedido"}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const estadoColors: Record<string, string> = {
    PENDIENTE: "#F4B419",
    PENDIENTE_VERIFICACION: "#F4B419",
    PROCESANDO: "#4A90E2",
    COMPLETADO: "#5A8F48",
    CANCELADO: "#E74C3C",
  };

  const pedidoFinalizado =
    pedido.estadoPedido === "COMPLETADO" ||
    pedido.estadoPedido === "PENDIENTE_VERIFICACION" ||
    pedido.estadoPedido === "PROCESANDO";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={confirmarSalir}
        >
          <Text style={styles.backButtonText}>
            {pedidoFinalizado ? "← Volver" : "← Cancelar y volver"}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📦</Text>
            </View>
            <View>
              <Text style={styles.pedidoTitle}>Pedido #{pedido.idPedido}</Text>
              <Text style={styles.fechaText}>
                📅 {new Date(pedido.fechaPedido).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: estadoColors[pedido.estadoPedido] || "#6B7F69" },
            ]}
          >
            <Text style={styles.estadoText}>{pedido.estadoPedido}</Text>
          </View>
        </View>
      </View>

      {/* Productos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 Productos del pedido</Text>
        {detalles.map((detalle, index) => (
          <View key={index} style={styles.productoCard}>
            {detalle.producto?.imagenProducto && (
              <Image
                source={{ uri: detalle.producto.imagenProducto }}
                style={styles.productoImage}
              />
            )}
            <View style={styles.productoInfo}>
              <Text style={styles.productoNombre}>
                {detalle.producto?.nombreProducto || "Producto"}
              </Text>
              <Text style={styles.productoDetalle}>
                Cantidad: {detalle.cantidad} • ${(detalle.subtotal / detalle.cantidad).toFixed(2)} c/u
              </Text>
            </View>
            <Text style={styles.productoSubtotal}>${detalle.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Resumen */}
      <View style={styles.resumenCard}>
        <Text style={styles.sectionTitle}>💰 Resumen del pedido</Text>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Subtotal</Text>
          <Text style={styles.resumenValue}>${pedido.subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>IVA (12%)</Text>
          <Text style={styles.resumenValue}>${pedido.iva.toFixed(2)}</Text>
        </View>

        {pedidoFinalizado && pedido.metodoPago && (
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Método de pago</Text>
            <Text style={styles.resumenValue}>
              {pedido.metodoPago === "EFECTIVO" && "💵 Efectivo"}
              {pedido.metodoPago === "TRANSFERENCIA" && "🏦 Transferencia"}
              {pedido.metodoPago === "TARJETA" && "💳 Tarjeta"}
            </Text>
          </View>
        )}
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${pedido.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Formulario de pago (solo si está pendiente) */}
      {!pedidoFinalizado && (
        <View style={styles.pagoSection}>
          <Text style={styles.sectionTitle}>💳 Método de pago</Text>
          
          <View style={styles.metodosPago}>
            {["EFECTIVO", "TRANSFERENCIA", "TARJETA"].map((metodo) => (
              <TouchableOpacity
                key={metodo}
                style={[
                  styles.metodoButton,
                  metodoPago === metodo && styles.metodoButtonActive,
                ]}
                onPress={() => setMetodoPago(metodo)}
              >
                <Text
                  style={[
                    styles.metodoButtonText,
                    metodoPago === metodo && styles.metodoButtonTextActive,
                  ]}
                >
                  {metodo === "EFECTIVO" && "💵 Efectivo"}
                  {metodo === "TRANSFERENCIA" && "🏦 Transferencia"}
                  {metodo === "TARJETA" && "💳 Tarjeta"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Formularios según método de pago */}
          {metodoPago === "EFECTIVO" && (
            <View style={styles.formContainer}>
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  💵 <Text style={styles.alertTextBold}>Pago contra entrega</Text>
                  {"\n"}Pagarás <Text style={styles.alertTextBold}>${pedido.total.toFixed(2)}</Text> en efectivo cuando recibas tu pedido.
                </Text>
              </View>
              
              <Text style={styles.inputLabel}>Monto que entregarás (opcional):</Text>
              <TextInput
                style={styles.input}
                placeholder={`Mínimo: $${pedido.total.toFixed(2)}`}
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={montoEfectivo}
                onChangeText={setMontoEfectivo}
              />
              {montoEfectivo && parseFloat(montoEfectivo) >= pedido.total && (
                <Text style={styles.cambioText}>
                  ✓ Cambio: ${(parseFloat(montoEfectivo) - pedido.total).toFixed(2)}
                </Text>
              )}
            </View>
          )}

          {metodoPago === "TRANSFERENCIA" && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Subir comprobante:</Text>
              <TouchableOpacity
                style={styles.fileButton}
                onPress={seleccionarArchivo}
              >
                <Text style={styles.fileButtonText}>
                  {comprobante ? `✓ ${comprobante.name}` : "📎 Seleccionar archivo"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {metodoPago === "TARJETA" && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Número de tarjeta:</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={19}
                value={numTarjeta}
                onChangeText={(text) =>
                  setNumTarjeta(
                    text
                      .replace(/\s/g, "")
                      .replace(/(\d{4})/g, "$1 ")
                      .trim()
                  )
                }
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>CVV:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={cvv}
                    onChangeText={setCvv}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Expiración (MM/AA):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12/25"
                    placeholderTextColor="#94a3b8"
                    value={fechaTarjeta}
                    onChangeText={setFechaTarjeta}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Titular:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#94a3b8"
                value={titular}
                onChangeText={setTitular}
              />
            </View>
          )}

          {/* Botón finalizar */}
          <TouchableOpacity
            style={[styles.finalizarButton, finalizando && styles.finalizarButtonDisabled]}
            onPress={finalizarCompra}
            disabled={finalizando}
          >
            <Text style={styles.finalizarButtonText}>
              {finalizando ? "⏳ Procesando..." : "✔ Finalizar Compra"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Información adicional si está finalizado */}
      {pedidoFinalizado && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {pedido.estadoPedido === "COMPLETADO" && "✓ Tu pedido ha sido completado exitosamente. Gracias por tu compra."}
            {pedido.estadoPedido === "PENDIENTE_VERIFICACION" && "⏳ Tu pedido está en verificación. Te notificaremos cuando sea procesado."}
            {pedido.estadoPedido === "PROCESANDO" && "🔄 Tu pedido está siendo procesado. Pronto estará listo."}
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7F69",
    marginBottom: 24,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: "#5A8F48",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5A8F48",
  },
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#5A8F48",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 24,
  },
  pedidoTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  fechaText: {
    fontSize: 12,
    color: "#6B7F69",
    marginTop: 4,
  },
  estadoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  estadoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 16,
  },
  productoCard: {
    flexDirection: "row",
    backgroundColor: "#F9FBF7",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    gap: 12,
  },
  productoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 4,
  },
  productoDetalle: {
    fontSize: 12,
    color: "#6B7F69",
  },
  productoSubtotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5A8F48",
  },
  resumenCard: {
    backgroundColor: "#F9D94A",
    marginTop: 16,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resumenLabel: {
    fontSize: 14,
    color: "#2D3E2B",
  },
  resumenValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3E2B",
  },
  divider: {
    height: 2,
    backgroundColor: "rgba(45, 62, 43, 0.2)",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2D3E2B",
  },
  pagoSection: {
    backgroundColor: "white",
    marginTop: 16,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
  },
  metodosPago: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metodoButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  metodoButtonActive: {
    backgroundColor: "#5A8F48",
    borderColor: "#5A8F48",
  },
  metodoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7F69",
  },
  metodoButtonTextActive: {
    color: "white",
  },
  formContainer: {
    marginTop: 16,
  },
  alertBox: {
    backgroundColor: "#FFF3CD",
    borderWidth: 2,
    borderColor: "#FFC107",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
  alertTextBold: {
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#2D3E2B",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  cambioText: {
    fontSize: 13,
    color: "#5A8F48",
    fontWeight: "600",
    marginTop: -8,
    marginBottom: 12,
  },
  fileButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: 12,
  },
  fileButtonText: {
    fontSize: 14,
    color: "#6B7F69",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  finalizarButton: {
    backgroundColor: "#5A8F48",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  finalizarButtonDisabled: {
    backgroundColor: "#98A598",
  },
  finalizarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  infoBox: {
    backgroundColor: "#FAFBF9",
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F4ED",
  },
  infoText: {
    fontSize: 13,
    color: "#6B7F69",
    lineHeight: 20,
  },
});