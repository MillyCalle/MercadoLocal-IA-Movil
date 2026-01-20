// app/vendedor/VendedorPerfil.tsx - VERSIÓN CON DISEÑO COHERENTE
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG } from "../../config";
import { useCarrito } from "../context/CarritoContext";

const { width } = Dimensions.get("window");

// Componente para los círculos flotantes del fondo
const FloatingCirclesVendedor = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

interface Producto {
  idProducto: number;
  nombreProducto: string;
  precioProducto: number;
  stockProducto: number;
  imagenProducto: string;
  unidadMedida?: string;
  promedioValoracion?: number;
  totalValoraciones?: number;
  idVendedor: number;
  nombreVendedor?: string;
  apellidoVendedor?: string;
  nombreEmpresa?: string;
  direccion?: string;
  telefono?: string;
}

interface VendedorInfo {
  idVendedor: number;
  nombreEmpresa: string;
  nombreVendedor: string;
  apellidoVendedor: string;
  direccion: string;
  telefono: string;
  calificacionPromedio?: number;
}

export default function VendedorPerfil() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { agregarCarrito: agregarAlCarritoContext } = useCarrito();

  const [vendedor, setVendedor] = useState<VendedorInfo | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    cargarDatosVendedor();
    startAnimations();
  }, [id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const cargarDatosVendedor = async () => {
    if (!id) {
      setError("ID de vendedor inválido");
      setLoading(false);
      return;
    }

    try {
      try {
        const responseVendedor = await fetch(`${API_CONFIG.BASE_URL}/api/public/vendedores/${id}`);
        
        if (responseVendedor.ok) {
          const data = await responseVendedor.json();
          
          setVendedor({
            idVendedor: data.idVendedor || parseInt(id as string),
            nombreEmpresa: data.nombreEmpresa || "Empresa",
            nombreVendedor: data.nombreVendedor || "Propietario",
            apellidoVendedor: data.apellidoVendedor || "",
            direccion: data.direccion || "Dirección no especificada",
            telefono: data.telefono || "Sin teléfono",
            calificacionPromedio: data.calificacionPromedio || 0
          });
          
          setProductos(data.productos || []);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.log("No se pudo cargar desde endpoint de vendedores");
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/productos/listar`);
      
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }

      const allProductos: Producto[] = await response.json();
      
      const productosVendedor = allProductos.filter(
        (p) => p.idVendedor === parseInt(id as string)
      );
      
      if (productosVendedor.length === 0) {
        throw new Error("No se encontraron productos de este vendedor");
      }
      
      const primerProducto = productosVendedor[0];
      
      const vendedorData: VendedorInfo = {
        idVendedor: parseInt(id as string),
        nombreEmpresa: primerProducto.nombreEmpresa || "Empresa",
        nombreVendedor: primerProducto.nombreVendedor || "Propietario",
        apellidoVendedor: primerProducto.apellidoVendedor || "",
        direccion: primerProducto.direccion || "Dirección no especificada",
        telefono: primerProducto.telefono || "Sin teléfono",
        calificacionPromedio: primerProducto.promedioValoracion || 0
      };
      
      setVendedor(vendedorData);
      setProductos(productosVendedor);
      setError(null);
      
    } catch (error: any) {
      console.error("Error cargando datos del vendedor:", error);
      setError(error.message || "No se pudo cargar la información del vendedor");
      
      const vendedorRespaldo: VendedorInfo = {
        idVendedor: parseInt(id as string),
        nombreEmpresa: "Huerta Orgánica Don Luis",
        nombreVendedor: "Luis Fernando",
        apellidoVendedor: "Morales Torres",
        direccion: "Parroquia Sidcay, Cuenca - Azuay",
        telefono: "0987 123 456",
        calificacionPromedio: 4.8
      };
      
      setVendedor(vendedorRespaldo);
      
      const productosEjemplo: Producto[] = [
        {
          idProducto: 1,
          nombreProducto: "Tomates Orgánicos Criollos",
          precioProducto: 2.50,
          stockProducto: 10,
          imagenProducto: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
          promedioValoracion: 4.7,
          totalValoraciones: 24,
          idVendedor: parseInt(id as string),
        },
        {
          idProducto: 2,
          nombreProducto: "Lechuga Fresca Hidropónica",
          precioProducto: 1.80,
          stockProducto: 8,
          imagenProducto: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop",
          promedioValoracion: 4.5,
          totalValoraciones: 18,
          idVendedor: parseInt(id as string),
        },
        {
          idProducto: 3,
          nombreProducto: "Zanahorias Baby Orgánicas",
          precioProducto: 2.20,
          stockProducto: 15,
          imagenProducto: "https://images.unsplash.com/photo-1589923186741-b7d59d6b2c4d?w=400&h=300&fit=crop",
          promedioValoracion: 4.9,
          totalValoraciones: 32,
          idVendedor: parseInt(id as string),
        },
        {
          idProducto: 4,
          nombreProducto: "Pimientos Tricolor",
          precioProducto: 3.50,
          stockProducto: 6,
          imagenProducto: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop",
          promedioValoracion: 4.6,
          totalValoraciones: 15,
          idVendedor: parseInt(id as string),
        }
      ];
      
      setProductos(productosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarCarrito = async (producto: Producto) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");

      if (!userStr || !token) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para agregar productos al carrito",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Iniciar sesión", onPress: () => router.push("/login") },
          ]
        );
        return;
      }

      await agregarAlCarritoContext(producto.idProducto, 1);

      Alert.alert(
        "✅ ¡Agregado!", 
        `${producto.nombreProducto} agregado al carrito`,
        [{ text: "OK", style: "default" }]
      );
      
    } catch (error: any) {
      console.error("Error agregando al carrito:", error);
      Alert.alert("Error", error.message || "No se pudo agregar al carrito");
    }
  };

  const handleLlamar = () => {
    if (vendedor?.telefono && vendedor.telefono !== "Sin teléfono" && vendedor.telefono !== "Teléfono no disponible") {
      let phoneNumber = vendedor.telefono.replace(/\s/g, '');
      
      // Formatear para llamada telefónica
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+593' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }
      
      const phoneUrl = `tel:${phoneNumber}`;
      
      Linking.canOpenURL(phoneUrl).then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Error", "No se puede realizar llamadas desde este dispositivo");
        }
      });
    } else {
      Alert.alert("Información", "Número de teléfono no disponible");
    }
  };

  const handleWhatsApp = () => {
    if (vendedor?.telefono && vendedor.telefono !== "Sin teléfono") {
      let phoneNumber = vendedor.telefono.replace(/\s/g, '');
      
      // Convertir a formato internacional para WhatsApp
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '593' + phoneNumber.substring(1);
      }
      
      const message = "Hola, me interesan sus productos. ¿Podría darme más información?";
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            "WhatsApp no disponible",
            "No se pudo abrir WhatsApp. Asegúrate de tenerlo instalado.",
            [
              { text: "Cancelar", style: "cancel" },
              { 
                text: "Descargar WhatsApp", 
                onPress: () => {
                  const storeUrl = Platform.OS === 'ios' 
                    ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                    : 'https://play.google.com/store/apps/details?id=com.whatsapp';
                  Linking.openURL(storeUrl);
                }
              }
            ]
          );
        }
      }).catch(err => {
        console.error("Error al verificar WhatsApp:", err);
        Alert.alert("Error", "No se pudo verificar si WhatsApp está disponible");
      });
    } else {
      Alert.alert("Información", "Número de WhatsApp no disponible");
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingStars}>
          {"⭐".repeat(fullStars)}
          {hasHalfStar && "⭐"}
        </Text>
      </View>
    );
  };

  const calcularPromedioGeneral = () => {
    if (productos.length === 0) return "0.0";
    
    const productosConRating = productos.filter(p => p.promedioValoracion && p.promedioValoracion > 0);
    if (productosConRating.length === 0) return "0.0";
    
    const suma = productosConRating.reduce((acc, p) => acc + (p.promedioValoracion || 0), 0);
    return (suma / productosConRating.length).toFixed(1);
  };

  const renderProducto = ({ item }: { item: Producto }) => {
    const imageUri = item.imagenProducto && item.imagenProducto !== "" 
      ? item.imagenProducto 
      : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80";

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/producto/${item.idProducto}`)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nombreProducto}
          </Text>

          {/* Valoración */}
          {item.promedioValoracion !== undefined && (
            <View style={styles.productRatingContainer}>
              {renderStars(item.promedioValoracion)}
              <Text style={styles.productRatingText}>
                {item.promedioValoracion.toFixed(1)} ({item.totalValoraciones || 0})
              </Text>
            </View>
          )}

          <View style={styles.productFooter}>
            <View>
              <Text style={styles.productPrice}>${item.precioProducto.toFixed(2)}</Text>
              {item.unidadMedida && (
                <Text style={styles.productUnit}>{item.unidadMedida}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                item.stockProducto <= 0 && styles.addButtonDisabled
              ]}
              onPress={() => handleAgregarCarrito(item)}
              disabled={item.stockProducto <= 0}
            >
              <Text style={styles.addButtonText}>
                {item.stockProducto > 0 ? "+" : "+"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando perfil del vendedor...</Text>
        <View style={styles.loadingCircles}>
          <View style={[styles.loadingCircle, { backgroundColor: '#FF6B35' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#3498DB' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#9B59B6' }]} />
        </View>
      </View>
    );
  }

  if (error && (!vendedor || productos.length === 0)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al cargar perfil</Text>
        <Text style={styles.errorText}>
          {error || "No se pudo cargar la información del vendedor"}
        </Text>
        <Text style={styles.errorSubtext}>
          Verifica tu conexión a internet o intenta más tarde
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const promedioGeneral = calcularPromedioGeneral();
  const nombreCompleto = vendedor 
    ? `${vendedor.nombreVendedor || ""} ${vendedor.apellidoVendedor || ""}`.trim() 
    : "Propietario no disponible";

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
      >
        {/* 🔥 HEADER CON GRADIENTE Y CÍRCULOS */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <FloatingCirclesVendedor />
          
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonCircle}>
              <Text style={styles.backButtonIcon}>←</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTop}>
            <Text style={styles.headerIcon}>🏪</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerLabel}>PERFIL DEL VENDEDOR</Text>
            <Text style={styles.headerTitle}>{vendedor?.nombreEmpresa}</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Productos frescos y de calidad directo del productor
          </Text>
        </Animated.View>

        {/* 🔥 TARJETA DE PERFIL */}
        <Animated.View 
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {vendedor?.nombreEmpresa?.charAt(0)?.toUpperCase() || "V"}
                  </Text>
                  <View style={styles.avatarRing} />
                </View>
                
                {/* Badge de calificación */}
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeIcon}>⭐</Text>
                  <Text style={styles.ratingBadgeText}>
                    {promedioGeneral}/5.0
                  </Text>
                </View>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.companyName}>
                  {vendedor?.nombreEmpresa || "Empresa del Vendedor"}
                </Text>
                
                <View style={styles.ratingDisplay}>
                  {renderStars(Number(promedioGeneral))}
                  <View style={styles.ratingInfo}>
                    <Text style={styles.ratingNumber}>{promedioGeneral}</Text>
                    <Text style={styles.profileRatingText}>
                      • {productos.length} {productos.length === 1 ? "producto" : "productos"}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.profileStatus}>
                  <View style={[styles.statusDot, { backgroundColor: "#2ECC71" }]} />
                  <Text style={styles.statusText}>🟢 Activo • MercadoLocal</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 🔥 INFORMACIÓN DE CONTACTO */}
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Text style={styles.contactIcon}>👤</Text>
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>PROPIETARIO</Text>
                  <Text style={styles.contactValue}>{nombreCompleto}</Text>
                </View>
              </View>

              <View style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Text style={styles.contactIcon}>📍</Text>
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>DIRECCIÓN</Text>
                  <Text style={styles.contactValue}>{vendedor?.direccion || "Dirección no disponible"}</Text>
                </View>
              </View>

              <View style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Text style={styles.contactIcon}>📞</Text>
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>CONTACTO</Text>
                  <TouchableOpacity onPress={handleLlamar}>
                    <Text style={styles.phoneLink}>{vendedor?.telefono || "Teléfono no disponible"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 🔥 BOTONES DE ACCIÓN */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]}
                onPress={handleLlamar}
              >
                <Text style={styles.actionButtonIcon}>📞</Text>
                <Text style={styles.actionButtonText}>Llamar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.whatsappButton]}
                onPress={handleWhatsApp}
              >
                <Text style={styles.actionButtonIcon}>💬</Text>
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* 🔥 SECCIÓN DE PRODUCTOS */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Productos Disponibles</Text>
              <Text style={styles.sectionSubtitle}>Directo del productor</Text>
            </View>
            <View style={styles.productCountBadge}>
              <Text style={styles.productCountText}>{productos.length}</Text>
            </View>
          </View>

          {productos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptyDescription}>
                Este vendedor aún no tiene productos publicados
              </Text>
            </View>
          ) : (
            <FlatList
              data={productos}
              renderItem={renderProducto}
              keyExtractor={(item) => `product-${item.idProducto}`}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
              contentContainerStyle={styles.productGrid}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  
  // 🔥 LOADING
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
  
  // 🔥 ERROR
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "System",
  },
  
  // 🔥 CÍRCULOS FLOTANTES
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
  
  // 🔥 HEADER
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  backButtonHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonIcon: {
    fontSize: 20,
    color: "#FF6B35",
    fontWeight: "700",
    fontFamily: "System",
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
    color: "#FF6B35",
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#FF6B35",
    fontWeight: "800",
    marginBottom: 8,
    fontFamily: "System",
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
  
  // 🔥 TARJETA DE PERFIL
  profileSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    fontFamily: "System",
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: "#FFD700",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ratingBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B6914",
    fontFamily: "System",
  },
  profileInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    fontFamily: "System",
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingStars: {
    fontSize: 14,
    color: "#FFD700",
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginRight: 4,
    fontFamily: "System",
  },
  profileRatingText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    fontFamily: "System",
  },
  profileStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: "#2ECC71",
    fontWeight: "600",
    fontFamily: "System",
  },
  divider: {
    height: 2,
    backgroundColor: "#F3F4F6",
    marginVertical: 20,
    borderRadius: 1,
  },
  
  // 🔥 INFORMACIÓN DE CONTACTO
  contactInfo: {
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactIcon: {
    fontSize: 20,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: "System",
  },
  contactValue: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 20,
    fontFamily: "System",
  },
  phoneLink: {
    fontSize: 15,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
  },
  
  // 🔥 BOTONES DE ACCIÓN
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  callButton: {
    backgroundColor: "#4A90E2",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "System",
  },
  
  // 🔥 SECCIÓN DE PRODUCTOS
  productsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "System",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "System",
  },
  productCountBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 36,
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  productCountText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "System",
  },
  emptyState: {
    backgroundColor: "white",
    padding: 48,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    color: "#9CA3AF",
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: "System",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "System",
  },
  productGrid: {
    paddingBottom: 10,
  },
  productRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  
  // 🔥 PRODUCTOS (Mismo estilo que Explore)
  productCard: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "48%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  productImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f1f5f9",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    minHeight: 36,
    fontFamily: "System",
  },
  productRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productRatingText: {
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: "System",
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "System",
  },
  productUnit: {
    fontSize: 9,
    color: "#94a3b8",
    fontFamily: "System",
  },
  addButton: {
    backgroundColor: "#FF6B35",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowColor: "#cbd5e1",
  },
  addButtonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
    fontFamily: "System",
  },
  
  bottomSpacer: {
    height: 40,
  },
});