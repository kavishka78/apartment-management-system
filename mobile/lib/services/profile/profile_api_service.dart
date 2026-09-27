import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/profile/profile_models.dart';
import '../auth/auth_service.dart';

class ProfileApiService {
  static const String _base = 'http://10.0.2.2:5073/api/v1';

  /// Get the current resident's full profile details
  static Future<ResidentProfileModel?> getProfile(int residentId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.get(
        Uri.parse('$_base/resident/profile/$residentId'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return ResidentProfileModel.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Update resident's contact / emergency information
  static Future<bool> updateProfile(
    int residentId, {
    required String fullName,
    required String phoneNumber,
    required String emergencyContact,
  }) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.put(
        Uri.parse('$_base/resident/profile/$residentId'),
        headers: headers,
        body: jsonEncode({
          'fullName': fullName,
          'phoneNumber': phoneNumber,
          'emergencyContact': emergencyContact,
        }),
      ).timeout(const Duration(seconds: 12));

      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Fetch all household members for a resident
  static Future<List<HouseholdMemberModel>> getHouseholdMembers(int residentId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.get(
        Uri.parse('$_base/resident/$residentId/household'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List<dynamic>;
        return list.map((m) => HouseholdMemberModel.fromJson(m)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /// Add a new family / household member
  static Future<HouseholdMemberModel?> addHouseholdMember(
    int residentId, {
    required String name,
    required String relation,
    required String age,
  }) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.post(
        Uri.parse('$_base/resident/$residentId/household'),
        headers: headers,
        body: jsonEncode({
          'name': name,
          'relation': relation,
          'age': age,
        }),
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        return HouseholdMemberModel.fromJson(jsonDecode(res.body));
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Remove a family member
  static Future<bool> removeHouseholdMember(int residentId, int memberId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.delete(
        Uri.parse('$_base/resident/$residentId/household/$memberId'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
