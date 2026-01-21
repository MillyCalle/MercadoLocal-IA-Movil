// /app/vendedor/ayuda.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

export default function AyudaVendedor() {
    const router = useRouter();

    const faqs = [
        {
            question: '¿Cómo agrego un nuevo producto?',
            answer: 'Ve a la sección "Gestión de Productos" y haz clic en "Agregar Nuevo Producto". Completa todos los campos requeridos y sube una imagen del producto.',
            icon: 'add-circle-outline',
        },
        {
            question: '¿Cómo edito un producto existente?',
            answer: 'En la lista de productos, haz clic en el botón "Editar" del producto que deseas modificar.',
            icon: 'create-outline',
        },
        {
            question: '¿Qué significa el color del badge de stock?',
            answer: '✅ Verde: Stock alto (>10 unidades) ⚡ Amarillo: Stock bajo (1-10 unidades) ❌ Rojo: Sin stock',
            icon: 'pricetag-outline',
        },
        {
            question: '¿Cómo contacto con soporte?',
            answer: 'Puedes escribirnos a mercadolocal@gmail.com o llamar al +593 993365084',
            icon: 'headset-outline',
        },
        {
            question: '¿Cómo gestiono mis pedidos?',
            answer: 'Accede a la sección "Gestión de Pedidos" desde tu dashboard para ver y actualizar el estado de tus pedidos.',
            icon: 'cart-outline',
        },
        {
            question: '¿Puedo cambiar mi información de perfil?',
            answer: 'Sí, ve a "Mi Perfil" en el menú principal para actualizar tus datos personales.',
            icon: 'person-outline',
        },
    ];

    const recursos = [
        {
            title: 'Guía del Vendedor',
            description: 'Manual completo para maximizar tus ventas',
            icon: 'book-outline',
            color: '#9B59B6',
            onPress: () => Linking.openURL('https://tudominio.com/guia-vendedor.pdf'),
        },
        {
            title: 'Video Tutoriales',
            description: 'Aprende visualmente con tutoriales paso a paso',
            icon: 'videocam-outline',
            color: '#E74C3C',
            onPress: () => Linking.openURL('https://tudominio.com/videos-tutoriales'),
        },
        {
            title: 'Preguntas Frecuentes',
            description: 'Respuestas a las dudas más comunes',
            icon: 'help-circle-outline',
            color: '#3498DB',
            onPress: () => {}, // Se puede expandir
        },
    ];

    const contactSupport = () => {
        Linking.openURL('mailto:mercadolocal@gmail.com?subject=Soporte%20Vendedor&body=Hola,%20necesito%20ayuda%20con:');
    };

    const callSupport = () => {
        Linking.openURL('tel:+593993365084');
    };

    const openWhatsApp = () => {
        Linking.openURL('https://wa.me/593993365084?text=Hola,%20necesito%20ayuda%20como%20vendedor');
    };

    const openWebHelp = () => {
        Linking.openURL('https://tudominio.com/centro-ayuda-vendedor');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header con efectos visuales */}
                <View style={styles.header}>
                    {/* Círculos flotantes de fondo */}
                    <FloatingCircles />
                    
                    <View style={styles.headerTop}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                        </TouchableOpacity>
                        <Text style={styles.headerIcon}>💡</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                    
                    {/* Título con efecto especial */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Centro de Ayuda</Text>
                        <View style={styles.titleUnderline} />
                    </View>
                    
                    <Text style={styles.headerSubtitle}>
                        Encuentra respuestas y recursos para gestionar tu tienda
                    </Text>
                </View>

                {/* Sección Principal */}
                <View style={styles.mainSection}>
                    {/* Sección de Preguntas Frecuentes */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="help-circle-outline" size={24} color="#FF6B35" />
                            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
                        </View>
                        
                        <Text style={styles.sectionDescription}>
                            Las dudas más comunes de nuestros vendedores
                        </Text>

                        <View style={styles.faqContainer}>
                            {faqs.map((faq, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.faqCard}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        // Se podría expandir para mostrar más detalles
                                    }}
                                >
                                    <View style={styles.faqIconContainer}>
                                        <Ionicons name={faq.icon as any} size={22} color="#FF6B35" />
                                    </View>
                                    <View style={styles.faqContent}>
                                        <Text style={styles.faqQuestion}>
                                            {faq.question}
                                        </Text>
                                        <Text style={styles.faqAnswer}>
                                            {faq.answer}
                                        </Text>
                                    </View>
                                    <View style={styles.faqArrow}>
                                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Sección de Contacto */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="headset-outline" size={24} color="#3498DB" />
                            <Text style={styles.sectionTitle}>Contacta con Soporte</Text>
                        </View>
                        
                        <Text style={styles.sectionDescription}>
                            Estamos aquí para ayudarte en lo que necesites
                        </Text>

                        <View style={styles.contactContainer}>
                            <TouchableOpacity 
                                style={[styles.contactCard, styles.emailCard]}
                                onPress={contactSupport}
                                activeOpacity={0.7}
                            >
                                <View style={styles.contactIconContainer}>
                                    <Ionicons name="mail-outline" size={26} color="#FF6B35" />
                                </View>
                                <Text style={styles.contactTitle}>Correo Electrónico</Text>
                                <Text style={styles.contactDetail}>mercadolocal@gmail.com</Text>
                                <View style={styles.contactButton}>
                                    <Text style={styles.contactButtonText}>Escribir</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.contactCard, styles.phoneCard]}
                                onPress={callSupport}
                                activeOpacity={0.7}
                            >
                                <View style={styles.contactIconContainer}>
                                    <Ionicons name="call-outline" size={26} color="#3498DB" />
                                </View>
                                <Text style={styles.contactTitle}>Teléfono</Text>
                                <Text style={styles.contactDetail}>+593 993 365 084</Text>
                                <View style={styles.contactButtonPhone}>
                                    <Text style={styles.contactButtonTextPhone}>Llamar</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.contactCard, styles.whatsappCard]}
                                onPress={openWhatsApp}
                                activeOpacity={0.7}
                            >
                                <View style={styles.contactIconContainer}>
                                    <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
                                </View>
                                <Text style={styles.contactTitle}>WhatsApp</Text>
                                <Text style={styles.contactDetail}>+593 993 365 084</Text>
                                <View style={styles.contactButtonWhatsApp}>
                                    <Text style={styles.contactButtonTextWhatsApp}>Chat</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sección de Recursos */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={24} color="#9B59B6" />
                            <Text style={styles.sectionTitle}>Recursos y Guías</Text>
                        </View>
                        
                        <Text style={styles.sectionDescription}>
                            Material útil para mejorar tu experiencia
                        </Text>

                        <View style={styles.resourcesContainer}>
                            {recursos.map((recurso, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.resourceCard}
                                    onPress={recurso.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.resourceIconContainer, { backgroundColor: `${recurso.color}20` }]}>
                                        <Ionicons name={recurso.icon as any} size={26} color={recurso.color} />
                                    </View>
                                    <Text style={styles.resourceTitle}>{recurso.title}</Text>
                                    <Text style={styles.resourceDescription}>{recurso.description}</Text>
                                    <View style={[styles.resourceButton, { backgroundColor: `${recurso.color}20` }]}>
                                        <Ionicons name="arrow-forward-outline" size={14} color={recurso.color} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Sección de Información Adicional */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="information-circle-outline" size={32} color="#2C3E50" />
                        </View>
                        <Text style={styles.infoTitle}>¿Necesitas más ayuda?</Text>
                        <Text style={styles.infoText}>
                            Visita nuestro centro de ayuda en línea para documentación más detallada, tutoriales avanzados y preguntas técnicas específicas.
                        </Text>
                        <TouchableOpacity 
                            style={styles.webButton}
                            onPress={openWebHelp}
                        >
                            <Text style={styles.webButtonText}>Visitar Centro de Ayuda Web</Text>
                            <Ionicons name="open-outline" size={18} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Horarios de atención */}
                    <View style={styles.horariosCard}>
                        <View style={styles.horariosHeader}>
                            <Ionicons name="time-outline" size={24} color="#F39C12" />
                            <Text style={styles.horariosTitle}>Horarios de Atención</Text>
                        </View>
                        <View style={styles.horariosContent}>
                            <View style={styles.horarioItem}>
                                <Text style={styles.horarioDias}>Lunes a Viernes</Text>
                                <Text style={styles.horarioHoras}>9:00 AM - 18:00 PM</Text>
                            </View>
                            <View style={styles.horarioItem}>
                                <Text style={styles.horarioDias}>Sábados</Text>
                                <Text style={styles.horarioHoras}>9:00 AM - 14:00 PM</Text>
                            </View>
                            <View style={styles.horarioItem}>
                                <Text style={styles.horarioDias}>Domingos</Text>
                                <Text style={styles.horarioHoras}>Cerrado</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.finalSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    scrollContent: {
        paddingBottom: 40,
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
        justifyContent: "space-between",
        width: '100%',
        marginBottom: 12,
        zIndex: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerIcon: {
        fontSize: 36,
    },
    headerSpacer: {
        width: 40,
    },
    
    // Título con efectos
    titleContainer: {
        alignItems: 'center',
        marginBottom: 8,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: "#2C3E50",
        textAlign: 'center',
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
        zIndex: 1,
    },
    
    mainSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    
    // Secciones
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2C3E50',
        marginLeft: 10,
    },
    sectionDescription: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 20,
        lineHeight: 22,
    },
    
    // FAQs
    faqContainer: {
        gap: 12,
    },
    faqCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    faqIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF2E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    faqContent: {
        flex: 1,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 6,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    faqArrow: {
        marginLeft: 8,
        marginTop: 4,
    },
    
    // Contacto
    contactContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    contactCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        width: '32%',
        minWidth: 100,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    emailCard: {
        borderTopWidth: 4,
        borderTopColor: '#FF6B35',
    },
    phoneCard: {
        borderTopWidth: 4,
        borderTopColor: '#3498DB',
    },
    whatsappCard: {
        borderTopWidth: 4,
        borderTopColor: '#25D366',
    },
    contactIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
        textAlign: 'center',
    },
    contactDetail: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 12,
        textAlign: 'center',
    },
    contactButton: {
        backgroundColor: '#FFF2E8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    contactButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FF6B35',
    },
    contactButtonPhone: {
        backgroundColor: '#EBF5FB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    contactButtonTextPhone: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3498DB',
    },
    contactButtonWhatsApp: {
        backgroundColor: '#E0F7E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    contactButtonTextWhatsApp: {
        fontSize: 11,
        fontWeight: '600',
        color: '#25D366',
    },
    
    // Recursos
    resourcesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    resourceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        width: '32%',
        minWidth: 100,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    resourceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    resourceTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
        textAlign: 'center',
    },
    resourceDescription: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 14,
    },
    resourceButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: 8,
        top: 8,
    },
    
    // Sección de Información
    infoSection: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    infoIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#f1f5f9',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 8,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    webButton: {
        backgroundColor: '#FF6B35',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    webButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginRight: 8,
    },
    
    // Horarios de atención
    horariosCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    horariosHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    horariosTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 10,
    },
    horariosContent: {
        gap: 12,
    },
    horarioItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    horarioDias: {
        fontSize: 14,
        color: '#64748b',
    },
    horarioHoras: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
    },
    
    finalSpacer: {
        height: 40,
    },
});