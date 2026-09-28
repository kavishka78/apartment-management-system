import 'package:flutter/material.dart';
import 'login_entry_screen.dart';
import '../main_navigation_screen.dart';
import '../../services/auth/auth_service.dart';
import '../../services/auth/resident_auth_api.dart';

/// The first screen shown every time the app launches.
///
/// Logic:
///   1. Show branded splash for a short moment.
///   2. Check SharedPreferences for a saved JWT.
///   3. If found → validate it with the backend (GET /api/v1/auth/me).
///      ✅ Valid  → go directly to MainNavigationScreen (stay logged in).
///      ❌ Expired → clear saved data and go to LoginEntryScreen.
///   4. No token saved → go to LoginEntryScreen.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // Fade-in animation for the logo
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation =
        CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
    _fadeController.forward();

    // Start the session check after the UI is ready
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkSession());
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _checkSession() async {
    // Give the splash a minimum visible time so it doesn't flash
    await Future.delayed(const Duration(milliseconds: 1800));

    if (!mounted) return;

    final session = await AuthService.getSession();

    if (session == null || !session.isValid) {
      _goToHome();
      return;
    }

    // Validate the saved token is still accepted by the server
    final isValid = await ResidentAuthApi.validateToken(session.token);

    if (!mounted) return;

    if (isValid) {
      _goToHome();
    } else {
      // Token expired or revoked — clear stale data and re-login
      await AuthService.clearSession();
      _goToHome();
    }
  }

  void _goToLogin() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginEntryScreen()),
    );
  }

  void _goToHome() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF17212B),
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App icon
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  Icons.apartment_rounded,
                  color: Colors.white,
                  size: 48,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Smart Apartment',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Your home, simplified.',
                style: TextStyle(
                  color: Color(0xFFB8C2CC),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 60),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFB8C2CC)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
