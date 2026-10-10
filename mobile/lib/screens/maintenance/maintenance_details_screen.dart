import '../../services/api_config.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/maintenance/maintenance_model.dart';
import '../../models/maintenance/ai_recommendation_model.dart';
import '../../services/maintenance/maintenance_api_service.dart';
import '../../widgets/maintenance/maintenance_skeleton.dart';
import 'verify_resolution_screen.dart';

class MaintenanceDetailsScreen extends StatefulWidget {
  final int ticketId;

  const MaintenanceDetailsScreen({super.key, required this.ticketId});

  @override
  State<MaintenanceDetailsScreen> createState() =>
      _MaintenanceDetailsScreenState();
}

class _MaintenanceDetailsScreenState extends State<MaintenanceDetailsScreen> {
  bool _isLoading = true;
  String _error = '';
  MaintenanceTicket? _ticket;
  AiRecommendation? _aiStatus;
  String _aiWorkflowStatus = '';

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final results = await Future.wait([
        MaintenanceApiService.getComplaintById(widget.ticketId),
        MaintenanceApiService.getWorkflowSummary(widget.ticketId),
      ]);

      final ticketRes = results[0];
      final aiRes = results[1];

      if (ticketRes['success'] == true && mounted) {
        setState(() {
          _ticket = MaintenanceTicket.fromJson(ticketRes['data']);

          if (aiRes['success'] == true && aiRes['data'] != null) {
            _aiStatus = AiRecommendation.fromJson(aiRes['data']);
            _aiWorkflowStatus = aiRes['data']['workflowStatus'] ?? '';
          }

          _isLoading = false;
        });
      } else {
        if (mounted) {
          setState(() {
            _error = ticketRes['message'] ?? 'Failed to load ticket';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error parsing ticket: $e';
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color text;
    switch (status) {
      case 'Pending':
        bg = Colors.orange.shade50;
        text = Colors.orange.shade700;
        break;
      case 'In Progress':
        bg = Colors.blue.shade50;
        text = Colors.blue.shade700;
        break;
      case 'Resolved':
        bg = Colors.green.shade50;
        text = Colors.green.shade700;
        break;
      case 'Closed':
        bg = Colors.grey.shade200;
        text = Colors.grey.shade700;
        break;
      default:
        bg = Colors.grey.shade100;
        text = Colors.grey.shade600;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: text,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    Color color = Colors.green;
    Color bgColor = Colors.green.shade50;
    if (priority == 'High' || priority == 'Urgent') {
      color = Colors.red.shade700;
      bgColor = Colors.red.shade50;
    }
    if (priority == 'Medium') {
      color = Colors.orange.shade800;
      bgColor = Colors.orange.shade50;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.flag, color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            priority,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          _ticket != null ? 'Ticket #${_ticket!.id}' : '',
          style: const TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.white.withValues(alpha: 0.9),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        centerTitle: true,
      ),
      body: _isLoading
          ? const SafeArea(child: MaintenanceSkeleton(itemCount: 1))
          : _error.isNotEmpty
          ? SafeArea(
              child: Center(
                child: Text(_error, style: const TextStyle(color: Colors.red)),
              ),
            )
          : _ticket == null
          ? const SizedBox.shrink()
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Photo Header
                  if (_ticket!.photoPath != null &&
                      _ticket!.photoPath!.isNotEmpty)
                    Container(
                      width: double.infinity,
                      height: 300,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        image: DecorationImage(
                          image: NetworkImage(
                            '${ApiConfig.serverUrl}${_ticket!.photoPath}',
                          ),
                          fit: BoxFit.cover,
                          onError: (e, s) => const AssetImage(''), // Fallback handled by errorBuilder below implicitly if it was an Image widget, but since it's BoxDecoration we just let it fail silently or use a placeholder
                        ),
                      ),
                      // A fallback if the network image completely fails
                      child: Image.network(
                        '${ApiConfig.serverUrl}${_ticket!.photoPath}',
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, stack) => const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.broken_image,
                                size: 48,
                                color: Colors.grey,
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Image not found',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    const SizedBox(
                      height: 100,
                    ), // Spacing for app bar if no photo

                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title and Badges
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildStatusBadge(_ticket!.status),
                            Text(
                              DateFormat('MMM d, yyyy')
                                  .format(_ticket!.createdAt),
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _ticket!.title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1E2532),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.category_outlined,
                                    size: 14,
                                    color: Colors.blue.shade700,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _ticket!.category?.name ?? 'Maintenance',
                                    style: TextStyle(
                                      color: Colors.blue.shade700,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            _buildPriorityBadge(_ticket!.priority),
                          ],
                        ),

                        const SizedBox(height: 32),

                        // Description
                        const Text(
                          'Description',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E2532),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.only(
                              topRight: Radius.circular(12),
                              bottomRight: Radius.circular(12),
                            ),
                            border: Border(
                              left: BorderSide(
                                color: Color(0xFF94A3B8),
                                width: 4,
                              ),
                            ),
                          ),
                          child: Text(
                            _ticket!.description,
                            style: const TextStyle(
                              color: Color(0xFF334155),
                              fontSize: 15,
                              height: 1.5,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),

                        // Repair Cost
                        if (_ticket!.repairCost > 0) ...[
                          const SizedBox(height: 24),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF059669), Color(0xFF10B981)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981)
                                      .withValues(alpha: 0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Stack(
                              children: [
                                Positioned(
                                  right: -10,
                                  top: -10,
                                  child: Icon(
                                    Icons.receipt_long,
                                    size: 80,
                                    color: Colors.white.withValues(alpha: 0.15),
                                  ),
                                ),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    const Text(
                                      'Repair Cost',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      'Rs. ${_ticket!.repairCost.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Verify Action
                        if (_ticket!.status == 'Resolved' &&
                            !_ticket!.residentVerified) ...[
                          const SizedBox(height: 32),
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.orange.shade200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.info_outline,
                                      color: Colors.orange.shade800,
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Action Required',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'The technician has marked this issue as resolved. Please verify and provide feedback.',
                                  style: TextStyle(height: 1.4),
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  height: 48,
                                  child: ElevatedButton(
                                    onPressed: () async {
                                      final changed = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) =>
                                              VerifyResolutionScreen(
                                                ticket: _ticket!,
                                              ),
                                        ),
                                      );
                                      if (changed == true) _loadDetails();
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.orange.shade700,
                                      shape: const StadiumBorder(),
                                    ),
                                    child: const Text(
                                      'Verify Resolution',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 32),

                        // Timeline
                        const Text(
                          'Request History',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E2532),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE8ECEF)),
                          ),
                          child: Column(
                            children: () {
                              final visibleHistory = _ticket!.history
                                  .where((h) {
                                    final s = h.status.toLowerCase();
                                    if (s.contains('technician assigned'))
                                      return true;
                                    if (s.contains('ai ') ||
                                        s.contains('sla') ||
                                        s.contains('triage') ||
                                        s.contains('escalation'))
                                      return false;
                                    return true;
                                  })
                                  .map((h) {
                                    if (h.status.contains(
                                      'Technician Assigned',
                                    )) {
                                      return MaintenanceHistoryEntry(
                                        id: h.id,
                                        status: 'Assigned',
                                        note: h.note,
                                        changedBy: h.changedBy,
                                        createdAt: h.createdAt,
                                      );
                                    }
                                    return h;
                                  })
                                  .toList();
                              return List.generate(visibleHistory.length, (
                                index,
                              ) {
                                return _buildTimelineItem(
                                  visibleHistory[index],
                                  index == visibleHistory.length - 1,
                                );
                              });
                            }(),
                          ),
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildTimelineItem(MaintenanceHistoryEntry h, bool isLast) {
    IconData icon;
    Color color;

    switch (h.status) {
      case 'Pending':
        icon = Icons.hourglass_empty;
        color = Colors.orange;
        break;
      case 'Assigned':
        icon = Icons.engineering;
        color = Colors.blue;
        break;
      case 'In Progress':
        icon = Icons.handyman;
        color = Colors.purple;
        break;
      case 'Resolved':
        icon = Icons.check_circle;
        color = Colors.green;
        break;
      case 'Closed':
        icon = Icons.done_all;
        color = Colors.grey.shade700;
        break;
      default:
        icon = Icons.info;
        color = Colors.grey;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline line and dot
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              if (!isLast)
                Expanded(
                  child: Container(width: 2, color: Colors.grey.shade200),
                ),
            ],
          ),
          const SizedBox(width: 16),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          h.status == 'Pending'
                              ? 'Complaint Created'
                              : h.status,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: Color(0xFF1E2532),
                          ),
                        ),
                      ),
                      Text(
                        DateFormat('MMM d, h:mm a').format(h.createdAt),
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  if (h.note.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Builder(
                      builder: (context) {
                        final match = RegExp(
                          r'^\[Rating: (\d)/5 Stars\]\s*(.*)$',
                        ).firstMatch(h.note);
                        if (match != null) {
                          final rating = int.parse(match.group(1)!);
                          final text = match.group(2)!;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: List.generate(
                                  5,
                                  (index) => Icon(
                                    Icons.star,
                                    size: 16,
                                    color: index < rating
                                        ? Colors.amber
                                        : Colors.grey.shade300,
                                  ),
                                ),
                              ),
                              if (text.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  text,
                                  style: const TextStyle(
                                    color: Color(0xFF1E88E5),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ],
                          );
                        }
                        return Text(
                          h.note,
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        );
                      },
                    ),
                  ],
                  if (h.changedBy.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      'By: ${h.changedBy}',
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
