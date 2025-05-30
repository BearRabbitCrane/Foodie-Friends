import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Image, Dimensions, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../Components/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { fetchSuggestions } from '../Utils/HelperFunctions';
import Rating from '../Components/Rating';
import ImageHorizontalScrolling from '../Components/ImageHorizontalScrolling';
import { Padding, Stylings } from '../Utils/Style';

const { width } = Dimensions.get('window');

const MapScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null); 
  const mapRef = useRef(null); 
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [markers, setMarkers] = useState([]); // State for multiple markers

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to use this feature.');
        return;
      }
  
      const location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
  
      setInitialRegion(region);
      fetchNearbyPlaces(location.coords.latitude, location.coords.longitude); // Fetch nearby places
    })();
  }, []);
  
  const handleReturnToCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current.animateToRegion(region, 1000);
    } catch (error) {
      console.error('Error fetching current location:', error);
      Alert.alert('Error', 'Unable to fetch current location.');
    }
  };

  const handleSearchChange = async (query) => {
    setSearchQuery(query);
  
    if (query.length > 2) {
      const suggestions = await fetchSuggestions(query, process.env.EXPO_PUBLIC_apiKey);
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
  
      // Clear selected place details and reset map if search bar is cleared
      if (query === '') {
        setSelectedPlaceDetails(null);
        setSelectedMarker(null);
  
        if (initialRegion) {
          mapRef.current.animateToRegion(initialRegion, 1000); // Smooth animation to initial region
        }
      }
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    setSearchQuery(suggestion.description);
    setSuggestions([]);
  
    const apiKey = process.env.EXPO_PUBLIC_apiKey;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.id}&key=${apiKey}`;
  
    try {
      const response = await axios.get(url);
      const place = response.data.result;
  
      const selectedLocation = {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        name: place.name,
        id: place.place_id,
      };
  
      setSelectedMarker(selectedLocation);
  
      // Construct place details with cuisine type
      const placeDetails = {
        name: place.name,
        type: place.types,
        rating: place.rating || 'N/A',
        photos: place.photos
          ? place.photos.slice(0, 10).map((photo) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
            )
          : [], // Default to empty if no photos
      };
  
      console.log('Selected place details:', placeDetails);
      setSelectedPlaceDetails(placeDetails);
  
      // Animate the map to the selected marker's location
      mapRef.current.animateToRegion(
        {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } catch (error) {
      console.error('Error fetching place details', error);
    }
  };
  
  const fetchNearbyPlaces = async (latitude, longitude) => {
    const apiKey = process.env.EXPO_PUBLIC_apiKey;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=restaurant|cafe|bar&key=${apiKey}`;
  
    try {
      const response = await axios.get(url);
      const places = response.data.results;
  
      const markersData = places.map((place) => ({
        id: place.place_id,
        name: place.name,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 'N/A',
      }));
  
      setMarkers(markersData); // Update the markers state
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    }
  };

  const handleMarkerPress = async (marker) => {
    setSelectedMarker(marker); // Set the selected marker
    setSearchQuery(''); // Clear the search query
    
    const apiKey = process.env.EXPO_PUBLIC_apiKey;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${marker.id}&key=${apiKey}`;
  
    try {
      const response = await axios.get(url);
      const place = response.data.result;
  
      const placeDetails = {
        name: place.name,
        rating: place.rating || 'N/A',
        photos: place.photos
          ? place.photos.slice(0, 10).map((photo) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
            )
          : [], // Default to empty if no photos
      };
  
      console.log('Marker pressed, place details:', placeDetails);
      setSelectedPlaceDetails(placeDetails); // Update the selected place details
    } catch (error) {
      console.error('Error fetching place details for marker:', error);
    }
  };
  
  const handleZoom = (type) => {
    if (!initialRegion) return;

    // Adjust zoom by modifying the latitudeDelta and longitudeDelta
    const zoomFactor = type === 'in' ? 0.5 : 2; // Reduce delta to zoom in; increase delta to zoom out
    const newRegion = {
      ...initialRegion,
      latitudeDelta: initialRegion.latitudeDelta * zoomFactor,
      longitudeDelta: initialRegion.longitudeDelta * zoomFactor,
    };

    setInitialRegion(newRegion); // Update the state
    mapRef.current.animateToRegion(newRegion, 500); // Smoothly animate the map to the new region
  };
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for restaurants..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        clearButtonMode="while-editing"
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          style={Stylings.suggestionsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSuggestionSelect(item)}
              style={Stylings.suggestionItem}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      {initialRegion && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onRegionChangeComplete={(region) => {
            fetchNearbyPlaces(region.latitude, region.longitude);
          }}
        >
          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <Pressable style={[styles.zoomButton, { backgroundColor: theme.backgroundColor }]} onPress={() => handleZoom('in')}>
              <Ionicons name="add-circle-outline" size={30} color={theme.textColor} />
            </Pressable>
            <Pressable style={[styles.zoomButton, { backgroundColor: theme.backgroundColor }]} onPress={() => handleZoom('out')}>
              <Ionicons name="remove-circle-outline" size={30} color={theme.textColor} />
            </Pressable>
          </View>

          {/* Button to return to the current location */}
          <Pressable
            style={[styles.currentLocationButton, { backgroundColor: theme.backgroundColor }]}
            onPress={handleReturnToCurrentLocation}
          >
            <Ionicons name="navigate-circle-outline" size={30} color={theme.textColor}  />
          </Pressable>

          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.name}
              onPress={() => handleMarkerPress(marker)} // Set marker as selected when clicked
            />
          ))}
        </MapView>
      )}

      {/* Restaurant compact window - Display selected marker details */}
      {selectedMarker && selectedPlaceDetails && (
        <View style={[styles.restaurantCompactContainer, { borderColor: theme.textColor }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScrollView}
          >
            {selectedPlaceDetails.photos.length > 0 ? (
              <ImageHorizontalScrolling images={selectedPlaceDetails.photos} imageStyle={styles.image} />
            ) : (
              <Text style={{ color: theme.textColor, padding: 10 }}>No images available</Text>
            )}
          </ScrollView>

          <Pressable onPress={() => navigation.navigate('RestaurantDetailScreen', { placeId: selectedMarker.id })}>
            <View style={styles.restaurantInfoCompactContainer}>
              <Text style={[styles.title, { color: theme.textColor }]}>
                {selectedPlaceDetails.name}
              </Text>

              <Rating rating={selectedPlaceDetails.rating} style={[styles.rating, { color: theme.textColor, marginTop: Padding.large, marginLeft: Padding.large }]}/>
            </View>
          </Pressable>
        </View>

      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    marginTop: 80,
    margin: 20,
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
  },
  map: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  restaurantCompactContainer: {
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    maxHeight: 200,
    borderRadius: 5,
  },
  image: {
    width: width,
    height: 150,
    resizeMode: 'cover',
  },
  imageScrollView: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  restaurantInfoCompactContainer: {
    flexDirection: 'row',
  },
  rating: {
    marginTop: 20,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    padding: 1,
  },
  zoomButton: {
    borderRadius: 25,
    padding: 1,
    marginVertical: 10,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 50, // Adjust position above other UI components
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 100, // Adjust the height for spacing between buttons
  },
});

export default MapScreen;
