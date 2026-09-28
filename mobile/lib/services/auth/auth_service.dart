import 'package:shared_preferences/shared_preferences.dart';
import '../../models/auth/resident_session.dart';

/// Manages the resident's local login session.
///
/// Responsibilities:
///   - Persisting the JWT token and resident profile to SharedPreferences.
///   - Providing the current session to any screen in the app.
///   - Clearing the session on logout.
class AuthService {
  // ── SharedPreferences Keys ─────────────────────────────────────────────────
  static const _kToken = 'auth_token';
  static const _kResidentId = 'auth_residentId';
  static const _kName = 'auth_name';
  static const _kEmail = 'auth_email';
  static const _kPhone = 'auth_phone';
  static const _kUnitNumber = 'auth_unitNumber';
  static const _kTenantId = 'auth_tenantId';

  // ── In-memory cache (avoids repeated disk reads in one session) ────────────
  static ResidentSession? _cachedSession;

  // ── Save ───────────────────────────────────────────────────────────────────

  /// Persists a new session after a successful login.
  static Future<void> saveSession(ResidentSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, session.token);
    await prefs.setInt(_kResidentId, session.residentId);
    await prefs.setString(_kName, session.name);
    await prefs.setString(_kEmail, session.email);
    await prefs.setString(_kPhone, session.phone);
    await prefs.setString(_kUnitNumber, session.unitNumber);
    await prefs.setInt(_kTenantId, session.tenantId);
    _cachedSession = session;
  }

  // ── Load ───────────────────────────────────────────────────────────────────

  /// Returns the saved session, or null if the user is not logged in.
  static Future<ResidentSession?> getSession() async {
    if (_cachedSession != null) return _cachedSession;

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_kToken);
    if (token == null || token.isEmpty) return null;

    _cachedSession = ResidentSession(
      token: token,
      residentId: prefs.getInt(_kResidentId) ?? 0,
      name: prefs.getString(_kName) ?? '',
      email: prefs.getString(_kEmail) ?? '',
      phone: prefs.getString(_kPhone) ?? '',
      unitNumber: prefs.getString(_kUnitNumber) ?? '',
      tenantId: prefs.getInt(_kTenantId) ?? 0,
    );

    return _cachedSession!.isValid ? _cachedSession : null;
  }

  // ── Convenience getters ────────────────────────────────────────────────────

  /// Returns true when a valid session exists locally.
  static Future<bool> isLoggedIn() async {
    final session = await getSession();
    return session != null && session.isValid;
  }

  /// Returns the JWT token, or an empty string if not logged in.
  static Future<String> getToken() async {
    final session = await getSession();
    return session?.token ?? '';
  }

  /// Returns the current resident's session synchronously from cache.
  /// Returns null if the cache has not been loaded yet.
  static ResidentSession? get currentSession => _cachedSession;

  // ── Clear / Logout ─────────────────────────────────────────────────────────

  /// Clears all stored session data (logout).
  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
    await prefs.remove(_kResidentId);
    await prefs.remove(_kName);
    await prefs.remove(_kEmail);
    await prefs.remove(_kPhone);
    await prefs.remove(_kUnitNumber);
    await prefs.remove(_kTenantId);
    _cachedSession = null;
  }

  /// Returns the Authorization header value for API requests.
  static Future<Map<String, String>> authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }
}
