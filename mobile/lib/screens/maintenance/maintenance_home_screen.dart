import '../../services/api_config.dart';
import 'package:flutter/material.dart';

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../services/maintenance/maintenance_api_service.dart';
import 'create_complaint_screen.dart';
import 'my_complaints_screen.dart';
import 'resident_ai_assistant_screen.dart';
import 'maintenance_history_screen.dart';
import 'notifications_screen.dart';
import '../../models/maintenance/maintenance_model.dart';
import '../../widgets/maintenance/repair_costs_bottom_sheet.dart';

const int CURRENT_RESIDENT_ID = 1;

class MaintenanceHomeScreen extends StatefulWidget {
  const MaintenanceHomeScreen({super.key});

  @override
  State<MaintenanceHomeScreen> createState() => _MaintenanceHomeScreenState();
}

class _MaintenanceHomeScreenState extends State<MaintenanceHomeScreen> {
  int _openCount = 0;
  int _inProgressCount = 0;
  List<MaintenanceTicket> _allTickets = [];
  int _unreadNotifications = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    final result = await MaintenanceApiService.getComplaints(
      residentId: CURRENT_RESIDENT_ID,
    );

    try {
      final notifRes = await http.get(
        Uri.parse(
          '${ApiConfig.baseUrl}/Notifications/resident/$CURRENT_RESIDENT_ID',
        ),
      );
      if (notifRes.statusCode == 200) {
        final List<dynamic> notifs = json.decode(notifRes.body);
        if (mounted) {
          setState(() {
            _unreadNotifications = notifs
                .where((n) => n['isRead'] == false)
                .length;
          });
        }
      }
    } catch (e) {
      // Ignore
    }

    if (mounted) {
      if (result['success'] == true) {
        final List<dynamic> ticketsData = result['data'];
        final List<MaintenanceTicket> parsedTickets = ticketsData
            .map((e) => MaintenanceTicket.fromJson(e))
            .toList();

        int open = 0;
        int inProgress = 0;

        for (var t in ticketsData) {
          if (t['status'] == 'Pending' || t['status'] == 'Assigned') {
            open++;
          } else if (t['status'] == 'In Progress' ||
              (t['status'] == 'Resolved' && t['residentVerified'] == false)) {
            inProgress++;
          }
        }
        setState(() {
          _openCount = open;
          _inProgressCount = inProgress;
          _allTickets = parsedTickets;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'Apartment Maintenance',
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF1E2532)),
            onPressed: _loadStats,
          ),
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_none, color: Color(0xFF1E2532)),
                if (_unreadNotifications > 0)
                  Positioned(
                    right: 2,
                    top: 2,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 8,
                        minHeight: 8,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              ).then((_) => _loadStats());
            },
          ),
          const SizedBox(width: 8),
        ],
      ),

      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const ResidentAiAssistantScreen(),
            ),
          ).then((needsRefresh) {
            if (needsRefresh == true) _loadStats();
          });
        },
        backgroundColor: Colors.white,
        icon: const Icon(Icons.auto_awesome, color: Colors.blueAccent),
        label: const Text(
          'Ask Assistant',
          style: TextStyle(
            color: const Color(0xFF1E2532),
            fontWeight: FontWeight.bold,
          ),
        ),
        elevation: 4,
      ),

      body: RefreshIndicator(
        onRefresh: _loadStats,
        color: const Color(0xFF1E2532),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Card
                Container(
                  width: double.infinity,
                  height: 190,
                  clipBehavior: Clip.hardEdge,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF4F9FF),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 280,
                        child: Image.asset(
                          'assets/images/maintenance_banner.jpg',
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                const Color(0xFFF4F9FF),
                                const Color(0xFFF4F9FF).withValues(alpha: 0.0),
                              ],
                              stops: const [0.55, 0.65],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ),
                          ),
                        ),
                      ),
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                const Color(0xFFF4F9FF),
                                const Color(0xFFF4F9FF).withValues(alpha: 0.0),
                              ],
                              stops: const [0.0, 0.20],
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'KEEP OUR COMMUNITY BETTER',
                              style: TextStyle(
                                color: Color(0xFF1E2532),
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Need a',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                height: 1.1,
                              ),
                            ),
                            const Text(
                              'Repair?',
                              style: TextStyle(
                                color: Color(0xFF1E88E5),
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: 200,
                              child: const Text(
                                'Submit maintenance requests for plumbing, electrical, AC, or any general issues. We\'ll take care of it.',
                                style: TextStyle(
                                  color: Colors.black87,
                                  fontSize: 11,
                                  height: 1.3,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Stat Cards (Colored but reduced height by moving arrow up)
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        'Open Requests',
                        _isLoading ? '-' : _openCount.toString(),
                        "We're working on it",
                        Icons.description_outlined,
                        const Color(0xFFFFF0E6), // Peach bg
                        const Color(0xFFFF7043), // Deep orange icon
                        () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MyComplaintsScreen(),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard(
                        'In Progress',
                        _isLoading ? '-' : _inProgressCount.toString(),
                        'Currently being handled',
                        Icons.settings_outlined,
                        const Color(0xFFE3F2FD), // Light blue bg
                        const Color(0xFF1E88E5), // Deep blue icon
                        () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MyComplaintsScreen(),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Services List (Original Navy Style)
                const Text(
                  'Maintenance Services',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1E2532),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Quick access to all maintenance features',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 16),

                _buildServiceListItem(
                  'Report Issue',
                  'Submit a new maintenance request',
                  Icons.edit_note,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const CreateComplaintScreen(),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                _buildServiceListItem(
                  'My Complaints',
                  'View and track your active requests',
                  Icons.assignment_outlined,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MyComplaintsScreen(),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                _buildServiceListItem(
                  'Maintenance History',
                  'View your completed and closed requests',
                  Icons.history,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MaintenanceHistoryScreen(),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                _buildServiceListItem(
                  'Cost Analysis',
                  'Track and analyze repair expenditures',
                  Icons.analytics_outlined,
                  () {
                    if (_allTickets.isEmpty) return;
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: Colors.transparent,
                      isScrollControlled: true,
                      builder: (context) => RepairCostsBottomSheet(
                        tickets: _allTickets
                            .where(
                              (t) =>
                                  t.status == 'Resolved' ||
                                  t.status == 'Closed',
                            )
                            .toList(),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String count,
    String subtitle,
    IconData icon,
    Color bgColor,
    Color iconColor,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: iconColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: Colors.white, size: 20),
                ),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.chevron_right,
                    size: 16,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              count,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1E2532),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E2532),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceListItem(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.01),
              blurRadius: 5,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF1E2532), size: 28),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1E2532),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }
}
