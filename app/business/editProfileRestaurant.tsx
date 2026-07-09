import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { doc, GeoPoint, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertTriangle, ArrowLeft, Camera, Check, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { auth, db, storage } from '@/services/firebase';

const CATEGORIES = ['Panadería', 'Menú', 'Comida Rápida', 'Postres', 'Cafetería'];

const mapCategoryToId = (cat: string) => {
  const map: Record<string, string> = {
    'Panadería': 'bakery', 'Menú': 'menu', 'Comida Rápida': 'fastfood',
    'Postres': 'dessert', 'Cafetería': 'drinks'
  };
  return map[cat] || 'all';
};

export default function EditProfileRestaurantScreen() {
  const router = useRouter();

  const [nombreComercial, setNombreComercial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [category, setCategory] = useState('');
  const [coordenadas, setCoordenadas] = useState<GeoPoint | null>(null);
  const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        const restRef = doc(db, 'restaurantes', auth.currentUser.uid);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) {
          const data = restSnap.data();
          setNombreComercial(data.nombre || '');
          setDireccion(data.ubicacion?.direccion_texto || '');
          setCurrentImageUrl(data.imagenUrl || '');

          const catId = data.categoriaId || '';
          const catMap: Record<string, string> = {
            'bakery': 'Panadería', 'menu': 'Menú', 'fastfood': 'Comida Rápida',
            'dessert': 'Postres', 'drinks': 'Cafetería'
          };
          setCategory(catMap[catId] || '');

          if (data.ubicacion?.coordenadas) {
            setCoordenadas(new GeoPoint(
              data.ubicacion.coordenadas.latitude,
              data.ubicacion.coordenadas.longitude
            ));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: false,
         quality: 0.8,
         });
    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permiso de GPS denegado.');
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCoordenadas(new GeoPoint(location.coords.latitude, location.coords.longitude));
      Alert.alert('¡Éxito!', 'Ubicación GPS actualizada.');
    } catch {
      setErrorMsg('No se pudo obtener la ubicación.');
    }
  };

  const uploadToFirebase = async (uri: string, path: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const handleSave = async () => {
    if (!nombreComercial.trim()) {
      setErrorMsg('El nombre comercial es obligatorio.');
      return;
    }
    if (!category) {
      setErrorMsg('Selecciona una categoría.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      const uid = auth.currentUser!.uid;

      let imagenUrl = currentImageUrl;
      if (profileImage) {
        imagenUrl = await uploadToFirebase(profileImage.uri, `restaurantes_logos/${uid}_perfil`);
      }

      const updateData: any = {
        nombre: nombreComercial.trim(),
        categoriaId: mapCategoryToId(category),
        imagenUrl,
        'ubicacion.direccion_texto': direccion.trim(),
      };

      if (coordenadas) {
        updateData['ubicacion.coordenadas'] = coordenadas;
      }

      await updateDoc(doc(db, 'restaurantes', uid), updateData);

      Alert.alert('¡Listo!', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      setErrorMsg('Ocurrió un error al guardar. Revisa tu conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#90C659" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">

      {/* HEADER */}
      <View className="bg-[#90C659] pt-12 pb-5 px-4 flex-row items-center shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full bg-white/20 mr-3">
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>
        <View>
          <Text className="font-black text-lg text-white">Editar Perfil</Text>
          <Text className="text-white/70 text-xs">Actualiza la información de tu local</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {errorMsg ? (
          <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-200 flex-row items-center gap-2">
            <AlertTriangle color="#dc2626" size={16} />
            <Text className="text-red-600 text-xs font-bold flex-1">{errorMsg}</Text>
          </View>
        ) : null}

        {/* LOGO */}
        <Text className="font-black text-sm text-gray-800 mb-3">📸 Logo del local</Text>
        <TouchableOpacity onPress={pickImage} className="items-center mb-6">
          <View className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#90C659] bg-gray-100 items-center justify-center">
            {profileImage ? (
              <Image source={{ uri: profileImage.uri }} className="w-full h-full" resizeMode="cover" />
            ) : currentImageUrl ? (
              <Image source={{ uri: currentImageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Camera color="#9ca3af" size={32} />
            )}
          </View>
          <View className="mt-2 bg-[#90C659] px-4 py-1.5 rounded-full flex-row items-center gap-1">
            <Camera color="white" size={14} />
            <Text className="text-white text-xs font-bold">Cambiar foto</Text>
          </View>
        </TouchableOpacity>

        {/* NOMBRE COMERCIAL */}
        <Text className="font-black text-sm text-gray-800 mb-3">🏪 Nombre del local</Text>
        <View className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-5">
          <TextInput
            placeholder="Ej. La Molienda"
            value={nombreComercial}
            onChangeText={setNombreComercial}
            className="text-sm font-medium text-gray-800"
            placeholderTextColor="#d1d5db"
          />
        </View>

        {/* CATEGORÍA */}
        <Text className="font-black text-sm text-gray-800 mb-3">🍽️ Categoría</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              className={`px-4 py-2.5 rounded-xl border ${category === cat ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-xs font-bold ${category === cat ? 'text-white' : 'text-gray-600'}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DIRECCIÓN */}
        <Text className="font-black text-sm text-gray-800 mb-3">📍 Dirección del local</Text>
        <View className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-3">
          <TextInput
            placeholder="Ej. Av. Pardo 123, Chimbote"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            className="text-sm font-medium text-gray-800"
            placeholderTextColor="#d1d5db"
            style={{ textAlignVertical: 'top', minHeight: 50 }}
          />
        </View>

        {/* MAPA */}
        <Text className="font-black text-sm text-gray-800 mb-2">🗺️ Ubicación en el mapa</Text>
        <Text className="text-xs text-gray-400 mb-3">Toca el mapa o arrastra el marcador para ajustar tu ubicación</Text>

        <View style={{ height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
          <MapView
            style={{ flex: 1 }}
            provider="google"
            initialRegion={{
              latitude: coordenadas ? coordenadas.latitude : -9.0853,
              longitude: coordenadas ? coordenadas.longitude : -78.5782,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setCoordenadas(new GeoPoint(latitude, longitude));
            }}
          >
            {coordenadas && (
              <Marker
                coordinate={{
                  latitude: coordenadas.latitude,
                  longitude: coordenadas.longitude,
                }}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setCoordenadas(new GeoPoint(latitude, longitude));
                }}
                pinColor="#90C659"
              />
            )}
          </MapView>
        </View>

        <TouchableOpacity
          onPress={handleGetLocation}
          className="flex-row items-center justify-center gap-2 bg-blue-500 py-3 rounded-xl mb-6"
        >
          <MapPin color="white" size={16} />
          <Text className="text-white font-bold text-sm">Usar mi ubicación actual</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* BOTÓN GUARDAR */}
      <View className="absolute bottom-0 w-full px-4 pt-3 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 ${isSaving ? 'bg-gray-300' : 'bg-[#90C659]'}`}
          style={{ shadowColor: '#90C659', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
        >
          {isSaving ? <ActivityIndicator color="white" size="small" /> : <Check color="white" size={18} />}
          <Text className="text-white font-black text-base">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}