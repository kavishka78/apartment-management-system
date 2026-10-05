import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'auth_service.dart';

class PushNotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // Request permission (Apple & Web requires this, Android 13+ requires this)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted push notification permission');
      
      // Get the token and send it to the backend
      String? token = await _fcm.getToken();
      if (token != null) {
        await _sendTokenToBackend(token);
      }

      // Listen for token refreshes
      _fcm.onTokenRefresh.listen((newToken) {
        _sendTokenToBackend(newToken);
      });
    }
  }

  static Future<void> _sendTokenToBackend(String token) async {
    if (!await AuthService.isLoggedIn()) return;
    
    try {
      final headers = await AuthService.authHeaders();
      await http.post(
        Uri.parse('http://10.0.2.2:5073/api/auth/resident/fcm-token'),
        headers: headers,
        body: jsonEncode({'token': token}),
      );
      print('FCM Token successfully synced with C# Backend');
    } catch (e) {
      print('Failed to send FCM token to backend: $e');
    }
  }
}