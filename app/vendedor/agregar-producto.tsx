import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
}

interface Subcategoria {
  idSubcategoria: number;
  nombreSubcategoria: string;
  idCategoria: number;
}

interface IARecomendacion {
  similar_found: boolean;
  precio_promedio: number;
  precio_ingresado: number;
  estado: 'bajo' | 'alto' | 'adecuado';
  recomendado: number;
  productos_similares: Array<{
    nombre: string;
    precio: number;
  }>;
}

// Íconos para categorías
const CATEGORIA_ICONOS: Record<string, string> = {
  'Frutas y Verduras': '🍎',
  'Lácteos Artesanales': '🧀',
  'Carnes': '🥩',
  'Pescados': '🐟',
  'Panadería': '🥖',
  'Bebidas': '🥤',
  'Especias': '🌶️',
  'Orgánicos': '🌿',
  'Congelados': '❄️',
};

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

export default function AgregarProducto() {
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  
  // Estados de imagen
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  
  // Estados IA
  const [precioIA, setPrecioIA] = useState<IARecomendacion | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [mostrarIA, setMostrarIA] = useState(false);
  
  // Estado del formulario
  const [form, setForm] = useState({
    nombreProducto: '',
    descripcionProducto: '',
    precioProducto: '',
    stockProducto: '',
    unidad: 'kg',
    idCategoria: '',
    idSubcategoria: '',
  });

  // Verificar autenticación y cargar datos
  useEffect(() => {
    verificarVendedorYCargar();
  }, []);

  useEffect(() => {
    if (form.idCategoria) {
      cargarSubcategorias();
    } else {
      setSubcategorias([]);
      setForm(prev => ({ ...prev, idSubcategoria: '' }));
    }
  }, [form.idCategoria]);

  useEffect(() => {
    if (form.nombreProducto.trim().length > 2 && form.precioProducto) {
      setMostrarIA(true);
      const timer = setTimeout(() => {
        analizarPrecio();
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setMostrarIA(false);
    }
  }, [form.nombreProducto, form.precioProducto]);

  const verificarVendedorYCargar = async () => {
    try {
      const rol = await AsyncStorage.getItem('rol');
      const token = await AsyncStorage.getItem('authToken');
      const userDataString = await AsyncStorage.getItem('user');

      if (!token || rol !== 'VENDEDOR') {
        Alert.alert('Acceso restringido', 'Debes ser vendedor para agregar productos');
        await AsyncStorage.clear();
        router.replace('/login');
        return;
      }

      const userData: User = JSON.parse(userDataString || '{}');
      setUser(userData);
      await Promise.all([
        cargarCategorias(token),
      ]);
    } catch (error) {
      console.error('Error verificando vendedor:', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/listar`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategorias(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Error al cargar categorías');
      }
    } catch (error: any) {
      console.error('❌ Error cargando categorías:', error);
      setError('Error al cargar categorías');
    }
  };

  const cargarSubcategorias = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/subcategorias/categoria/${form.idCategoria}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubcategorias(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Error al cargar subcategorías');
      }
    } catch (error: any) {
      console.error('❌ Error cargando subcategorías:', error);
    }
  };

  // Función auxiliar para obtener el ID del usuario
  const getUserId = (user: User | null): string | undefined => {
    if (!user) return undefined;
    return user.idUsuario || user.idVendedor || user.id || user._id;
  };

  // Función para seleccionar imagen
  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar imágenes');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setSelectedImage({
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `producto_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para analizar precio con IA
  const analizarPrecio = async () => {
    if (!form.nombreProducto || form.nombreProducto.length < 3 || !form.precioProducto) return;

    setAnalizando(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/ia/precio/recomendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombreProducto,
          precio: parseFloat(form.precioProducto) || 0,
        }),
      });

      if (response.ok) {
        const data: IARecomendacion = await response.json();
        setPrecioIA(data);
      }
    } catch (err) {
      console.error('❌ Error recomendador IA:', err);
    } finally {
      setAnalizando(false);
    }
  };

  // Aplicar precio recomendado por IA
  const aplicarPrecioRecomendado = () => {
    if (precioIA) {
      setForm(prev => ({ 
        ...prev, 
        precioProducto: precioIA.recomendado.toString() 
      }));
      Alert.alert('✅ Precio actualizado', `Se ha aplicado el precio recomendado: $${precioIA.recomendado.toFixed(2)}`);
    }
  };

  // CORRECCIÓN: Función para manejar cambios en el formulario - Acepta string | undefined
  const handleChange = (name: string, value: string | undefined) => {
    setForm(prev => ({ ...prev, [name]: value || '' }));
  };

  // Función para guardar producto
  const handleSubmit = async () => {
    // Validaciones
    if (!form.nombreProducto || !form.precioProducto || !form.stockProducto || !form.idSubcategoria) {
      Alert.alert('⚠️ Campos incompletos', 'Por favor completa todos los campos obligatorios marcados con *');
      return;
    }

    if (!selectedImage) {
      Alert.alert('📸 Imagen requerida', 'Una imagen atractiva ayuda a vender más tu producto');
      return;
    }

    const userId = getUserId(user);
    if (!userId) {
      Alert.alert('🔐 Sesión expirada', 'Por favor, inicia sesión nuevamente');
      return;
    }

    setGuardando(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // PASO 1: Subir la imagen
      const formData = new FormData();
      formData.append('file', selectedImage as any);

      const uploadResponse = await fetch(`${API_BASE_URL}/uploads/producto`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir imagen');
      }

      const imageUrl = await uploadResponse.text();

      // PASO 2: Crear el producto
      const body = {
        idUsuario: userId,
        idVendedor: userId,
        idSubcategoria: parseInt(form.idSubcategoria),
        nombreProducto: form.nombreProducto,
        descripcionProducto: form.descripcionProducto,
        precioProducto: parseFloat(form.precioProducto),
        stockProducto: parseInt(form.stockProducto),
        unidad: form.unidad,
        imagenProducto: imageUrl,
      };

      const response = await fetch(`${API_BASE_URL}/productos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        Alert.alert(
          '🎉 ¡Producto publicado!',
          'Tu producto ha sido agregado exitosamente al catálogo',
          [
            {
              text: 'Ver mi producto',
              onPress: () => {
                setForm({
                  nombreProducto: '',
                  descripcionProducto: '',
                  precioProducto: '',
                  stockProducto: '',
                  unidad: 'kg',
                  idCategoria: '',
                  idSubcategoria: '',
                });
                setImageUri(null);
                setSelectedImage(null);
                setPrecioIA(null);
                setMostrarIA(false);
                router.back();
              },
            },
          ]
        );
      } else {
        const error = await response.text();
        throw new Error(`Error al crear producto: ${error}`);
      }
    } catch (error: any) {
      console.error('❌ Error en la petición:', error);
      Alert.alert('❌ Error', error.message || 'Error al guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
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
              <Text style={styles.headerTitle}>Agregar Producto</Text>
              <View style={styles.titleUnderline} />
            </View>

            <Text style={styles.headerSubtitle}>
              Añade nuevos productos a tu catálogo
            </Text>
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

          {/* Sección de imagen */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={[styles.imageUpload, imageUri && styles.imageUploadActive]}
              onPress={seleccionarImagen}
              activeOpacity={0.9}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={48} color="#94a3b8" />
                  <Text style={styles.uploadText}>Toca para seleccionar una imagen</Text>
                  <Text style={styles.uploadSubtext}>Recomendado: 1:1, buena calidad</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={seleccionarImagen}
            >
              <Ionicons name={imageUri ? 'swap-horizontal' : 'image-outline'} size={20} color="#FF6B35" />
              <Text style={styles.changeImageText}>
                {imageUri ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre del producto */}
          <View style={styles.formSection}>
            <View style={styles.inputHeader}>
              <Ionicons name="pricetag" size={20} color="#FF6B35" />
              <Text style={styles.inputLabel}>
                Nombre del producto <Text style={styles.requiredMark}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ej: Queso artesanal de cabra"
              placeholderTextColor="#94a3b8"
              value={form.nombreProducto}
              onChangeText={(value) => handleChange('nombreProducto', value)}
            />
          </View>

          {/* Descripción */}
          <View style={styles.formSection}>
            <View style={styles.inputHeader}>
              <Ionicons name="document-text" size={20} color="#FF6B35" />
              <Text style={styles.inputLabel}>
                Descripción <Text style={styles.optionalText}>(Opcional)</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe las características, origen, ingredientes, etc..."
              placeholderTextColor="#94a3b8"
              value={form.descripcionProducto}
              onChangeText={(value) => handleChange('descripcionProducto', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Categorías - Diseño de tarjetas */}
          <View style={styles.formSection}>
            <View style={styles.inputHeader}>
              <Ionicons name="grid" size={20} color="#FF6B35" />
              <Text style={styles.inputLabel}>
                Categoría <Text style={styles.requiredMark}>*</Text>
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              <View style={styles.categoriesList}>
                {categorias.map((categoria) => {
                  const icono = CATEGORIA_ICONOS[categoria.nombreCategoria] || '📦';
                  return (
                    <TouchableOpacity
                      key={categoria.idCategoria}
                      style={[
                        styles.categoryCard,
                        String(categoria.idCategoria) === form.idCategoria && styles.categoryCardActive,
                      ]}
                      onPress={() => handleChange('idCategoria', String(categoria.idCategoria))}
                    >
                      <Text style={styles.categoryIcon}>{icono}</Text>
                      <Text style={[
                        styles.categoryName,
                        String(categoria.idCategoria) === form.idCategoria && styles.categoryNameActive,
                      ]}>
                        {categoria.nombreCategoria}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Subcategorías */}
            {form.idCategoria && subcategorias.length > 0 && (
              <>
                <View style={[styles.inputHeader, { marginTop: 20 }]}>
                  <Ionicons name="list" size={20} color="#FF6B35" />
                  <Text style={styles.inputLabel}>
                    Subcategoría <Text style={styles.requiredMark}>*</Text>
                  </Text>
                </View>
                <View style={styles.subcategoriesGrid}>
                  {subcategorias.map((subcategoria) => (
                    <TouchableOpacity
                      key={subcategoria.idSubcategoria}
                      style={[
                        styles.subcategoryChip,
                        String(subcategoria.idSubcategoria) === form.idSubcategoria && styles.subcategoryChipActive,
                      ]}
                      onPress={() => handleChange('idSubcategoria', String(subcategoria.idSubcategoria))}
                    >
                      <Text style={[
                        styles.subcategoryText,
                        String(subcategoria.idSubcategoria) === form.idSubcategoria && styles.subcategoryTextActive,
                      ]}>
                        {subcategoria.nombreSubcategoria}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Precio y Stock - Medidas iguales */}
          <View style={styles.formSection}>
            <View style={styles.inputHeader}>
              <Ionicons name="cash" size={20} color="#FF6B35" />
              <Text style={styles.inputLabel}>Precio y Disponibilidad</Text>
            </View>

            <View style={styles.priceStockRow}>
              {/* Precio */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabelSmall}>
                    Precio <Text style={styles.requiredMark}>*</Text>
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    value={form.precioProducto}
                    onChangeText={(value) => handleChange('precioProducto', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Stock */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabelSmall}>
                    Stock <Text style={styles.requiredMark}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={styles.stockInput}
                  placeholder="100"
                  placeholderTextColor="#94a3b8"
                  value={form.stockProducto}
                  onChangeText={(value) => handleChange('stockProducto', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Unidades de medida con íconos mejorados */}
            <View style={styles.unidadesSection}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabelSmall}>Unidad de medida</Text>
              </View>
              <View style={styles.unidadesGrid}>
                {[
                  { value: 'kg', label: 'Kilogramo', icon: '⚖️' },
                  { value: 'lb', label: 'Libra', icon: '📏' },
                  { value: 'unidad', label: 'Unidad', icon: '📦' },
                  { value: 'litro', label: 'Litro', icon: '💧' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.unidadCard,
                      form.unidad === item.value && styles.unidadCardActive,
                    ]}
                    onPress={() => handleChange('unidad', item.value)}
                  >
                    <Text style={styles.unidadIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.unidadLabel,
                      form.unidad === item.value && styles.unidadLabelActive,
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ASISTENTE IA - DESTACADO (Tal como te gustó) */}
          {mostrarIA && (
            <View style={styles.iaContainer}>
              <View style={styles.iaHeader}>
                <View style={styles.iaTitleContainer}>
                  <Ionicons name="sparkles" size={20} color="#FF6B35" />
                  <Text style={styles.iaTitle}>Asistente de Precio IA</Text>
                </View>
                <TouchableOpacity onPress={() => setMostrarIA(false)}>
                  <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {analizando ? (
                <View style={styles.iaLoading}>
                  <ActivityIndicator size="small" color="#FF6B35" />
                  <Text style={styles.iaLoadingText}>Analizando mercado...</Text>
                </View>
              ) : precioIA ? (
                <View style={styles.iaContent}>
                  {precioIA.similar_found ? (
                    <>
                      <View style={styles.iaComparison}>
                        <View style={styles.iaComparisonItem}>
                          <Text style={styles.iaComparisonLabel}>Tu precio</Text>
                          <Text style={styles.iaComparisonValue}>
                            ${precioIA.precio_ingresado.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.iaArrow}>
                          <Ionicons 
                            name={precioIA.estado === 'bajo' ? 'arrow-down' : 
                                 precioIA.estado === 'alto' ? 'arrow-up' : 'checkmark'} 
                            size={20} 
                            color="#FF6B35" 
                          />
                        </View>
                        <View style={styles.iaComparisonItem}>
                          <Text style={styles.iaComparisonLabel}>Recomendado</Text>
                          <Text style={[styles.iaComparisonValue, styles.iaComparisonValueHighlight]}>
                            ${precioIA.recomendado.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      <View style={[
                        styles.iaStatus,
                        precioIA.estado === 'bajo' ? styles.iaStatusLow :
                        precioIA.estado === 'alto' ? styles.iaStatusHigh :
                        styles.iaStatusGood
                      ]}>
                        <Text style={styles.iaStatusText}>
                          {precioIA.estado === 'bajo' ? 'Tu precio está BAJO del mercado' :
                           precioIA.estado === 'alto' ? 'Tu precio está ALTO del mercado' : 
                           'Tu precio es competitivo'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.iaApplyButton}
                        onPress={aplicarPrecioRecomendado}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text style={styles.iaApplyButtonText}>Usar precio recomendado</Text>
                      </TouchableOpacity>

                      {precioIA.productos_similares.length > 0 && (
                        <View style={styles.similarProducts}>
                          <Text style={styles.similarProductsTitle}>
                            {precioIA.productos_similares.length} productos similares encontrados
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {precioIA.productos_similares.slice(0, 3).map((producto, index) => (
                              <View key={index} style={styles.similarProductCard}>
                                <Text style={styles.similarProductName} numberOfLines={2}>
                                  {producto.nombre}
                                </Text>
                                <Text style={styles.similarProductPrice}>
                                  ${producto.precio.toFixed(2)}
                                </Text>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.iaNoResults}>
                      <Ionicons name="search-outline" size={24} color="#F39C12" />
                      <Text style={styles.iaNoResultsText}>No encontramos productos similares</Text>
                      <Text style={styles.iaNoResultsSubtext}>Tu producto podría ser único</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.iaPrompt}>
                  <Text style={styles.iaPromptText}>
                    Ingresa el nombre y precio para obtener recomendaciones
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Botón para mostrar IA si está oculta */}
          {!mostrarIA && form.nombreProducto && (
            <TouchableOpacity
              style={styles.showIAButton}
              onPress={() => setMostrarIA(true)}
            >
              <Ionicons name="sparkles" size={18} color="#FF6B35" />
              <Text style={styles.showIAButtonText}>Ver recomendaciones de precio IA</Text>
            </TouchableOpacity>
          )}

          {/* Botones de acción */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={guardando}
            >
              <Ionicons name="arrow-back" size={20} color="#64748b" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Publicar Producto</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlay de carga */}
      {guardando && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingOverlayText}>Publicando producto...</Text>
        </View>
      )}
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

  // Sección de imagen
  imageSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  imageUpload: {
    width: width - 40,
    height: width - 40,
    maxHeight: 300,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageUploadActive: {
    borderWidth: 0,
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'System',
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    fontFamily: 'System',
  },

  // Sección del formulario
  formSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  inputLabelSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  requiredMark: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  optionalText: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'System',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Categorías
  categoriesScroll: {
    marginTop: 8,
  },
  categoriesList: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  categoryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  categoryNameActive: {
    color: '#FF6B35',
  },
  subcategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  subcategoryChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subcategoryChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  subcategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },
  subcategoryTextActive: {
    color: 'white',
  },

  // Precio y Stock - MEDIDAS IGUALES
  priceStockRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    zIndex: 1,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    paddingLeft: 35,
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'System',
  },
  stockInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'System',
  },

  // Unidades de medida
  unidadesSection: {
    marginTop: 10,
  },
  unidadesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  unidadCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  unidadCardActive: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  unidadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  unidadLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  unidadLabelActive: {
    color: '#FF6B35',
  },

  // IA Container - TAL COMO TE GUSTÓ
  iaContainer: {
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  iaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iaTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  iaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  iaLoadingText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'System',
  },
  iaContent: {
    gap: 20,
  },
  iaComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  iaComparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  iaComparisonLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontFamily: 'System',
  },
  iaComparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  iaComparisonValueHighlight: {
    color: '#FF6B35',
  },
  iaArrow: {
    paddingHorizontal: 10,
  },
  iaStatus: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  iaStatusLow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  iaStatusHigh: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  iaStatusGood: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  iaStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  iaApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  iaApplyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'System',
  },
  similarProducts: {
    marginTop: 10,
  },
  similarProductsTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontFamily: 'System',
  },
  similarProductCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  similarProductName: {
    fontSize: 12,
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'System',
    fontWeight: '600',
  },
  similarProductPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    fontFamily: 'System',
  },
  iaNoResults: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  iaNoResultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  iaNoResultsSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  iaPrompt: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  iaPromptText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  showIAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginHorizontal: 20,
    marginTop: 20,
  },
  showIAButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    fontFamily: 'System',
  },

  // Botones de acción
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'System',
  },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingOverlayText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
});