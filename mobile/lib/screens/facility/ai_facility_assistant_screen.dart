import 'dart:convert';

import 'package:flutter/material.dart';

import '../../services/facility/facility_api_service.dart';
import '../../services/auth/auth_service.dart';

class AiFacilityAssistantScreen extends StatefulWidget {
  const AiFacilityAssistantScreen({super.key});

  @override
  State<AiFacilityAssistantScreen> createState() =>
      _AiFacilityAssistantScreenState();
}

class _AiFacilityAssistantScreenState extends State<AiFacilityAssistantScreen> {
  final TextEditingController _promptController = TextEditingController();

  bool _isProcessing = false;
  bool _isApproving = false;
  Map<String, dynamic>? _workflowData;
  String? _errorMessage;
  String? _successMessage;

  Future<void> _submitAiRequest() async {
    final text = _promptController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
      _successMessage = null;
      _workflowData = null;
    });

    final session = await AuthService.getSession();
    final residentId = (session != null && session.residentId > 0)
        ? session.residentId
        : 1;
    final residentName = session?.name.isNotEmpty == true
        ? session!.name
        : 'Kamal Perera (A-101)';

    final res = await FacilityApiService.planAgenticWorkflow(
      objective: text,
      residentId: residentId,
      residentName: residentName,
    );

    if (mounted) {
      setState(() {
        _isProcessing = false;
        if (res['success'] == true) {
          _workflowData = res['data']?['workflow'];
          final bool requiresApproval =
              _workflowData?['requiresApproval'] ?? true;
          final String status = _workflowData?['status'] ?? '';
          final String valStatus = _workflowData?['validationStatus'] ?? '';

          Map<String, dynamic>? proposal;
          try {
            if (_workflowData?['proposalJson'] != null) {
              proposal = jsonDecode(_workflowData!['proposalJson']);
            }
          } catch (_) {}

          final bool isInquiry =
              proposal?['isInquiry'] == true || status == 'InquiryAnswered';

          final bool isFailed =
              status == 'Failed' ||
              valStatus.startsWith("Failed") ||
              valStatus.startsWith("Rejected") ||
              valStatus.contains("outside operating hours") ||
              valStatus.contains("closed") ||
              valStatus.contains("inactive");

          if (isFailed) {
            _errorMessage = valStatus.isNotEmpty
                ? valStatus.replaceAll("Rejected: ", "")
                : "Facility is not available within that time period.";
            _successMessage = null;
          } else if (isInquiry) {
            _successMessage =
                proposal?['answer'] ??
                valStatus ??
                'Inquiry Answered by AI Agent.';
          } else if (status == 'AutoApproved') {
            _successMessage = "Standard Request Auto-Approved! Facility spot and visitor parking allocated in database.";
          } else if (requiresApproval) {
            _successMessage =
                "Proposal ready. Review and confirm your booking.";
          } else {
            _successMessage = null;
          }
        } else {
          _errorMessage = res['message'] ?? 'AI Workflow Execution Failed';
        }
      });
    }
  }

  Future<void> _approveHighImpactRequest(int workflowId) async {
    setState(() {
      _isApproving = true;
      _errorMessage = null;
    });

    final res = await FacilityApiService.approveAgenticWorkflow(workflowId);

    if (mounted) {
      setState(() {
        _isApproving = false;
        if (res['success'] == true) {
          _successMessage = "Event Approved! Passes issued.";
          if (_workflowData != null) {
            _workflowData!['status'] = 'Approved';
          }
        } else {
          _errorMessage = res['message'] ?? 'Failed to approve workflow';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic>? proposal;
    String validationStatus = '';
    bool requiresApproval = false;
    int? workflowId;
    String currentStatus = '';

    if (_workflowData != null) {
      workflowId = _workflowData!['id'];
      currentStatus = _workflowData!['status'] ?? '';
      validationStatus = _workflowData!['validationStatus'] ?? '';
      requiresApproval = _workflowData!['requiresApproval'] ?? false;

      try {
        if (_workflowData!['proposalJson'] != null) {
          proposal = jsonDecode(_workflowData!['proposalJson']);
        }
      } catch (_) {}
    }

    final bool isFailed =
        currentStatus == 'Failed' ||
        validationStatus.startsWith("Failed") ||
        validationStatus.startsWith("Rejected") ||
        validationStatus.contains("outside operating hours") ||
        validationStatus.contains("closed") ||
        validationStatus.contains("inactive");
    final bool isApproved =
        currentStatus == 'Approved' || currentStatus == 'AutoApproved';
    final bool isInquiry =
        proposal?['isInquiry'] == true || currentStatus == 'InquiryAnswered';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          "Resident Agentic AI Assistant",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text(
                "Smart Facility & Parking Assistant",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Prompt Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Your Booking Request",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _promptController,
                    maxLines: 3,
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: Color(0xFF1E293B),
                    ),
                    decoration: InputDecoration(
                      hintText: "e.g. Reserve Clubhouse for 8 guests and 2 parking slots this Saturday...",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: _isProcessing ? null : _submitAiRequest,
                      icon: _isProcessing
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.auto_awesome, size: 18),
                      label: Text(
                        _isProcessing
                            ? "Agent Pipeline Running..."
                            : "Submit AI Request",
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        shape: const StadiumBorder(),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Color(0xFFDC2626),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Color(0xFF991B1B),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (_successMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      color: Color(0xFF059669),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _successMessage!,
                        style: const TextStyle(
                          color: Color(0xFF065F46),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (_workflowData != null) ...[
              const SizedBox(height: 16),

              // AI Proposal Summary or Inquiry Answer Box
              if (proposal != null && !isFailed && !isInquiry) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: requiresApproval && !isApproved
                          ? const Color(0xFFFDE68A)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "AI Staged Proposal",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "Facility: ${proposal['facilityName'] ?? '—'}",
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF334155),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Date & Time: ${proposal['date']} (${proposal['startTime']} - ${proposal['endTime']})",
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF334155),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Guests: ${proposal['guests']} Attendees",
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF334155),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Parking Passes: ${proposal['visitorVehicles']} Slots (${(proposal['assignedParkingSlots'] as List?)?.join(', ') ?? 'Auto'})",
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF334155),
                        ),
                      ),
                      if (proposal['estimatedTotalCost'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          "Estimated Cost: LKR ${(proposal['estimatedTotalCost'] as num).toStringAsFixed(2)}",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color:
                                (proposal['estimatedTotalCost'] as num) > 3000
                                ? const Color(0xFFB45309)
                                : const Color(0xFF047857),
                          ),
                        ),
                      ],

                      const SizedBox(height: 14),

                      if (requiresApproval &&
                          !isApproved &&
                          workflowId != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFDE68A)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "Booking Confirmation Required",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12.5,
                                  color: Color(0xFFB45309),
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                "Review the date, guest count, parking and cost before confirming your booking.",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF92400E),
                                ),
                              ),
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                height: 40,
                                child: ElevatedButton(
                                  onPressed: _isApproving
                                      ? null
                                      : () => _approveHighImpactRequest(
                                          workflowId!,
                                        ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    shape: const StadiumBorder(),
                                    elevation: 0,
                                  ),
                                  child: _isApproving
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text(
                                          "Approve & Confirm AI Booking",
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
