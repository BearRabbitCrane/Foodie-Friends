import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../Components/ThemeContext';
import ScreenWrapper from '../Components/ScreenWrapper';
import { fetchDataFromDB, deleteFromDB, writeToDB, updateDB } from '../Firebase/firestoreHelper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../Firebase/firebaseSetup';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../Firebase/firebaseSetup";
import { ImagePickerHandler } from '../Utils/HelperFunctions';
import { Align, BorderWidth, Colors, ContainerStyle, Padding, Width, BorderRadius, Font, Position, Resize } from '../Utils/Style';

export default function ProfileScreen() {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [profileImage, setProfileImage] = useState(null); // Set initial value to null
  const { pickImage, captureImage } = ImagePickerHandler();

  useEffect(() => {
    const checkUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedProfileImage = await AsyncStorage.getItem('profileImage');
      if (storedUsername) {
        setUsername(storedUsername);
        loadUserPosts(storedUsername);
        setUsernameModalVisible(false);
      } else {
        setUsernameModalVisible(true);
      }
      if (storedProfileImage) {
        setProfileImage(storedProfileImage);
      }
    };

    checkUsername();
  }, []);

  const loadUserPosts = async () => {
    try {
      const posts = await fetchDataFromDB('posts');
      console.log('Fetched Posts:', posts);
  
      const filteredPosts = posts.filter((post) => post.userId === auth.currentUser.uid);
  
      setUserPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };
  
  const handleSaveUsername = async () => {
    if (username.trim().length === 0) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }
  
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User is not logged in.');
        return;
      }
  
      const userCollection = 'users';
  
      // Fetch existing user data
      const existingUsers = await fetchDataFromDB(userCollection, { userId });
      if (existingUsers.length > 0) {
        // Update if user already exists
        const existingUserDocId = existingUsers[0].id;
        await updateDB(existingUserDocId, { username }, userCollection);
        console.log("Username updated successfully.");
      } else {
        // Write a new user document if none exists
        await writeToDB({ userId, username }, userCollection);
        console.log("New user created successfully.");
      }
  
      await AsyncStorage.setItem('username', username); // Save locally for convenience
      setUsernameModalVisible(false);
      Alert.alert('Success', 'Username saved successfully.');
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Failed to save username. Please try again.');
    }
  };
  

  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert("Permission Required", "Camera and media permissions are needed to upload profile pictures.");
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const initializeUserProfile = async () => {
      try {
        // Get current user's ID
        const userId = auth.currentUser?.uid;
  
        // If no user is logged in, clear state and alert
        if (!userId) {
          setUsername('');
          setProfileImage(null);
          Alert.alert('Error', 'User is not logged in.');
          return;
        }
  
        const userCollection = 'users';
  
        // Fetch user data from Firestore
        const existingUsers = await fetchDataFromDB(userCollection, { userId });
  
        if (existingUsers.length > 0) {
          const user = existingUsers[0];
          setUsername(user.username || '');
          setProfileImage(user.profileImage || '');
  
          // If the user doesn't have a username, prompt to create one
          if (!user.username) {
            setUsernameModalVisible(true);
          }
  
          // Save data to AsyncStorage as a fallback
          await AsyncStorage.setItem('username', user.username || '');
          await AsyncStorage.setItem('profileImage', user.profileImage || '');
        } else {
          // No user data found in Firestore, prompt for setup
          setUsername('');
          setProfileImage(null);
          setUsernameModalVisible(true);
  
          // Clear AsyncStorage
          await AsyncStorage.removeItem('username');
          await AsyncStorage.removeItem('profileImage');
        }
      } catch (error) {
        console.error('Error initializing user profile:', error);
        Alert.alert('Error', 'Unable to load profile information. Please try again.');
      }
    };
  
    initializeUserProfile();
  }, []);  
  
  const updateProfileImage = async (imageUri) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User is not logged in.');
        return;
      }
  
      // Upload the image to Firebase Storage
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profileImages/${userId}/${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const uploadedImageUrl = await getDownloadURL(snapshot.ref);
  
      // Update the user's document in Firestore with the new profile image URL
      const userCollection = 'users';
      const existingUsers = await fetchDataFromDB(userCollection, { userId });
  
      if (existingUsers.length > 0) {
        const userDocId = existingUsers[0].id;
        await updateDB(userDocId, { profileImage: uploadedImageUrl }, userCollection);
      } else {
        await writeToDB({ userId, profileImage: uploadedImageUrl }, userCollection);
      }
  
      // Save the image URL locally
      await AsyncStorage.setItem('profileImage', uploadedImageUrl);
  
      // Update state
      setProfileImage(uploadedImageUrl);
  
      Alert.alert('Success', 'Profile image updated successfully.');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    }
  };
  
  
  const pickProfileImage = async () => {
    const selectedImageUri = await pickImage();
    if (selectedImageUri) {
      console.log('Selected Image:', selectedImageUri); // Debug log
      await updateProfileImage(selectedImageUri);
    }
  };
  
  const captureProfileImage = async () => {
    const capturedImageUri = await captureImage();
    if (capturedImageUri) {
      console.log('Captured Image:', capturedImageUri); // Debug log
      setProfileImage(capturedImageUri);
      await updateProfileImage(capturedImageUri);
    }
  };
  

  const handleProfileImagePress = async () => {
    Alert.alert(
      "Set Profile Picture",
      "Choose an option:",
      [
        {
          text: "Take a Photo",
          onPress: captureProfileImage,
        },
        {
          text: "Choose from Gallery",
          onPress: pickProfileImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };
  
  
  const renderRow = (rowItems, rowIndex) => (
    <View
      style={{ flexDirection: 'row', justifyContent: rowItems.length === 1 ? 'flex-start' : 'space-between' }}
      key={`row-${rowIndex}`}
    >
      {rowItems.map((item) => (
        <View key={item.id} style={[styles.postItem, rowItems.length === 1 && { width: '48%' }]}>
          <Pressable
            onPress={() =>
              navigation.navigate('EditPost', {
                postId: item.id,
                initialDescription: item.description,
                initialImages: item.images,
                initialRating: item.rating,
                restaurantName: item.restaurantName || 'No restaurant specified',
                restaurantId: item.restaurantId || '',
              })
            }
          >
           {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.image} />
          ) : (
            <Text>No Image Available</Text>
          )}
            <Text style={styles.postTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.name || item.description.split(' ').slice(0, 5).join(' ')}...
          </Text>
          </Pressable>
          {/* Delete Button */}
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeletePost(item.id, item.userId)}
          >
            <Ionicons name="close" size={20} color="red" />
          </Pressable>
        </View>
      ))}
    </View>
  );
  
  const handleDeletePost = async (postId, userId) => {
    if (userId !== auth.currentUser?.uid) {
      Alert.alert('Permission Denied', 'You can only delete your own posts.');
      return;
    }
  
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFromDB(postId, 'posts');
            setUserPosts(userPosts.filter((post) => post.id !== postId)); // Update UI
            Alert.alert('Post Deleted', 'Your post has been successfully deleted.');
          } catch (error) {
            console.error('Error deleting post:', error);
            Alert.alert('Delete Error', 'There was an issue deleting your post.');
          }
        },
      },
    ]);
  };
  
  
  return (
    <ScreenWrapper>
      {/* Username Modal */}
      <Modal visible={usernameModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Your Username</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder="Enter a username"
              value={username}
              onChangeText={setUsername}
            />
            <Pressable style={styles.saveButton} onPress={handleSaveUsername}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.profileHeader}>
      <Pressable onPress={handleProfileImagePress}>
        <Image
         source={{ uri: profileImage || 'https://via.placeholder.com/100' }}
         style={styles.profileImage}
       />
      </Pressable>

        <View style={styles.usernameContainer}>
         <Text style={[styles.username, { color: theme.textColor }]}>
             {username || "User"}
         </Text>
         <Pressable onPress={() => setUsernameModalVisible(true)} style={styles.editIcon}>
           <Ionicons name="pencil" size={20} color={theme.textColor} />
         </Pressable>
        </View>
        {/* Action Button */}
        <Pressable onPress={() => navigation.navigate('FoodGallery')} style={styles.actionButton}>
          <Ionicons name="images-outline" size={24} color={theme.textColor} />
          <Text style={[styles.buttonText, { color: theme.textColor }]}>My Food Gallery</Text>
        </Pressable>
      </View>

      
      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>My Posts</Text>
      <ScrollView contentContainerStyle={styles.postsList}>
        {Array.from({ length: Math.ceil(userPosts.length / 2) }, (_, rowIndex) =>
          renderRow(userPosts.slice(rowIndex * 2, rowIndex * 2 + 2), rowIndex)
        )}
      </ScrollView>
    
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  profileHeader: {
    alignItems: Align.center,
    paddingVertical: Padding.xlarge,
  },
  profileImage: {
    width: Width.Image,
    height: Width.Image,
    borderRadius: BorderRadius.xxxlarge,
    borderWidth: BorderWidth.medium,
    borderColor: Colors.borderColor,
    marginBottom: Padding.large,
  },
  usernameContainer: {
    flexDirection: ContainerStyle.flexDirection,
    alignItems: Align.center,
    marginBottom: Padding.xlarge,
  },
  editIcon: {
    marginLeft: Padding.medium,
    padding: Padding.small,
  },
  username: {
    fontSize: Font.sizeLarge,
    fontWeight: Font.weight,
  },
  actionButton: {
    flexDirection: ContainerStyle.flexDirection,
    alignItems: Align.center,
    backgroundColor: Colors.borderColor,
    paddingVertical: Padding.medium,
    paddingHorizontal: Padding.large,
    borderRadius: BorderRadius.smallMedium,
    marginVertical: Padding.small,
    width: Width.smallMedium,
    justifyContent: Align.center,
  },
  buttonText: {
    fontSize: Font.sizeMedium,
    marginLeft: Padding.medium,
  },
  sectionTitle: {
    fontSize: Font.sizeLarge,
    fontWeight: Font.weight,
    marginBottom: Padding.large,
    paddingHorizontal: Padding.mediumLarge,
  },
  postItem: {
    flex: 0.48, // Adjusted for two posts in a row
    margin: Padding.small,
    backgroundColor: Colors.greenPostColor,
    borderRadius: BorderRadius.smallMedium,
    padding: Padding.large,
    alignItems: Align.center,
  },
  postsList: {
    flexGrow: ContainerStyle.flexGrow,
    padding: Padding.large,
    alignItems: ContainerStyle.alignLeft,
  },
  image: {
    width: Width.ImageLarge,
    height: Width.ImageLarge,
    borderRadius: Padding.medium,
    marginBottom: Padding.small,
    resizeMode: Resize.cover,
  },
  postTitle: {
    fontSize: Font.sizeMedium,
    fontWeight: Font.weight,
  },
  modalContainer: {
    flex: ContainerStyle.flex,
    justifyContent: Align.center,
    alignItems: Align.center,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: Width.medium,
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.medium,
    padding: Padding.xlarge,
    alignItems: Align.center,
  },
  modalTitle: {
    fontSize: Font.sizeLarge,
    fontWeight: Font.weight,
    marginBottom: Padding.large,
  },
  usernameInput: {
    borderWidth: BorderWidth.thin,
    borderColor: Colors.inputBorder,
    width: Width.medium,
    padding: Padding.large,
    borderRadius: BorderRadius.small,
    marginBottom: Padding.xlarge,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Padding.large,
    paddingHorizontal: Padding.xlarge,
    borderRadius: BorderRadius.small,
  },
  saveButtonText: {
    color: Colors.tertiary,
    fontWeight: Font.weight,
  },
  deleteButton: {
    position: Position.absolute,
    top: Padding.small,
    right: Padding.small,
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.xxxlarge,
    padding: Padding.small,
    elevation: 3, // Shadow for Android
  },
});