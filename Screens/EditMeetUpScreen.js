import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, Modal, Alert, TextInput } from 'react-native';
import { ThemeContext } from '../Components/ThemeContext';
import PressableButton from '../Components/PressableButtons/PressableButton';
import DateInput from '../Components/Inputs/DateInput';
import TimeInput from '../Components/Inputs/TimeInput';
import { writeToDB } from '../Firebase/firestoreHelper';
import moment from 'moment';

export default function EditMeetUpScreen({ navigation, route }) {
  const { theme } = useContext(ThemeContext);
  const [restaurant, setRestaurant] = useState(route.params?.restaurant || '');
  const [date, setDate] = useState(route.params?.date || new Date());
  const [time, setTime] = useState(route.params?.time || '');
  const [details, setDetails] = useState(route.params?.details || '');
  const collectionName = 'meetups';

  const confirmCancel = () => {
    Alert.alert(
      "Confirm Cancel",
      "Are you sure you want to cancel?",
      [
        {
          text: "No",
          onPress: () => console.log("EditMeetUp Cancel Pressed"),
          style: "cancel"
        },
        { text: "Yes", onPress: navigation.goBack }
      ],
      { cancelable: false }
    );
  };

  const handleSave = async() => {
    if (!restaurant) {
      Alert.alert("Validation Error", "Restaurant cannot be empty.");
      return;
    }
    if (!time) {
      Alert.alert("Validation Error", "Time cannot be empty.");
      return;
    }
    if (!date) {
      Alert.alert("Validation Error", "Date cannot be empty.");
      return;
    }

    const selectedDateTime = moment(`${moment(date).format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD hh:mm A');
    const currentDateTime = moment();

    if (selectedDateTime.isBefore(currentDateTime)) {
      Alert.alert("Validation Error", "The selected date and time cannot be in the past.");
      return;
    }

    const formattedDate = moment(date).format('YYYY-MM-DD'); // Format the date to YYYY-MM-DD

    const meetUp = {
      restaurant: restaurant,
      date: formattedDate,
      details: details,
      time: time,
    };

    console.log(meetUp);
    await writeToDB(meetUp, collectionName);

    // Save the meet-up (you can add your save logic here)
    Alert.alert("Success", "Meet-up saved successfully!");
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={styles.inputText}>Restaurant*</Text>
      <TextInput 
        style={styles.inputContainer} 
        value={restaurant}
        onChangeText={setRestaurant}
      />

      <TimeInput time={time} setTime={setTime} />

      <DateInput date={date} setDate={setDate} />

      <Text style={styles.inputText}>Details: </Text>
      <TextInput 
        placeholder='Who is coming? What are we celebrating?'
        style={[styles.inputContainer, { height: 100 }]} 
        multiline={true}
        value={details}
        onChangeText={setDetails}
      />

      <View style={styles.buttonContainer}>
        <PressableButton 
          title="Cancel" 
          onPress={confirmCancel} 
          textStyle={[styles.buttonTextStyle, { color: 'red' }]}
          buttonStyle={{ marginTop: 0 }}
        />
        <PressableButton 
          title="Save" 
          onPress={handleSave}
          textStyle={styles.buttonTextStyle}
          buttonStyle={{ marginTop: 0 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  inputText: {
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    width: '100%',
    padding: 5,
    marginBottom: 20,
    width: 350,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
  },
  buttonTextStyle: {
    fontSize: 16,
  },
});