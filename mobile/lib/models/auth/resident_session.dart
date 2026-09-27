/// Represents the logged-in resident's session data stored locally after login.
class ResidentSession {
  final int residentId;
  final String name;
  final String email;
  final String phone;
  final String unitNumber;
  final int tenantId;
  final String token;

  const ResidentSession({
    required this.residentId,
    required this.name,
    required this.email,
    required this.phone,
    required this.unitNumber,
    required this.tenantId,
    required this.token,
  });

  /// Create a ResidentSession from the JSON response returned by the backend
  /// after a successful Firebase token exchange.
  factory ResidentSession.fromJson(Map<String, dynamic> json) {
    final resident = json['resident'] as Map<String, dynamic>;
    return ResidentSession(
      token: json['token'] as String,
      residentId: resident['id'] as int,
      name: resident['fullName'] as String? ?? '',
      email: resident['email'] as String? ?? '',
      phone: resident['phoneNumber'] as String? ?? '',
      unitNumber: resident['unitNumber'] as String? ?? '',
      tenantId: resident['tenantId'] as int,
    );
  }

  /// Serialize to a flat map for SharedPreferences storage.
  Map<String, String> toStorageMap() => {
        'token': token,
        'residentId': residentId.toString(),
        'name': name,
        'email': email,
        'phone': phone,
        'unitNumber': unitNumber,
        'tenantId': tenantId.toString(),
      };

  /// Re-hydrate from SharedPreferences storage map.
  factory ResidentSession.fromStorageMap(Map<String, String?> map) {
    return ResidentSession(
      token: map['token'] ?? '',
      residentId: int.tryParse(map['residentId'] ?? '') ?? 0,
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      unitNumber: map['unitNumber'] ?? '',
      tenantId: int.tryParse(map['tenantId'] ?? '') ?? 0,
    );
  }

  /// Quick validity check — a session is valid if it has a token and a residentId.
  bool get isValid => token.isNotEmpty && residentId > 0;
}
