import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';

import '../api_config.dart';

class MaintenanceApiService {
  static String get baseUrl => ApiConfig.baseUrl;

  // Helper method for error handling consistency
  static Map<String, dynamic> _handleError(
    http.Response? response,
    dynamic e,
    String defaultMessage,
  ) {
    if (e != null) {
      debugPrint('MAINTENANCE API ERROR: $e');
      return {
        'success': false,
        'message': 'Cannot reach the maintenance server. Check the API URL and connection.',
      };
    }

    if (response?.statusCode == 401) {
      return {'success': false, 'message': 'Session expired. Please sign in again (HTTP 401).'};
    }
    if (response?.statusCode == 403) {
      return {'success': false, 'message': 'Your account cannot access maintenance (HTTP 403).'};
    }

    String errorMessage = defaultMessage;
    if (response != null && response.body.isNotEmpty) {
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          errorMessage =
              decoded['message'] ??
              decoded['title'] ??
              decoded['errors']?.toString() ??
              defaultMessage;
        } else {
          errorMessage = response.body;
        }
      } catch (_) {
        errorMessage = response.body;
      }
    }
    if (response != null) errorMessage = '$errorMessage (HTTP ${response.statusCode})';
    return {'success': false, 'message': errorMessage};
  }

  // =========================================================
  // GET ALL COMPLAINTS (Supports filtering)
  // =========================================================
  static Future<Map<String, dynamic>> getComplaints() async {
    try {
      final session = await AuthService.getSession();
      if (session == null) {
        return {
          'success': false,
          'message': 'Please sign in to view your complaints.',
        };
      }
      final response = await http.get(
        Uri.parse('$baseUrl/maintenance'),
        headers: await AuthService.authHeaders(),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> decoded = jsonDecode(response.body);

        final filtered = decoded
            .where((item) => item['residentId'] == session.residentId)
            .toList();

        return {'success': true, 'data': filtered};
      }
      return _handleError(response, null, 'Failed to load complaints');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }

  // =========================================================
  // GET SINGLE COMPLAINT BY ID
  // =========================================================
  static Future<Map<String, dynamic>> getComplaintById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/maintenance/$id'),
        headers: await AuthService.authHeaders(),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }
      return _handleError(response, null, 'Failed to load complaint details');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }

  // =========================================================
  // GET CATEGORIES
  // =========================================================
  static Future<Map<String, dynamic>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/maintenance/categories'),
        headers: await AuthService.authHeaders(),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }
      return _handleError(response, null, 'Failed to load categories');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }

  // =========================================================
  // CREATE COMPLAINT
  // =========================================================
  static Future<Map<String, dynamic>> createComplaint({
    required int residentId,
    required int categoryId,
    required String title,
    required String description,
    required String priority,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/maintenance'),
        headers: await AuthService.authHeaders(),
        body: jsonEncode({
          'residentId': residentId,
          'categoryId': categoryId,
          'title': title,
          'description': description,
          'priority': priority,
        }),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }
      return _handleError(response, null, 'Failed to create complaint');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }

  // =========================================================
  // UPLOAD PHOTO
  // =========================================================
  static Future<Map<String, dynamic>> uploadPhoto(
    int maintenanceId,
    String filePath,
  ) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/maintenance/$maintenanceId/photo'),
      );
      final token = await AuthService.getToken();
      if (token.isNotEmpty) request.headers['Authorization'] = 'Bearer $token';

      request.files.add(await http.MultipartFile.fromPath('file', filePath));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Backend returns plain text URL or JSON object. We wrap it nicely.
        return {'success': true, 'data': response.body};
      }
      return _handleError(response, null, 'Failed to upload photo');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }

  // =========================================================
  // GET AI RECOMMENDATION (TRIAGE STATUS)
  // =========================================================
  static Future<Map<String, dynamic>> getWorkflowSummary(
    int maintenanceId,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/maintenance/$maintenanceId/workflows/latest'),
        headers: await AuthService.authHeaders(),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else if (response.statusCode == 404) {
        return {'success': true, 'data': null}; // No workflow yet
      }
      return _handleError(response, null, 'Failed to load AI triage status');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }

  // =========================================================
  // VERIFY RESOLUTION
  // =========================================================
  static Future<Map<String, dynamic>> verifyResolution(
    int maintenanceId,
    bool isApproved,
    String? note,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/maintenance/$maintenanceId/verify'),
        headers: await AuthService.authHeaders(),
        body: jsonEncode({'isApproved': isApproved, 'note': note}),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }
      return _handleError(response, null, 'Failed to verify resolution');
    } catch (e) {
      return _handleError(null, e, '');
    }
  }
}
