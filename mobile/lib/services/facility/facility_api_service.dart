import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class FacilityApiService {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
  static const String baseUrl = 'http://10.0.2.2:5073/api';

  // =========================================================
  // GET ALL FACILITIES
  // =========================================================
  static Future<Map<String, dynamic>> getFacilities() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/facilities'),
        headers: {'Content-Type': 'application/json'},
      );

      debugPrint('GET FACILITIES STATUS: ${response.statusCode}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      }

      return {
        'success': false,
        'message': 'Failed to load facilities (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('GET FACILITIES ERROR: $e');
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }

  // =========================================================
  // GET ALL BOOKINGS FOR RESIDENT
  // =========================================================
  static Future<Map<String, dynamic>> getBookings() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
      );

      debugPrint('GET BOOKINGS STATUS: ${response.statusCode}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      }

      return {
        'success': false,
        'message': 'Failed to load bookings (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('GET BOOKINGS ERROR: $e');
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }

  // =========================================================
  // CREATE A FACILITY BOOKING
  // =========================================================
  static Future<Map<String, dynamic>> createBooking({
    required int facilityId,
    required int residentId,
    required DateTime bookingDate,
    required String startTime, // Format "HH:mm:ss"
    required String endTime,   // Format "HH:mm:ss"
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'facilityId': facilityId,
          'residentId': residentId,
          'bookingDate': bookingDate.toIso8601String(),
          'startTime': startTime,
          'endTime': endTime,
        }),
      );

      debugPrint('CREATE BOOKING STATUS: ${response.statusCode}');
      debugPrint('CREATE BOOKING RESPONSE: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'message': 'Booking request submitted!'};
      }

      String errorMsg = 'Failed to submit booking';
      if (response.body.isNotEmpty) {
        try {
          final decoded = jsonDecode(response.body);
          if (decoded is Map && decoded['title'] != null) {
            errorMsg = decoded['title'];
          } else if (response.body.startsWith('"')) {
            errorMsg = response.body.replaceAll('"', '');
          } else {
            errorMsg = response.body;
          }
        } catch (_) {
          errorMsg = response.body;
        }
      }

      return {'success': false, 'message': errorMsg};
    } catch (e) {
      debugPrint('CREATE BOOKING ERROR: $e');
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }
}
