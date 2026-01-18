import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// PALETA DE COLORES ACTUALIZADA
const COLORS = {
  primary: '#FF6B35',
  secondary: '#9B59B6',
  accent: '#3498DB',
  success: '#2ECC71',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#2C3E50',
  lightText: '#64748B',
  overlay: 'rgba(255, 255, 255, 0.95)',
  glow: 'rgba(255, 107, 53, 0.25)',
};

// Datos para el carrusel
const featuresData = [
  {
    id: '1',
    icon: 'shopping-cart',
    iconType: 'FontAwesome5',
    title: 'Compra Rápida',
    description: 'Encuentra productos frescos en minutos',
    color: COLORS.primary,
    bgColor: 'rgba(255, 107, 53, 0.15)',
  },
  {
    id: '2',
    icon: 'store',
    iconType: 'MaterialCommunityIcons',
    title: 'Vende Fácil',
    description: 'Llega a más clientes con nuestra plataforma',
    color: COLORS.secondary,
    bgColor: 'rgba(155, 89, 182, 0.15)',
  },
  {
    id: '3',
    icon: 'robot',
    iconType: 'MaterialCommunityIcons',
    title: 'IA Inteligente',
    description: 'Recomendaciones personalizadas para ti',
    color: COLORS.accent,
    bgColor: 'rgba(52, 152, 219, 0.15)',
  },
  {
    id: '4',
    icon: 'rocket',
    iconType: 'Ionicons',
    title: 'Entrega Flash',
    description: 'Recibe tus pedidos en tiempo récord',
    color: COLORS.success,
    bgColor: 'rgba(46, 204, 113, 0.15)',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animaciones principales
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Círculos flotantes animados (del segundo código)
  const floatingCircles = useRef(
    Array.from({ length: 8 }).map((_, index) => {
      const initialX = Math.random() * width;
      const initialY = Math.random() * height * 0.5;
      const initialScale = 0.3 + Math.random() * 0.4;
      
      return {
        animX: useRef(new Animated.Value(initialX)).current,
        animY: useRef(new Animated.Value(initialY)).current,
        scale: useRef(new Animated.Value(initialScale)).current,
        opacity: useRef(new Animated.Value(0.03 + Math.random() * 0.07)).current,
        color: Math.random() > 0.66 ? COLORS.primary : 
               Math.random() > 0.33 ? COLORS.secondary : COLORS.accent,
        size: 30 + Math.random() * 100,
        initialX,
        initialY,
        initialScale,
      };
    })
  ).current;

  // Renderizar iconos dinámicamente
  const renderIcon = (iconType: string, icon: string, color: string, size: number) => {
    switch (iconType) {
      case 'FontAwesome5':
        return <FontAwesome5 name={icon as any} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={icon as any} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
      default:
        return <Ionicons name="cube" size={size} color={color} />;
    }
  };

  // Animación automática del carrusel
  useEffect(() => {
    const startAutoScroll = () => {
      const interval = setInterval(() => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= featuresData.length) {
          nextIndex = 0;
        }
        
        setCurrentIndex(nextIndex);
        
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * (width - 40),
            animated: true,
          });
        }
      }, 3500);

      return () => clearInterval(interval);
    };

    const cleanUp = startAutoScroll();
    return cleanUp;
  }, [currentIndex, width]);

  useEffect(() => {
    // Animación de entrada principal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Animación de círculos flotantes (del segundo código)
    floatingCircles.forEach((circle) => {
      // Animación horizontal
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle.animX, {
            toValue: circle.initialX + (Math.random() * 60 - 30),
            duration: 4000 + Math.random() * 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(circle.animX, {
            toValue: circle.initialX,
            duration: 4000 + Math.random() * 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animación vertical
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle.animY, {
            toValue: circle.initialY + (Math.random() * 40 - 20),
            duration: 3000 + Math.random() * 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(circle.animY, {
            toValue: circle.initialY,
            duration: 3000 + Math.random() * 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animación de pulso
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle.scale, {
            toValue: circle.initialScale * 1.2,
            duration: 2500 + Math.random() * 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circle.scale, {
            toValue: circle.initialScale,
            duration: 2500 + Math.random() * 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Función para manejar el login como invitado
  const handleGuestLogin = async () => {
    console.log('🟡 Botón de invitado presionado');
    
    try {
      // 1. Marcar como usuario invitado
      await AsyncStorage.setItem('isGuest', 'true');
      console.log('✅ isGuest guardado en AsyncStorage');
      
      // 2. Limpiar cualquier sesión previa
      await AsyncStorage.multiRemove([
        'authToken', 
        'token', 
        'user', 
        'rol', 
        'idUsuario',
        'idVendedor',
        'idConsumidor'
      ]);
      console.log('✅ Sesiones previas limpiadas');
      
      // 3. Verificar que podemos acceder a AsyncStorage
      const isGuest = await AsyncStorage.getItem('isGuest');
      console.log('✅ Verificación isGuest:', isGuest);
      
      // 4. Esperar un momento para asegurar que AsyncStorage se guardó
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 5. Redirigir a la pantalla de explorar
      console.log('🔄 Redirigiendo a /(tabs)/explorar');
      router.replace('/(tabs)/explorar');
      
    } catch (error: any) {
      console.error('❌ Error en login invitado:', error);
      Alert.alert('Error', 'No se pudo iniciar como invitado. Error: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Fondo con gradiente y círculos flotantes */}
      <View style={styles.background}>
        <LinearGradient
          colors={[COLORS.background, '#FFFFFF']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Círculos flotantes animados */}
        {floatingCircles.map((circle, index) => (
          <Animated.View
            key={`circle-${index}`}
            style={[
              styles.floatingCircle,
              {
                width: circle.size,
                height: circle.size,
                borderRadius: circle.size / 2,
                backgroundColor: circle.color,
                transform: [
                  { translateX: circle.animX },
                  { translateY: circle.animY },
                  { scale: circle.scale },
                ],
                opacity: circle.opacity,
              },
            ]}
          />
        ))}
      </View>
      
      {/* Contenido principal */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo y título */}
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideUpAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Logo con efecto de pulso */}
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.logoCircle,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Image
                  source={require('../assets/images/Logo2.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
            
            {/* Títulos - MY HARVEST como principal */}
            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>MY HARVEST</Text>
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>
                  MERCADO <Text style={styles.subtitleAccent}>LOCAL</Text>
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>IA</Text>
                </View>
              </View>
              <View style={styles.titleUnderline} />
              <Text style={styles.tagline}>
                Donde la tradición se encuentra con la innovación
              </Text>
            </View>
          </Animated.View>
          
          {/* Carrusel de características */}
          <Animated.View 
            style={[
              styles.carouselContainer,
              { opacity: fadeAnim }
            ]}
          >
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
                if (slideIndex !== currentIndex) {
                  setCurrentIndex(slideIndex);
                }
              }}
              style={styles.carouselScroll}
            >
              {featuresData.map((item) => (
                <View key={`carousel-${item.id}`} style={styles.carouselItem}>
                  <View style={styles.featureCard}>
                    <View style={[styles.featureIconContainer, { backgroundColor: item.bgColor }]}>
                      {renderIcon(item.iconType, item.icon, item.color, 32)}
                    </View>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            {/* Indicadores de paginación */}
            <View style={styles.indicatorContainer}>
              {featuresData.map((_, index) => (
                <TouchableOpacity
                  key={`indicator-${index}`}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.activeIndicator
                  ]}
                  onPress={() => {
                    setCurrentIndex(index);
                    scrollViewRef.current?.scrollTo({
                      x: index * (width - 40),
                      animated: true,
                    });
                  }}
                />
              ))}
            </View>
          </Animated.View>
          
          {/* Estadísticas */}
          <Animated.View 
            style={[
              styles.statsContainer,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                  <FontAwesome5 name="users" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.statNumber}>10K+</Text>
                  <Text style={styles.statLabel}>Usuarios</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                  <MaterialCommunityIcons name="store" size={20} color={COLORS.secondary} />
                </View>
                <View>
                  <Text style={styles.statNumber}>500+</Text>
                  <Text style={styles.statLabel}>Vendedores</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                  <Ionicons name="cube" size={20} color={COLORS.accent} />
                </View>
                <View>
                  <Text style={styles.statNumber}>50K+</Text>
                  <Text style={styles.statLabel}>Productos</Text>
                </View>
              </View>
            </View>
          </Animated.View>
          
          {/* Botones de acción */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.primary, '#FF8B35']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-in" size={22} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={22} color={COLORS.primary} style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>
            
            {/* Botón de invitado - CON FUNCIÓN CORREGIDA */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              activeOpacity={0.7}
            >
              <View style={styles.guestButtonContent}>
                <Ionicons name="compass" size={18} color={COLORS.lightText} />
                <Text style={styles.guestButtonText}>
                  Explorar como invitado
                </Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.lightText} />
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <View style={styles.footerContent}>
              <Text style={styles.footerText}>
                Al continuar, aceptas nuestros{' '}
                <Text style={styles.footerLink}>Términos</Text> y{' '}
                <Text style={styles.footerLink}>Privacidad</Text>
              </Text>
              <View style={styles.footerBadge}>
                <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.primary} />
                <Text style={styles.footerBadgeText}>Seguro</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
  },
  floatingCircle: {
    position: 'absolute',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  titleContainer: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitleAccent: {
    color: COLORS.primary,
  },
  badge: {
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.2)',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  carouselContainer: {
    width: '100%',
    marginBottom: 30,
  },
  carouselScroll: {
    width: width - 40,
  },
  carouselItem: {
    width: width - 40,
    alignItems: 'center',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  featureIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 24,
    borderRadius: 12,
  },
  statsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.lightText,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  guestButton: {
    marginTop: 8,
  },
  guestButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginHorizontal: 10,
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.lightText,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  footerBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
});