import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { API_CONFIG } from "../../config";
import { useCarrito } from "../context/CarritoContext";
import { useFavoritos } from "../context/FavoritosContext";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;
const isTablet = width >= 768 && height < 1000;
const isLandscape = width > height;

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

const PremiumCard = ({ children, style }: {
  children: React.ReactNode;
  style?: any;
}) => {
  return (
    <View style={[styles.premiumCard, style]}>
      {children}
    </View>
  );
};

export default function ProductoDetalle() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { agregarCarrito: agregarAlCarritoContext } = useCarrito();
  const { agregarFavorito, favoritos, esFavorito: esFavoritoContext } = useFavoritos();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);
  
  // Modales
  const [showEnvio, setShowEnvio] = useState(false);
  const [showReembolso, setShowReembolso] = useState(false);
  const [showReseñas, setShowReseñas] = useState(false);
  const [showNuevaReseña, setShowNuevaReseña] = useState(false);

  // Nueva reseña
  const [nuevaCalificacion, setNuevaCalificacion] = useState<number>(5);
  const [nuevoComentario, setNuevoComentario] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const textInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Verificar si el producto está en favoritos usando el contexto
  const esFavorito = producto ? esFavoritoContext(producto.idProducto) : false;

  useEffect(() => {
    cargarProducto();
    startAnimations();
    
    // Listeners para el teclado
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    
    // Listener para cambios en orientación
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setKeyboardHeight(0); // Resetear altura del teclado al cambiar orientación
    });
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      subscription?.remove();
    };
  }, [id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cargarProducto = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/productos/detalle/${id}`);
      if (!response.ok) throw new Error("Error al cargar producto");
      const data: Producto = await response.json();
      setProducto(data);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo cargar el producto");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Verificar stock disponible
  const verificarStock = (cantidadDeseada: number): boolean => {
    if (!producto) return false;
    if (producto.stockProducto < cantidadDeseada) {
      Alert.alert(
        "Stock insuficiente",
        `Solo hay ${producto.stockProducto} unidades disponibles`,
        [{ text: "Aceptar" }]
      );
      return false;
    }
    return true;
  };

  // Verificar si usuario es vendedor (como en web)
  const verificarSiEsVendedor = async (): Promise<boolean> => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return false;
      
      const user = JSON.parse(userStr);
      return user.rol === "VENDEDOR";
    } catch (error) {
      console.error("Error verificando rol:", error);
      return false;
    }
  };

  const guardarYIrAFavoritos = async () => {
    try {
      setGuardandoFavorito(true);
      
      if (!producto) {
        Alert.alert("Error", "No hay información del producto");
        setGuardandoFavorito(false);
        return;
      }
      
      // Verificar si es vendedor (como en web)
      const esVendedor = await verificarSiEsVendedor();
      if (esVendedor) {
        Alert.alert(
          "Acción no disponible",
          "Esta función solo está disponible para consumidores",
          [{ text: "Aceptar" }]
        );
        setGuardandoFavorito(false);
        return;
      }
      
      // 1. VERIFICAR AUTENTICACIÓN
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para guardar en favoritos",
          [
            { text: "Cancelar" },
            { text: "Iniciar sesión", onPress: () => router.push("/login" as any) },
          ]
        );
        setGuardandoFavorito(false);
        return;
      }

      // 2. VERIFICAR SI YA ES FAVORITO - MOSTRAR ADVERTENCIA COMO EN WEB
      if (esFavorito) {
        Alert.alert(
          "Producto ya en favoritos",
          `"${producto.nombreProducto}" ya está en tus favoritos. Para eliminarlo, ve a la sección de Favoritos.`,
          [{ text: "Aceptar" }]
        );
        router.push("/(tabs)/Favoritos" as any);
        setGuardandoFavorito(false);
        return;
      }

      // 3. USAR LA FUNCIÓN DEL CONTEXTO QUE YA VERIFICA DUPLICADOS
      try {
        await agregarFavorito(producto.idProducto);
        Alert.alert("¡Guardado!", "Producto agregado a favoritos");
        
        // 4. NAVEGAR A FAVORITOS DESPUÉS DE AGREGAR
        setTimeout(() => {
          router.push("/(tabs)/Favoritos" as any);
        }, 500);
        
      } catch (error: any) {
        console.error("Error al agregar favorito:", error);
        Alert.alert("Error", error.message || "No se pudo agregar a favoritos");
      }
      
    } catch (error) {
      console.error("Error en guardarYIrAFavoritos:", error);
      Alert.alert("Error", "No se pudo completar la acción");
    } finally {
      setGuardandoFavorito(false);
    }
  };

  const agregarAlCarrito = async () => {
    try {
      const esVendedor = await verificarSiEsVendedor();
      if (esVendedor) {
        Alert.alert(
          "Acción no disponible",
          "Esta función solo está disponible para consumidores",
          [{ text: "Aceptar" }]
        );
        return;
      }

      if (!verificarStock(cantidad)) {
        return;
      }

      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

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

      await agregarAlCarritoContext(producto!.idProducto, cantidad);
      
      Alert.alert("¡Agregado!", `${producto?.nombreProducto} agregado al carrito 🛒`);
      
    } catch (error: any) {
      console.error("❌ Error en agregarAlCarrito:", error);
      Alert.alert("Error al agregar", error.message || "No se pudo agregar al carrito");
    }
  };

  const comprarAhora = async () => {
    try {
      const esVendedor = await verificarSiEsVendedor();
      if (esVendedor) {
        Alert.alert(
          "Acción no disponible",
          "Esta función solo está disponible para consumidores",
          [{ text: "Aceptar" }]
        );
        return;
      }

      if (!verificarStock(cantidad)) {
        return;
      }

      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para comprar",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Iniciar sesión", 
              onPress: () => router.push("/(tabs)/profile" as any) 
            },
          ]
        );
        return;
      }

      const user = JSON.parse(userStr);
      const idConsumidor = user.idConsumidor || user.idUsuario;

      const confirmacion = await new Promise((resolve) => {
        Alert.alert(
          "⚡ Comprar Ahora",
          `¿Deseas comprar "${producto?.nombreProducto}"?\n\n` +
          `Cantidad: ${cantidad}\n` +
          `Precio unitario: $${producto?.precioProducto.toFixed(2)}\n` +
          `Total: $${(producto!.precioProducto * cantidad).toFixed(2)}`,
          [
            { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
            { text: "Continuar", onPress: () => resolve(true), style: "default" },
          ]
        );
      });

      if (!confirmacion) {
        return;
      }

      const body = {
        idConsumidor: idConsumidor,
        idVendedor: producto!.idVendedor || 1,
        metodoPago: "TARJETA",
        detalles: [
          {
            idProducto: producto!.idProducto,
            cantidad: cantidad
          }
        ]
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/pedidos/comprar-ahora`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en compra:", errorText);
        Alert.alert("Error", "No se pudo crear el pedido. Intenta nuevamente.");
        return;
      }

      const pedido = await response.json();

      Alert.alert("¡Pedido creado!", "Ahora serás redirigido para completar el pago");
      
      setTimeout(() => {
        router.push({
          pathname: `/pedido/${pedido.idPedido}` as any,
          params: { origen: "CHECKOUT" }
        });
      }, 1500);

    } catch (error: any) {
      console.error("❌ Error en comprar ahora:", error);
      Alert.alert("Error", 
        "Ocurrió un error inesperado al procesar tu compra\n" + 
        (error.message || "")
      );
    }
  };

  const enviarReseña = async () => {
    try {
      const esVendedor = await verificarSiEsVendedor();
      if (esVendedor) {
        Alert.alert(
          "Acción no disponible",
          "Esta función solo está disponible para consumidores",
          [{ text: "Aceptar" }]
        );
        return;
      }

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

      const response = await fetch(`${API_CONFIG.BASE_URL}/valoraciones/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      let responseData;
      let responseText = "";
      
      try {
        responseText = await response.text();
      } catch (readError) {
        console.error("Error leyendo respuesta:", readError);
        responseText = "";
      }

      if (!response.ok) {
        let errorMessage = "Error al enviar reseña";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        Alert.alert("Error", errorMessage);
        return;
      }

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parseando respuesta JSON:", parseError);
        Alert.alert("Error", "Respuesta del servidor inválida");
        return;
      }

      Alert.alert("¡Enviado!", "✅ Tu reseña ha sido publicada 🎉");
      setShowNuevaReseña(false);
      setNuevoComentario("");
      setNuevaCalificacion(5);
      cargarProducto();
    } catch (error) {
      console.error("❌ Error enviando reseña:", error);
      Alert.alert("Error", "No se pudo enviar la reseña. Verifica tu conexión.");
    }
  };

  const verPerfilVendedor = () => {
    if (producto && producto.idVendedor) {
       router.push(`/(tabs)/VendedorPerfil?id=${producto.idVendedor}` as any);
    } else {
      Alert.alert("Error", "No se encontró información del vendedor");
    }
  };

  const cerrarTeclado = () => {
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!producto) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <Text style={styles.backButtonIcon}>←</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={[
          styles.imageSection,
          isLandscape && styles.imageSectionLandscape
        ]}>
          <Image
            source={{ uri: producto.imagenProducto }}
            style={[
              styles.mainImage,
              isLandscape && styles.mainImageLandscape
            ]}
            resizeMode="cover"
          />
          
          {producto.stockProducto > 0 && producto.stockProducto <= 10 && (
            <View style={[
              styles.stockBadge,
              isLandscape && styles.stockBadgeLandscape
            ]}>
              <Text style={styles.stockBadgeText}>
                ⚡ ¡Solo {producto.stockProducto} disponibles!
              </Text>
            </View>
          )}
        </View>

        <View style={[
          styles.contentSection,
          isLandscape && styles.contentSectionLandscape,
          isTablet && styles.contentSectionTablet
        ]}>
          <View style={styles.categoryRow}>
            {producto.nombreCategoria && (
              <View style={[styles.categoryBadge, { backgroundColor: '#FFF2E8' }]}>
                <Text style={[styles.categoryText, { color: '#FF6B35' }]}>
                  {producto.nombreCategoria}
                </Text>
              </View>
            )}
            {producto.nombreSubcategoria && (
              <View style={[styles.categoryBadge, { backgroundColor: '#E8F4FD' }]}>
                <Text style={[styles.categoryText, { color: '#3498DB' }]}>
                  {producto.nombreSubcategoria}
                </Text>
              </View>
            )}
          </View>

          <Text style={[
            styles.productName,
            isSmallDevice && styles.productNameSmall,
            isTablet && styles.productNameTablet,
            isLandscape && styles.productNameLandscape
          ]}>{producto.nombreProducto}</Text>

          <TouchableOpacity
            style={styles.ratingRow}
            onPress={() => setShowReseñas(true)}
          >
            <View style={styles.ratingContainer}>
              <Text style={[
                styles.ratingStars,
                isSmallDevice && styles.ratingStarsSmall
              ]}>⭐</Text>
              <Text style={[
                styles.ratingValue,
                isSmallDevice && styles.ratingValueSmall
              ]}>
                {producto.promedioValoracion?.toFixed(1) || "0.0"}
              </Text>
            </View>
            <Text style={[
              styles.ratingCount,
              isSmallDevice && styles.ratingCountSmall
            ]}>
              ({producto.totalValoraciones || 0} reseñas)
            </Text>
          </TouchableOpacity>

          <PremiumCard style={[
            styles.priceCard,
            isSmallDevice && styles.priceCardSmall
          ]}>
            <View style={styles.priceHeader}>
              <Text style={[
                styles.priceLabel,
                isSmallDevice && styles.priceLabelSmall
              ]}>PRECIO</Text>
              {producto.unidadMedida && (
                <Text style={[
                  styles.unitLabel,
                  isSmallDevice && styles.unitLabelSmall
                ]}>
                  Por {producto.unidadMedida}
                </Text>
              )}
            </View>
            <Text style={[
              styles.priceValue,
              isSmallDevice && styles.priceValueSmall,
              isTablet && styles.priceValueTablet
            ]}>
              ${parseFloat(String(producto.precioProducto)).toFixed(2)}
            </Text>
          </PremiumCard>

          <View style={styles.quantitySection}>
            <Text style={[
              styles.sectionLabel,
              isSmallDevice && styles.sectionLabelSmall
            ]}>Cantidad</Text>
            <View style={[
              styles.quantityControls,
              isSmallDevice && styles.quantityControlsSmall
            ]}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  isSmallDevice && styles.quantityButtonSmall
                ]}
                onPress={() => setCantidad(Math.max(1, cantidad - 1))}
              >
                <Text style={[
                  styles.quantityButtonText,
                  isSmallDevice && styles.quantityButtonTextSmall
                ]}>−</Text>
              </TouchableOpacity>
              <View style={[
                styles.quantityDisplay,
                isSmallDevice && styles.quantityDisplaySmall
              ]}>
                <Text style={[
                  styles.quantityText,
                  isSmallDevice && styles.quantityTextSmall
                ]}>{cantidad}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  isSmallDevice && styles.quantityButtonSmall
                ]}
                onPress={() => setCantidad(cantidad + 1)}
              >
                <Text style={[
                  styles.quantityButtonText,
                  isSmallDevice && styles.quantityButtonTextSmall
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[
            styles.actionsRow,
            isSmallDevice && styles.actionsRowSmall,
            isLandscape && styles.actionsRowLandscape
          ]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cartButton]}
              onPress={agregarAlCarrito}
            >
              <Text style={[
                styles.actionButtonText, 
                styles.cartButtonText,
                isSmallDevice && styles.actionButtonTextSmall
              ]}>🛒 Agregar al Carrito</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.buyButton]}
              onPress={comprarAhora}
            >
              <Text style={[
                styles.actionButtonText, 
                styles.buyButtonText,
                isSmallDevice && styles.actionButtonTextSmall
              ]}>⚡ Comprar Ahora</Text>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.secondaryActions,
            isSmallDevice && styles.secondaryActionsSmall,
            isLandscape && styles.secondaryActionsLandscape
          ]}>
            <TouchableOpacity
              style={[styles.secondaryButton, esFavorito && styles.favoritoActivo]}
              onPress={guardarYIrAFavoritos}
              disabled={guardandoFavorito}
            >
              {guardandoFavorito ? (
                <ActivityIndicator size="small" color="#FF6B35" />
              ) : (
                <Text style={[
                  styles.secondaryButtonText,
                  isSmallDevice && styles.secondaryButtonTextSmall
                ]}>
                  {esFavorito ? "❤️ Guardado" : "🤍 Guardar"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowEnvio(true)}
            >
              <Text style={[
                styles.secondaryButtonText,
                isSmallDevice && styles.secondaryButtonTextSmall
              ]}>🚚 Envío</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowReembolso(true)}
            >
              <Text style={[
                styles.secondaryButtonText,
                isSmallDevice && styles.secondaryButtonTextSmall
              ]}>💵 Reembolso</Text>
            </TouchableOpacity>
          </View>

          <PremiumCard style={[
            styles.vendorCard,
            isSmallDevice && styles.vendorCardSmall,
            isLandscape && styles.vendorCardLandscape
          ]}>
            <View style={styles.vendorHeader}>
              <View style={[
                styles.vendorAvatar,
                isSmallDevice && styles.vendorAvatarSmall
              ]}>
                <Text style={[
                  styles.vendorAvatarText,
                  isSmallDevice && styles.vendorAvatarTextSmall
                ]}>🌾</Text>
              </View>
              <View style={styles.vendorInfo}>
                <Text style={[
                  styles.vendorLabel,
                  isSmallDevice && styles.vendorLabelSmall
                ]}>VENDIDO POR</Text>
                <Text style={[
                  styles.vendorName,
                  isSmallDevice && styles.vendorNameSmall
                ]}>{producto.nombreVendedor}</Text>
                {producto.nombreEmpresa && (
                  <Text style={[
                    styles.vendorCompany,
                    isSmallDevice && styles.vendorCompanySmall
                  ]}>{producto.nombreEmpresa}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.verPerfilButtonSmall,
                isSmallDevice && styles.verPerfilButtonSmallSmall
              ]}
              onPress={verPerfilVendedor}
            >
              <Text style={[
                styles.verPerfilButtonTextSmall,
                isSmallDevice && styles.verPerfilButtonTextSmallSmall
              ]}>👤 Ver Perfil</Text>
            </TouchableOpacity>
          </PremiumCard>

          <PremiumCard style={styles.descriptionCard}>
            <Text style={[
              styles.sectionTitle,
              isSmallDevice && styles.sectionTitleSmall
            ]}>📋 Descripción</Text>
            <Text style={[
              styles.descriptionText,
              isSmallDevice && styles.descriptionTextSmall,
              isTablet && styles.descriptionTextTablet
            ]}>
              {producto.descripcionProducto || "Sin descripción disponible"}
            </Text>
          </PremiumCard>

          <TouchableOpacity
            style={styles.verReseñasButton}
            onPress={() => setShowReseñas(true)}
          >
            <Text style={[
              styles.verReseñasButtonText,
              isSmallDevice && styles.verReseñasButtonTextSmall
            ]}>
              ⭐ Ver todas las reseñas ({producto.totalValoraciones || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.escribirReseñaButton}
            onPress={() => setShowNuevaReseña(true)}
          >
            <Text style={[
              styles.escribirReseñaButtonText,
              isSmallDevice && styles.escribirReseñaButtonTextSmall
            ]}>
              ✍️ Escribe tu reseña
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODALES */}
      <Modal visible={showEnvio} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <PremiumCard style={[
            styles.modalContent,
            isSmallDevice && styles.modalContentSmall,
            isTablet && styles.modalContentTablet
          ]}>
            <Text style={[
              styles.modalTitle,
              isSmallDevice && styles.modalTitleSmall
            ]}>📦 Política de Envío</Text>
            <Text style={[
              styles.modalText,
              isSmallDevice && styles.modalTextSmall
            ]}>✓ Envío dentro de 24-48 horas</Text>
            <Text style={styles.modalText}>✓ Entregas dentro de la ciudad</Text>
            <Text style={styles.modalText}>✓ Producto fresco garantizado</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowEnvio(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </PremiumCard>
        </View>
      </Modal>

      <Modal visible={showReembolso} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <PremiumCard style={[
            styles.modalContent,
            isSmallDevice && styles.modalContentSmall
          ]}>
            <Text style={[
              styles.modalTitle,
              isSmallDevice && styles.modalTitleSmall
            ]}>💵 Política de Reembolso</Text>
            <Text style={styles.modalText}>✓ Reembolso hasta 48h tras entrega</Text>
            <Text style={styles.modalText}>✓ Requiere evidencia fotográfica</Text>
            <Text style={styles.modalText}>✗ No cubre daño por mal uso</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowReembolso(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </PremiumCard>
        </View>
      </Modal>

      <Modal visible={showReseñas} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <PremiumCard style={[
            styles.modalContent, 
            { maxHeight: height * (isTablet ? 0.8 : 0.7) }
          ]}>
            <Text style={[
              styles.modalTitle,
              isSmallDevice && styles.modalTitleSmall
            ]}>⭐ Reseñas del Producto</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {producto.valoraciones && producto.valoraciones.length > 0 ? (
                producto.valoraciones.map((v, i) => (
                  <PremiumCard key={i} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={[
                        styles.reviewName,
                        isSmallDevice && styles.reviewNameSmall
                      ]}>{v.nombreConsumidor}</Text>
                      <View style={styles.reviewRatingContainer}>
                        <Text style={styles.reviewRatingText}>⭐ {v.calificacion}</Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.reviewComment,
                      isSmallDevice && styles.reviewCommentSmall
                    ]}>{v.comentario}</Text>
                  </PremiumCard>
                ))
              ) : (
                <View style={styles.noReviewsContainer}>
                  <Text style={styles.noReviewsIcon}>📝</Text>
                  <Text style={[
                    styles.noReviews,
                    isSmallDevice && styles.noReviewsSmall
                  ]}>Aún no hay reseñas</Text>
                  <Text style={[
                    styles.noReviewsSubtext,
                    isSmallDevice && styles.noReviewsSubtextSmall
                  ]}>
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
          </PremiumCard>
        </View>
      </Modal>

      <Modal 
        visible={showNuevaReseña} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowNuevaReseña(false)}
      >
        <TouchableWithoutFeedback onPress={cerrarTeclado}>
          <View style={[
            styles.modalOverlay,
            { justifyContent: keyboardHeight > 0 ? 'flex-start' : 'center' }
          ]}>
            <PremiumCard style={[
              styles.modalContentReseña,
              isSmallDevice && styles.modalContentReseñaSmall,
              isTablet && styles.modalContentReseñaTablet,
              keyboardHeight > 0 && { 
                marginTop: Platform.OS === 'ios' ? 40 : 20,
                maxHeight: height - keyboardHeight - (Platform.OS === 'ios' ? 80 : 40)
              }
            ]}>
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[
                  styles.modalTitle,
                  isSmallDevice && styles.modalTitleSmall
                ]}>✍️ Escribe tu reseña</Text>
                
                <Text style={[
                  styles.inputLabel,
                  isSmallDevice && styles.inputLabelSmall
                ]}>Calificación</Text>
                <View style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setNuevaCalificacion(star)}
                    >
                      <Text style={[
                        styles.ratingStar,
                        star <= nuevaCalificacion && styles.ratingStarActive,
                        isSmallDevice && styles.ratingStarSmall
                      ]}>
                        ⭐
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[
                  styles.inputLabel,
                  isSmallDevice && styles.inputLabelSmall
                ]}>Tu comentario</Text>
                <TextInput
                  ref={textInputRef}
                  style={[
                    styles.textArea,
                    isSmallDevice && styles.textAreaSmall
                  ]}
                  placeholder="Cuéntanos tu experiencia..."
                  placeholderTextColor="#94a3b8"
                  value={nuevoComentario}
                  onChangeText={setNuevoComentario}
                  multiline
                  numberOfLines={isSmallDevice ? 3 : 4}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={cerrarTeclado}
                />

                <View style={[
                  styles.modalActions,
                  isSmallDevice && styles.modalActionsSmall,
                  keyboardHeight > 0 && { marginBottom: 20 }
                ]}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      cerrarTeclado();
                      setShowNuevaReseña(false);
                    }}
                  >
                    <Text style={[
                      styles.modalButtonText, 
                      styles.modalButtonSecondaryText,
                      isSmallDevice && styles.modalButtonTextSmall
                    ]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={() => {
                      cerrarTeclado();
                      enviarReseña();
                    }}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      isSmallDevice && styles.modalButtonTextSmall
                    ]}>Enviar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </PremiumCard>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos base
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
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header
  header: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  backButton: {
    zIndex: 11,
  },
  backButtonCircle: {
    width: width < 375 ? 36 : 44,
    height: width < 375 ? 36 : 44,
    borderRadius: width < 375 ? 18 : 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  backButtonIcon: {
    fontSize: width < 375 ? 18 : 22,
    color: "#FF6B35",
    fontWeight: "700",
  },
  
  // Imagen del producto
  imageSection: {
    height: width < 375 ? 300 : 400,
    backgroundColor: "#faf7ef",
    position: "relative",
  },
  imageSectionLandscape: {
    height: width * 0.6,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  mainImageLandscape: {
    height: "100%",
  },
  stockBadge: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: width < 375 ? 15 : 20,
    paddingVertical: width < 375 ? 8 : 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stockBadgeLandscape: {
    bottom: 15,
  },
  stockBadgeText: {
    color: "white",
    fontSize: width < 375 ? 10 : 12,
    fontWeight: "700",
    fontFamily: "System",
  },
  
  // Contenido principal
  contentSection: {
    padding: width < 375 ? 15 : 20,
  },
  contentSectionLandscape: {
    paddingHorizontal: width * 0.1,
  },
  contentSectionTablet: {
    paddingHorizontal: 40,
  },
  
  // Categorías
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: width < 375 ? 6 : 8,
    marginBottom: width < 375 ? 10 : 12,
  },
  categoryBadge: {
    paddingHorizontal: width < 375 ? 12 : 14,
    paddingVertical: width < 375 ? 5 : 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: width < 375 ? 10 : 11,
    fontWeight: "600",
    fontFamily: "System",
  },
  
  // Nombre del producto
  productName: {
    fontSize: width < 375 ? 22 : 26,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: width < 375 ? 10 : 12,
    lineHeight: width < 375 ? 28 : 32,
    fontFamily: "System",
  },
  productNameSmall: {
    fontSize: 20,
  },
  productNameTablet: {
    fontSize: 28,
  },
  productNameLandscape: {
    fontSize: 24,
  },
  
  // Calificación
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: width < 375 ? 16 : 20,
    justifyContent: "space-between",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingStars: {
    fontSize: width < 375 ? 18 : 20,
    marginRight: width < 375 ? 4 : 6,
  },
  ratingStarsSmall: {
    fontSize: 16,
  },
  ratingValue: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: "700",
    color: "#F4B419",
    marginRight: width < 375 ? 4 : 6,
    fontFamily: "System",
  },
  ratingValueSmall: {
    fontSize: 14,
  },
  ratingCount: {
    fontSize: width < 375 ? 11 : 13,
    color: "#64748b",
    fontFamily: "System",
  },
  ratingCountSmall: {
    fontSize: 11,
  },
  
  // Tarjeta premium
  premiumCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: width < 375 ? 16 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  
  // Precio
  priceCard: {
    marginBottom: width < 375 ? 16 : 20,
  },
  priceCardSmall: {
    padding: 14,
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: width < 375 ? 6 : 8,
  },
  priceLabel: {
    fontSize: width < 375 ? 10 : 11,
    fontWeight: "600",
    color: "#64748b",
    fontFamily: "System",
  },
  priceLabelSmall: {
    fontSize: 9,
  },
  unitLabel: {
    fontSize: width < 375 ? 10 : 11,
    color: "#64748b",
    fontFamily: "System",
  },
  unitLabelSmall: {
    fontSize: 9,
  },
  priceValue: {
    fontSize: width < 375 ? 30 : 36,
    fontWeight: "900",
    color: "#FF6B35",
    fontFamily: "System",
  },
  priceValueSmall: {
    fontSize: 28,
  },
  priceValueTablet: {
    fontSize: 40,
  },
  
  // Cantidad
  quantitySection: {
    marginBottom: width < 375 ? 16 : 20,
  },
  sectionLabel: {
    fontSize: width < 375 ? 13 : 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: width < 375 ? 10 : 12,
    fontFamily: "System",
  },
  sectionLabelSmall: {
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: width < 375 ? 8 : 12,
    backgroundColor: "#F9FBF7",
    padding: width < 375 ? 10 : 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  quantityControlsSmall: {
    gap: 8,
    padding: 8,
  },
  quantityButton: {
    width: width < 375 ? 36 : 40,
    height: width < 375 ? 36 : 40,
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  quantityButtonSmall: {
    width: 32,
    height: 32,
  },
  quantityButtonText: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "System",
  },
  quantityButtonTextSmall: {
    fontSize: 16,
  },
  quantityDisplay: {
    width: width < 375 ? 36 : 40,
    alignItems: "center",
  },
  quantityDisplaySmall: {
    width: 32,
  },
  quantityText: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
  },
  quantityTextSmall: {
    fontSize: 14,
  },
  
  // Botones principales
  actionsRow: {
    gap: width < 375 ? 8 : 12,
    marginBottom: width < 375 ? 10 : 12,
  },
  actionsRowSmall: {
    flexDirection: width < 375 ? 'column' : 'row',
  },
  actionsRowLandscape: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: width < 375 ? 14 : 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cartButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
  },
  buyButton: {
    backgroundColor: '#FF6B35',
  },
  actionButtonText: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: '700',
    fontFamily: "System",
  },
  actionButtonTextSmall: {
    fontSize: 13,
  },
  cartButtonText: {
    color: '#FF6B35',
  },
  buyButtonText: {
    color: 'white',
  },
  
  // Botones secundarios
  secondaryActions: {
    flexDirection: "row",
    gap: width < 375 ? 8 : 10,
    marginBottom: width < 375 ? 16 : 20,
  },
  secondaryActionsSmall: {
    flexDirection: width < 375 ? 'column' : 'row',
  },
  secondaryActionsLandscape: {
    flexDirection: 'row',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#FFF3E0",
    padding: width < 375 ? 10 : 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: width < 375 ? 40 : 44,
  },
  favoritoActivo: {
    backgroundColor: "#FFE5E9",
  },
  secondaryButtonText: {
    fontSize: width < 375 ? 12 : 13,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "System",
  },
  secondaryButtonTextSmall: {
    fontSize: 11,
  },
  
  // Vendedor
  vendorCard: {
    flexDirection: width < 375 ? 'column' : "row",
    alignItems: "center",
    marginBottom: width < 375 ? 16 : 20,
  },
  vendorCardSmall: {
    padding: 16,
  },
  vendorCardLandscape: {
    flexDirection: 'row',
  },
  vendorHeader: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    marginBottom: width < 375 ? 12 : 0,
  },
  vendorAvatar: {
    width: width < 375 ? 40 : 50,
    height: width < 375 ? 40 : 50,
    borderRadius: width < 375 ? 20 : 25,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: width < 375 ? 10 : 12,
  },
  vendorAvatarSmall: {
    width: 36,
    height: 36,
  },
  vendorAvatarText: {
    fontSize: width < 375 ? 20 : 24,
  },
  vendorAvatarTextSmall: {
    fontSize: 18,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorLabel: {
    fontSize: width < 375 ? 9 : 10,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 2,
    fontFamily: "System",
  },
  vendorLabelSmall: {
    fontSize: 8,
  },
  vendorName: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
  },
  vendorNameSmall: {
    fontSize: 13,
  },
  vendorCompany: {
    fontSize: width < 375 ? 11 : 12,
    color: "#64748b",
    marginTop: 2,
    fontFamily: "System",
  },
  vendorCompanySmall: {
    fontSize: 10,
  },
  verPerfilButtonSmall: {
    paddingHorizontal: width < 375 ? 14 : 16,
    paddingVertical: width < 375 ? 7 : 8,
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    marginLeft: width < 375 ? 0 : 10,
    alignSelf: width < 375 ? 'stretch' : 'auto',
    alignItems: 'center',
  },
  verPerfilButtonSmallSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verPerfilButtonTextSmall: {
    fontSize: width < 375 ? 12 : 13,
    fontWeight: "700",
    color: "white",
    fontFamily: "System",
  },
  verPerfilButtonTextSmallSmall: {
    fontSize: 11,
  },
  
  // Descripción
  descriptionCard: {
    marginBottom: width < 375 ? 14 : 16,
  },
  sectionTitle: {
    fontSize: width < 375 ? 16 : 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: width < 375 ? 10 : 12,
    fontFamily: "System",
  },
  sectionTitleSmall: {
    fontSize: 15,
  },
  descriptionText: {
    fontSize: width < 375 ? 13 : 14,
    color: "#64748b",
    lineHeight: width < 375 ? 20 : 22,
    fontFamily: "System",
  },
  descriptionTextSmall: {
    fontSize: 12,
    lineHeight: 18,
  },
  descriptionTextTablet: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Botones de reseñas
  verReseñasButton: {
    backgroundColor: "#FFF9E6",
    padding: width < 375 ? 14 : 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: width < 375 ? 10 : 12,
    borderWidth: 2,
    borderColor: "#F4B419",
  },
  verReseñasButtonText: {
    fontSize: width < 375 ? 13 : 15,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
  },
  verReseñasButtonTextSmall: {
    fontSize: 12,
  },
  escribirReseñaButton: {
    backgroundColor: "#FF6B35",
    padding: width < 375 ? 14 : 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: width < 375 ? 16 : 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  escribirReseñaButtonText: {
    fontSize: width < 375 ? 13 : 15,
    fontWeight: "700",
    color: "white",
    fontFamily: "System",
  },
  escribirReseñaButtonTextSmall: {
    fontSize: 12,
  },
  
  // Modales - CORREGIDOS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: width < 375 ? 15 : 20,
  },
  modalContentReseña: {
    width: "100%",
    maxWidth: 400,
    maxHeight: height * 0.8,
    alignSelf: 'center',
  },
  modalContentReseñaSmall: {
    maxHeight: height * 0.85,
  },
  modalContentReseñaTablet: {
    maxWidth: 500,
  },
  modalScrollView: {
    maxHeight: height * 0.7,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalContentSmall: {
    maxWidth: 350,
    padding: 16,
  },
  modalContentTablet: {
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: width < 375 ? 14 : 16,
    fontFamily: "System",
  },
  modalTitleSmall: {
    fontSize: 16,
  },
  modalText: {
    fontSize: width < 375 ? 13 : 14,
    color: "#64748b",
    marginBottom: width < 375 ? 8 : 10,
    lineHeight: width < 375 ? 18 : 20,
    fontFamily: "System",
  },
  modalTextSmall: {
    fontSize: 12,
  },
  modalButton: {
    backgroundColor: "#FF6B35",
    padding: width < 375 ? 12 : 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: width < 375 ? 14 : 16,
  },
  modalButtonSecondary: {
    backgroundColor: "#e5e7eb",
  },
  modalButtonText: {
    color: "white",
    fontSize: width < 375 ? 13 : 15,
    fontWeight: "700",
    fontFamily: "System",
  },
  modalButtonTextSmall: {
    fontSize: 12,
  },
  modalButtonSecondaryText: {
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    gap: width < 375 ? 8 : 10,
    marginTop: width < 375 ? 14 : 16,
    marginBottom: 0,
  },
  modalActionsSmall: {
    marginBottom: 0,
  },
  
  // Reseñas
  reviewCard: {
    marginBottom: width < 375 ? 10 : 12,
    padding: width < 375 ? 14 : 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: width < 375 ? 8 : 10,
  },
  reviewName: {
    fontSize: width < 375 ? 13 : 15,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
  },
  reviewNameSmall: {
    fontSize: 12,
  },
  reviewRatingContainer: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: width < 375 ? 8 : 10,
    paddingVertical: width < 375 ? 3 : 4,
    borderRadius: 12,
  },
  reviewRatingText: {
    fontSize: width < 375 ? 12 : 14,
    fontWeight: "700",
    color: "#F4B419",
    fontFamily: "System",
  },
  reviewComment: {
    fontSize: width < 375 ? 12 : 14,
    color: "#64748b",
    lineHeight: width < 375 ? 18 : 20,
    fontFamily: "System",
  },
  reviewCommentSmall: {
    fontSize: 11,
    lineHeight: 16,
  },
  noReviewsContainer: {
    alignItems: "center",
    padding: width < 375 ? 30 : 40,
  },
  noReviewsIcon: {
    fontSize: width < 375 ? 40 : 48,
    marginBottom: width < 375 ? 10 : 12,
  },
  noReviews: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: width < 375 ? 4 : 6,
    fontFamily: "System",
  },
  noReviewsSmall: {
    fontSize: 13,
  },
  noReviewsSubtext: {
    fontSize: width < 375 ? 11 : 13,
    color: "#64748b",
    textAlign: "center",
    fontFamily: "System",
  },
  noReviewsSubtextSmall: {
    fontSize: 10,
  },
  
  // Inputs del modal de reseña
  inputLabel: {
    fontSize: width < 375 ? 12 : 13,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: width < 375 ? 6 : 8,
    marginTop: width < 375 ? 10 : 12,
    fontFamily: "System",
  },
  inputLabelSmall: {
    fontSize: 11,
  },
  ratingSelector: {
    flexDirection: "row",
    gap: width < 375 ? 8 : 10,
    marginBottom: width < 375 ? 10 : 12,
  },
  ratingStar: {
    fontSize: width < 375 ? 28 : 32,
    opacity: 0.3,
  },
  ratingStarSmall: {
    fontSize: 24,
  },
  ratingStarActive: {
    opacity: 1,
  },
  textArea: {
    backgroundColor: "#F9FBF7",
    borderRadius: 12,
    padding: width < 375 ? 12 : 14,
    fontSize: width < 375 ? 13 : 14,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: width < 375 ? 80 : 100,
    maxHeight: width < 375 ? 120 : 150,
    textAlignVertical: "top",
    fontFamily: "System",
  },
  textAreaSmall: {
    minHeight: 70,
    maxHeight: 100,
    fontSize: 12,
    padding: 10,
  },
});