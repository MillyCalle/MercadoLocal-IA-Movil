import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config";
import { useCarrito } from "../context/CarritoContext";

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
  idVendedor?: number;
  nombreEmpresa?: string;
  promedioValoracion?: number;
  totalValoraciones?: number;
  valoraciones?: Array<{
    nombreConsumidor: string;
    calificacion: number;
    comentario: string;
  }>;
}

export default function ProductoDetalle() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { agregarCarrito: agregarAlCarritoContext } = useCarrito();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [menuVendedor, setMenuVendedor] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  
  // Modales
  const [showEnvio, setShowEnvio] = useState(false);
  const [showReembolso, setShowReembolso] = useState(false);
  const [showReseñas, setShowReseñas] = useState(false);
  const [showNuevaReseña, setShowNuevaReseña] = useState(false);

  // Nueva reseña
  const [nuevaCalificacion, setNuevaCalificacion] = useState<number>(5);
  const [nuevoComentario, setNuevoComentario] = useState("");

  useEffect(() => {
    cargarProducto();
    verificarFavorito();
  }, [id]);

  const cargarProducto = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/productos/detalle/${id}`);
      if (!response.ok) throw new Error("Error al cargar producto");
      const data: Producto = await response.json();
      console.log("📦 Producto cargado:", data);
      console.log("⭐ Valoraciones:", data.valoraciones);
      setProducto(data);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo cargar el producto");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const verificarFavorito = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) return;

      const user = JSON.parse(userStr);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/favoritos/verificar/${user.idUsuario}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEsFavorito(data.esFavorito || false);
      }
    } catch (error) {
      console.log("Error verificando favorito:", error);
    }
  };

  const toggleFavorito = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para guardar favoritos",
          [
            { text: "Cancelar" },
            { text: "Iniciar sesión", onPress: () => router.push("/login" as any) },
          ]
        );
        return;
      }

      const user = JSON.parse(userStr);

      const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/agregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idConsumidor: user.idUsuario,
          idProducto: producto?.idProducto,
        }),
      });

      if (response.ok) {
        setEsFavorito(!esFavorito);
        Alert.alert(
          "¡Listo!",
          esFavorito
            ? "Producto eliminado de favoritos 💔"
            : "Producto agregado a favoritos ❤️"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo actualizar favoritos");
    }
  };

  const agregarAlCarrito = async () => {
    try {
      console.log("🎬 INICIANDO agregarAlCarrito");
      
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      console.log("🔑 Token existe:", !!token);
      console.log("👤 Usuario existe:", !!userStr);

      if (!userStr || !token) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para agregar al carrito",
          [
            { text: "Cancelar" },
            { text: "Iniciar sesión", onPress: () => router.push("/login" as any) },
          ]
        );
        return;
      }

      console.log("📦 ID Producto:", producto?.idProducto);
      console.log("📊 Cantidad:", cantidad);

      // ✅ Usar la función del context renombrada
      await agregarAlCarritoContext(producto!.idProducto, cantidad);
      
      console.log("✅ agregarCarrito completado exitosamente");
      Alert.alert("¡Agregado!", `${producto?.nombreProducto} agregado al carrito 🛒`);
      
    } catch (error: any) {
      console.error("❌ Error en agregarAlCarrito:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      Alert.alert("Error al agregar", error.message || "No se pudo agregar al carrito");
    }
  };

  const comprarAhora = async () => {
  try {
    const userStr = await AsyncStorage.getItem("user");
    const token = await AsyncStorage.getItem("authToken");

    if (!userStr || !token) {
      Alert.alert(
        "Inicia sesión",
        "Debes iniciar sesión para comprar",
        [
          { text: "Cancelar" },
          { text: "Iniciar sesión", onPress: () => router.push("/login" as any) },
        ]
      );
      return;
    }

    const user = JSON.parse(userStr);
    const idConsumidor = user.idConsumidor || user.idUsuario;

    const body = {
      idConsumidor: idConsumidor,
      idVendedor: producto?.idVendedor,
      metodoPago: "TARJETA",
      detalles: [
        {
          idProducto: producto?.idProducto,
          cantidad: cantidad,
        },
      ],
    };

    console.log("💳 Comprando ahora:", body);

    const response = await fetch(`${API_CONFIG.BASE_URL}/pedidos/comprar-ahora`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("📥 Respuesta compra:", responseText);

    if (!response.ok) {
      let errorMessage = "Error al procesar la compra";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      console.error("❌ Error del servidor:", errorMessage);
      Alert.alert("Error", errorMessage);
      return;
    }

    // ✅ Parsear la respuesta para obtener el ID del pedido
    const pedidoCreado = JSON.parse(responseText);
    console.log("✅ Pedido creado:", pedidoCreado);

    // ✅ Redirigir a la página del pedido
    router.push(`/consumidor/Pedido/${pedidoCreado.idPedido}` as any);

  } catch (error) {
    console.error("❌ Error al comprar:", error);
    Alert.alert("Error", "No se pudo procesar la compra. Verifica tu conexión.");
  }
};

  const enviarReseña = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        Alert.alert("Error", "Debes iniciar sesión");
        return;
      }

      if (!nuevoComentario.trim()) {
        Alert.alert("Comentario requerido", "Por favor escribe un comentario para tu reseña");
        return;
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor || user.idUsuario;

      const body = {
        idProducto: producto?.idProducto,
        idConsumidor: idConsumidor,
        calificacion: Number(nuevaCalificacion),
        comentario: nuevoComentario.trim(),
      };

      console.log("📤 Enviando reseña:", body);
      console.log("👤 Usuario completo:", user);

      const response = await fetch(`${API_CONFIG.BASE_URL}/valoraciones/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("📥 Respuesta del servidor:", responseText);
      console.log("📊 Status code:", response.status);

      if (!response.ok) {
        let errorMessage = "Error al enviar reseña";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        console.error("❌ Error del servidor:", errorMessage);
        Alert.alert("Error", errorMessage);
        return;
      }

      Alert.alert("¡Enviado!", "Tu reseña ha sido publicada 🎉");
      setShowNuevaReseña(false);
      setNuevoComentario("");
      setNuevaCalificacion(5);
      cargarProducto();
    } catch (error) {
      console.error("❌ Error enviando reseña:", error);
      Alert.alert("Error", "No se pudo enviar la reseña. Verifica tu conexión.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b8e4e" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!producto) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Image
            source={{ uri: producto.imagenProducto }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          
          {producto.stockProducto > 0 && producto.stockProducto <= 10 && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>
                ⚡ Solo {producto.stockProducto} disponibles
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentSection}>
          <View style={styles.categoryRow}>
            {producto.nombreCategoria && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{producto.nombreCategoria}</Text>
              </View>
            )}
            {producto.nombreSubcategoria && (
              <View style={[styles.categoryBadge, { backgroundColor: "#F4E8C1" }]}>
                <Text style={styles.categoryText}>{producto.nombreSubcategoria}</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{producto.nombreProducto}</Text>

          <TouchableOpacity
            style={styles.ratingRow}
            onPress={() => setShowReseñas(true)}
          >
            <Text style={styles.ratingStars}>⭐</Text>
            <Text style={styles.ratingValue}>
              {producto.promedioValoracion?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.ratingCount}>
              ({producto.totalValoraciones || 0} reseñas)
            </Text>
          </TouchableOpacity>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>PRECIO</Text>
            <Text style={styles.priceValue}>
              ${parseFloat(String(producto.precioProducto)).toFixed(2)}
            </Text>
            <Text style={styles.priceUnit}>
              Por {producto.unidadMedida || "unidad"}
            </Text>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>Cantidad</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setCantidad(Math.max(1, cantidad - 1))}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{cantidad}</Text>
              </View>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setCantidad(cantidad + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cartButton]}
              onPress={agregarAlCarrito}
            >
              <Text style={styles.actionButtonText}>🛒 Agregar al Carrito</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.buyButton]}
              onPress={comprarAhora}
            >
              <Text style={styles.actionButtonText}>⚡ Comprar Ahora</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, esFavorito && styles.favoritoActivo]}
              onPress={toggleFavorito}
            >
              <Text style={styles.secondaryButtonText}>
                {esFavorito ? "❤️ Guardado" : "🤍 Guardar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowEnvio(true)}
            >
              <Text style={styles.secondaryButtonText}>🚚 Envío</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowReembolso(true)}
            >
              <Text style={styles.secondaryButtonText}>💵 Reembolso</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vendorCard}>
            <View style={styles.vendorAvatar}>
              <Text style={styles.vendorAvatarText}>🌾</Text>
            </View>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorLabel}>VENDIDO POR</Text>
              <Text style={styles.vendorName}>{producto.nombreVendedor}</Text>
              {producto.nombreEmpresa && (
                <Text style={styles.vendorCompany}>{producto.nombreEmpresa}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.vendorMenuButton}
              onPress={() => setMenuVendedor(true)}
            >
              <Text style={styles.vendorMenuIcon}>⋯</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>📋 Descripción</Text>
            <Text style={styles.descriptionText}>
              {producto.descripcionProducto || "Sin descripción disponible"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.verReseñasButton}
            onPress={() => setShowReseñas(true)}
          >
            <Text style={styles.verReseñasButtonText}>
              ⭐ Ver todas las reseñas ({producto.totalValoraciones || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.escribirReseñaButton}
            onPress={() => setShowNuevaReseña(true)}
          >
            <Text style={styles.escribirReseñaButtonText}>
              ✍️ Escribe tu reseña
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showEnvio} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📦 Política de Envío</Text>
            <Text style={styles.modalText}>✓ Envío dentro de 24-48 horas</Text>
            <Text style={styles.modalText}>✓ Entregas dentro de la ciudad</Text>
            <Text style={styles.modalText}>✓ Producto fresco garantizado</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowEnvio(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showReembolso} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💵 Política de Reembolso</Text>
            <Text style={styles.modalText}>✓ Reembolso hasta 48h tras entrega</Text>
            <Text style={styles.modalText}>✓ Requiere evidencia fotográfica</Text>
            <Text style={styles.modalText}>✗ No cubre daño por mal uso</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowReembolso(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showReseñas} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: height * 0.7 }]}>
            <Text style={styles.modalTitle}>⭐ Reseñas del Producto</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {producto.valoraciones && producto.valoraciones.length > 0 ? (
                producto.valoraciones.map((v, i) => (
                  <View key={i} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewName}>{v.nombreConsumidor}</Text>
                      <View style={styles.reviewRatingContainer}>
                        <Text style={styles.reviewRatingText}>⭐ {v.calificacion}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{v.comentario}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noReviewsContainer}>
                  <Text style={styles.noReviewsIcon}>📝</Text>
                  <Text style={styles.noReviews}>Aún no hay reseñas</Text>
                  <Text style={styles.noReviewsSubtext}>
                    Sé el primero en compartir tu opinión
                  </Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowReseñas(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNuevaReseña} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✍️ Escribe tu reseña</Text>
            
            <Text style={styles.inputLabel}>Calificación</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNuevaCalificacion(star)}
                >
                  <Text style={styles.ratingStar}>
                    {star <= nuevaCalificacion ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Tu comentario</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Cuéntanos tu experiencia..."
              placeholderTextColor="#94a3b8"
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#e5e7eb" }]}
                onPress={() => setShowNuevaReseña(false)}
              >
                <Text style={[styles.modalButtonText, { color: "#333" }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={enviarReseña}>
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={menuVendedor} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVendedor(false)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setMenuVendedor(false);
                Alert.alert("Perfil del Vendedor", "Función próximamente disponible");
              }}
            >
              <Text style={styles.menuItemText}>👤 Ver Perfil del Vendedor</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: "#6b8e4e",
    fontWeight: "600",
  },
  imageSection: {
    height: 400,
    backgroundColor: "#faf7ef",
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  stockBadge: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "#F5C744",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stockBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  contentSection: {
    padding: 20,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#ECF2E3",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "#3a5a40",
    fontSize: 11,
    fontWeight: "600",
  },
  productName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D3E2B",
    marginBottom: 12,
    lineHeight: 32,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingStars: {
    fontSize: 20,
    marginRight: 6,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4B419",
    marginRight: 6,
  },
  ratingCount: {
    fontSize: 13,
    color: "#6B7F69",
  },
  priceCard: {
    backgroundColor: "#F9D94A",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: "900",
    color: "#2D3E2B",
    marginBottom: 4,
  },
  priceUnit: {
    fontSize: 11,
    color: "#6B7F69",
  },
  quantitySection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FBF7",
    padding: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECF2E3",
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5A8F48",
  },
  quantityDisplay: {
    width: 40,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  actionsRow: {
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cartButton: {
    backgroundColor: "#5A8F48",
  },
  buyButton: {
    backgroundColor: "#2D3E2B",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  favoritoActivo: {
    backgroundColor: "#FFE5E9",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3E2B",
  },
  vendorCard: {
    flexDirection: "row",
    backgroundColor: "#FAFCF8",
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ECF2E3",
    marginBottom: 20,
    alignItems: "center",
  },
  vendorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6b8e4e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vendorAvatarText: {
    fontSize: 24,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorLabel: {
    fontSize: 10,
    color: "#6B7F69",
    fontWeight: "600",
    marginBottom: 2,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  vendorCompany: {
    fontSize: 12,
    color: "#6B7F69",
    marginTop: 2,
  },
  vendorMenuButton: {
    padding: 8,
  },
  vendorMenuIcon: {
    fontSize: 24,
    color: "#6B7F69",
  },
  descriptionCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECF2E3",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7F69",
    lineHeight: 22,
  },
  verReseñasButton: {
    backgroundColor: "#FFF9E6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#F4B419",
  },
  verReseñasButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  escribirReseñaButton: {
    backgroundColor: "#5A8F48",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  escribirReseñaButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: "#6B7F69",
    marginBottom: 10,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#5A8F48",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  reviewCard: {
    backgroundColor: "#F9FBF7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECF2E3",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3E2B",
  },
  reviewRatingContainer: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F4B419",
  },
  reviewComment: {
    fontSize: 14,
    color: "#6B7F69",
    lineHeight: 20,
  },
  noReviewsContainer: {
    alignItems: "center",
    padding: 40,
  },
  noReviewsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noReviews: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 6,
  },
  noReviewsSubtext: {
    fontSize: 13,
    color: "#6B7F69",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 8,
    marginTop: 12,
  },
  ratingSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  ratingStar: {
    fontSize: 32,
  },
  textArea: {
    backgroundColor: "#F9FBF7",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#2D3E2B",
    borderWidth: 1,
    borderColor: "#ECF2E3",
    minHeight: 100,
    textAlignVertical: "top",
  },
  menuCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ECF2E3",
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3E2B",
  },
});