import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCarrito } from "../context/CarritoContext";

// Componente para los círculos flotantes del fondo
const FloatingCirclesCart = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

export default function Carrito() {
    const router = useRouter();
    const { items, actualizarCantidad, eliminarItem, loading } = useCarrito();

    const [subtotal, setSubtotal] = useState(0);
    const [iva, setIVA] = useState(0);
    const [total, setTotal] = useState(0);
    const [processingCheckout, setProcessingCheckout] = useState(false);

    // Calcular totales
    useEffect(() => {
        const sub = items.reduce(
            (acc, item) => acc + item.precioProducto * item.cantidad,
            0
        );
        const ivaCalc = sub * 0.12;
        setSubtotal(sub);
        setIVA(ivaCalc);
        setTotal(sub + ivaCalc);
    }, [items]);

    const handleVaciarCarrito = () => {
        Alert.alert(
            "Vaciar Carrito",
            "¿Estás seguro de que deseas vaciar el carrito?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Vaciar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            for (const item of items) {
                                await eliminarItem(item.idCarrito);
                            }
                            Alert.alert("✅ Carrito vaciado", "Se han eliminado todos los productos");
                        } catch (error) {
                            Alert.alert("Error", "No se pudo vaciar el carrito");
                        }
                    },
                },
            ]
        );
    };

    const handleEliminar = (idCarrito: number) => {
        Alert.alert(
            "Eliminar Producto",
            "¿Estás seguro de que deseas eliminar este producto del carrito?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarItem(idCarrito);
                            Alert.alert("✅ Eliminado", "Producto eliminado del carrito");
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar el producto");
                        }
                    },
                },
            ]
        );
    };

    const realizarCheckout = () => {
        if (!items || items.length === 0) {
            Alert.alert("Carrito vacío", "Agrega productos antes de continuar");
            return;
        }

        // Redirigir al CheckoutUnificado
        router.push("/consumidor/CheckoutUnificado" as any);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A8F48" />
                <Text style={styles.loadingText}>Cargando carrito...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header con efectos visuales */}
            <View style={styles.header}>
                {/* Círculos flotantes de fondo */}
                <FloatingCirclesCart />
                
                <View style={styles.headerTop}>
                    <Text style={styles.headerIcon}>🛒</Text>
                </View>
                
                {/* Título con efecto especial */}
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Mi Carrito</Text>
                    <View style={styles.titleUnderline} />
                </View>
                
                <Text style={styles.headerSubtitle}>
                    Revisa tus productos antes de finalizar
                </Text>
            </View>

            {items.length === 0 ? (
                // Carrito vacío
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🛒</Text>
                    <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                    <Text style={styles.emptySubtitle}>
                        ¡Explora nuestros productos y añade tus favoritos!
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.push("/(tabs)/explorar" as any)}
                    >
                        <Text style={styles.exploreButtonText}>Explorar Productos</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Productos */}
                    <View style={styles.productosSection}>
                        <View style={styles.productosHeader}>
                            <View>
                                <Text style={styles.productosTitle}>Productos</Text>
                                <Text style={styles.productosCount}>
                                    {items.length} {items.length === 1 ? "producto" : "productos"}
                                </Text>
                            </View>
                            {items.length > 0 && (
                                <TouchableOpacity
                                    style={styles.vaciarButton}
                                    onPress={handleVaciarCarrito}
                                >
                                    <Text style={styles.vaciarButtonText}>🗑️ Vaciar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {items.map((item) => (
                            <View key={item.idCarrito} style={styles.productoCard}>
                                <Image
                                    source={{ uri: item.imagenProducto }}
                                    style={styles.productoImagen}
                                />

                                <View style={styles.productoInfo}>
                                    <Text style={styles.productoNombre} numberOfLines={2}>
                                        {item.nombreProducto}
                                    </Text>

                                    <Text style={styles.productoPrecio}>
                                        ${item.precioProducto.toFixed(2)}
                                    </Text>

                                    <View style={styles.cantidadControls}>
                                        <TouchableOpacity
                                            style={styles.cantidadButton}
                                            onPress={() =>
                                                actualizarCantidad(item.idCarrito, item.cantidad - 1)
                                            }
                                        >
                                            <Text style={styles.cantidadButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.cantidadText}>{item.cantidad}</Text>

                                        <TouchableOpacity
                                            style={styles.cantidadButton}
                                            onPress={() =>
                                                actualizarCantidad(item.idCarrito, item.cantidad + 1)
                                            }
                                        >
                                            <Text style={styles.cantidadButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.productoSubtotal}>
                                        Subtotal: ${(item.precioProducto * item.cantidad).toFixed(2)}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.eliminarButton}
                                    onPress={() => handleEliminar(item.idCarrito)}
                                >
                                    <Text style={styles.eliminarButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Resumen */}
                    <View style={styles.resumenCard}>
                        <Text style={styles.resumenTitle}>📋 Resumen de Compra</Text>

                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>Subtotal</Text>
                            <Text style={styles.resumenValue}>${subtotal.toFixed(2)}</Text>
                        </View>

                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>IVA (12%)</Text>
                            <Text style={styles.resumenValue}>${iva.toFixed(2)}</Text>
                        </View>

                        <View style={styles.resumenDivider} />

                        <View style={styles.resumenTotal}>
                            <Text style={styles.resumenTotalLabel}>Total</Text>
                            <Text style={styles.resumenTotalValue}>${total.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.checkoutButton,
                                processingCheckout && styles.checkoutButtonDisabled
                            ]}
                            onPress={realizarCheckout}
                            disabled={processingCheckout}
                        >
                            {processingCheckout ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.checkoutButtonText}>🛒 Finalizar Compra</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.seguirButton}
                            onPress={() => router.push("/(tabs)/explorar" as any)}
                        >
                            <Text style={styles.seguirButtonText}>← Seguir Comprando</Text>
                        </TouchableOpacity>

                        {/* Info adicional */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>✓</Text>
                                <Text style={styles.infoText}>Compra segura y protegida</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>✓</Text>
                                <Text style={styles.infoText}>Productos frescos y orgánicos</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>✓</Text>
                                <Text style={styles.infoText}>Envío coordinado con el vendedor</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
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
        backgroundColor: '#5A8F48', // VERDE PRINCIPAL
        top: 20,
        left: 20,
    },
    circle2: {
        width: 80,
        height: 80,
        backgroundColor: '#2ECC71', // VERDE CLARO
        top: 60,
        right: 30,
    },
    circle3: {
        width: 100,
        height: 100,
        backgroundColor: '#F39C12', // AMARILLO/NARANJA
        bottom: 40,
        left: 40,
    },
    circle4: {
        width: 60,
        height: 60,
        backgroundColor: '#E74C3C', // ROJO
        bottom: 80,
        right: 50,
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
        color: "#5A8F48",
        fontWeight: "600",
        fontFamily: "System",
    },
    
    // Header mejorado
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
        backgroundColor: '#5A8F48', // VERDE (color principal)
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
    
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
        color: "#9CA3AF",
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 12,
        fontFamily: "System",
    },
    emptySubtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 30,
        fontFamily: "System",
    },
    
    // Botón Explorar - COLOR VERDE
    exploreButton: {
        backgroundColor: "#5A8F48",
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 12,
        shadowColor: "#5A8F48",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    exploreButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "System",
    },
    
    scrollView: {
        flex: 1,
    },
    
    productosSection: {
        padding: 20,
    },
    
    productosHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    
    productosTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        fontFamily: "System",
    },
    
    productosCount: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 4,
        fontFamily: "System",
    },
    
    // Botón Vaciar - COLOR ROJO
    vaciarButton: {
        backgroundColor: "#FEE2E2",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E74C3C",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    vaciarButtonText: {
        color: "#E74C3C",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "System",
    },
    
    // Tarjeta de producto
    productoCard: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    
    productoImagen: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    
    productoInfo: {
        flex: 1,
        marginLeft: 16,
    },
    
    productoNombre: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 6,
        fontFamily: "System",
    },
    
    // Precio - COLOR NARANJA como en explorar
    productoPrecio: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF6B35",
        marginBottom: 12,
        fontFamily: "System",
    },
    
    cantidadControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    
    // Botón cantidad - COLOR VERDE
    cantidadButton: {
        width: 32,
        height: 32,
        backgroundColor: "#5A8F48",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#5A8F48",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    
    cantidadButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "System",
    },
    
    cantidadText: {
        fontSize: 16,
        fontWeight: "700",
        minWidth: 30,
        textAlign: "center",
        fontFamily: "System",
    },
    
    productoSubtotal: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
        fontFamily: "System",
    },
    
    // Botón eliminar - COLOR ROJO
    eliminarButton: {
        width: 36,
        height: 36,
        backgroundColor: "#E74C3C",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#E74C3C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    
    eliminarButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "System",
    },
    
    // Resumen de compra
    resumenCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 24,
        margin: 20,
        marginTop: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    
    resumenTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 20,
        fontFamily: "System",
    },
    
    resumenRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    
    resumenLabel: {
        fontSize: 15,
        color: "#64748b",
        fontWeight: "500",
        fontFamily: "System",
    },
    
    resumenValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        fontFamily: "System",
    },
    
    resumenDivider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 16,
    },
    
    resumenTotal: {
        backgroundColor: "#f8f9fa",
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    
    resumenTotalLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        fontFamily: "System",
    },
    
    resumenTotalValue: {
        fontSize: 28,
        fontWeight: "900",
        color: "#5A8F48", // VERDE para total
        fontFamily: "System",
    },
    
    // Botón checkout - COLOR VERDE
    checkoutButton: {
        backgroundColor: "#5A8F48",
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#5A8F48",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    
    checkoutButtonDisabled: {
        backgroundColor: "#A5C9A0",
    },
    
    checkoutButtonText: {
        color: "white",
        fontSize: 17,
        fontWeight: "800",
        fontFamily: "System",
    },
    
    // Botón seguir comprando - COLOR VERDE con fondo blanco
    seguirButton: {
        backgroundColor: "white",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#5A8F48",
        marginBottom: 20,
    },
    
    seguirButtonText: {
        color: "#5A8F48",
        fontSize: 15,
        fontWeight: "700",
        fontFamily: "System",
    },
    
    // Info card
    infoCard: {
        backgroundColor: "#f8f9fa",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    
    infoIcon: {
        fontSize: 14,
        marginRight: 8,
        color: "#5A8F48",
    },
    
    infoText: {
        fontSize: 13,
        color: "#64748b",
        fontFamily: "System",
    },
});