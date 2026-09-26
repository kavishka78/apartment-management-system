import 'package:flutter/material.dart';

import '../../services/parking/parking_api_service.dart';

class VisitorParkingScreen extends StatefulWidget {
  const VisitorParkingScreen({super.key});

  @override
  State<VisitorParkingScreen> createState() => _VisitorParkingScreenState();
}

class _VisitorParkingScreenState extends State<VisitorParkingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _vehicleController = TextEditingController();
  DateTime _expectedArrival = DateTime.now().add(const Duration(hours: 2));
  bool _isSubmitting = false;

  List<dynamic> _activeVisitors = [];
  bool _isLoadingVisitors = true;

  @override
  void initState() {
    super.initState();
    _loadActiveVisitors();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _vehicleController.dispose();
    super.dispose();
  }

  Future<void> _loadActiveVisitors() async {
    setState(() => _isLoadingVisitors = true);
    final res = await ParkingApiService.getActiveVisitors();
    if (mounted) {
      setState(() {
        _isLoadingVisitors = false;
        if (res['success'] == true) {
          _activeVisitors = res['data'] ?? [];
        }
      });
    }
  }

  Future<void> _submitVisitorPass() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final res = await ParkingApiService.preRegisterVisitor(
      residentId: 101, // Mock resident ID
      visitorName: _nameController.text,
      phoneNumber: _phoneController.text,
      vehicleNumber: _vehicleController.text,
      expectedArrival: _expectedArrival,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);

      if (res['success'] == true) {
        final code = res['accessCode'] ?? 'GEN-PASS';
        _nameController.clear();
        _phoneController.clear();
        _vehicleController.clear();

        _showPassDialog(code);
        _loadActiveVisitors();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Failed to register visitor'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _cancelVisitorPass(int passId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Visitor Pass?'),
        content: const Text(
          'Are you sure you want to cancel this visitor pass? Any assigned parking slot will be released.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Yes, Cancel',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final res = await ParkingApiService.cancelVisitorPass(passId);
      if (mounted) {
        if (res['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Visitor pass cancelled and parking spot released.',
              ),
              backgroundColor: Colors.green,
            ),
          );
          _loadActiveVisitors();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Failed to cancel pass'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _showPassDialog(String code) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.green),
            SizedBox(width: 8),
            Text('Pass Issued!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Share this Access Code with your visitor for security check-in & visitor parking allocation:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF17212B),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                code,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 3,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        title: const Text('Visitor & Parking Pass'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF17212B),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadActiveVisitors,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF17212B),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SECURITY & PARKING',
                    style: TextStyle(
                      color: Color(0xFFB8C2CC),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.1,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Pre-Register Visitors',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Generate instant gate access pass & auto-allocate visitor parking slots.',
                    style: TextStyle(color: Color(0xFFD5DADF), fontSize: 13),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Pre-register form
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE8ECEF)),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Visitor Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: 'Visitor Full Name',
                        prefixIcon: const Icon(Icons.person_outline),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      validator: (val) => val == null || val.isEmpty
                          ? 'Enter visitor name'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Phone Number',
                        prefixIcon: const Icon(Icons.phone_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _vehicleController,
                      decoration: InputDecoration(
                        labelText: 'Vehicle Number (For parking)',
                        prefixIcon: const Icon(Icons.directions_car_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _submitVisitorPass,
                        icon: const Icon(Icons.qr_code_2_rounded),
                        label: _isSubmitting
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : const Text('Generate Gate Access Pass'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF17212B),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            const Text(
              'Active Visitor Gate Logs',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            if (_isLoadingVisitors)
              const Center(child: CircularProgressIndicator())
            else if (_activeVisitors.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(
                  child: Text(
                    'No active visitors at the gate currently.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _activeVisitors.length,
                itemBuilder: (context, index) {
                  final v = _activeVisitors[index];
                  final passId = v['id'] ?? v['passId'];
                  final name = v['visitorName'] ?? 'Visitor';
                  final vehicle = v['vehicleNumber'] ?? 'No vehicle';
                  final code = v['accessCode'] ?? '—';
                  final slot = v['assignedParkingSlot'] ?? 'Unassigned';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE8ECEF)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Vehicle: $vehicle | Code: $code',
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: slot != 'Unassigned'
                                    ? const Color(0xFFEFF6FF)
                                    : const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: slot != 'Unassigned'
                                      ? const Color(0xFFBFDBFE)
                                      : const Color(0xFFE5E7EB),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.local_parking_rounded,
                                    size: 16,
                                    color: slot != 'Unassigned'
                                        ? const Color(0xFF2563EB)
                                        : Colors.grey,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    slot != 'Unassigned'
                                        ? 'Slot: $slot'
                                        : 'No Slot',
                                    style: TextStyle(
                                      color: slot != 'Unassigned'
                                          ? const Color(0xFF1E40AF)
                                          : Colors.grey,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => _cancelVisitorPass(passId),
                              icon: const Icon(
                                Icons.cancel_outlined,
                                size: 16,
                                color: Colors.red,
                              ),
                              label: const Text(
                                'Cancel Pass',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontSize: 12,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                  color: Color(0xFFFECACA),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
