import { View, Text, KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import {useRouter} from "expo-router"
import styles from "../../assets/styles/create.styles"
import {Ionicons} from "@expo/vector-icons"
import COLORS from '../../constants/colors'
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {useAuthStore} from "../../store/authStore";
import { API_URL } from '../../constants/api'

const create = () => {
    const[title, setTitle] = useState("");
    const[caption, setCaption] = useState("")
    const[rating, setRating] = useState(3)
    const[image, setImage] = useState(null)
    const[imageBase64, setImageBase64] = useState(null)
    const[loading, setLoading] = useState(false)

    const router = useRouter();
    const {token} =useAuthStore();
    console.log("token" , token)

    //  image picker function
    // const pickImage=async ()=>{
    //   try {
    //     // request permission if needed
    //     if(Platform.OS !== "web"){
    //       const {status} =await imagePicker.requestMediaLibraryPermissionsAsync();
    //       if(status !== "granted"){
    //         Alert.alert("Permission Denied", "We need camera roll permission to upload an image");
    //         return;
    //       }
    //     }
    //     // launch image library
    //     const result = await imagePicker.launchImageLibraryAsync({
    //       mediaTypes:"images",
    //       allowsEditing:true,
    //       aspect:[4,3],
    //       quality:0.1,
    //       base64:true, 
    //     });
    //     if(!result.canceled){
    //       setImage(result.assets[0].uri);
    //       // if base64 is provided, useit
    //       if(result.assets[0].base64){
    //         setImageBase64(result.assets[0].base64);
    //       }else{
    //         // otherwise convert to base64
    //         const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri,{
    //           encoding: FileSystem.EncodingType.base64,
    //         });
    //         setImageBase64(base64);
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Error picking image:", error);
    //   }
    // }

    // Share button function
    
    const pickImage = async () => {
      try {
        if (Platform.OS !== "web") {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission Denied", "We need camera roll permission to upload an image");
            return;
          }
        }
    
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5, // Compress when selecting
        });
    
        if (!result.canceled) {
          // Resize & compress before converting to base64
          const compressedImage = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 800 } }], // Resize to 800px width
            { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG } // Compress further
          );
    
          setImage(compressedImage.uri);
    
          // Convert compressed image to base64
          const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
    
          setImageBase64(base64);
        }
      } catch (error) {
        console.error("Error picking image:", error);
      }
    };

    const handleSubmit = async ()=>{
      if(!title || !caption || !imageBase64 || !rating){
        Alert.alert("Error","Please fill in all fields");
        return;
      }
      try {
        setLoading(true);
        // get file extension from URI or default to jpeg
        const uriParts = image.split(".");
        const fileType = uriParts[uriParts.length-1];
        const imageType = fileType ? `image/${fileType.toLowerCase()}`:"image/jpeg";

        const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

        const response = await fetch(`${API_URL}/api/books`,{
          method:"POST",
          headers:{
            Authorization:`Bearer ${token}`,
            "Content-Type":"application/json",
          },
          body:JSON.stringify({
            title,
            caption,
            rating:rating.toString(),
            image: imageDataUrl,
          }),
        })
        
        const responseText = await response.text(); // Get the raw response as text
console.log('Response:', responseText); // Log the raw response

// Now, try to parse the response
const data = JSON.parse(responseText);
if (!response.ok) throw new Error(data.message || "Something went wrong");
        Alert.alert("Success", "Your book recommendation has been posted!");
        setTitle("");
        setCaption("")
        setRating(3)
        setImage(null)
        setImageBase64(null);
        router.push("/")
      } catch (error) {
        console.error("Error creating post:", error);
        Alert.alert("Error", error.message || "Something went wrong");
      } finally{
        setLoading(false)
      }
    }

    // rating function
    const renderRatingPicker=()=>{
      const stars=[];
      for(let i=1; i<=5; i++){
        stars.push(
          <TouchableOpacity key={i} onPress={()=>setRating(i)} style={styles.starButton}>
            <Ionicons 
            name={i<=rating ?"star" : "star-outline"}
            size={32}
            color={i<= rating ? "#f4b400" : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )
      }
      return <View style={styles.ratingContainer}>{stars}</View>
    }
  return (
    <KeyboardAvoidingView
           style={{flex:1}}
           behavior={Platform.OS === "ios" ? "padding" : "height"}
           >
         <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
          <View style={styles.card}>
            {/* header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Book Recommendation</Text>
              <Text style={styles.subtitle}>Share your favorite reads with others</Text>
            </View>

              <View style={styles.form}>
                {/* book title */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Book Title</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons 
                    name="book-outline"
                    size={20}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                    />
                    <TextInput 
                    style={styles.input}
                    placeholder="Enter book title"
                    placeholderTextColor={COLORS.placeholderText}
                    value={title}
                    onChangeText={setTitle}
                    />
                  </View>
                </View>

               {/* rating */}
               <View style={styles.formGroup}>
                <Text style={styles.label}>Your Rating</Text>
                {renderRatingPicker()}
               </View>

               {/* image */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Book Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
               {image ? (
                <Image source={{uri:image}} style={styles.previewImage} />
               ):(
                <View style={styles.placeholderContainer}>
                  <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={styles.placeholderText}>Tap to select image</Text>
                </View>
               )}
                </TouchableOpacity>
              </View>

             {/* caption */}
             <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput 
              style={styles.textArea}
              placeholder="Write your review or thoughts about this book..."
              placeholderTextColor={COLORS.placeholderText}
              value={caption}
              onChangeText={setCaption}
              multiline
              />
             </View>

             {/* share button */}
             <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              { loading ?(
                <ActivityIndicator color={COLORS.white} />
              ):(
                <>
                <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={COLORS.white}
                style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Share</Text>
                </>
              )}
             </TouchableOpacity>
              </View>
          </View>
         </ScrollView>
      </KeyboardAvoidingView>
  )
}

export default create