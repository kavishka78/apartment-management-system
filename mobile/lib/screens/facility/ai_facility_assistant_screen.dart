import 'dart:convert';

import 'package:flutter/material.dart';

import '../../services/facility/facility_api_service.dart';

class AiFacilityAssistantScreen extends StatefulWidget {
  const AiFacilityAssistantScreen({super.key});

  @override
  State<AiFacilityAssistantScreen> createState() =>
      _AiFacilityAssistantScreenState();
}

class _AiFacilityAssistantScreenState extends State<AiFacilityAssistantScreen> {
  final TextEditingController _promptController = TextEditingController(
    text: "Enter your Request",
  );

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

    final res = await FacilityApiService.planAgenticWorkflow(
      objective: text,
      residentId: 1,
      residentName: 'Kamal Perera (A-101)',
    );

    if (mounted) {
      setState(() {
        _isProcessing = false;
        if (res['success'] == true) {
          _workflowData = res['data']?['workflow'];
          final bool requiresApproval =
              _workflowData?['requiresApproval'] ?? true;
          final String status = _workflowData?['status'] ?? '';

          Map<String, dynamic>? proposal;
          try {
            if (_workflowData?['proposalJson'] != null) {
              proposal = jsonDecode(_workflowData!['proposalJson']);
            }
          } catch (_) {}

          final bool isInquiry =
              proposal?['isInquiry'] == true || status == 'InquiryAnswered';

          if (isInquiry) {
            _successMessage =
                proposal?['answer'] ??
                _workflowData?['validationStatus'] ??
                'Inquiry Answered by AI Agent.';
          } else if (!requiresApproval || status == 'AutoApproved') {
            _successMessage = "Standard Request Auto-Approved! Facility spot and visitor parking allocated in database.";
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
          _successMessage = "Event Approved! passes issued.";
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
    List<dynamic> planSteps = [];
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
        if (_workflowData!['planJson'] != null) {
          planSteps = jsonDecode(_workflowData!['planJson']);
        }
        if (_workflowData!['proposalJson'] != null) {
          proposal = jsonDecode(_workflowData!['proposalJson']);
        }
      } catch (_) {}
    }

    final bool isFailed =
        validationStatus.startsWith("Failed") ||
        validationStatus.startsWith("Rejected");
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
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

              // Agent Execution Plan
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "Agent Execution Plan",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isFailed
                                ? const Color(0xFFFEF2F2)
                                : isApproved
                                ? const Color(0xFFECFDF5)
                                : const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            isFailed
                                ? "Validation Failed"
                                : isApproved
                                ? "Confirmed"
                                : "Approval Needed",
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isFailed
                                  ? const Color(0xFF991B1B)
                                  : isApproved
                                  ? const Color(0xFF065F46)
                                  : const Color(0xFFB45309),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ...planSteps.asMap().entries.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 9,
                              backgroundColor: const Color(0xFFEEF2FF),
                              child: Text(
                                "${entry.key + 1}",
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF4F46E5),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                entry.value.toString(),
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: Color(0xFF334155),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // AI Proposal Summary or Inquiry Answer Box
              if (proposal != null && !isFailed) ...[
                if (isInquiry)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Information Answer",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Color(0xFF1E40AF),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          proposal['answer'] ?? validationStatus,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF1E3A8A),
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          "Note: No facility booking was created for this inquiry question.",
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF3B82F6),
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  )
                else
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

                        const SizedBox(height: 14),

                        if (requiresApproval &&
                            !isApproved &&
                            workflowId != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color(0xFFFDE68A),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "Resident High-Impact Confirmation Required",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5,
                                    color: Color(0xFFB45309),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  "This request exceeds 10 guests or 2 visitor vehicles. Please confirm to execute your booking.",
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
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
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
