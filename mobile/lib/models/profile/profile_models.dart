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

/// Permanent resident vehicle registered to an apartment unit
class ResidentVehicleModel {
  final int id;
  final int tenantId;
  final int residentId;
  final String residentName;
  final String unitNumber;
  final String plateNumber;
  final String vehicleType;
  final String makeModel;
  final String? parkingSlot;
  final String registeredAt;
  final String status;

  const ResidentVehicleModel({
    required this.id,
    required this.tenantId,
    required this.residentId,
    required this.residentName,
    required this.unitNumber,
    required this.plateNumber,
    required this.vehicleType,
    required this.makeModel,
    this.parkingSlot,
    required this.registeredAt,
    required this.status,
  });

  factory ResidentVehicleModel.fromJson(Map<String, dynamic> json) {
    return ResidentVehicleModel(
      id: json['id'] as int? ?? 0,
      tenantId: json['tenantId'] as int? ?? 0,
      residentId: json['residentId'] as int? ?? 0,
      residentName: json['residentName'] as String? ?? '',
      unitNumber: json['unitNumber'] as String? ?? '',
      plateNumber: json['plateNumber'] as String? ?? '',
      vehicleType: json['vehicleType'] as String? ?? 'Car',
      makeModel: json['makeModel'] as String? ?? '',
      parkingSlot: json['parkingSlot'] as String?,
      registeredAt: json['registeredAt'] as String? ?? '',
      status: json['status'] as String? ?? 'Approved',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tenantId': tenantId,
        'residentId': residentId,
        'residentName': residentName,
        'unitNumber': unitNumber,
        'plateNumber': plateNumber,
        'vehicleType': vehicleType,
        'makeModel': makeModel,
        'parkingSlot': parkingSlot,
        'registeredAt': registeredAt,
        'status': status,
      };
}

/// Domestic staff (driver, maid, cleaner, etc.) with gate access pass
class DomesticStaffModel {
  final int id;
  final int tenantId;
  final int residentId;
  final String residentName;
  final String unitNumber;
  final String fullName;
  final String staffType;
  final String nicNumber;
  final String contactPhone;
  final String accessPassCode;
  final String workingHours;
  final bool isActive;

  const DomesticStaffModel({
    required this.id,
    required this.tenantId,
    required this.residentId,
    required this.residentName,
    required this.unitNumber,
    required this.fullName,
    required this.staffType,
    required this.nicNumber,
    required this.contactPhone,
    required this.accessPassCode,
    required this.workingHours,
    required this.isActive,
  });

  factory DomesticStaffModel.fromJson(Map<String, dynamic> json) {
    return DomesticStaffModel(
      id: json['id'] as int? ?? 0,
      tenantId: json['tenantId'] as int? ?? 0,
      residentId: json['residentId'] as int? ?? 0,
      residentName: json['residentName'] as String? ?? '',
      unitNumber: json['unitNumber'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      staffType: json['staffType'] as String? ?? 'Helper',
      nicNumber: json['nicNumber'] as String? ?? '',
      contactPhone: json['contactPhone'] as String? ?? '',
      accessPassCode: json['accessPassCode'] as String? ?? '',
      workingHours: json['workingHours'] as String? ?? 'Daily 8AM-5PM',
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tenantId': tenantId,
        'residentId': residentId,
        'residentName': residentName,
        'unitNumber': unitNumber,
        'fullName': fullName,
        'staffType': staffType,
        'nicNumber': nicNumber,
        'contactPhone': contactPhone,
        'accessPassCode': accessPassCode,
        'workingHours': workingHours,
        'isActive': isActive,
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
