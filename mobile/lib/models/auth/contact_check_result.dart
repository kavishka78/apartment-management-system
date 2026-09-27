/// Result returned by the backend when we check whether a phone/email
/// is registered with any apartment complex in the system.
class ContactCheckResult {
  /// Whether the contact (phone or email) was found in the Residents table.
  final bool found;

  /// Resident's display name (shown as a greeting on the OTP screen).
  final String name;

  /// The unit the resident belongs to, e.g. "4B".
  final String unitNumber;

  /// The complex / apartment building name, e.g. "Lotus Tower".
  final String complexName;

  /// Resident's ID (used internally when exchanging Firebase token).
  final int residentId;

  /// Which contact method was used: "phone" or "email".
  final String entryMethod;

  const ContactCheckResult({
    required this.found,
    this.name = '',
    this.unitNumber = '',
    this.complexName = '',
    this.residentId = 0,
    this.entryMethod = '',
  });

  factory ContactCheckResult.fromJson(Map<String, dynamic> json) {
    return ContactCheckResult(
      found: json['found'] as bool? ?? false,
      name: json['name'] as String? ?? '',
      unitNumber: json['unitNumber'] as String? ?? '',
      complexName: json['complexName'] as String? ?? '',
      residentId: json['residentId'] as int? ?? 0,
      entryMethod: json['entryMethod'] as String? ?? '',
    );
  }

  /// Shortcut for a "not found" result.
  factory ContactCheckResult.notFound() =>
      const ContactCheckResult(found: false);
}
