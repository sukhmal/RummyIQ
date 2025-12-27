import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, Spacing, IconSize } from '../theme';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface Firework {
  id: number;
  particles: Particle[];
  startX: number;
  startY: number;
}

const COLORS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff8800', '#ffffff', '#ff69b4'];

const FireworksModal = ({
  visible,
  winnerName,
  onClose,
}: {
  visible: boolean;
  winnerName: string;
  onClose: () => void;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const fireworkIdRef = useRef(0);
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const createFirework = (x: number, y: number) => {
    const particles: Particle[] = [];
    const numParticles = 20;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        id: i,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1),
        color: Math.random() > 0.3 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const firework: Firework = {
      id: fireworkIdRef.current++,
      particles,
      startX: x,
      startY: y,
    };

    setFireworks(prev => [...prev, firework]);

    // Animate particles
    const angle = (2 * Math.PI) / numParticles;
    particles.forEach((particle, index) => {
      const distance = 80 + Math.random() * 60;
      const particleAngle = angle * index + (Math.random() - 0.5) * 0.5;
      const targetX = Math.cos(particleAngle) * distance;
      const targetY = Math.sin(particleAngle) * distance;

      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: targetX,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: targetY + 50, // Add gravity effect
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Remove firework after animation
    setTimeout(() => {
      setFireworks(prev => prev.filter(f => f.id !== firework.id));
    }, 1200);
  };

  useEffect(() => {
    if (visible) {
      // Animate title
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Create initial fireworks
      const positions = [
        { x: width * 0.2, y: height * 0.25 },
        { x: width * 0.8, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.15 },
        { x: width * 0.3, y: height * 0.35 },
        { x: width * 0.7, y: height * 0.3 },
      ];

      positions.forEach((pos, index) => {
        setTimeout(() => createFirework(pos.x, pos.y), index * 300);
      });

      // Continue creating fireworks
      const interval = setInterval(() => {
        createFirework(
          width * 0.2 + Math.random() * width * 0.6,
          height * 0.15 + Math.random() * height * 0.25
        );
      }, 500);

      return () => {
        clearInterval(interval);
        titleScale.setValue(0);
        titleOpacity.setValue(0);
      };
    }
  }, [visible, titleOpacity, titleScale]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        {/* Fireworks */}
        {fireworks.map(firework => (
          <View
            key={firework.id}
            style={[
              styles.fireworkContainer,
              { left: firework.startX, top: firework.startY },
            ]}>
            {firework.particles.map(particle => (
              <Animated.View
                key={particle.id}
                style={[
                  styles.particle,
                  {
                    backgroundColor: particle.color,
                    opacity: particle.opacity,
                    transform: [
                      { translateX: particle.x },
                      { translateY: particle.y },
                      { scale: particle.scale },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        ))}

        {/* Winner announcement */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}>
          <View style={styles.congratsRow}>
            <Icon name="party.popper.fill" size={IconSize.large} color={colors.gold} weight="medium" />
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Icon name="party.popper.fill" size={IconSize.large} color={colors.gold} weight="medium" />
          </View>
          <Text style={styles.winnerLabel}>Winner</Text>
          <Text style={styles.winnerName}>{winnerName}</Text>
          <View style={styles.trophyContainer}>
            <Icon name="trophy.fill" size={IconSize.xxlarge} color={colors.gold} weight="medium" />
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>View Results</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireworkContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.gold,
    marginHorizontal: Spacing.md,
    minWidth: 280,
  },
  congratsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    textAlign: 'center',
  },
  winnerLabel: {
    fontSize: 18,
    color: colors.secondaryLabel,
    marginBottom: 5,
  },
  winnerName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.label,
    marginBottom: Spacing.sm,
  },
  trophyContainer: {
    marginVertical: Spacing.lg,
  },
  button: {
    backgroundColor: colors.gold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    marginTop: Spacing.sm,
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FireworksModal;
