import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      {/* Mensaje de Bienvenida Directo */}
      <View style={styles.headerContainer}>
        <Text style={styles.logoText}>🍏 EcoEat</Text>
        <Text style={styles.headline}>Rescata comida deliciosa a precios increíbles</Text>
        <Text style={styles.subtext}>Únete a la comunidad que lucha contra el desperdicio de alimentos.</Text>
      </View>

      {/* Botones de Acción para el Flujo Express */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => alert('¡Abriendo el Mapa del Barrio como Invitado!')}
        >
          <Text style={styles.buttonText}>Explorar como Invitado (Sin Cuenta)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Iniciar sesión / Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2e7d32', // Verde Eco
    marginBottom: 20,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    marginBottom: 40,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3, // Sombra para Android
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
});

