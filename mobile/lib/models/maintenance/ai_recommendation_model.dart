import 'dart:convert';
class AgentStep {
  final int sequence;
  final String agentRole;
  final String action;
  final String status;
  final String toolName;
  final String inputSummary;
  final String outputSummary;
  final String validationResult;
  final int durationMilliseconds;

  AgentStep({
    required this.sequence,
    required this.agentRole,
    required this.action,
    required this.status,
    required this.toolName,
    required this.inputSummary,
    required this.outputSummary,
    required this.validationResult,
    required this.durationMilliseconds,
  });

  factory AgentStep.fromJson(Map<String, dynamic> json) {
    return AgentStep(
      sequence: json['sequence'] as int? ?? 0,
      agentRole: json['agentRole'] ?? '',
      action: json['action'] ?? '',
      status: json['status'] ?? '',
      toolName: json['toolName'] ?? '',
      inputSummary: json['inputSummary'] ?? '',
      outputSummary: json['outputSummary'] ?? '',
      validationResult: json['validationResult'] ?? '',
      durationMilliseconds: json['durationMilliseconds'] as int? ?? 0,
    );
  }
}

class AiRecommendation {
  final String category;
  final String priority;
  final String reason;
  final int? recommendedTechnicianId;
  final String technicianReason;
  final String slaRisk;
  final String slaReason;
  final List<String> plan;
  final List<String> completedSteps;
  final String toolResults;
  final String validationResults;
  final List<AgentStep> agentSteps;
  final int? workflowId;

  AiRecommendation({
    required this.category,
    required this.priority,
    required this.reason,
    this.recommendedTechnicianId,
    required this.technicianReason,
    required this.slaRisk,
    required this.slaReason,
    required this.plan,
    required this.completedSteps,
    required this.toolResults,
    required this.validationResults,
    required this.agentSteps,
    this.workflowId,
  });

  static List<String> _parseList(dynamic value) {
    if (value == null) return [];
    if (value is List) return value.map((e) => e.toString()).toList();
    if (value is String) {
      if (value.trim().startsWith('[')) {
        try {

          final parsed = jsonDecode(value);
          if (parsed is List) return parsed.map((e) => e.toString()).toList();
        } catch (_) {}
      }
      return [value];
    }
    return [];
  }

  factory AiRecommendation.fromJson(Map<String, dynamic> json) {
    return AiRecommendation(
      category: json['category'] ?? '',
      priority: json['priority'] ?? '',
      reason: json['reason'] ?? '',
      recommendedTechnicianId: json['recommendedTechnicianId'] as int?,
      technicianReason: json['technicianReason'] ?? '',
      slaRisk: json['slaRisk'] ?? '',
      slaReason: json['slaReason'] ?? '',
      plan: _parseList(json['plan']),
      completedSteps: _parseList(json['completedSteps']),
      toolResults: json['toolResults'] ?? '',
      validationResults: json['validationResults'] ?? '',
      agentSteps: (json['steps'] as List? ?? json['agentSteps'] as List?)
              ?.map((e) => AgentStep.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      workflowId: json['workflowId'] ?? json['id'] as int?,
    );
  }
}
