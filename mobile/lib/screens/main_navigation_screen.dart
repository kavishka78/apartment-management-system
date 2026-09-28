import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'payment/payment_home_screen.dart';
import 'facility/facilities_list_screen.dart';
import 'facility/my_bookings_screen.dart';
import 'parking/visitor_parking_screen.dart';
import 'maintenance/maintenance_home_screen.dart';
import 'auth/login_entry_screen.dart';
import '../services/auth/auth_service.dart';

import 'payment/payment_home_screen.dart';
import 'facility/facilities_list_screen.dart';
import 'facility/my_bookings_screen.dart';
import 'parking/visitor_parking_screen.dart';
import 'maintenance/maintenance_home_screen.dart';
import 'auth/login_entry_screen.dart';
import 'profile/profile_home_screen.dart';
import 'profile/vehicle_registration_screen.dart';
import 'profile/domestic_staff_screen.dart';

import '../services/auth/auth_service.dart';
/// The main bottom navigation shell shown after successful login.
///
/// Moved out of main.dart so SplashScreen can route to it independently.
/// The Profile tab is currently a placeholder — Part 2 will replace it
/// with the full Resident Profile Hub screen.
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
    _notificationTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      try {
        final session = AuthService.currentSession;
        // Using hardcoded 1 as per current setup, or session.residentId if available
        final resId = session?.residentId ?? 1; 
        
        final response = await http.get(Uri.parse('http://10.0.2.2:5073/api/Notifications/resident/$resId'));
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
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
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
            child: const Text(
              'Sign Out',
              style: TextStyle(color: Colors.red),
            ),
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
      body: SafeArea(
        child: _screens[_selectedIndex],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _changePage,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment),
            label: 'Facilities',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_parking_outlined),
            selectedIcon: Icon(Icons.local_parking),
            label: 'Parking',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Payments',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// ── Home Screen (unchanged from original main.dart) ─────────────────────────

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Get the resident's name from the saved session for the greeting
    final session = AuthService.currentSession;
    final firstName = session?.name.split(' ').first ?? 'Resident';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: const BoxDecoration(
                  color: Color(0xFF17212B),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Welcome back',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      firstName,
                      style: const TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.notifications_none_rounded),
              ),
            ],
          ),

          const SizedBox(height: 30),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFF17212B),
              borderRadius: BorderRadius.circular(20),
            ),
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
                const SizedBox(height: 10),
                const Text(
                  'Everything you need,\nin one place.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 25,
                    height: 1.2,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  session != null
                      ? 'Unit ${session.unitNumber} · ${session.name}'
                      : 'Manage facilities, visitor passes, & payments.',
                  style: const TextStyle(
                    color: Color(0xFFD5DADF),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 30),

          const Text(
            'Quick Services',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 15),

          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 14,
            crossAxisSpacing: 14,
            childAspectRatio: 1.15,
            children: [
              ServiceCard(
                title: 'Facilities',
                subtitle: 'Book amenities',
                icon: Icons.apartment_rounded,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const FacilitiesListScreen()),
                  );
                },
              ),
              ServiceCard(
                title: 'Maintenance',
                subtitle: 'Report issues',
                icon: Icons.build_circle_outlined,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const MaintenanceHomeScreen()),
                  );
                },
              ),
              ServiceCard(
                title: 'Visitor & Parking',
                subtitle: 'Passes & Slots',
                icon: Icons.local_parking_rounded,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const VisitorParkingScreen()),
                  );
                },
              ),
              ServiceCard(
                title: 'Payments',
                subtitle: 'Pay your bills',
                icon: Icons.credit_card_rounded,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const PaymentHomeScreen()),
                  );
                },
              ),
              ServiceCard(
                title: 'My Bookings',
                subtitle: 'Facility status',
                icon: Icons.bookmark_outline_rounded,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const MyBookingsScreen()),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Reusable widgets (unchanged) ─────────────────────────────────────────────

class ServiceCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  const ServiceCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: const Color(0xFFE8ECEF),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF1F2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: const Color(0xFF17212B),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
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
              child: Icon(
                icon,
                size: 45,
                color: const Color(0xFF17212B),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                fontSize: 25,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
