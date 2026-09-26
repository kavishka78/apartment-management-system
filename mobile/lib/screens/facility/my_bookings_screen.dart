import 'package:flutter/material.dart';
import '../../services/facility/facility_api_service.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  List<dynamic> _bookings = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await FacilityApiService.getBookings();

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          _bookings = result['data'] ?? [];
        } else {
          _errorMessage = result['message'];
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        title: const Text('My Facility Bookings'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF17212B),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadBookings,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadBookings,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  )
                : _bookings.isEmpty
                    ? const Center(
                        child: Text(
                          'No facility bookings found.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _bookings.length,
                        itemBuilder: (context, index) {
                          final b = _bookings[index];
                          return _buildBookingCard(b);
                        },
                      ),
      ),
    );
  }

  Widget _buildBookingCard(dynamic booking) {
    final facilityName = booking['facilityName'] ?? 'Facility #${booking['facilityId']}';
    final dateStr = booking['bookingDate'] != null
        ? DateTime.parse(booking['bookingDate']).toLocal().toString().split(' ')[0]
        : '—';
    final startTime = booking['startTime']?.toString().substring(0, 5) ?? '';
    final endTime = booking['endTime']?.toString().substring(0, 5) ?? '';
    final status = booking['status']?.toString() ?? 'Pending';

    Color statusColor;
    if (status.toLowerCase() == 'approved') {
      statusColor = Colors.green;
    } else if (status.toLowerCase() == 'pending') {
      statusColor = Colors.orange;
    } else {
      statusColor = Colors.red;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8ECEF)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.bookmark_outline_rounded,
              color: statusColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  facilityName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Date: $dateStr',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
                Text(
                  'Time: $startTime - $endTime',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
