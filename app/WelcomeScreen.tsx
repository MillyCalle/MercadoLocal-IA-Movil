// app/index.tsx - CÓDIGO COMPLETO CORREGIDO
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Datos para el carrusel
const featuresData = [
  {
    id: '1',
    icon: 'leaf',
    iconType: 'FontAwesome5',
    title: 'Productos Frescos',
    description: 'Directo del campo a tu mesa',
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.2)',
  },
  {
    id: '2',
    icon: 'flash',
    iconType: 'Ionicons',
    title: 'Entrega Rápida',
    description: 'En minutos, no en días',
    color: '#FFC107',
    bgColor: 'rgba(255, 193, 7, 0.2)',
  },
  {
    id: '3',
    icon: 'robot',
    iconType: 'MaterialCommunityIcons',
    title: 'IA Inteligente',
    description: 'Recomendaciones personalizadas',
    color: '#2196F3',
    bgColor: 'rgba(33, 150, 243, 0.2)',
  },
  {
    id: '4',
    icon: 'heart',
    iconType: 'Ionicons',
    title: 'Comunidad',
    description: 'Apoya a productores locales',
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.2)',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Referencias para las animaciones de partículas
  const particleRefs = useRef(
    Array.from({ length: 15 }).map(() => ({
      x: useRef(Math.random() * width).current,
      y: useRef(Math.random() * height).current,
      animX: useRef(new Animated.Value(Math.random() * width)).current,
      animY: useRef(new Animated.Value(Math.random() * height)).current,
      scale: useRef(new Animated.Value(0.3 + Math.random() * 0.7)).current,
      opacity: useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current,
    }))
  ).current;

  // Renderizar iconos dinámicamente - CORREGIDO
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
  const startAutoScroll = () => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= featuresData.length) {
        nextIndex = 0;
      }
      
      setCurrentIndex(nextIndex);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: nextIndex * (width - 80),
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ),
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

    // Animación de partículas flotantes
    particleRefs.forEach((particle) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.animX, {
            toValue: particle.x + (Math.random() * 100 - 50),
            duration: 3000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.animX, {
            toValue: particle.x,
            duration: 3000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.animY, {
            toValue: particle.y + (Math.random() * 100 - 50),
            duration: 4000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.animY, {
            toValue: particle.y,
            duration: 4000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 0.8,
            duration: 2000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 2000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Iniciar carrusel automático
    const cleanUp = startAutoScroll();
    return cleanUp;
  }, [currentIndex]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3c2a" />
      
      {/* Fondo con gradiente animado */}
      <LinearGradient
        colors={['#1a3c2a', '#2d5a3e', '#3a6b4a']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        
        {/* Partículas flotantes */}
        {particleRefs.map((particle, index) => (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.animX },
                  { translateY: particle.animY },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
                backgroundColor: index % 3 === 0 ? '#FFD700' : 
                               index % 3 === 1 ? '#4CAF50' : '#FFFFFF',
              },
            ]}
          />
        ))}
        
        {/* Logo giratorio */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideUpAnim },
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <LinearGradient
              colors={['#FFD700', '#FFC107', '#FF9800']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="leaf" size={60} color="#FFFFFF" />
            </LinearGradient>
          </View>
          
          {/* Anillos concéntricos - SOLO VIEWS, NO TEXTO */}
          <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: Animated.multiply(pulseAnim, 1.2) }] }]} />
          <Animated.View style={[styles.ring, styles.ring3, { transform: [{ scale: Animated.multiply(pulseAnim, 1.4) }] }]} />
        </Animated.View>
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            {/* Título principal - TODO EN <Text> */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>MERCADO LOCAL</Text>
              <Animated.View style={[styles.titleUnderline, { transform: [{ scaleX: pulseAnim }] }]} />
              <Text style={styles.subtitle}>- IA -</Text>
              <Text style={styles.tagline}>Donde lo fresco se encuentra con lo digital</Text>
            </View>
            
            {/* Carrusel de características */}
            <Animated.View 
              style={[
                styles.carouselContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
              ]}
            >
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                snapToInterval={width - 80}
                snapToAlignment="center"
                decelerationRate="fast"
                onScroll={(event) => {
                  const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 80));
                  if (slideIndex !== currentIndex) {
                    setCurrentIndex(slideIndex);
                  }
                }}
                style={styles.carouselScroll}
                contentContainerStyle={styles.carouselContent}
              >
                {featuresData.map((item) => (
                  <View key={`carousel-${item.id}`} style={styles.carouselItem}>
                    <View style={styles.featureCard}>
                      <View style={[styles.featureIcon, { backgroundColor: item.bgColor }]}>
                        {renderIcon(item.iconType, item.icon, item.color, 24)}
                      </View>
                      <Text style={styles.featureTitle}>{item.title}</Text>
                      <Text style={styles.featureDescription}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              
              {/* Indicadores de paginación - SOLO VIEWS */}
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
                        x: index * (width - 80),
                        animated: true,
                      });
                    }}
                  />
                ))}
              </View>
            </Animated.View>
            
            {/* Contador de estadísticas animado - TODO EN <Text> */}
            <Animated.View 
              style={[
                styles.statsContainer,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Productores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Productos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50K+</Text>
                <Text style={styles.statLabel}>Clientes</Text>
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
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFC107']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-in" size={24} color="#1a3c2a" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                  <Animated.View style={[styles.buttonPulse, { transform: [{ scale: pulseAnim }] }]} />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/register')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['transparent', 'transparent']}
                  style={styles.secondaryButtonInner}
                >
                  <Ionicons name="person-add" size={24} color="#FFD700" style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
                </LinearGradient>
                <View style={styles.buttonBorder} />
              </TouchableOpacity>
              
              {/* Botón de invitado - CORREGIDA LA RUTA */}
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => {
                  // CORREGIDO: usar '/(tabs)' si explore es la primera pestaña
                  // o '/(tabs)/explore' si tienes un archivo explore.tsx
                  router.replace('/(tabs)/explorar');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.guestButtonText}>
                  Explorar como invitado
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
            
            {/* Footer - TODO EN <Text> */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <Text style={styles.footerText}>
                Al continuar, aceptas nuestros{' '}
                <Text style={styles.footerLink}>Términos</Text> y{' '}
                <Text style={styles.footerLink}>Privacidad</Text>
              </Text>
              <View style={styles.footerIcon}>
                <MaterialCommunityIcons name="leaf-circle" size={20} color="#FFD700" />
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a3c2a',
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ring1: {
    width: 150,
    height: 150,
  },
  ring2: {
    width: 180,
    height: 180,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  ring3: {
    width: 210,
    height: 210,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    width: 200,
    height: 4,
    backgroundColor: '#FFD700',
    marginVertical: 12,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  carouselContainer: {
    width: '100%',
    marginBottom: 40,
    alignItems: 'center',
  },
  carouselScroll: {
    width: width - 80,
  },
  carouselContent: {
    alignItems: 'center',
  },
  carouselItem: {
    width: width - 80,
    paddingHorizontal: 10,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 220,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  featureIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#FFD700',
    width: 12,
    height: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonIcon: {
    marginRight: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3c2a',
    letterSpacing: 1,
  },
  buttonPulse: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  secondaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
  },
  secondaryButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
  buttonBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    zIndex: -1,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  guestButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLink: {
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
  footerIcon: {
    marginTop: 8,
  },
});