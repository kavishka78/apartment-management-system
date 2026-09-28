import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../models/auth/contact_check_result.dart';
import '../../models/auth/resident_session.dart';

/// Handles all HTTP calls to the backend for resident authentication.
///
/// Endpoints used:
///   POST /api/v1/auth/resident/verify-contact  → check if phone/email is registered
///   POST /api/v1/auth/resident/firebase-token  → exchange Firebase token for app JWT
///   GET  /api/v1/auth/me                       → validate a saved JWT
class ResidentAuthApi {
  static String get _base => kIsWeb ? 'http://localhost:5073/api/v1' : 'http://10.0.2.2:5073/api/v1';

  // ── Verify Contact ─────────────────────────────────────────────────────────

  /// Step 1 of login:
  /// Checks whether the [contact] (phone number or email) is registered
  /// with any apartment complex in the system.
  ///
  /// Returns a [ContactCheckResult] with `found = true` when the resident
  /// exists and their account is Active.
  static Future<ContactCheckResult> verifyContact(String contact) async {
    try {
      final isPhone = RegExp(r'^\+?[\d\s\-]{7,15}$').hasMatch(contact.trim());

      final body = isPhone
          ? {'phone': contact.trim()}
          : {'email': contact.trim().toLowerCase()};

      final response = await http
          .post(
            Uri.parse('$_base/auth/resident/verify-contact'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return ContactCheckResult.fromJson(data);
      }

      // 404 = not registered, anything else = server error
      return ContactCheckResult.notFound();
    } catch (_) {
      return ContactCheckResult.notFound();
    }
  }

  // ── Exchange Firebase Token ────────────────────────────────────────────────

  /// Step 2 of login (phone OTP or email OTP path):
  /// Sends the Firebase ID token to the backend, which verifies it and
  /// returns our own JWT + resident profile.
  ///
  /// Returns a [ResidentSession] on success, or null on failure.
  static Future<ResidentSession?> exchangeFirebaseToken(
      String firebaseIdToken) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_base/auth/resident/firebase-token'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'firebaseIdToken': firebaseIdToken}),
          )
          .timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return ResidentSession.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ── Google Sign-In token exchange ──────────────────────────────────────────

  /// Step 2 of login (Google path):
  /// Sends the Google ID token credential to the existing backend endpoint.
  /// The backend verifies the Google token and returns our app JWT.
  ///
  /// Uses the existing `POST /api/v1/auth/google` endpoint already in
  /// PlatformController.cs.
  static Future<ResidentSession?> exchangeGoogleToken(
      String googleIdToken) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_base/auth/google'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'credential': googleIdToken}),
          )
          .timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;

        // The backend resolves Resident separately from UserAccount.
        if (data['resident'] is! Map<String, dynamic>) return null;
        return ResidentSession.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ── Validate saved JWT ─────────────────────────────────────────────────────

  /// Validates a saved JWT by calling GET /api/v1/auth/me.
  /// Returns true if the token is still valid on the server side.
  static Future<bool> validateToken(String token) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_base/auth/me'),
            headers: {
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
