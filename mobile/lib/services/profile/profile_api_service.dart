import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/profile/profile_models.dart';
import '../api_config.dart';
import '../auth/auth_service.dart';

class ProfileApiService {
  static String get _base => ApiConfig.v1Url;

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

  // ── Household Members ───────────────────────────────────────────────────────

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

  // ── Vehicles ───────────────────────────────────────────────────────────────

  static Future<List<ResidentVehicleModel>> getVehicles(int residentId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.get(
        Uri.parse('$_base/resident/$residentId/vehicles'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List<dynamic>;
        return list.map((v) => ResidentVehicleModel.fromJson(v)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<ResidentVehicleModel?> registerVehicle(
    int residentId, {
    required String plateNumber,
    required String vehicleType,
    required String makeModel,
    String? parkingSlot,
  }) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.post(
        Uri.parse('$_base/resident/$residentId/vehicles'),
        headers: headers,
        body: jsonEncode({
          'plateNumber': plateNumber,
          'vehicleType': vehicleType,
          'makeModel': makeModel,
          'parkingSlot': parkingSlot,
        }),
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        return ResidentVehicleModel.fromJson(jsonDecode(res.body));
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<bool> removeVehicle(int residentId, int vehicleId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.delete(
        Uri.parse('$_base/resident/$residentId/vehicles/$vehicleId'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // ── Domestic Staff & Digital Passes ────────────────────────────────────────

  static Future<List<DomesticStaffModel>> getStaff(int residentId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.get(
        Uri.parse('$_base/resident/$residentId/staff'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List<dynamic>;
        return list.map((s) => DomesticStaffModel.fromJson(s)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<DomesticStaffModel?> registerStaff(
    int residentId, {
    required String fullName,
    required String staffType,
    required String contactPhone,
    required String nicNumber,
    required String workingHours,
  }) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.post(
        Uri.parse('$_base/resident/$residentId/staff'),
        headers: headers,
        body: jsonEncode({
          'fullName': fullName,
          'staffType': staffType,
          'contactPhone': contactPhone,
          'nicNumber': nicNumber,
          'workingHours': workingHours,
        }),
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        return DomesticStaffModel.fromJson(jsonDecode(res.body));
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<bool> toggleStaffPass(int staffId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.patch(
        Uri.parse('$_base/resident/staff/$staffId/toggle'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> removeStaff(int residentId, int staffId) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.delete(
        Uri.parse('$_base/resident/$residentId/staff/$staffId'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
