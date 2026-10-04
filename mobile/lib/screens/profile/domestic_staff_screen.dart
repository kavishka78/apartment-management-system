import 'package:flutter/material.dart';
import '../../models/profile/profile_models.dart';
import '../../services/profile/profile_api_service.dart';

class DomesticStaffScreen extends StatefulWidget {
  final int residentId;
  const DomesticStaffScreen({super.key, required this.residentId});

  @override
  State<DomesticStaffScreen> createState() => _DomesticStaffScreenState();
}

class _DomesticStaffScreenState extends State<DomesticStaffScreen> {
  List<DomesticStaffModel> _staffList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStaff();
  }

  Future<void> _loadStaff() async {
    setState(() => _isLoading = true);
    final list = await ProfileApiService.getStaff(widget.residentId);
    if (mounted) {
      setState(() {
        _staffList = list;
        _isLoading = false;
      });
    }
  }

  void _showAddStaffSheet() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final nicCtrl = TextEditingController();
    final hoursCtrl = TextEditingController(text: 'Mon - Fri (8:00 AM - 5:00 PM)');
    String selectedRole = 'Maid / Housekeeper';
    final roles = [
      'Maid / Housekeeper',
      'Driver',
      'Cook / Chef',
      'Cleaner',
      'Caregiver / Nanny',
      'Tutor'
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 30),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Register Domestic Staff',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF17212B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Generates a digital gate access pass for your staff or helper.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 20),

                  // Full Name
                  const Text(
                    'Staff Full Name',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      hintText: 'e.g. Kusumawathi Perera',
                      prefixIcon: const Icon(Icons.badge_outlined, size: 20),
                      filled: true,
                      fillColor: const Color(0xFFF5F7F8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Role / Staff Type
                  const Text(
                    'Staff Role',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F7F8),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedRole,
                        isExpanded: true,
                        items: roles
                            .map((r) => DropdownMenuItem(
                                  value: r,
                                  child: Text(r, style: const TextStyle(fontSize: 14)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) {
                            setSheetState(() => selectedRole = v);
                          }
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Contact Phone & NIC
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Phone Number',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: phoneCtrl,
                              keyboardType: TextInputType.phone,
                              decoration: InputDecoration(
                                hintText: '0712345678',
                                filled: true,
                                fillColor: const Color(0xFFF5F7F8),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'NIC / ID Number',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: nicCtrl,
                              decoration: InputDecoration(
                                hintText: '198512345678',
                                filled: true,
                                fillColor: const Color(0xFFF5F7F8),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Working Hours
                  const Text(
                    'Authorized Schedule / Hours',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: hoursCtrl,
                    decoration: InputDecoration(
                      hintText: 'Mon - Fri (8:00 AM - 5:00 PM)',
                      prefixIcon: const Icon(Icons.access_time_rounded, size: 20),
                      filled: true,
                      fillColor: const Color(0xFFF5F7F8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        final name = nameCtrl.text.trim();
                        if (name.isEmpty) return;

                        Navigator.pop(ctx);
                        setState(() => _isLoading = true);

                        await ProfileApiService.registerStaff(
                          widget.residentId,
                          fullName: name,
                          staffType: selectedRole,
                          contactPhone: phoneCtrl.text.trim(),
                          nicNumber: nicCtrl.text.trim(),
                          workingHours: hoursCtrl.text.trim(),
                        );
                        _loadStaff();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF17212B),
                        foregroundColor: Colors.white,
                        shape: const StadiumBorder(),
                      ),
                      child: const Text(
                        'Generate Access Pass',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
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

  Future<void> _togglePass(DomesticStaffModel s) async {
    final success = await ProfileApiService.toggleStaffPass(s.id);
    if (success) {
      _loadStaff();
    }
  }

  Future<void> _confirmDelete(DomesticStaffModel s) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Revoke Pass & Remove'),
        content: Text('Permanently remove ${s.fullName} and revoke their access pass?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Revoke', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      await ProfileApiService.removeStaff(widget.residentId, s.id);
      _loadStaff();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        title: const Text(
          'Domestic Staff Passes',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF17212B),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showAddStaffSheet,
            icon: const Icon(Icons.person_add_rounded),
            tooltip: 'Add Staff',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF17212B)),
              ),
            )
          : _staffList.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.purple.shade50,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.badge_outlined,
                            size: 48,
                            color: Color(0xFF17212B),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No Domestic Staff Registered',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Register maids, cleaners, or drivers to issue gate access codes and security validation.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _showAddStaffSheet,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Register First Helper'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF17212B),
                            foregroundColor: Colors.white,
                            shape: const StadiumBorder(),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadStaff,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: _staffList.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 14),
                    itemBuilder: (ctx, idx) {
                      final s = _staffList[idx];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: s.isActive
                                ? const Color(0xFFE8ECEF)
                                : Colors.red.shade100,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: s.isActive
                                            ? Colors.purple.shade50
                                            : Colors.grey.shade100,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(
                                        Icons.badge_outlined,
                                        size: 20,
                                        color: s.isActive
                                            ? Colors.purple.shade800
                                            : Colors.grey,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          s.fullName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                          ),
                                        ),
                                        Text(
                                          '${s.staffType} • ${s.contactPhone}',
                                          style: const TextStyle(
                                            color: Colors.grey,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                IconButton(
                                  onPressed: () => _confirmDelete(s),
                                  icon: const Icon(Icons.delete_outline_rounded,
                                      color: Colors.redAccent, size: 20),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            // Digital Access Pass Tag
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: s.isActive
                                    ? const Color(0xFF17212B).withValues(alpha: 0.04)
                                    : Colors.red.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.qr_code_2_rounded,
                                          size: 16, color: Color(0xFF17212B)),
                                      const SizedBox(width: 6),
                                      Text(
                                        s.accessPassCode,
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    s.workingHours,
                                    style: const TextStyle(
                                        fontSize: 10, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  s.isActive
                                      ? 'Gate Access: Enabled'
                                      : 'Gate Access: Revoked / Suspended',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: s.isActive
                                        ? Colors.green.shade700
                                        : Colors.redAccent,
                                  ),
                                ),
                                Switch.adaptive(
                                  value: s.isActive,
                                  activeColor: const Color(0xFF17212B),
                                  onChanged: (_) => _togglePass(s),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
