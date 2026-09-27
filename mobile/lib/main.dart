import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/auth/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization notice: $e');
  }
  runApp(const ApartmentResidentApp());
}

class ApartmentResidentApp extends StatelessWidget {
  const ApartmentResidentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Smart Apartment',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF17212B),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F7F8),
      ),
      // SplashScreen handles session check → routes to Login or Home
      home: const SplashScreen(),
    );
  }
}