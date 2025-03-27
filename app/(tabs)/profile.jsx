import { View, Text, Alert, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import {useRouter} from "expo-router"
import { API_URL} from "../../constants/api"
import {useAuthStore} from "../../store/authStore"
import styles from "../../assets/styles/profile.styles"
import ProfileHeader from '../../components/ProfileHeader'
import LogoutButton from '../../components/LogoutButton'
import { Ionicons } from '@expo/vector-icons'
import COLORS from '../../constants/colors'
import { Image } from 'expo-image'
import Loader from "../../components/Loader"

const sleep = (ms)=> new Promise((resolve)=> setTimeout(resolve,ms));

export default function profile() {
  const[books, setBooks]=useState([]);
  const[isLoading, setIsLoading]=useState(true);
  const[refreshing, setRefreshing]=useState(false);

  const {token} = useAuthStore()

  const router = useRouter();

  const fetchData = async ()=>{
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/books/user`,{
      headers:{Authorization:`Bearer ${token}`},
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message || "Failed to fetch user books");

      setBooks(data);
    } catch (error) {
      console.error("Error fetching data:",error);
      Alert.alert("Error","Failed to load profile data. pull down to refresh");
    } finally{
      setIsLoading(false)
    }
  };

  useEffect(()=>{
    fetchData();
  },[]);

  const handleDeleteBook = async(bookId)=>{
    try {
      const response = await fetch(`${API_URL}/api/books/${bookId}`,{
        method:"DELETE",
        headers:{Authorization:`Bearer ${token}`},
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message || "Failed to delete book");

      setBooks(books.filter((book)=>book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
     Alert.alert("Error", error.message ||"Failed to delete recommendation") 
    }
  }

  const confirmDelete=(bookId)=>{
  Alert.alert("Delete recommendation","Are you sure you want to delete this recommendation?",[
    {text:"Cancel",style:"cancel"},
    {text:"Delete",style:"destructive", onPress:()=> handleDeleteBook(bookId)}
  ])
  }

  const renderBookItems= ({item})=>(
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
        <Text style={styles.bookCaption} numberOfLines={2}>{item.caption}</Text>
        <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={()=> confirmDelete(item._id)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
  const renderRatingStars = (rating)=>{
      const stars =[];
      for(let i =1; i<=5;i++){
        stars.push(
          <Ionicons
          key={i}
          name={i<=rating?"star":"star-outline"}
          size={16}
          color={i<=rating ? "#f4b400" : COLORS.textSecondary}
          style={{marginRight:2}}
          />
        )
      }
      return stars;
    };
    const handleRefresh =async()=>{
      setRefreshing(true);
      await sleep(500);
      await fetchData();
      setRefreshing(false)
    }
    if(isLoading && !refreshing) return <Loader />
  return (
    <View style={styles.container}>
     <ProfileHeader />
     <LogoutButton />
     {/* your recommendation */}
     <View style={styles.booksHeader}>
      <Text style={styles.booksTitle}>Your Recommendations 📚</Text>
      <Text style={styles.booksCount}>{books.length} books</Text>
     </View>
     <FlatList 
     data={books}
     renderItem={renderBookItems}
     keyExtractor={(item)=> item._id}
     showsVerticalScrollIndicator={false}

     refreshControl={
      <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
      />
     }
     contentContainerStyle={styles.booksList}
     ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={50} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>No recommendations yet</Text>
        <TouchableOpacity style={styles.addButton} onPress={()=>router.push("/create")}>
          <Text style={styles.addButtonText}>Add your first Book</Text>
        </TouchableOpacity>

      </View>
     }
     />
    </View>
  )
}