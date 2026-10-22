import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function IceCreamScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Ice Cream</Text>
      <Text style={styles.body}>This is the Ice Cream tab.</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details')}
      />
      
    </View>
  );
}

function DetailsScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Details</Text>
      <Text style={styles.body}>This screen is pushed onto the Ice Cream stack.</Text>
      <Button
        title="Go to More Details"
        onPress={() => navigation.navigate('MoreDetails')}
      />
    </View>
  );
}

function MoreDetailsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>More Details</Text>
      <Text style={styles.body}>This screen is pushed onto the Ice Cream stack.</Text>
    </View>
  );
}

function CoffeeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Hot Coffee</Text>
      <Text style={styles.body}>This is the Hot Coffee tab.</Text>
      <Button
        title="Go to About"
        onPress={() => navigation.navigate('About')}
      />
    </View>
  );
}

function AboutScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.body}>This screen is pushed onto the Coffee stack.</Text>
    </View>
  );
}

function IceCreamStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Ice Cream" component={IceCreamScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="MoreDetails" component={MoreDetailsScreen} />
    </Stack.Navigator>
  );
}

function CoffeeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Hot Coffee" component={CoffeeScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Ice Cream" component={IceCreamStack} />
          <Tab.Screen name="Hot Coffee" component={CoffeeStack} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    marginBottom: 16,
  },
});
