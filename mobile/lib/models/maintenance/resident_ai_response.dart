class DraftComplaint {
  final String title;
  final String description;
  final int categoryId;

  DraftComplaint({required this.title, required this.description, required this.categoryId});

  factory DraftComplaint.fromJson(Map<String, dynamic> json) {
    return DraftComplaint(
      title: json['title'] ?? json['Title'] ?? '',
      description: json['description'] ?? json['Description'] ?? '',
      categoryId: json['categoryId'] ?? json['CategoryId'] ?? 4,
    );
  }
}

class ResidentAiResponse {
  final bool success;
  final String status;
  final String reply;
  final DraftComplaint? draftComplaint;
  final String? error;

  ResidentAiResponse({
    required this.success,
    required this.status,
    required this.reply,
    this.draftComplaint,
    this.error,
  });

  factory ResidentAiResponse.fromJson(Map<String, dynamic> json) {
    
    // Safely extract draft complaint regardless of C# serialization settings
    final draftJson = json['draftComplaint'] ?? json['DraftComplaint'] ?? json['draft_complaint'];
    
    return ResidentAiResponse(
      success: json['success'] ?? json['Success'] ?? false,
      status: json['status'] ?? json['Status'] ?? 'error',
      reply: json['reply'] ?? json['Reply'] ?? '',
      draftComplaint: draftJson != null ? DraftComplaint.fromJson(draftJson) : null,
      error: json['error'] ?? json['Error'],
    );
  }
}
