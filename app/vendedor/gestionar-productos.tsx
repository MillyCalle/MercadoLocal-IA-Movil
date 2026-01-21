import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_CONFIG } from '../../config';

const { width } = Dimensions.get('window');
const API_BASE_URL = API_CONFIG.BASE_URL;

// TIPOS
interface Producto {
    idProducto: number;
    nombreProducto: string;
    descripcionProducto?: string;
    precioProducto: number;
    stockProducto: number;
    imagenProducto: string;
    unidadMedida?: string;
    nombreCategoria?: string;
    nombreSubcategoria?: string;
}

interface User {
    idVendedor?: string;
    id?: string;
    _id?: string;
    nombre?: string;
    username?: string;
    email?: string;
    rol: string;
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

export default function GestionarProductos() {
    const router = useRouter();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        verificarVendedorYCargar();
    }, []);

    const verificarVendedorYCargar = async () => {
        try {
            const rol = await AsyncStorage.getItem('rol');
            const token = await AsyncStorage.getItem('authToken');
            const userDataString = await AsyncStorage.getItem('user');

            if (!token || rol !== 'VENDEDOR') {
                console.log('❌ No autorizado como vendedor');
                await AsyncStorage.clear();
                router.replace('/login');
                return;
            }

            console.log('✅ Usuario autorizado como vendedor');
            const userData: User = JSON.parse(userDataString || '{}');
            setUser(userData);
            await cargarProductos(token, userData);
        } catch (error) {
            console.error('Error verificando vendedor:', error);
            router.replace('/login');
        }
    };

    const cargarProductos = async (token: string, userData: User) => {
        try {
            setError(null);
            const vendedorId = userData.idVendedor || userData.id || userData._id;

            if (!vendedorId) {
                throw new Error('No se encontró ID del vendedor');
            }

            const response = await fetch(
                `${API_BASE_URL}/productos/vendedor/${vendedorId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('📦 Productos cargados:', data);
                setProductos(Array.isArray(data) ? data : []);
            } else {
                throw new Error('Error al cargar productos');
            }
        } catch (error: any) {
            console.error('❌ Error al cargar productos:', error);
            setError(error.message || 'Error al cargar productos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const eliminarProducto = async (idProducto: number, nombreProducto: string) => {
        Alert.alert(
            'Confirmar eliminación',
            `¿Estás seguro de eliminar el producto "${nombreProducto}"?\n\nEsta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            const response = await fetch(
                                `${API_BASE_URL}/productos/eliminar/${idProducto}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                }
                            );

                            if (response.ok) {
                                // Eliminar el producto del estado
                                setProductos(prev => prev.filter(p => p.idProducto !== idProducto));
                                Alert.alert('✅ Éxito', `Producto "${nombreProducto}" eliminado exitosamente`);
                                console.log('🗑️ Producto eliminado:', idProducto);
                            } else {
                                throw new Error('No se pudo eliminar el producto');
                            }
                        } catch (error) {
                            console.error('❌ Error al eliminar producto:', error);
                            Alert.alert('❌ Error', 'No se pudo eliminar el producto');
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        const token = await AsyncStorage.getItem('authToken');
        if (token && user) {
            await cargarProductos(token, user);
        }
    };

    const renderProducto = ({ item }: { item: Producto }) => (
        <View style={styles.productCard}>
            {/* Imagen del producto */}
            <Image
                source={{ uri: item.imagenProducto }}
                style={styles.productImage}
                resizeMode="cover"
            />

            {/* Badge de stock */}
            <View style={[
                styles.stockBadge,
                item.stockProducto > 10 ? styles.stockHigh : 
                item.stockProducto > 0 ? styles.stockMedium : styles.stockLow
            ]}>
                <Text style={styles.stockText}>
                    {item.stockProducto > 10 ? '✓' : item.stockProducto > 0 ? '⚡' : '✗'}
                </Text>
            </View>

            {/* Información del producto */}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                    {item.nombreProducto}
                </Text>

                {/* Categoría y Subcategoría */}
                <View style={styles.categoryRow}>
                    <View style={styles.categoryBadge}>
                        <Ionicons name="pricetag-outline" size={12} color="#FF6B35" />
                        <Text style={styles.categoryText}>
                            {item.nombreCategoria || 'Sin categoría'}
                        </Text>
                    </View>
                    {item.nombreSubcategoria && (
                        <View style={styles.subcategoryBadge}>
                            <Text style={styles.subcategoryText}>
                                {item.nombreSubcategoria}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Precio y Stock */}
                <View style={styles.detailsRow}>
                    <Text style={styles.productPrice}>
                        ${item.precioProducto.toFixed(2)}
                    </Text>
                    <Text style={[
                        styles.stockCount,
                        item.stockProducto <= 10 && item.stockProducto > 0 ? styles.stockCountWarning :
                        item.stockProducto === 0 ? styles.stockCountDanger : null
                    ]}>
                        {item.stockProducto} unidades
                    </Text>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push({
                            pathname: '/vendedor/editar-producto',
                            params: { id: item.idProducto }
                        })}
                    >
                        <Ionicons name="create-outline" size={18} color="#3498DB" />
                        <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => eliminarProducto(item.idProducto, item.nombreProducto)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                        <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>Cargando productos...</Text>
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
                        colors={['#FF6B35']}
                        tintColor="#FF6B35"
                    />
                }
            >
                {/* Header con efectos visuales */}
                <View style={styles.header}>
                    {/* Círculos flotantes de fondo */}
                    <FloatingCircles />

                    <View style={styles.headerTop}>
                        <Text style={styles.headerIcon}>📦</Text>
                        {user && (
                            <View style={styles.userBadge}>
                                <Ionicons name="shield-checkmark-outline" size={16} color="#FF6B35" />
                                <Text style={styles.userBadgeText}>Vendedor</Text>
                            </View>
                        )}
                    </View>

                    {/* Título con efecto especial */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Gestión de Productos</Text>
                        <View style={styles.titleUnderline} />
                    </View>

                    <Text style={styles.headerSubtitle}>
                        Administra tu inventario de productos
                    </Text>

                    {/* Botón Agregar Producto */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/vendedor/agregar-producto')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={22} color="white" />
                        <Text style={styles.addButtonText}>Agregar Nuevo Producto</Text>
                    </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="warning-outline" size={24} color="#E74C3C" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Ionicons name="refresh" size={20} color="#E74C3C" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Sección de Productos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Tu Inventario</Text>
                            <Text style={styles.sectionSubtitle}>
                                {productos.length} {productos.length === 1 ? 'producto' : 'productos'} registrados
                            </Text>
                        </View>
                        <View style={styles.statsIndicator}>
                            <Ionicons name="cube-outline" size={22} color="white" />
                        </View>
                    </View>

                    {productos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={64} color="#94a3b8" />
                            <Text style={styles.emptyStateText}>No hay productos registrados</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Comienza agregando tu primer producto
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyStateButton}
                                onPress={() => router.push('/vendedor/agregar-producto')}
                            >
                                <Ionicons name="add-circle-outline" size={18} color="white" />
                                <Text style={styles.emptyStateButtonText}>Agregar Producto</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={productos}
                            renderItem={renderProducto}
                            keyExtractor={(item) => String(item.idProducto)}
                            scrollEnabled={false}
                            contentContainerStyle={styles.productList}
                        />
                    )}
                </View>

                {/* Resumen del Inventario */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="stats-chart" size={32} color="#FF6B35" />
                            <Text style={styles.summaryTitle}>Resumen del Inventario</Text>
                        </View>

                        <View style={styles.summaryStats}>
                            <View style={styles.summaryStat}>
                                <Text style={styles.summaryStatLabel}>Total Productos</Text>
                                <Text style={styles.summaryStatValue}>{productos.length}</Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryStat}>
                                <Text style={styles.summaryStatLabel}>En Stock Alto</Text>
                                <Text style={[styles.summaryStatValue, { color: '#2ECC71' }]}>
                                    {productos.filter(p => p.stockProducto > 10).length}
                                </Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryStat}>
                                <Text style={styles.summaryStatLabel}>Stock Bajo/Sin Stock</Text>
                                <Text style={[styles.summaryStatValue, { color: '#E74C3C' }]}>
                                    {productos.filter(p => p.stockProducto <= 10).length}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Llamada a la acción */}
                <View style={styles.ctaSection}>
                    <View style={styles.ctaCard}>
                        <Ionicons name="rocket-outline" size={36} color="white" />
                        <Text style={styles.ctaTitle}>¿Necesitas ayuda?</Text>
                        <Text style={styles.ctaDescription}>
                            Consulta nuestra guía de vendedor o contacta con soporte
                        </Text>
                        <TouchableOpacity 
                            style={styles.ctaButton}
                            onPress={() => router.push('/vendedor/ayuda')}
                        >
                            <Text style={styles.ctaButtonText}>Ir al Soporte →</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Espacio final */}
                <View style={{ height: 30 }} />
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
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF2E8",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: "#FFE0CC",
        gap: 4,
    },
    userBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FF6B35",
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
        marginBottom: 20,
    },

    // Botón Agregar
    addButton: {
        backgroundColor: "#FF6B35",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
        zIndex: 1,
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    addButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "System",
    },

    // Error
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF0F2",
        borderWidth: 1,
        borderColor: "#E74C3C",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        gap: 12,
    },
    errorText: {
        flex: 1,
        color: "#E74C3C",
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

    // Indicador de estadísticas
    statsIndicator: {
        backgroundColor: "#FF6B35",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },

    // Lista de productos
    productList: {
        gap: 16,
    },
    productCard: {
        backgroundColor: "white",
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    productImage: {
        width: '100%',
        height: 180,
        backgroundColor: "#F1F5F9",
    },
    stockBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    stockHigh: {
        backgroundColor: "#2ECC71",
    },
    stockMedium: {
        backgroundColor: "#F39C12",
    },
    stockLow: {
        backgroundColor: "#E74C3C",
    },
    stockText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "System",
    },
    productInfo: {
        padding: 16,
    },
    productName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 12,
        fontFamily: "System",
        lineHeight: 24,
    },
    categoryRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    categoryBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF2E8",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FF6B35",
        fontFamily: "System",
    },
    subcategoryBadge: {
        backgroundColor: "#F0F4F8",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    subcategoryText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#64748b",
        fontFamily: "System",
    },
    detailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    productPrice: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FF6B35",
        fontFamily: "System",
    },
    stockCount: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
        fontFamily: "System",
    },
    stockCountWarning: {
        color: "#F39C12",
    },
    stockCountDanger: {
        color: "#E74C3C",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 12,
    },
    editButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EBF5FB",
        borderWidth: 2,
        borderColor: "#3498DB",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3498DB",
        fontFamily: "System",
    },
    deleteButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FDECEA",
        borderWidth: 2,
        borderColor: "#E74C3C",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#E74C3C",
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
    emptyStateButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: "#FF6B35",
        borderRadius: 12,
        gap: 8,
    },
    emptyStateButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "System",
    },

    // Sección de resumen
    summarySection: {
        paddingHorizontal: 20,
        marginTop: 30,
        marginBottom: 20,
    },
    summaryCard: {
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
    summaryHeader: {
        alignItems: "center",
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginTop: 12,
        textAlign: "center",
        fontFamily: "System",
    },
    summaryStats: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    summaryStat: {
        flex: 1,
        alignItems: "center",
    },
    summaryStatLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 8,
        fontFamily: "System",
        textAlign: "center",
    },
    summaryStatValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FF6B35",
        fontFamily: "System",
    },
    summaryDivider: {
        width: 1,
        height: "100%",
        backgroundColor: "#f1f5f9",
    },

    // CTA Section
    ctaSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
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
        marginTop: 16,
        marginBottom: 8,
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