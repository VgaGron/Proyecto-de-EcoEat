import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertTriangle, ArrowLeft, Camera, Check, Gift, UtensilsCrossed } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../firebase';

const CATEGORIES = ['Panadería', 'Menú', 'Comida Rápida', 'Postres', 'Cafetería', 'Vegano'];
const ALERGENOS_OPCIONES = ['gluten', 'lactosa', 'frutos secos', 'mariscos', 'huevo', 'soja'];

const ALERGENOS_ICONS: Record<string, string> = {
  gluten: '🌾',
  lactosa: '🥛',
  'frutos secos': '🥜',
  mariscos: '🦐',
  huevo: '🥚',
  soja: '🫘',
};

export default function AddProductScreen() {
  const router = useRouter();

  const [productType, setProductType] = useState<'pack' | 'plato'>('plato');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precioOriginal: '',
    precioOferta: '',
    cantidadDisponible: '',
    horaInicio: '',
    horaFin: ''
  });

  const [category, setCategory] = useState('');
  const [alergenos, setAlergenos] = useState<string[]>([]);
  const [productImage, setProductImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const toggleAlergeno = (a: string) => {
    setAlergenos((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setErrorMsg('Necesitamos permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
});

    if (!result.canceled && result.assets?.length > 0) {
      setProductImage(result.assets[0]);
    }
  };

  const uploadToFirebase = async (uri: string, path: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', precioOriginal: '', precioOferta: '', cantidadDisponible: '', horaInicio: '', horaFin: '' });
    setCategory('');
    setAlergenos([]);
    setProductImage(null);
  };

  const validate = () => {
    if (!formData.nombre.trim()) return 'El nombre del producto es obligatorio.';
    if (!formData.precioOriginal || !formData.precioOferta) return 'Ingresa ambos precios.';
    if (Number(formData.precioOferta) >= Number(formData.precioOriginal)) return 'El precio de oferta debe ser menor al precio original.';
    if (!formData.cantidadDisponible) return 'Indica la cantidad disponible.';
    if (!formData.horaInicio.trim() || !formData.horaFin.trim()) return 'Ingresa la hora de inicio y fin.';
    if (!category) return 'Selecciona una categoría.';
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }
    if (!auth.currentUser) { setErrorMsg('Debes iniciar sesión como restaurante.'); return; }

    try {
      setIsLoading(true);
      setErrorMsg('');
      let imagenUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400';
      if (productImage) {
        imagenUrl = await uploadToFirebase(productImage.uri, `productos/${auth.currentUser.uid}_${Date.now()}`);
      }
      const collectionName = productType === 'pack' ? 'packs_sopresa' : 'platos_independientes';
      await addDoc(collection(db, collectionName), {
        restauranteId: auth.currentUser.uid,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || 'Delicioso excedente del día.',
        precioOriginal: Number(formData.precioOriginal),
        precioOferta: Number(formData.precioOferta),
        categoria: category,
        horaInicio: formData.horaInicio.trim(),
        horaFin: formData.horaFin.trim(),
        cantidadDisponible: Number(formData.cantidadDisponible),
        imagenUrl,
        alergenos,
        fecha_creacion: new Date().toISOString(),
      });
      setSuccessMsg(true);
      resetForm();
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (error) {
      setErrorMsg('Ocurrió un error al guardar. Revisa tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const descuento = formData.precioOriginal && formData.precioOferta
    ? Math.round((1 - Number(formData.precioOferta) / Number(formData.precioOriginal)) * 100)
    : 0;

  return (
    <View className="flex-1 bg-gray-50">

      {/* HEADER */}
      <View className="bg-[#90C659] pt-12 pb-5 px-4 flex-row items-center shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full bg-white/20 mr-3">
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>
        <View>
          <Text className="font-black text-lg text-white">Subir Producto</Text>
          <Text className="text-white/70 text-xs">Completa los datos del producto</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {errorMsg ? (
          <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-200 flex-row items-center gap-2">
            <AlertTriangle color="#dc2626" size={16} />
            <Text className="text-red-600 text-xs font-bold flex-1">{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View className="bg-green-50 p-3 rounded-xl mb-4 border border-green-200 flex-row items-center gap-2">
            <Check color="#16a34a" size={16} />
            <Text className="text-green-700 text-xs font-bold flex-1">¡Producto publicado con éxito!</Text>
          </View>
        ) : null}

        {/* TIPO DE PRODUCTO */}
        <Text className="font-black text-sm text-gray-800 mb-3">📦 Tipo de producto</Text>
        <View className="flex-row gap-3 mb-6">
          {[
            { key: 'plato', label: 'Plato', sublabel: 'Independiente', icon: <UtensilsCrossed size={28} color={productType === 'plato' ? '#fff' : '#9ca3af'} /> },
            { key: 'pack', label: 'Pack', sublabel: 'Sorpresa', icon: <Gift size={28} color={productType === 'pack' ? '#fff' : '#9ca3af'} /> },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setProductType(opt.key as 'plato' | 'pack')}
              className={`flex-1 py-5 rounded-2xl items-center justify-center gap-1 ${productType === opt.key ? 'bg-[#90C659]' : 'bg-white border border-gray-200'}`}
            >
              {opt.icon}
              <Text className={`font-black text-sm mt-1 ${productType === opt.key ? 'text-white' : 'text-gray-700'}`}>{opt.label}</Text>
              <Text className={`text-[10px] font-medium ${productType === opt.key ? 'text-white/80' : 'text-gray-400'}`}>{opt.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FOTO */}
        <Text className="font-black text-sm text-gray-800 mb-3">📸 Foto del producto</Text>
        <TouchableOpacity onPress={pickImage} className="w-full h-44 rounded-2xl overflow-hidden mb-6 border-2 border-dashed border-gray-300 bg-white items-center justify-center">
          {productImage ? (
            <Image source={{ uri: productImage.uri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center gap-2">
              <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center">
                <Camera color="#9ca3af" size={28} />
              </View>
              <Text className="text-gray-400 text-sm font-bold">Toca para subir una foto</Text>
              <Text className="text-gray-300 text-xs">JPG, PNG recomendado</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* DATOS BÁSICOS */}
        <Text className="font-black text-sm text-gray-800 mb-3">📝 Información del producto</Text>
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <View className="px-4 pt-4 pb-3 border-b border-gray-50">
            <Text className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Nombre</Text>
            <TextInput
              placeholder="Ej. Pan de molde artesanal"
              value={formData.nombre}
              onChangeText={(t) => setFormData({ ...formData, nombre: t })}
              className="text-sm font-medium text-gray-800"
              placeholderTextColor="#d1d5db"
            />
          </View>
          <View className="px-4 pt-3 pb-4">
            <Text className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Descripción</Text>
            <TextInput
              placeholder="Cuéntale al cliente qué incluye..."
              value={formData.descripcion}
              onChangeText={(t) => setFormData({ ...formData, descripcion: t })}
              multiline
              numberOfLines={3}
              className="text-sm font-medium text-gray-800"
              style={{ textAlignVertical: 'top', minHeight: 60 }}
              placeholderTextColor="#d1d5db"
            />
          </View>
        </View>

        {/* PRECIOS */}
        <Text className="font-black text-sm text-gray-800 mb-3">💰 Precios y disponibilidad</Text>
        <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs font-bold text-gray-400 mb-1">Precio original</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-gray-400 font-bold text-sm">S/.</Text>
                <TextInput
                  placeholder="0.00"
                  value={formData.precioOriginal}
                  onChangeText={(t) => setFormData({ ...formData, precioOriginal: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  className="flex-1 text-base font-black text-gray-700"
                  placeholderTextColor="#d1d5db"
                />
              </View>
            </View>
            <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
              <Text className="text-xs font-bold text-green-600 mb-1">Precio oferta</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-green-500 font-bold text-sm">S/.</Text>
                <TextInput
                  placeholder="0.00"
                  value={formData.precioOferta}
                  onChangeText={(t) => setFormData({ ...formData, precioOferta: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  className="flex-1 text-base font-black text-green-700"
                  placeholderTextColor="#d1d5db"
                />
              </View>
            </View>
          </View>

          {descuento > 0 && (
            <View className="bg-orange-50 rounded-xl p-2.5 mb-4 flex-row items-center gap-2">
              <Text className="text-lg">🎉</Text>
              <Text className="text-orange-600 font-bold text-sm">¡Descuento del {descuento}% aplicado!</Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="w-1/3 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs font-bold text-gray-400 mb-1">Stock</Text>
              <TextInput
                placeholder="0"
                value={formData.cantidadDisponible}
                onChangeText={(t) => setFormData({ ...formData, cantidadDisponible: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                className="text-base font-black text-gray-700"
                placeholderTextColor="#d1d5db"
              />
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs font-bold text-gray-400 mb-1">🕐 Inicia</Text>
              <TextInput
                placeholder="14:00"
                value={formData.horaInicio}
                onChangeText={(t) => setFormData({ ...formData, horaInicio: t })}
                className="text-base font-black text-gray-700"
                maxLength={5}
                placeholderTextColor="#d1d5db"
              />
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs font-bold text-gray-400 mb-1">🕐 Termina</Text>
              <TextInput
                placeholder="18:00"
                value={formData.horaFin}
                onChangeText={(t) => setFormData({ ...formData, horaFin: t })}
                className="text-base font-black text-gray-700"
                maxLength={5}
                placeholderTextColor="#d1d5db"
              />
            </View>
          </View>
        </View>

        {/* CATEGORÍA */}
        <Text className="font-black text-sm text-gray-800 mb-3">🍽️ Categoría</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
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

        {/* ALÉRGENOS */}
        <Text className="font-black text-sm text-gray-800 mb-1">⚠️ Alérgenos</Text>
        <Text className="text-xs text-gray-400 mb-3">Marca los ingredientes que pueden causar alergias</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {ALERGENOS_OPCIONES.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => toggleAlergeno(a)}
              className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${alergenos.includes(a) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}
            >
              <Text>{ALERGENOS_ICONS[a]}</Text>
              <Text className={`text-xs font-bold capitalize ${alergenos.includes(a) ? 'text-red-600' : 'text-gray-600'}`}>{a}</Text>
              {alergenos.includes(a) && <Check color="#dc2626" size={12} />}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* BOTÓN FIJO */}
      <View className="absolute bottom-0 w-full px-4 pt-3 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 ${isLoading ? 'bg-gray-300' : 'bg-[#90C659]'}`}
          style={{ shadowColor: '#90C659', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
        >
          {isLoading ? <ActivityIndicator color="white" size="small" /> : <Check color="white" size={18} />}
          <Text className="text-white font-black text-base">
            {isLoading ? 'Guardando...' : 'Publicar producto'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}