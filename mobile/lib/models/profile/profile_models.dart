/// Household member residing with the primary resident
class HouseholdMemberModel {
  final int id;
  final int residentId;
  final String name;
  final String relation;
  final String age;

  const HouseholdMemberModel({
    required this.id,
    required this.residentId,
    required this.name,
    required this.relation,
    required this.age,
  });

  factory HouseholdMemberModel.fromJson(Map<String, dynamic> json) {
    return HouseholdMemberModel(
      id: json['id'] as int? ?? 0,
      residentId: json['residentId'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      relation: json['relation'] as String? ?? '',
      age: json['age']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'residentId': residentId,
        'name': name,
        'relation': relation,
        'age': age,
      };
}

/// Full resident profile information
class ResidentProfileModel {
  final int id;
  final int tenantId;
  final String fullName;
  final String email;
  final String phoneNumber;
  final String nationalId;
  final String unitNumber;
  final String status;
  final String? emergencyContact;
  final String? moveInDate;
  final int vehiclesCount;
  final int staffCount;
  final List<HouseholdMemberModel> householdMembers;

  const ResidentProfileModel({
    required this.id,
    required this.tenantId,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.nationalId,
    required this.unitNumber,
    required this.status,
    this.emergencyContact,
    this.moveInDate,
    required this.vehiclesCount,
    required this.staffCount,
    required this.householdMembers,
  });

  factory ResidentProfileModel.fromJson(Map<String, dynamic> json) {
    var membersList = <HouseholdMemberModel>[];
    if (json['householdMembers'] != null && json['householdMembers'] is List) {
      membersList = (json['householdMembers'] as List)
          .map((m) => HouseholdMemberModel.fromJson(m as Map<String, dynamic>))
          .toList();
    }

    return ResidentProfileModel(
      id: json['id'] as int? ?? 0,
      tenantId: json['tenantId'] as int? ?? 0,
      fullName: json['fullName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      nationalId: json['nationalId'] as String? ?? '',
      unitNumber: json['unitNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'Active',
      emergencyContact: json['emergencyContact'] as String?,
      moveInDate: json['moveInDate'] as String?,
      vehiclesCount: json['vehiclesCount'] as int? ?? 0,
      staffCount: json['staffCount'] as int? ?? 0,
      householdMembers: membersList,
    );
  }
}
