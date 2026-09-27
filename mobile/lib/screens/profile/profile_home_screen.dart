import 'package:flutter/material.dart';
import '../../models/profile/profile_models.dart';
import '../../services/auth/auth_service.dart';
import '../../services/profile/profile_api_service.dart';
import '../auth/login_entry_screen.dart';
import 'household_members_screen.dart';
import 'vehicle_registration_screen.dart';
import 'domestic_staff_screen.dart';

class ProfileHomeScreen extends StatefulWidget {
  const ProfileHomeScreen({super.key});

  @override
  State<ProfileHomeScreen> createState() => _ProfileHomeScreenState();
}

class _ProfileHomeScreenState extends State<ProfileHomeScreen> {
  ResidentProfileModel? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    final session = await AuthService.getSession();
    if (session != null && session.residentId > 0) {
      final prof = await ProfileApiService.getProfile(session.residentId);
      if (mounted) {
        setState(() {
          _profile = prof;
          _isLoading = false;
        });
      }
    } else {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showEditProfileDialog() {
    if (_profile == null) return;
    final nameCtrl = TextEditingController(text: _profile!.fullName);
    final phoneCtrl = TextEditingController(text: _profile!.phoneNumber);
    final emergencyCtrl = TextEditingController(text: _profile!.emergencyContact ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Profile Details'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emergencyCtrl,
                decoration: const InputDecoration(
                  labelText: 'Emergency Contact',
                  prefixIcon: Icon(Icons.contact_phone_outlined),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _isLoading = true);
              await ProfileApiService.updateProfile(
                _profile!.id,
                fullName: nameCtrl.text.trim(),
                phoneNumber: phoneCtrl.text.trim(),
                emergencyContact: emergencyCtrl.text.trim(),
              );
              _loadProfile();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF17212B),
              foregroundColor: Colors.white,
            ),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out from your resident account?'),
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
    final session = AuthService.currentSession;
    final displayName = _profile?.fullName ?? session?.name ?? 'Resident';
    final unitNo = _profile?.unitNumber ?? session?.unitNumber ?? '4B';
    final email = _profile?.email ?? session?.email ?? '';
    final phone = _profile?.phoneNumber ?? session?.phone ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        title: const Text(
          'Resident Profile',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF17212B),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showEditProfileDialog,
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit details',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF17212B)),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Resident Identity Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF17212B),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                displayName.isNotEmpty
                                    ? displayName[0].toUpperCase()
                                    : 'R',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 26,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Unit $unitNo · Primary Resident',
                              style: const TextStyle(
                                color: Color(0xFFB8C2CC),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Quick Registry Metric Cards (Vehicles & Staff)
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              final resId = _profile?.id ?? session?.residentId ?? 0;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      VehicleRegistrationScreen(residentId: resId),
                                ),
                              ).then((_) => _loadProfile());
                            },
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE8ECEF)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.directions_car_rounded,
                                      color: Color(0xFF17212B), size: 24),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${_profile?.vehiclesCount ?? 0}',
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Text(
                                    'Vehicles Registered',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              final resId = _profile?.id ?? session?.residentId ?? 0;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      DomesticStaffScreen(residentId: resId),
                                ),
                              ).then((_) => _loadProfile());
                            },
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE8ECEF)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.badge_outlined,
                                      color: Color(0xFF17212B), size: 24),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${_profile?.staffCount ?? 0}',
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Text(
                                    'Staff Gate Passes',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Registry Subsystem Navigation Options
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE8ECEF)),
                      ),
                      child: Column(
                        children: [
                          ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.family_restroom_rounded,
                                  color: Colors.blue.shade700, size: 20),
                            ),
                            title: const Text(
                              'Household Members',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Text(
                              '${_profile?.householdMembers.length ?? 0} members registered',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            trailing: const Icon(Icons.arrow_forward_ios_rounded,
                                size: 14, color: Colors.grey),
                            onTap: () {
                              final resId = _profile?.id ?? session?.residentId ?? 0;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      HouseholdMembersScreen(residentId: resId),
                                ),
                              ).then((_) => _loadProfile());
                            },
                          ),
                          const Divider(height: 1, indent: 60),
                          ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF17212B).withOpacity(0.08),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.directions_car_rounded,
                                  color: Color(0xFF17212B), size: 20),
                            ),
                            title: const Text(
                              'My Registered Vehicles',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Text(
                              '${_profile?.vehiclesCount ?? 0} vehicles linked to unit',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            trailing: const Icon(Icons.arrow_forward_ios_rounded,
                                size: 14, color: Colors.grey),
                            onTap: () {
                              final resId = _profile?.id ?? session?.residentId ?? 0;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      VehicleRegistrationScreen(residentId: resId),
                                ),
                              ).then((_) => _loadProfile());
                            },
                          ),
                          const Divider(height: 1, indent: 60),
                          ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.purple.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.badge_outlined,
                                  color: Colors.purple.shade800, size: 20),
                            ),
                            title: const Text(
                              'Domestic Staff & Gate Passes',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Text(
                              '${_profile?.staffCount ?? 0} helpers authorized',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            trailing: const Icon(Icons.arrow_forward_ios_rounded,
                                size: 14, color: Colors.grey),
                            onTap: () {
                              final resId = _profile?.id ?? session?.residentId ?? 0;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      DomesticStaffScreen(residentId: resId),
                                ),
                              ).then((_) => _loadProfile());
                            },
                          ),
                          const Divider(height: 1, indent: 60),
                          ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.emerald.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.phone_outlined,
                                  color: Colors.emerald.shade700, size: 20),
                            ),
                            title: const Text(
                              'Contact Info',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Text(
                              phone.isNotEmpty ? phone : email,
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            trailing: const Icon(Icons.check_circle,
                                size: 16, color: Colors.emerald),
                          ),
                          const Divider(height: 1, indent: 60),
                          ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.amber.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.emergency_outlined,
                                  color: Colors.amber.shade800, size: 20),
                            ),
                            title: const Text(
                              'Emergency Contact',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Text(
                              _profile?.emergencyContact?.isNotEmpty == true
                                  ? _profile!.emergencyContact!
                                  : 'Not set (Tap edit to add)',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Logout Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton.icon(
                        onPressed: _handleLogout,
                        icon: const Icon(Icons.logout_rounded,
                            size: 18, color: Colors.redAccent),
                        label: const Text(
                          'Sign Out',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFFFD4D4)),
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
