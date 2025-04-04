import React, { useContext, useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, Alert, ScrollView, Dimensions, Button, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../Components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchDataFromDB } from '../Firebase/firestoreHelper';
import PressableButton from '../Components/PressableButtons/PressableButton';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import Rating from '../Components/Rating';
import { Align, BorderWidth, Colors, ContainerStyle, Padding, Width, BorderRadius, Font, Margin, Resize, Height } from '../Utils/Style';

const { width } = Dimensions.get('window');

export default function RestaurantDetailScreen() {
  const { theme } = useContext(ThemeContext);
  const route = useRoute(); // Get route to access passed parameters
  const navigation = useNavigation();
  const { placeId } = route.params;

  const [restaurant, setRestaurant] = useState(null); // Store fetched restaurant details
  const [loading, setLoading] = useState(true); // Loading state
  const [combinedReviews, setCombinedReviews] = useState([]); 
  
  // Function to calculate relative time
  const calculateRelativeTime = (timestamp) => {
    if (!timestamp) return 'Time not available';
    
    // Convert the timestamp to milliseconds (if it's in seconds)
    const timestampInMilliseconds = timestamp;

    // Calculate the relative time using `date-fns`
    return formatDistanceToNow(new Date(timestampInMilliseconds), { addSuffix: true });
  };


  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      const apiKey = process.env.EXPO_PUBLIC_apiKey;
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
  
      try {
        // Fetch restaurant details from the API
        const response = await axios.get(url);
        const place = response.data.result;
  
        if (!place) {
          throw new Error('No place details found in the API response.');
        }
  
        const restaurantDetails = {
          name: place.name,
          rating: place.rating || 'N/A',
          photos: place.photos
            ? place.photos.map((photo) =>
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
              )
            : [], // Default to empty if no photos
          address: place.formatted_address || 'Address not available',
          phone: place.formatted_phone_number || 'Phone number not available',
          reviews: place.reviews || [], // Include reviews if available
        };
  
        setRestaurant(restaurantDetails);
  
        // Fetch reviews from Firestore
        const dbReviews = await fetchDataFromDB('posts'); // Fetch all posts
        const matchingDbReviews = dbReviews.filter((review) => review.restaurantId === placeId);
  
        // Format Firestore reviews
        const formattedDbReviews = matchingDbReviews.map((review) => ({
          text: review.description,
          rating: review.rating,
          author_name: review.username || 'Anonymous',
          profile_photo_url: review.profileImage,
          id: review.id, // Include the unique ID for navigation
          relative_time_description: calculateRelativeTime(review.time),
        }));
  
        console.log('Firestore reviews:', formattedDbReviews);
  
        // Combine API reviews with Firestore reviews
        setCombinedReviews([...formattedDbReviews, ...(restaurantDetails.reviews || [])]);
  
        setLoading(false);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
        Alert.alert('Error', 'Unable to fetch restaurant details.');
        setLoading(false);
      }
    };
  
    fetchRestaurantDetails();
  }, [placeId]);
  
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.textColor }]}>No restaurant details found.</Text>
      </View>
    );
  }

  const handleCreateReview = () => {
    navigation.navigate('EditReview');
  };

  const handleAddPost = () => {
    Alert.alert('Authentication Required', 'Please log in to add a new post');
    navigation.navigate('SignUpScreen'); // Redirect to the signup/login screen
  };

  const handleReview = (review) => {
    navigation.navigate('ReviewDetailScreen', {
      postId: review.id, // If the review has a unique identifier
      restaurantName: restaurant.name, // Optionally pass the restaurant name
      description: review.text,
      // pass 2 random photos of the place as the images of the review
      images: restaurant.photos.slice(0, 2),
      rating: review.rating || 0, // Pass the review's rating
      user: review.author_name,
      profile_photo_url: review.profile_photo_url,
    });
  };
  

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* Restaurant Photos */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollView}
        >
          {restaurant.photos.length > 0 ? (
            restaurant.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.image} />
            ))
          ) : (
            <Text style={{ color: theme.textColor, padding: 10 }}>No images available</Text>
          )}
        </ScrollView>

        {/* Restaurant Name */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textColor }]}>{restaurant.name}</Text>
        </View>

        {/* Rating */}
        <Rating rating={restaurant.rating} onPress={() => {}} />

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="location-outline" style={[styles.locationIcon, { color: theme.textColor }]} />
          <Text style={[styles.infoText, { color: theme.textColor }]}>
            {restaurant.address || 'Address not available'}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="call-outline" style={[styles.locationIcon, { color: theme.textColor }]} />
          <Text style={[styles.infoText, { color: theme.textColor }]}>
            {restaurant.phone || 'Phone number not available'}
          </Text>
        </View>

        {/* Reviews */}
        <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
          <View style={styles.ratingContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Reviews</Text>
            <Pressable onPress={handleAddPost} style={styles.addPostButton}>
              <Ionicons name="create-sharp" style={[styles.addPostIcon, { color: theme.textColor }]} />
            </Pressable>
          </View>


            <ScrollView style={styles.section}>
            {combinedReviews.length === 0 ? (
            <View style={styles.noReviewContainer}>
              <Text style={styles.noReviewText}>No review</Text>
              <PressableButton 
                title="Create a review" 
                onPress={handleCreateReview} 
                textStyle={{ color: theme.buttonColor, fontSize: 18 }}
              />
            </View>
            ) : (
              combinedReviews.map((review, index) => (
                <Pressable key={index} onPress={() => handleReview(review)}>
                  <View key={index} style={styles.reviewItem}>
    
                    <View style={styles.reviewContainer}>
                      <Image source={{ uri: review.profile_photo_url || 'https://www.fearfreehappyhomes.com/wp-content/uploads/2021/04/bigstock-Kitten-In-Pink-Blanket-Looking-415440131.jpg'}} style={styles.reviewImage} />
      
                        <View style={styles.reviewInfoContainer}>
                          <View style={styles.reviewDateTimeContainer}>
                              <Ionicons name="time-outline" style={[styles.reviewDateTimeIcon, { color: theme.textColor }]} />
                              <Text style={[styles.reviewText, { color: theme.textColor }]}>{review.relative_time_description || 'Time not available'}</Text>
                          </View>
                            <Text style={styles.reviewText}>{review.text}</Text>
                        </View>
  
                    </View>
                  </View>
                </Pressable>
            ))
          )}
          </ScrollView> 
        </View>
      </View>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: ContainerStyle.flex,
  },
  imageScrollView: {
    alignItems: Align.center,
  },
  image: {
    width: width, // Full screen width
    height: Height.postImageLarge,
    resizeMode: Resize.cover,
  },
  textContainer: {
    paddingHorizontal: Padding.xlarge,
    marginTop: Margin.small,
    paddingBottom: Padding.large,
  },
  title: {
    fontSize: Font.sizeXLarge,
    fontWeight: Font.weight,
    marginBottom: Margin.small,
    marginTop: Margin.small,
  },
  description: {
    fontSize: Font.sizeLarge,
    marginTop: Margin.small,
    marginBottom: Margin.large,
    marginLeft: Margin.large,
  },
  ratingContainer: {
    flexDirection: ContainerStyle.flexDirection,
    alignItems: Align.center,
    marginLeft: Margin.large,
  },
  infoContainer: {
    flexDirection: ContainerStyle.flexDirection,
    alignItems: Align.center,
    marginLeft: Margin.large,
    paddingBottom: Padding.large,
  },
  locationIcon: {
    fontSize: Font.sizeXLarge,
  },
  infoText: {
    fontSize: Font.sizeSmall,
    marginLeft: Margin.small,
  },
  sectionTitle: {
    fontSize: Font.sizeLarge,
    fontWeight: Font.weight,
    marginTop: Margin.large,
    marginBottom: Margin.small,
  },
  section: {
    flex: ContainerStyle.flex,
    marginBottom: Margin.small,
    borderColor: Colors.borderColor,
    borderWidth: BorderWidth.thin,
    marginHorizontal: Padding.xlarge,
    borderRadius: BorderRadius.medium,
    marginBottom: Margin.large,
  },
  noReviewText: {
    fontSize: Font.sizeMedium,
    marginTop: Margin.large,
  },
  noReviewContainer: {
    alignItems: Align.center,
  },
  addPostIcon: {
    fontSize: Font.sizeXLarge,
    marginLeft: Margin.small,
    marginBottom: Padding.negative,
  },
  reviewDateTimeContainer: {
    flexDirection: ContainerStyle.flexDirection,
  },
  reviewContainer: {
    flexDirection: ContainerStyle.flexDirection,
  },
  reviewDateTimeIcon: {
    marginTop: Padding.xsmall,
    marginHorizontal: Padding.small,
    color: Colors.gray,
    fontSize: Font.sizeMedium,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.inputBorder,
    marginTop: Padding.small,
    maxWidth: Margin.xxxxlarge,
  },
  reviewImage: {
    width: BorderRadius.xxlarge,
    height: BorderRadius.xxlarge,
    borderRadius: BorderRadius.large,
    marginRight: BorderRadius.medium,
  },
  reviewItem: {
    padding: Padding.large,
    borderBottomWidth: BorderWidth.thin,
    borderBottomColor: Colors.borderColor,
  },
});