import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Centralized API configuration for the entire mobile app.
///
/// Priority resolution order for baseUrl:
/// 1. In-app runtime override (persisted in SharedPreferences)
/// 2. Command-line flag (--dart-define=API_URL=...)
/// 3. Value from mobile/.env (API_URL=...)
/// 4. Platform default (http://10.0.2.2:5073/api)
class ApiConfig {
  static const String _keyCustomUrl = 'ah_custom_api_base_url';
  static const String _envUrl = String.fromEnvironment('API_URL');
  static String? _inMemoryCustomUrl;

  /// Call once in main() before runApp() to load .env and persisted settings.
  static Future<void> init() async {
    try {
      await dotenv.load(fileName: ".env");
    } catch (e) {
      debugPrint('Notice: .env file not loaded: $e');
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      _inMemoryCustomUrl = prefs.getString(_keyCustomUrl);
    } catch (_) {}
  }

  /// Override the API URL at runtime
  static Future<void> setCustomUrl(String url) async {
    String cleaned = url.trim();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    if (!cleaned.endsWith('/api') && !cleaned.endsWith('/api/v1')) {
      cleaned = '$cleaned/api';
    } else if (cleaned.endsWith('/api/v1')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    _inMemoryCustomUrl = cleaned;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyCustomUrl, cleaned);
    } catch (_) {}
  }

  /// Reset to .env / platform default
  static Future<void> resetToDefault() async {
    _inMemoryCustomUrl = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyCustomUrl);
    } catch (_) {}
  }

  /// Base API URL ending in `/api` (reads from mobile/.env if set)
  static String get baseUrl {
    if (_inMemoryCustomUrl != null && _inMemoryCustomUrl!.isNotEmpty) {
      return _inMemoryCustomUrl!;
    }
    if (_envUrl.isNotEmpty) {
      return _envUrl.endsWith('/')
          ? _envUrl.substring(0, _envUrl.length - 1)
          : _envUrl;
    }
    final dotenvUrl = dotenv.env['API_URL']?.trim();
    if (dotenvUrl != null && dotenvUrl.isNotEmpty) {
      return dotenvUrl.endsWith('/')
          ? dotenvUrl.substring(0, dotenvUrl.length - 1)
          : dotenvUrl;
    }
    return kIsWeb ? 'http://localhost:5073/api' : 'http://10.0.2.2:5073/api';
  }

  /// V1 API URL ending in `/api/v1`
  static String get v1Url => '$baseUrl/v1';

  /// Whether a custom runtime override is active
  static bool get hasCustomUrl =>
      _inMemoryCustomUrl != null && _inMemoryCustomUrl!.isNotEmpty;
}
