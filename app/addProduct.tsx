import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertTriangle, ArrowLeft, Camera, Check, Gift, UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../firebase';

const CATEGORIES = ['Panadería', 'Menú', 'Comida Rápida', 'Postres', 'Cafetería', 'Vegano'];
const ALERGENOS_OPCIONES = ['gluten', 'lactosa', 'frutos secos', 'mariscos', 'huevo', 'soja'];

export default function AddProductScreen() {
  const router = useRouter();

  // 'pack' = packs_sopresa | 'plato' = platos_independientes
  const [productType, setProductType] = useState<'pack' | 'plato'>('plato');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precioOriginal: '',
    precioOferta: '',
    cantidadDisponible: '',
    tiempoRestante: '',
  });

  const [category, setCategory] = useState('');
  const [alergenos, setAlergenos] = useState<string[]>([]);
  const [productImage, setProductImage] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const toggleAlergeno = (a: string) => {
    setAlergenos((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProductImage(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al seleccionar la imagen.');
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
    setFormData({
      nombre: '',
      descripcion: '',
      precioOriginal: '',
      precioOferta: '',
      cantidadDisponible: '',
      tiempoRestante: '',
    });
    setCategory('');
    setAlergenos([]);
    setProductImage(null);
  };

  const validate = () => {
    if (!formData.nombre.trim()) return 'El nombre del producto es obligatorio.';
    if (!formData.precioOriginal || !formData.precioOferta) return 'Ingresa ambos precios.';
    if (Number(formData.precioOferta) >= Number(formData.precioOriginal)) {
      return 'El precio de oferta debe ser menor al precio original.';
    }
    if (!formData.cantidadDisponible) return 'Indica la cantidad disponible.';
    if (!category) return 'Selecciona una categoría.';
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (!auth.currentUser) {
      setErrorMsg('Debes iniciar sesión como restaurante.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      let imagenUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400';

      if (productImage) {
        const path = `productos/${auth.currentUser.uid}_${Date.now()}`;
        imagenUrl = await uploadToFirebase(productImage.uri, path);
      }

      const collectionName = productType === 'pack' ? 'packs_sopresa' : 'platos_independientes';

      await addDoc(collection(db, collectionName), {
        restauranteId: auth.currentUser.uid,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || 'Delicioso excedente del día.',
        precioOriginal: Number(formData.precioOriginal),
        precioOferta: Number(formData.precioOferta),
        categoria: category,
        tiempoRestante: formData.tiempoRestante.trim() || 'Pronto',
        cantidadDisponible: Number(formData.cantidadDisponible),
        imagenUrl,
        alergenos,
        fecha_creacion: new Date().toISOString(),
      });

      setSuccessMsg(true);
      resetForm();

      setTimeout(() => setSuccessMsg(false), 2500);

    } catch (error) {
      console.error('Error al guardar producto:', error);
      setErrorMsg('Ocurrió un error al guardar. Revisa tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">

      {/* HEADER */}
      <View className="bg-[#90C659] pt-12 pb-5 px-4 flex-row items-center shadow-md z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="font-bold text-lg text-white ml-3">Subir Producto</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {errorMsg ? (
          <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100 flex-row items-start gap-2">
            <AlertTriangle color="#dc2626" size={18} style={{ marginTop: 2 }} />
            <Text className="text-red-600 text-xs font-bold flex-1">{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View className="bg-green-50 p-3 rounded-xl mb-4 border border-green-200 flex-row items-center gap-2">
            <Check color="#16a34a" size={18} />
            <Text className="text-green-700 text-xs font-bold flex-1">¡Producto publicado con éxito!</Text>
          </View>
        ) : null}

        {/* Selector de tipo de producto */}
        <Text className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">Tipo de producto</Text>
        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity
            onPress={() => setProductType('plato')}
            className={`flex-1 flex-col items-center justify-center py-4 rounded-2xl border-2 ${
              productType === 'plato' ? 'border-[#90C659] bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <UtensilsCrossed color={productType === 'plato' ? '#90C659' : '#9ca3af'} size={24} />
            <Text className={`text-xs font-bold mt-2 ${productType === 'plato' ? 'text-[#90C659]' : 'text-gray-500'}`}>
              Plato Independiente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setProductType('pack')}
            className={`flex-1 flex-col items-center justify-center py-4 rounded-2xl border-2 ${
              productType === 'pack' ? 'border-[#90C659] bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Gift color={productType === 'pack' ? '#90C659' : '#9ca3af'} size={24} />
            <Text className={`text-xs font-bold mt-2 ${productType === 'pack' ? 'text-[#90C659]' : 'text-gray-500'}`}>
              Pack Sorpresa
            </Text>
          </TouchableOpacity>
        </View>

        {/* Imagen del producto */}
        <Text className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">Foto del producto</Text>
        <TouchableOpacity
          onPress={pickImage}
          className="w-full h-40 bg-white rounded-2xl border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden mb-5"
        >
          {productImage ? (
            <Image source={{ uri: productImage.uri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Camera color="#9ca3af" size={28} />
              <Text className="text-xs text-gray-400 font-bold mt-1">Toca para subir una foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Datos básicos */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <Text className="font-bold text-xs text-gray-700 mb-1">Nombre del producto</Text>
          <TextInput
            placeholder="Ej. Pan de molde artesanal"
            value={formData.nombre}
            onChangeText={(t) => setFormData({ ...formData, nombre: t })}
            className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800 mb-3"
          />

          <Text className="font-bold text-xs text-gray-700 mb-1">Descripción</Text>
          <TextInput
            placeholder="Cuéntale al cliente qué incluye"
            value={formData.descripcion}
            onChangeText={(t) => setFormData({ ...formData, descripcion: t })}
            multiline
            numberOfLines={3}
            className="bg-gray-100 rounded-xl px-3 py-2 text-sm font-medium text-gray-800"
            style={{ textAlignVertical: 'top', minHeight: 70 }}
          />
        </View>

        {/* Precios y stock */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="font-bold text-xs text-gray-700 mb-1">Precio original (S/.)</Text>
              <TextInput
                placeholder="0.00"
                value={formData.precioOriginal}
                onChangeText={(t) => setFormData({ ...formData, precioOriginal: t.replace(/[^0-9.]/g, '') })}
                keyboardType="decimal-pad"
                className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800"
              />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-xs text-gray-700 mb-1">Precio oferta (S/.)</Text>
              <TextInput
                placeholder="0.00"
                value={formData.precioOferta}
                onChangeText={(t) => setFormData({ ...formData, precioOferta: t.replace(/[^0-9.]/g, '') })}
                keyboardType="decimal-pad"
                className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="font-bold text-xs text-gray-700 mb-1">Stock disponible</Text>
              <TextInput
                placeholder="Ej. 5"
                value={formData.cantidadDisponible}
                onChangeText={(t) => setFormData({ ...formData, cantidadDisponible: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800"
              />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-xs text-gray-700 mb-1">Tiempo restante</Text>
              <TextInput
                placeholder="Ej. 2 horas"
                value={formData.tiempoRestante}
                onChangeText={(t) => setFormData({ ...formData, tiempoRestante: t })}
                className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800"
              />
            </View>
          </View>
        </View>

        {/* Categoría */}
        <Text className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">Categoría</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              className={`px-3 py-2 rounded-xl border ${
                category === cat ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`text-xs font-bold ${category === cat ? 'text-white' : 'text-gray-600'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alérgenos */}
        <Text className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">
          Alérgenos (opcional)
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {ALERGENOS_OPCIONES.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => toggleAlergeno(a)}
              className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
                alergenos.includes(a) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
              }`}
            >
              {alergenos.includes(a) && <AlertTriangle color="#dc2626" size={12} />}
              <Text className={`text-xs font-bold capitalize ${alergenos.includes(a) ? 'text-red-600' : 'text-gray-600'}`}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Botón fijo inferior */}
      <View className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white shadow-lg pb-8">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
            isLoading ? 'bg-gray-300' : 'bg-[#90C659] shadow-lg'
          }`}
        >
          {isLoading && <ActivityIndicator color="white" size="small" />}
          <Text className="text-white font-bold text-base">
            {isLoading ? 'Guardando...' : 'Publicar producto'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}