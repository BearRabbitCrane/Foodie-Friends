import React, { useContext, useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../Components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchDataFromDB, deleteFromDB } from '../Firebase/firestoreHelper';

const { width } = Dimensions.get('window');

export default function ReviewDetailScreen() {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;

  const [reviewData, setReviewData] = useState({
    title: route.params?.title || '',
    description: route.params?.description || '',
    images: route.params?.images || [],
    rating: route.params?.rating || 0,
  });

  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewData.title || !reviewData.description) {
        const allPosts = await fetchDataFromDB('posts');
        const post = allPosts.find((p) => p.id === postId);
        if (post) {
          setReviewData({
            title: post.title || '',
            description: post.description || '',
            images: post.images || [],
            rating: post.rating || 0,
          });
        }
      }
    };
    fetchReview();
  }, [postId]);

  const handleDelete = async () => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          await deleteFromDB(postId, 'posts');
          navigation.goBack();
        },
        style: "destructive",
      },
    ]);
  };

  const renderStars = (rating) => {
    return Array.from({ length: rating }, (_, index) => (
      <Ionicons key={index} name="star" size={40} color="gold" />
    ));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Ionicons
          name="trash"
          size={24}
          color="white"
          onPress={handleDelete}
          style={{ marginRight: 15 }}
        />
      ),
    });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.textContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageScrollView}
      >
        {reviewData.images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>
      </View>
      <View style={styles.textContainer}></View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.textColor }]}>{reviewData.title}</Text>
        <Text style={[styles.description, { color: theme.textColor }]}>{reviewData.description}</Text>
        <View style={styles.ratingContainer}>
          {renderStars(reviewData.rating)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageScrollView: {
    alignItems: 'center',
  },
  image: {
    width: width, // Full screen width
    height: 300,
    resizeMode: 'cover',
  },
  textContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  description: {
    fontSize: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
