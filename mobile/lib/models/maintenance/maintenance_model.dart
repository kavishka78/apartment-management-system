class MaintenanceCategory {
  final int id;
  final String name;

  MaintenanceCategory({required this.id, required this.name});

  factory MaintenanceCategory.fromJson(Map<String, dynamic> json) {
    return MaintenanceCategory(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}

class TechnicianInfo {
  final int id;
  final String name;
  final String skills;
  final String status;

  TechnicianInfo({
    required this.id,
    required this.name,
    required this.skills,
    required this.status,
  });

  factory TechnicianInfo.fromJson(Map<String, dynamic> json) {
    return TechnicianInfo(
      id: json['id'] as int,
      name: json['name'] ?? '',
      skills: json['skills'] ?? '',
      status: json['status'] ?? '',
    );
  }
}

class MaintenanceHistoryEntry {
  final int id;
  final String status;
  final String note;
  final String changedBy;
  final DateTime createdAt;

  MaintenanceHistoryEntry({
    required this.id,
    required this.status,
    required this.note,
    required this.changedBy,
    required this.createdAt,
  });

  factory MaintenanceHistoryEntry.fromJson(Map<String, dynamic> json) {
    return MaintenanceHistoryEntry(
      id: json['id'] as int,
      status: json['status'] ?? '',
      note: json['note'] ?? '',
      changedBy: json['changedBy'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class MaintenanceTicket {
  final int id;
  final int residentId;
  final MaintenanceCategory? category;
  final String title;
  final String description;
  final String priority;
  final String status;
  final TechnicianInfo? technician;
  final double repairCost;
  final DateTime? slaDueDate;
  final String slaStatus;
  final bool residentVerified;
  final String? photoPath;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<MaintenanceHistoryEntry> history;

  MaintenanceTicket({
    required this.id,
    required this.residentId,
    this.category,
    required this.title,
    required this.description,
    required this.priority,
    required this.status,
    this.technician,
    required this.repairCost,
    this.slaDueDate,
    required this.slaStatus,
    required this.residentVerified,
    this.photoPath,
    required this.createdAt,
    required this.updatedAt,
    required this.history,
  });

  factory MaintenanceTicket.fromJson(Map<String, dynamic> json) {
    return MaintenanceTicket(
      id: json['id'] as int,
      residentId: json['residentId'] as int,
      category: json['category'] != null
          ? MaintenanceCategory.fromJson(json['category'])
          : null,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      priority: json['priority'] ?? 'Low',
      status: json['status'] ?? 'Pending',
      technician: json['technician'] != null
          ? TechnicianInfo.fromJson(json['technician'])
          : null,
      repairCost: json['repairCost'] != null ? double.tryParse(json['repairCost'].toString()) ?? 0.0 : 0.0,
      slaDueDate: json['slaDueDate'] != null
          ? DateTime.parse(json['slaDueDate'])
          : null,
      slaStatus: json['slaStatus'] ?? 'Normal',
      residentVerified: json['residentVerified'] ?? false,
      photoPath: json['photoPath'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      history: (json['history'] as List?)
              ?.map((e) => MaintenanceHistoryEntry.fromJson(e))
              .toList() ??
          [],
    );
  }
}
