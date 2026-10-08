import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'screens/auth/splash_screen.dart';
import 'services/api_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();

  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization notice: $e');
  }

  Stripe.publishableKey =
      'pk_test_51UKHuqGhXNDaGQ3gLG4KIDK7V3UKGf1n98pYETF4jS1dsxJHZUiep7Wm4ZTinHGo0dcrsmrhSj1856ONM1MhQJh7002mxfo6bS';

  // Keep applySettings disabled because it previously caused startup hanging.
  // await Stripe.instance.applySettings();

  runApp(const ApartmentResidentApp());
}

class ApartmentResidentApp extends StatelessWidget {
  const ApartmentResidentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ApartmentHub',
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Inter',
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
