import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ParkingApiService {
  static const String baseUrl = 'http://10.0.2.2:5073/api';

  // =========================================================
  // GET ACTIVE VISITORS / PASSES
  // =========================================================
  static Future<Map<String, dynamic>> getActiveVisitors() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/visitors/active'),
        headers: {'Content-Type': 'application/json'},
      );

      debugPrint('GET VISITORS STATUS: ${response.statusCode}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      }

      return {
        'success': false,
        'message': 'Failed to load visitor passes (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('GET VISITORS ERROR: $e');
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }

  // =========================================================
  // PRE-REGISTER VISITOR & REQUEST PARKING
  // =========================================================
  static Future<Map<String, dynamic>> preRegisterVisitor({
    required int residentId,
    required String visitorName,
    required String phoneNumber,
    required String vehicleNumber,
    required DateTime expectedArrival,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/visitors/pre-register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'residentId': residentId,
          'visitorName': visitorName.trim(),
          'phoneNumber': phoneNumber.trim(),
          'vehicleNumber': vehicleNumber.trim(),
          'expectedArrival': expectedArrival.toIso8601String(),
        }),
      );

      debugPrint('PRE-REGISTER STATUS: ${response.statusCode}');
      debugPrint('PRE-REGISTER RESPONSE: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {
          'success': true,
          'accessCode': decoded['accessCode'] ?? decoded['AccessCode'],
          'message': decoded['message'] ?? 'Visitor pass pre-registered successfully!',
        };
      }

      String errorMsg = 'Failed to register visitor pass';
      if (response.body.isNotEmpty) {
        try {
          final decoded = jsonDecode(response.body);
          if (decoded is Map && decoded['message'] != null) {
            errorMsg = decoded['message'];
          }
        } catch (_) {}
      }

      return {'success': false, 'message': errorMsg};
    } catch (e) {
      debugPrint('PRE-REGISTER ERROR: $e');
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }
}
