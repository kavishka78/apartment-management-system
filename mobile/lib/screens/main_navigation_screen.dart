import '../services/api_config.dart';

import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';

import 'payment/payment_home_screen.dart';
import 'facility/facilities_list_screen.dart';
import 'facility/my_bookings_screen.dart';
import 'parking/visitor_parking_screen.dart';
import 'maintenance/maintenance_home_screen.dart';
import 'maintenance/my_complaints_screen.dart';
import 'auth/login_entry_screen.dart';
import '../services/auth/auth_service.dart';

import 'facility/ai_facility_assistant_screen.dart';
import 'maintenance/resident_ai_assistant_screen.dart';
import 'payment/payment_chat_screen.dart';

import 'maintenance/notifications_screen.dart';
import 'profile/profile_home_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    FacilitiesListScreen(),
    VisitorParkingScreen(),
    PaymentHomeScreen(),
    ProfileHomeScreen(),
  ];

  Timer? _notificationTimer;
  final Set<int> _seenNotificationIds = {};

  @override
  void initState() {
    super.initState();
    _startNotificationPolling();
  }

  @override
  void dispose() {
    _notificationTimer?.cancel();
    super.dispose();
  }

  void _startNotificationPolling() {
    // Poll every 10 seconds for new notifications
    _notificationTimer = Timer.periodic(const Duration(seconds: 10), (
      timer,
    ) async {
      try {
        final session = await AuthService.getSession();
        if (session == null || !mounted) return;

        final response = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/Notifications/resident/${session.residentId}'),
          headers: await AuthService.authHeaders(),
        );
        if (response.statusCode == 200) {
          final List<dynamic> notifs = json.decode(response.body);

          for (var n in notifs) {
            final int id = n['id'];
            if (!_seenNotificationIds.contains(id)) {
              // It's a new notification we haven't seen during this session!
              // Don't pop up if it's already read from a previous session, unless we want to.
              // We will only pop up if it's explicitly unread.
              if (n['isRead'] == false && _seenNotificationIds.isNotEmpty) {
                _showNotificationPopup(n['title'], n['message']);
              }
              _seenNotificationIds.add(id);
            }
          }
        }
      } catch (e) {
        // silently ignore network errors in polling
      }
    });
  }

  void _showNotificationPopup(String title, String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(message, style: const TextStyle(color: Colors.white70)),
          ],
        ),
        backgroundColor: const Color(0xFF1E2532),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.only(top: 50, left: 20, right: 20),
        dismissDirection: DismissDirection.up,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 5),
        elevation: 6,
      ),
    );
  }

  void _changePage(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await AuthService.clearSession();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginEntryScreen()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: _selectedIndex == 4
          ? Colors.white
          : Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(bottom: false, child: _screens[_selectedIndex]),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 3, 16, 8),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(44),
              border: Border.all(color: const Color(0xFFE2E6E8)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x16000000),
                  blurRadius: 20,
                  offset: Offset(0, 5),
                ),
              ],
            ),
            child: Row(
              children: [
                _navItem(0, Icons.home_outlined, Icons.home_rounded, 'Home'),
                _navItem(
                  1,
                  Icons.wb_incandescent_outlined,
                  Icons.wb_incandescent_rounded,
                  'Facilities',
                ),
                _navItem(
                  2,
                  Icons.local_parking_outlined,
                  Icons.local_parking_rounded,
                  'Parking',
                ),
                _navItem(
                  3,
                  Icons.credit_score_outlined,
                  Icons.credit_score_rounded,
                  'Payments',
                ),
                _navItem(
                  4,
                  Icons.person_outline_rounded,
                  Icons.person_rounded,
                  'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(
    int index,
    IconData icon,
    IconData selectedIcon,
    String label,
  ) {
    final selected = _selectedIndex == index;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: label,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _changePage(index),
            borderRadius: BorderRadius.circular(40),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              height: 62,
              decoration: BoxDecoration(
                color: selected ? const Color(0xFFDBEAFE) : Colors.transparent,
                borderRadius: BorderRadius.circular(40),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    selected ? selectedIcon : icon,
                    size: 25,
                    color: selected ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                  ),
                  const SizedBox(height: 3),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      label,
                      maxLines: 1,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: selected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: selected ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Home Screen (unchanged from original main.dart) ─────────────────────────

class RecentActivity {
  final String title;
  final String idStr;
  final String status;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final Color statusBg;
  final Color statusText;
  final DateTime date;

  RecentActivity({
    required this.title,
    required this.idStr,
    required this.status,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.statusBg,
    required this.statusText,
    required this.date,
  });
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<RecentActivity> _recentActivities = [];
  bool _isLoadingActivities = true;

  @override
  void initState() {
    super.initState();
    _loadRecentActivities();
  }

  Future<void> _loadRecentActivities() async {
    try {
      final headers = await AuthService.authHeaders();
      final List<RecentActivity> activities = [];

      // Fetch maintenance
      try {
        final mRes = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/maintenance'),
          headers: headers,
        );
        if (mRes.statusCode == 200) {
          final List<dynamic> mList = json.decode(mRes.body);
          for (var m in mList) {
            activities.add(
              RecentActivity(
                title: 'Maintenance Request',
                idStr: '#MNT-${m["id"]} • ${m["status"]}',
                status: m["status"] ?? 'Pending',
                subtitle:
                    '${m["createdAt"].toString().substring(0, 10)} • ${m["title"]}',
                icon: Icons.build_rounded,
                iconColor: Colors.orange.shade800,
                bgColor: Colors.orange.shade50,
                statusBg: m["status"] == 'Resolved'
                    ? Colors.green.shade50
                    : (m["status"] == 'Closed'
                          ? Colors.red.shade50
                          : Colors.blue.shade50),
                statusText: m["status"] == 'Resolved'
                    ? Colors.green.shade700
                    : (m["status"] == 'Closed'
                          ? Colors.red.shade700
                          : Colors.blue.shade700),
                date: DateTime.parse(m["createdAt"]),
              ),
            );
          }
        }
      } catch (_) {}

      // Fetch visitors
      try {
        final vRes = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/visitors/active'),
          headers: headers,
        );
        if (vRes.statusCode == 200) {
          final List<dynamic> vList = json.decode(vRes.body);
          for (var v in vList) {
            activities.add(
              RecentActivity(
                title: 'Visitor Pass',
                idStr: '#VIS-${v["id"]} • ${v["status"]}',
                status: v["status"] ?? 'Approved',
                subtitle:
                    '${v["expectedArrival"]?.toString().substring(0, 10)} • ${v["visitorName"]}',
                icon: Icons.local_parking_rounded,
                iconColor: Colors.green.shade700,
                bgColor: Colors.green.shade50,
                statusBg: Colors.green.shade50,
                statusText: Colors.green.shade700,
                date: DateTime.parse(
                  v["createdAt"] ??
                      v["expectedArrival"] ??
                      DateTime.now().toIso8601String(),
                ),
              ),
            );
          }
        }
      } catch (_) {}

      // Fetch bookings
      try {
        final bRes = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/bookings'),
          headers: headers,
        );
        if (bRes.statusCode == 200) {
          final List<dynamic> bList = json.decode(bRes.body);
          for (var b in bList) {
            activities.add(
              RecentActivity(
                title: 'Facility Booking',
                idStr: '#BKG-${b["id"]} • ${b["status"]}',
                status: b["status"] ?? 'Confirmed',
                subtitle:
                    '${b["bookingDate"]?.toString().substring(0, 10) ?? ''} • ${b["facilityName"]}',
                icon: Icons.bookmark_outline_rounded,
                iconColor: Colors.teal.shade700,
                bgColor: Colors.teal.shade50,
                statusBg: b["status"] == 'Cancelled'
                    ? Colors.red.shade50
                    : Colors.green.shade50,
                statusText: b["status"] == 'Cancelled'
                    ? Colors.red.shade700
                    : Colors.green.shade700,
                date: DateTime.parse(
                  b["createdAt"] ??
                      b["bookingDate"] ??
                      DateTime.now().toIso8601String(),
                ),
              ),
            );
          }
        }
      } catch (_) {}

      // Fetch invoices
      try {
        final pRes = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/invoices?page=1&pageSize=20'),
          headers: headers,
        );
        if (pRes.statusCode == 200) {
          final Map<String, dynamic> pData = json.decode(pRes.body);
          if (pData['items'] != null) {
            final List<dynamic> pList = pData['items'];
            for (var p in pList) {
              activities.add(
                RecentActivity(
                  title: 'Invoice',
                  idStr: '${p["invoiceNumber"]} • ${p["status"]}',
                  status: p["status"] ?? 'Pending',
                  subtitle:
                      '${p["dueDate"]?.toString().substring(0, 10) ?? ''} • Rs. ${p["totalAmount"]}',
                  icon: Icons.credit_card_rounded,
                  iconColor: Colors.purple.shade700,
                  bgColor: Colors.purple.shade50,
                  statusBg: p["status"] == 'Paid'
                      ? Colors.green.shade50
                      : Colors.orange.shade50,
                  statusText: p["status"] == 'Paid'
                      ? Colors.green.shade700
                      : Colors.orange.shade700,
                  date: DateTime.parse(
                    p["createdAt"] ?? DateTime.now().toIso8601String(),
                  ),
                ),
              );
            }
          }
        }
      } catch (_) {}

      activities.sort((a, b) => b.date.compareTo(a.date));

      if (mounted) {
        setState(() {
          _recentActivities = activities.take(5).toList();
          _isLoadingActivities = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingActivities = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = AuthService.currentSession;
    final firstName = session?.name.split(' ').first ?? 'Resident';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    image: AssetImage('assets/images/resident_image.png'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 19,
                      color: Color(0xFF1E2532),
                    ),
                    children: [
                      const TextSpan(text: 'Welcome back, '),
                      TextSpan(
                        text: '$firstName !',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const NotificationsScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.notifications_none_rounded),
              ),
            ],
          ),

          const SizedBox(height: 30),

          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: double.infinity,
              color: const Color(0xFF17212B),
              child: Stack(
                children: [
                  Positioned(
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 200,
                    child: ShaderMask(
                      shaderCallback: (rect) {
                        return const LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [Colors.transparent, Colors.black],
                          stops: [0.0, 0.4],
                        ).createShader(rect);
                      },
                      blendMode: BlendMode.dstIn,
                      child: Image.asset(
                        'assets/images/apartment.jpg',
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SMART APARTMENT LIVING',
                          style: TextStyle(
                            color: Color(0xFFB8C2CC),
                            fontSize: 12,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Everything you need,\nin one place.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 25,
                            height: 1.2,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            const Icon(
                              Icons.home,
                              color: Colors.white70,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              session != null
                                  ? 'Unit ${session.unitNumber} • ${session.name}'
                                  : 'Manage facilities & passes.',
                              style: const TextStyle(
                                color: Color(0xFFD5DADF),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        if (session != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.circle,
                                  color: Colors.greenAccent,
                                  size: 8,
                                ),
                                const SizedBox(width: 6),
                                const Text(
                                  'Active Resident',
                                  style: TextStyle(
                                    color: Colors.greenAccent,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
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
              ),
            ),
          ),

          const SizedBox(height: 30),

          const Text(
            'Quick Services',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 15),

          LayoutBuilder(
            builder: (context, constraints) {
              final useTwoColumns =
                  constraints.maxWidth < 320 ||
                  MediaQuery.textScalerOf(context).scale(12) > 14;
              return GridView.count(
                crossAxisCount: useTwoColumns ? 2 : 3,
                shrinkWrap: true,
                primary: false,
                padding: EdgeInsets.zero,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: useTwoColumns ? 1.1 : 0.96,
                children: [
                  ServiceCard(
                    title: 'Facilities',
                    subtitle: 'Book amenities',
                    icon: Icons.pool_rounded,
                    iconColor: const Color(0xFF2563EB),
                    bgColor: const Color(0xFFEEF5FF),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const FacilitiesListScreen(),
                        ),
                      );
                    },
                  ),
                  ServiceCard(
                    title: 'Maintenance',
                    subtitle: 'Report an issue',
                    icon: Icons.handyman_rounded,
                    iconColor: const Color(0xFFF97316),
                    bgColor: const Color(0xFFFFF6ED),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MaintenanceHomeScreen(),
                        ),
                      );
                    },
                  ),
                  ServiceCard(
                    title: 'Visitors',
                    subtitle: 'Create a pass',
                    icon: Icons.directions_car_rounded,
                    iconColor: const Color(0xFF059669),
                    bgColor: const Color(0xFFEAFBF4),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const VisitorParkingScreen(),
                        ),
                      );
                    },
                  ),
                  ServiceCard(
                    title: 'Payments',
                    subtitle: 'Pay bills',
                    icon: Icons.account_balance_wallet_rounded,
                    iconColor: const Color(0xFF7C3AED),
                    bgColor: const Color(0xFFF4F0FF),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const PaymentHomeScreen(),
                        ),
                      );
                    },
                  ),
                  ServiceCard(
                    title: 'Bookings',
                    subtitle: 'View bookings',
                    icon: Icons.event_available_rounded,
                    iconColor: const Color(0xFF0D9488),
                    bgColor: const Color(0xFFECFAF8),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MyBookingsScreen(),
                        ),
                      );
                    },
                  ),
                  ServiceCard(
                    title: 'Profile',
                    subtitle: 'Account details',
                    icon: Icons.person_rounded,
                    iconColor: const Color(0xFF475569),
                    bgColor: const Color(0xFFF1F5F9),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ProfileHomeScreen(),
                        ),
                      );
                    },
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI Assistant',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF17212B),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Get instant help and smart suggestions.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildAgentButton(
                      context,
                      icon: Icons.auto_awesome_outlined,
                      iconColor: const Color(0xFF0D9488),
                      label: 'Maintenance',
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ResidentAiAssistantScreen(),
                        ),
                      ),
                    ),
                    _buildAgentButton(
                      context,
                      icon: Icons.blur_on,
                      iconColor: const Color(0xFF2563EB),
                      label: 'Facilities',
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AiFacilityAssistantScreen(),
                        ),
                      ),
                    ),
                    _buildAgentButton(
                      context,
                      icon: Icons.auto_fix_high_outlined,
                      iconColor: const Color(0xFF7C3AED),
                      label: 'Payments',
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const PaymentChatScreen(),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Activity',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              Text(
                'Latest updates',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
            ],
          ),

          const SizedBox(height: 15),

          if (_isLoadingActivities)
            Shimmer.fromColors(
              baseColor: Colors.grey.shade200,
              highlightColor: Colors.white,
              child: ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 3,
                itemBuilder: (_, __) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  height: 85,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            )
          else if (_recentActivities.isEmpty)
            const Text(
              'No recent activity.',
              style: TextStyle(color: Colors.grey),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _recentActivities.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final activity = _recentActivities[index];
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE8ECEF)),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        final destination = switch (activity.title) {
                          'Maintenance Request' => const MyComplaintsScreen(),
                          'Facility Booking' => const MyBookingsScreen(),
                          'Visitor Pass' => const VisitorParkingScreen(),
                          'Invoice' => const PaymentHomeScreen(),
                          _ => null,
                        };
                        if (destination != null) {
                          Navigator.push(context,
                            MaterialPageRoute(builder: (_) => destination));
                        }
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: activity.bgColor,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                activity.icon,
                                color: activity.iconColor,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    activity.title,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    activity.idStr,
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    activity.subtitle,
                                    style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: activity.statusBg,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    activity.status,
                                    style: TextStyle(
                                      color: activity.statusText,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Icon(
                                  Icons.chevron_right,
                                  color: Colors.grey.shade400,
                                  size: 20,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
        ].animate(interval: 50.ms).fadeIn(duration: 400.ms, curve: Curves.easeOut).slideY(begin: 0.1, duration: 400.ms, curve: Curves.easeOut),
      ),
    );
  }

  Widget _buildAgentButton(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Material(
            color: iconColor.withOpacity(0.12),
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: SizedBox(
                width: 60,
                height: 60,
                child: Icon(icon, color: iconColor, size: 28),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF17212B),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class ServiceCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;
  final Color iconColor;
  final Color bgColor;

  const ServiceCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onTap,
    this.iconColor = const Color(0xFF17212B),
    this.bgColor = const Color(0xFFEEF1F2),
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE1E7ED)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      maxLines: 1,
                      style: const TextStyle(
                        color: Color(0xFF17212B),
                        fontWeight: FontWeight.w700,
                        fontSize: 12.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 10.5,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PlaceholderScreen extends StatelessWidget {
  final String title;
  final IconData icon;
  final String message;

  const PlaceholderScreen({
    super.key,
    required this.title,
    required this.icon,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: const BoxDecoration(
                color: Color(0xFFEEF1F2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 45, color: const Color(0xFF17212B)),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
