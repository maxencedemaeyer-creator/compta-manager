// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArDDJuLm3pOkYtJW8sstBYQRIIIG5iYEk",
  authDomain: "padel-controle.firebaseapp.com",
  projectId: "padel-controle",
  storageBucket: "padel-controle.firebasestorage.app",
  messagingSenderId: "638862538293",
  appId: "1:638862538293:web:0f3e1f1610d4908143237c",
  measurementId: "G-83RVQH9QXE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
