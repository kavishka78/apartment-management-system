import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Centralized API configuration for the entire mobile app.
///
/// Supports:
/// 1. Cloud deployment via `--dart-define=API_URL=https://my-domain.com/api`
/// 2. In-app developer URL switching (persisted across restarts)
/// 3. Automatic platform defaults (Web, Android Emulator, LAN IP)
class ApiConfig {
  static const String _keyCustomUrl = 'ah_custom_api_base_url';

  // Environment variable override (e.g. for production builds or CI/CD)
  // Run with: flutter run --dart-define=API_URL=https://my-backend.com/api
  static const String _envUrl = String.fromEnvironment('API_URL');

  static String? _inMemoryCustomUrl;

  /// Call once in main() before runApp() to load persisted custom URL if any.
  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _inMemoryCustomUrl = prefs.getString(_keyCustomUrl);
    } catch (_) {}
  }

  /// Override the API URL at runtime (e.g. from developer settings dialog)
  static Future<void> setCustomUrl(String url) async {
    String cleaned = url.trim();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    // Ensure it ends with /api if user only typed the domain
    if (!cleaned.endsWith('/api') && !cleaned.endsWith('/api/v1')) {
      cleaned = '$cleaned/api';
    } else if (cleaned.endsWith('/api/v1')) {
      cleaned = cleaned.substring(0, cleaned.length - 3); // strip /v1 so baseUrl is /api
    }

    _inMemoryCustomUrl = cleaned;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyCustomUrl, cleaned);
    } catch (_) {}
  }

  /// Reset to platform defaults
  static Future<void> resetToDefault() async {
    _inMemoryCustomUrl = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyCustomUrl);
    } catch (_) {}
  }

  /// Base API URL ending in `/api` (e.g. `http://10.0.2.2:5073/api`)
  static String get baseUrl {
    if (_inMemoryCustomUrl != null && _inMemoryCustomUrl!.isNotEmpty) {
      return _inMemoryCustomUrl!;
    }
    if (_envUrl.isNotEmpty) {
      return _envUrl.endsWith('/') ? _envUrl.substring(0, _envUrl.length - 1) : _envUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5073/api';
    }
    // Android emulator host loopback address (10.0.2.2)
    return 'http://10.0.2.2:5073/api';
  }

  /// V1 API URL ending in `/api/v1` (e.g. `http://10.0.2.2:5073/api/v1`)
  static String get v1Url => '$baseUrl/v1';

  /// Whether a custom URL is currently active
  static bool get hasCustomUrl => _inMemoryCustomUrl != null && _inMemoryCustomUrl!.isNotEmpty;
}
