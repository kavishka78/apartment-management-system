import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/maintenance/maintenance_model.dart';
import 'my_complaints_screen.dart';

class ComplaintSuccessScreen extends StatelessWidget {
  final MaintenanceTicket ticket;

  const ComplaintSuccessScreen({super.key, required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios,
            color: Colors.black87,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context, true),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),

              // Custom Success Icon Graphic
              SizedBox(
                width: 120,
                height: 120,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // A simple background circle with a check
                    Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: Color(0xFF03A9F4), // Blue theme
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x33FF8C3A),
                            blurRadius: 15,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 48,
                        weight: 800,
                      ),
                    ),
                    // Just a few simple decorative dots using positioned containers
                    Positioned(
                      top: 15,
                      left: 15,
                      child: _buildDot(6, const Color(0xFF81D4FA)),
                    ),
                    Positioned(
                      top: 25,
                      right: 20,
                      child: _buildDot(8, const Color(0xFF29B6F6)),
                    ),
                    Positioned(
                      bottom: 25,
                      left: 25,
                      child: _buildDot(10, const Color(0xFFB3E5FC)),
                    ),
                    Positioned(
                      bottom: 20,
                      right: 30,
                      child: _buildDot(7, const Color(0xFF03A9F4)),
                    ),
                    Positioned(
                      top: 60,
                      left: 5,
                      child: _buildDot(5, const Color(0xFF81D4FA)),
                    ),
                    Positioned(
                      bottom: 60,
                      right: 5,
                      child: _buildDot(5, const Color(0xFF81D4FA)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              const Text(
                'Complaint Submitted!',
                style: TextStyle(
                  color: Color(0xFF1E2532),
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Your maintenance complaint has been\nsubmitted successfully.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 15,
                  height: 1.4,
                ),
              ),

              const SizedBox(height: 32),

              // Details Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE8ECEF)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildDetailRow(
                      Icons.confirmation_number_outlined,
                      'Complaint ID',
                      '#${ticket.id}',
                    ),
                    const Divider(height: 32, color: Color(0xFFE8ECEF)),
                    _buildDetailRow(
                      Icons.category_outlined,
                      'Category',
                      ticket.category?.name ?? 'General',
                    ),
                    const Divider(height: 32, color: Color(0xFFE8ECEF)),
                    _buildDetailRow(
                      Icons.flag_outlined,
                      'Priority',
                      ticket.priority,
                      isPriority: true,
                    ),
                    const Divider(height: 32, color: Color(0xFFE8ECEF)),
                    _buildDetailRow(
                      Icons.calendar_today_outlined,
                      'Submitted On',
                      DateFormat('MMM d, yyyy • h:mm a')
                          .format(ticket.createdAt.toLocal()),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Action Buttons
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const MyComplaintsScreen(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF03A9F4), // Blue
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: const StadiumBorder(),
                  ),
                  child: const Text(
                    'View My Complaints',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: () {
                    // Pop the success screen, then pop the create screen to go back to Home
                    Navigator.pop(context, true);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF03A9F4),
                    side: const BorderSide(
                      color: Color(0xFF03A9F4),
                      width: 1.5,
                    ),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text(
                    'Back to Home',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDot(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value, {
    bool isPriority = false,
  }) {
    Color valueColor = const Color(0xFF1E2532);
    IconData? priorityIcon;

    if (isPriority) {
      if (value == 'High' || value == 'Urgent') {
        valueColor = Colors.red;
        priorityIcon = Icons.flag;
      } else if (value == 'Medium') {
        valueColor = const Color(0xFF03A9F4);
        priorityIcon = Icons.flag;
      } else {
        valueColor = Colors.green;
        priorityIcon = Icons.flag;
      }
    }

    return Row(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF68727C)),
        const SizedBox(width: 12),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF68727C),
            fontWeight: FontWeight.w500,
          ),
        ),
        const Spacer(),
        if (priorityIcon != null) ...[
          Icon(priorityIcon, size: 16, color: valueColor),
          const SizedBox(width: 6),
        ],
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
