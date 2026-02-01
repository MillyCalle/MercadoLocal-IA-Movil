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
import { useFavoritos } from "../context/FavoritosContext";

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


  // 
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
    const { agregarFavorito, favoritos } = useFavoritos();

    const [producto, setProducto] = useState<Producto | null>(null);
    const [loading, setLoading] = useState(true);
    const [cantidad, setCantidad] = useState(1);
    const [menuVendedor, setMenuVendedor] = useState(false);
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

    // Verificar si el producto está en favoritos usando el contexto
    const esFavorito = producto ? favoritos.some(fav => fav.idProducto === producto.idProducto) : false;

    useEffect(() => {
      cargarProducto();
      startAnimations();
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

    const guardarYIrAFavoritos = async () => {
    try {
      setGuardandoFavorito(true);
      
      if (!producto) {
        Alert.alert("Error", "No hay información del producto");
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

      // 2. PARSEAR USUARIO CORRECTAMENTE
      let user;
      try {
        user = JSON.parse(userStr);
      } catch (parseError) {
        console.error("Error parseando usuario:", parseError);
        Alert.alert("Error", "Error en los datos del usuario");
        setGuardandoFavorito(false);
        return;
      }
      
      // 3. VERIFICAR DATOS DEL USUARIO
      if (!user || !user.idUsuario) {
        Alert.alert("Error", "No se pudo obtener la información del usuario");
        setGuardandoFavorito(false);
        return;
      }

      // 4. SOLO AGREGAR SI NO ES FAVORITO
      if (!esFavorito) {
        // Agregar al contexto local primero (para feedback inmediato)
        agregarFavorito(producto.idProducto);
        
        // Hacer petición al backend
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/agregar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              idConsumidor: user.idUsuario,
              idProducto: producto.idProducto,
            }),
          });

          if (!response.ok) {
            // Leer la respuesta UNA SOLA VEZ
            let errorData;
            try {
              const responseText = await response.text();
              try {
                errorData = JSON.parse(responseText);
              } catch {
                errorData = { message: responseText || "Error del servidor" };
              }
            } catch {
              errorData = { message: "Error al leer respuesta del servidor" };
            }
            
            const errorMessage = errorData.message || errorData.error || "Error del servidor";
            
            // Si el producto ya está en favoritos en el backend, no es un error crítico
            if (typeof errorMessage === 'string' && 
                (errorMessage.includes("ya existe") || 
                errorMessage.includes("already") ||
                errorMessage.includes("duplicate"))) {
              console.log("Producto ya estaba en favoritos en el servidor:", errorMessage);
              // Solo log, NO mostramos alerta
            } else {
              console.warn("Error del servidor al agregar favorito:", errorMessage);
              
            }
          } else {
            // Respuesta exitosa
            const responseData = await response.json();
            console.log("Favorito agregado en el servidor:", responseData);
          }
        } catch (fetchError: any) {
          console.error("Error en la petición al servidor:", fetchError.message || fetchError);
        
        }
        
        Alert.alert("¡Guardado!", "Producto agregado a favoritos");
      } else {
        // Si ya es favorito, solo navegamos
        Alert.alert("Información", "Este producto ya está en tus favoritos");
      }
      
      // 5. NAVEGAR A FAVORITOS
      router.push("/(tabs)/Favoritos" as any);
      
    } catch (error) {
      console.error("Error en guardarYIrAFavoritos:", error);
      Alert.alert("Error", "No se pudo completar la acción");
    } finally {
      setGuardandoFavorito(false);
    }
  };

    const agregarAlCarrito = async () => {
      try {
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
    console.log("🛒 [COMPRAR AHORA] Iniciando...");
    
    // 1. Verificar autenticación
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

    // 2. Confirmar con el usuario
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
      console.log("❌ Usuario canceló la compra");
      return;
    }

    // 3. Crear un objeto temporal en AsyncStorage para esta compra rápida
    const compraRapida = {
      producto: {
        idProducto: producto!.idProducto,
        nombreProducto: producto!.nombreProducto,
        precioProducto: producto!.precioProducto,
        imagenProducto: producto!.imagenProducto,
        idVendedor: producto!.idVendedor || 1,
        cantidad: cantidad
      },
      total: producto!.precioProducto * cantidad,
      fecha: new Date().toISOString(),
      esCompraRapida: true // Flag para identificar que es "Comprar Ahora"
    };

    // Guardar la compra rápida en AsyncStorage
    await AsyncStorage.setItem('compraRapida', JSON.stringify(compraRapida));
    
    console.log("✅ Compra rápida guardada:", compraRapida);

    // 4. Navegar al Checkout Unificado
    router.push({
      pathname: "/consumidor/CheckoutUnificado" as any,
      params: { 
        esCompraRapida: 'true',
        productoId: String(producto!.idProducto),
        cantidad: String(cantidad)
      }
    });

  } catch (error: any) {
    console.error("❌ Error en comprar ahora:", error);
    Alert.alert("Error", 
      "No se pudo iniciar la compra. Verifica tu conexión.\n" + 
      (error.message || "")
    );
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

        const response = await fetch(`${API_CONFIG.BASE_URL}/valoraciones/crear`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        // Leer la respuesta UNA SOLA VEZ
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

          <View style={styles.imageSection}>
            <Image
              source={{ uri: producto.imagenProducto }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            
            {producto.stockProducto > 0 && producto.stockProducto <= 10 && (
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>
                  ⚡ ¡Solo {producto.stockProducto} disponibles!
                </Text>
              </View>
            )}
          </View>

          <View style={styles.contentSection}>
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

            <Text style={styles.productName}>{producto.nombreProducto}</Text>

            <TouchableOpacity
              style={styles.ratingRow}
              onPress={() => setShowReseñas(true)}
            >
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStars}>⭐</Text>
                <Text style={styles.ratingValue}>
                  {producto.promedioValoracion?.toFixed(1) || "0.0"}
                </Text>
              </View>
              <Text style={styles.ratingCount}>
                ({producto.totalValoraciones || 0} reseñas)
              </Text>
            </TouchableOpacity>

            <PremiumCard style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceLabel}>PRECIO</Text>
                {producto.unidadMedida && (
                  <Text style={styles.unitLabel}>
                    Por {producto.unidadMedida}
                  </Text>
                )}
              </View>
              <Text style={styles.priceValue}>
                ${parseFloat(String(producto.precioProducto)).toFixed(2)}
              </Text>
            </PremiumCard>

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
                <Text style={[styles.actionButtonText, styles.cartButtonText]}>🛒 Agregar al Carrito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.buyButton]}
                onPress={comprarAhora}
              >
                <Text style={[styles.actionButtonText, styles.buyButtonText]}>⚡ Comprar Ahora</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, esFavorito && styles.favoritoActivo]}
                onPress={guardarYIrAFavoritos}
                disabled={guardandoFavorito}
              >
                {guardandoFavorito ? (
                  <ActivityIndicator size="small" color="#FF6B35" />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    {esFavorito ? "❤️ Guardado" : "🤍 Guardar"}
                  </Text>
                )}
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

            <PremiumCard style={styles.vendorCard}>
              <View style={styles.vendorHeader}>
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
              </View>
              <TouchableOpacity
                style={styles.vendorMenuButton}
                onPress={() => setMenuVendedor(true)}
              >
                <Text style={styles.vendorMenuIcon}>⋯</Text>
              </TouchableOpacity>
            </PremiumCard>

            <PremiumCard style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>📋 Descripción</Text>
              <Text style={styles.descriptionText}>
                {producto.descripcionProducto || "Sin descripción disponible"}
              </Text>
            </PremiumCard>

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

        {/* MODALES */}
        <Modal visible={showEnvio} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <PremiumCard style={styles.modalContent}>
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
            </PremiumCard>
          </View>
        </Modal>

        <Modal visible={showReembolso} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <PremiumCard style={styles.modalContent}>
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
            </PremiumCard>
          </View>
        </Modal>

        <Modal visible={showReseñas} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <PremiumCard style={[styles.modalContent, { maxHeight: height * 0.7 }]}>
              <Text style={styles.modalTitle}>⭐ Reseñas del Producto</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {producto.valoraciones && producto.valoraciones.length > 0 ? (
                  producto.valoraciones.map((v, i) => (
                    <PremiumCard key={i} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewName}>{v.nombreConsumidor}</Text>
                        <View style={styles.reviewRatingContainer}>
                          <Text style={styles.reviewRatingText}>⭐ {v.calificacion}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{v.comentario}</Text>
                    </PremiumCard>
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
            </PremiumCard>
          </View>
        </Modal>

        <Modal visible={showNuevaReseña} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <PremiumCard style={styles.modalContent}>
              <Text style={styles.modalTitle}>✍️ Escribe tu reseña</Text>
              
              <Text style={styles.inputLabel}>Calificación</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNuevaCalificacion(star)}
                  >
                    <Text style={[
                      styles.ratingStar,
                      star <= nuevaCalificacion && styles.ratingStarActive
                    ]}>
                      ⭐
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
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowNuevaReseña(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={enviarReseña}>
                  <Text style={styles.modalButtonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </PremiumCard>
          </View>
        </Modal>

      {/* MODAL DEL MENÚ DEL VENDEDOR - CORREGIDO */}
        <Modal visible={menuVendedor} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVendedor(false)}
          >
            <PremiumCard style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVendedor(false);
                  // Navegar al perfil del vendedor
                  if (producto && producto.idVendedor) {
                    router.push(`/(tabs)/VendedorPerfil?id=${producto.idVendedor}` as any);
                  } else {
                    Alert.alert("Error", "No se encontró información del vendedor");
                  }
                }}
              >
                <Text style={styles.menuItemText}>👤 Ver Perfil del Vendedor</Text>
              </TouchableOpacity>
            </PremiumCard>
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
      color: "#FF6B35",
      fontWeight: "600",
      fontFamily: "System",
    },
    scrollView: {
      flex: 1,
    },
    header: {
      position: "absolute",
      top: 50,
      left: 20,
      right: 20,
      zIndex: 10,
    },
    backButton: {
      zIndex: 11,
    },
    backButtonCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
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
      fontSize: 22,
      color: "#FF6B35",
      fontWeight: "700",
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
      bottom: 20,
      alignSelf: "center",
      backgroundColor: "#FF6B35",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    stockBadgeText: {
      color: "white",
      fontSize: 12,
      fontWeight: "700",
      fontFamily: "System",
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
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: "600",
      fontFamily: "System",
    },
    productName: {
      fontSize: 26,
      fontWeight: "800",
      color: "#1e293b",
      marginBottom: 12,
      lineHeight: 32,
      fontFamily: "System",
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      justifyContent: "space-between",
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
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
      fontFamily: "System",
    },
    ratingCount: {
      fontSize: 13,
      color: "#64748b",
      fontFamily: "System",
    },
    premiumCard: {
      backgroundColor: "white",
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: "#f1f5f9",
    },
    priceCard: {
      marginBottom: 20,
    },
    priceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    priceLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "#64748b",
      fontFamily: "System",
    },
    unitLabel: {
      fontSize: 11,
      color: "#64748b",
      fontFamily: "System",
    },
    priceValue: {
      fontSize: 36,
      fontWeight: "900",
      color: "#FF6B35",
      fontFamily: "System",
    },
    quantitySection: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: 12,
      fontFamily: "System",
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
      borderColor: "#e5e7eb",
    },
    quantityButtonText: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FF6B35",
      fontFamily: "System",
    },
    quantityDisplay: {
      width: 40,
      alignItems: "center",
    },
    quantityText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1e293b",
      fontFamily: "System",
    },
    actionsRow: {
      gap: 12,
      marginBottom: 12,
    },
    actionButton: {
      padding: 16,
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
      fontSize: 16,
      fontWeight: '700',
      fontFamily: "System",
    },
    cartButtonText: {
      color: '#FF6B35',
    },
    buyButtonText: {
      color: 'white',
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
      justifyContent: "center",
      minHeight: 44,
    },
    favoritoActivo: {
      backgroundColor: "#FFE5E9",
    },
    secondaryButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#1e293b",
      fontFamily: "System",
    },
    vendorCard: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    vendorHeader: {
      flexDirection: "row",
      flex: 1,
      alignItems: "center",
    },
    vendorAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "#FF6B35",
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
      color: "#64748b",
      fontWeight: "600",
      marginBottom: 2,
      fontFamily: "System",
    },
    vendorName: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1e293b",
      fontFamily: "System",
    },
    vendorCompany: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 2,
      fontFamily: "System",
    },
    vendorMenuButton: {
      padding: 8,
    },
    vendorMenuIcon: {
      fontSize: 24,
      color: "#64748b",
    },
    descriptionCard: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: 12,
      fontFamily: "System",
    },
    descriptionText: {
      fontSize: 14,
      color: "#64748b",
      lineHeight: 22,
      fontFamily: "System",
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
      color: "#1e293b",
      fontFamily: "System",
    },
    escribirReseñaButton: {
      backgroundColor: "#FF6B35",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 20,
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    escribirReseñaButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "white",
      fontFamily: "System",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: 16,
      fontFamily: "System",
    },
    modalText: {
      fontSize: 14,
      color: "#64748b",
      marginBottom: 10,
      lineHeight: 20,
      fontFamily: "System",
    },
    modalButton: {
      backgroundColor: "#FF6B35",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 16,
    },
    modalButtonSecondary: {
      backgroundColor: "#e5e7eb",
    },
    modalButtonText: {
      color: "white",
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "System",
    },
    modalButtonSecondaryText: {
      color: "#333",
    },
    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    },
    reviewCard: {
      marginBottom: 12,
      padding: 16,
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
      color: "#1e293b",
      fontFamily: "System",
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
      fontFamily: "System",
    },
    reviewComment: {
      fontSize: 14,
      color: "#64748b",
      lineHeight: 20,
      fontFamily: "System",
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
      color: "#1e293b",
      marginBottom: 6,
      fontFamily: "System",
    },
    noReviewsSubtext: {
      fontSize: 13,
      color: "#64748b",
      textAlign: "center",
      fontFamily: "System",
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: 8,
      marginTop: 12,
      fontFamily: "System",
    },
    ratingSelector: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    ratingStar: {
      fontSize: 32,
      opacity: 0.3,
    },
    ratingStarActive: {
      opacity: 1,
    },
    textArea: {
      backgroundColor: "#F9FBF7",
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: "#1e293b",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      minHeight: 100,
      textAlignVertical: "top",
      fontFamily: "System",
    },
    menuCard: {
      width: "80%",
      backgroundColor: "white",
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    menuItem: {
      padding: 18,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#1e293b",
      fontFamily: "System",
    },
  });