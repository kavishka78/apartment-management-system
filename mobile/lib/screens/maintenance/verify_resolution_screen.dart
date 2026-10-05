import 'package:flutter/material.dart';

import '../../models/maintenance/maintenance_model.dart';
import '../../services/maintenance/maintenance_api_service.dart';

class VerifyResolutionScreen extends StatefulWidget {
  final MaintenanceTicket ticket;

  const VerifyResolutionScreen({super.key, required this.ticket});

  @override
  State<VerifyResolutionScreen> createState() => _VerifyResolutionScreenState();
}

class _VerifyResolutionScreenState extends State<VerifyResolutionScreen> {
  final _noteController = TextEditingController();
  bool _isSubmitting = false;
  String _error = '';
  int _rating = 5; // Default 5 stars

  IconData _getCategoryIcon(String? categoryName) {
    switch (categoryName?.toLowerCase()) {
      case 'plumbing':
        return Icons.water_drop;
      case 'electrical':
        return Icons.electrical_services;
      case 'hvac':
        return Icons.ac_unit;
      case 'security':
        return Icons.security;
      case 'cleaning':
        return Icons.cleaning_services;
      case 'carpentry':
        return Icons.handyman;
      case 'appliance':
        return Icons.kitchen;
      case 'pest control':
        return Icons.pest_control;
      case 'landscaping':
        return Icons.park;
      case 'elevator':
        return Icons.elevator;
      case 'building':
        return Icons.apartment;
      default:
        return Icons.build;
    }
  }

  Color _getCategoryColor(String? categoryName) {
    switch (categoryName?.toLowerCase()) {
      case 'plumbing':
        return const Color(0xFF4FC3F7);
      case 'electrical':
        return const Color(0xFFFFB74D);
      case 'hvac':
        return const Color(0xFF81C784);
      case 'security':
        return const Color(0xFFE57373);
      case 'cleaning':
        return const Color(0xFF64B5F6);
      case 'carpentry':
        return const Color(0xFFA1887F);
      case 'appliance':
        return const Color(0xFF90A4AE);
      case 'pest control':
        return const Color(0xFFFF8A65);
      case 'landscaping':
        return const Color(0xFF81C784);
      case 'elevator':
        return const Color(0xFF9575CD);
      case 'building':
        return const Color(0xFF7986CB);
      default:
        return const Color(0xFF90A4AE);
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submitFeedback() async {
    setState(() {
      _isSubmitting = true;
      _error = '';
    });

    // Append star rating to the note since backend only accepts note
    String userNote = _noteController.text.trim();
    String finalNote = '[Rating: $_rating/5 Stars]';
    if (userNote.isNotEmpty) {
      finalNote += ' $userNote';
    }

    final result = await MaintenanceApiService.verifyResolution(
      widget.ticket.id,
      true, // Always approving from this positive feedback screen
      finalNote,
    );

    if (result['success'] == true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Feedback submitted and ticket closed.'),
            backgroundColor: Colors.green.shade700,
          ),
        );
        Navigator.pop(context, true);
      }
    } else {
      if (mounted) {
        setState(() {
          _error = result['message'];
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA), // Keeping the theme same
      appBar: AppBar(
        title: const Text(
          'Request Feedback',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (_error.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error,
                          style: TextStyle(color: Colors.red.shade800),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Success Icon
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: Color(0xFF1E2532), // Theme primary
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 20),

              const Text(
                'Maintenance Completed',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2532),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your request has been resolved.\nPlease share your feedback.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  height: 1.5,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 32),

              // Ticket Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE8ECEF)),
                ),
                child: Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 8.0, right: 8.0),
                      child: Icon(
                        _getCategoryIcon(widget.ticket.category?.name),
                        color: _getCategoryColor(widget.ticket.category?.name),
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.ticket.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: Color(0xFF1E2532),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.ticket.category?.name ?? 'Maintenance',
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '#TKT-${widget.ticket.id}',
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Star Rating
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'How would you rate the service?',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2532),
                    fontSize: 15,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: List.generate(5, (index) {
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _rating = index + 1;
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: Icon(
                        index < _rating ? Icons.star : Icons.star_border,
                        color: const Color(0xFFFF8C3A), // Orange stars
                        size: 40,
                      ),
                    ),
                  );
                }),
              ),

              const SizedBox(height: 32),

              // Comments Field
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Additional Comments (Optional)',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2532),
                    fontSize: 15,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE8ECEF)),
                ),
                child: TextField(
                  controller: _noteController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Good service. Issue was fixed quickly.',
                    hintStyle: TextStyle(color: Colors.grey),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 40),

              if (_isSubmitting)
                const Center(
                  child: CircularProgressIndicator(color: Color(0xFF1E2532)),
                )
              else
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _submitFeedback,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(
                        0xFF1E2532,
                      ), // Theme navy instead of bright green
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: const StadiumBorder(),
                    ),
                    child: const Text(
                      'Submit Feedback',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
