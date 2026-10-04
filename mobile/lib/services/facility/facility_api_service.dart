import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../auth/auth_service.dart';

import '../api_config.dart';

class FacilityApiService {
  static String get baseUrl => ApiConfig.baseUrl;
  static const Duration timeoutDuration = Duration(seconds: 10);

  // GET ALL FACILITIES
  static Future<Map<String, dynamic>> getFacilities() async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/facilities'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(timeoutDuration);

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
      return {'success': false, 'message': 'Cannot connect to server (Timeout or Network Error)'};
    }
  }

  // GET ALL BOOKINGS FOR RESIDENT
  static Future<Map<String, dynamic>> getBookings([int? residentId]) async {
    try {
      final session = AuthService.currentSession;
      final targetResidentId = residentId ?? session?.residentId;
      final uri = targetResidentId != null && targetResidentId > 0
          ? Uri.parse('$baseUrl/bookings?residentId=$targetResidentId')
          : Uri.parse('$baseUrl/bookings');

      final response = await http
          .get(
            uri,
            headers: await AuthService.authHeaders(),
          )
          .timeout(timeoutDuration);

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
      return {'success': false, 'message': 'Cannot connect to server (Timeout or Network Error)'};
    }
  }

  // GET BOOKINGS FOR SPECIFIC FACILITY
  static Future<Map<String, dynamic>> getBookingsForFacility(int facilityId) async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/bookings/facility/$facilityId'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(timeoutDuration);

      debugPrint('GET FACILITY BOOKINGS STATUS: ${response.statusCode}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      }

      return {
        'success': false,
        'message': 'Failed to load facility bookings (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('GET FACILITY BOOKINGS ERROR: $e');
      return {'success': false, 'message': 'Cannot connect to server (Timeout or Network Error)'};
    }
  }

  // CREATE A FACILITY BOOKING
  static Future<Map<String, dynamic>> createBooking({
    required int facilityId,
    required int residentId,
    required DateTime bookingDate,
    required String startTime,
    required String endTime,
    int bookedCapacity = 1,
    double totalCost = 0.0,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/bookings'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'facilityId': facilityId,
              'residentId': residentId,
              'bookingDate': bookingDate.toIso8601String(),
              'startTime': startTime,
              'endTime': endTime,
              'bookedCapacity': bookedCapacity,
              'totalCost': totalCost,
            }),
          )
          .timeout(timeoutDuration);

      debugPrint('CREATE BOOKING STATUS: ${response.statusCode}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'message': 'Booking request submitted!'};
      }

      String errorMsg = 'Failed to submit booking';
      if (response.body.isNotEmpty) {
        try {
          final decoded = jsonDecode(response.body);
          if (decoded is Map) {
            if (decoded['message'] != null) {
              errorMsg = decoded['message'].toString();
            } else if (decoded['Message'] != null) {
              errorMsg = decoded['Message'].toString();
            } else if (decoded['title'] != null) {
              errorMsg = decoded['title'].toString();
            } else {
              errorMsg = response.body;
            }
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
      return {'success': false, 'message': 'Cannot connect to server (Timeout or Network Error)'};
    }
  }

  // CANCEL / DELETE A BOOKING
  static Future<Map<String, dynamic>> cancelBooking(int bookingId) async {
    try {
      final response = await http
          .delete(
            Uri.parse('$baseUrl/bookings/$bookingId'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(timeoutDuration);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'message': 'Booking cancelled successfully!'};
      }

      return {
        'success': false,
        'message': 'Failed to cancel booking (${response.statusCode})',
      };
    } catch (e) {
      return {'success': false, 'message': 'Cannot connect to server (Timeout or Network Error)'};
    }
  }

  // PLAN AGENTIC WORKFLOW (Resident Mobile AI)
  static Future<Map<String, dynamic>> planAgenticWorkflow({
    required String objective,
    int residentId = 1,
    String residentName = 'Kamal Perera (A-101)',
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/workflows/plan-facility-parking'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'objective': objective,
              'residentId': residentId,
              'residentName': residentName,
            }),
          )
          .timeout(const Duration(seconds: 35));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      }
      return {'success': false, 'message': 'Failed to execute AI workflow (${response.statusCode})'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // APPROVE AGENTIC WORKFLOW (Resident High-Impact Confirmation)
  static Future<Map<String, dynamic>> approveAgenticWorkflow(int workflowId) async {
    try {
      final response = await http
          .put(
            Uri.parse('$baseUrl/workflows/$workflowId/approve'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      }
      return {'success': false, 'message': 'Failed to approve workflow'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
}
