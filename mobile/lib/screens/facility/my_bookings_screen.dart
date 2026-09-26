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

  // Time Filter State: 'all' | 'today' | 'week'
  String _filterRange = 'all';

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

  Future<void> _cancelBooking(int bookingId, String facilityName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Booking?'),
        content: Text('Are you sure you want to cancel your spot reservation for $facilityName?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep Booking', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: const Text('Cancel Spot'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final res = await FacilityApiService.cancelBooking(bookingId);
      if (mounted) {
        if (res['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Booking cancelled successfully!'),
              backgroundColor: Color(0xFF16A34A),
            ),
          );
          _loadBookings();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Failed to cancel booking'),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        }
      }
    }
  }

  List<dynamic> get _filteredBookings {
    if (_filterRange == 'all') return _bookings;

    final now = DateTime.now();
    return _bookings.where((b) {
      if (b['bookingDate'] == null) return false;
      try {
        final bDate = DateTime.parse(b['bookingDate']).toLocal();
        if (_filterRange == 'today') {
          return bDate.year == now.year &&
              bDate.month == now.month &&
              bDate.day == now.day;
        }
        if (_filterRange == 'week') {
          final firstDayOfWeek = DateTime(now.year, now.month, now.day - (now.weekday - 1));
          final lastDayOfWeek = firstDayOfWeek.add(const Duration(days: 6, hours: 23, minutes: 59));
          return bDate.isAfter(firstDayOfWeek.subtract(const Duration(seconds: 1))) &&
              bDate.isBefore(lastDayOfWeek);
        }
      } catch (_) {}
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _filteredBookings;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        title: const Text(
          'My Bookings',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadBookings,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Bar Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              children: [
                const Text(
                  'Filter:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(width: 10),
                _buildFilterChip('all', 'All Bookings'),
                const SizedBox(width: 8),
                _buildFilterChip('today', 'Today'),
                const SizedBox(width: 8),
                _buildFilterChip('week', 'This Week'),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1, color: Color(0xFFE2E8F0)),

          Expanded(
            child: RefreshIndicator(
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
                      : filteredList.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.event_busy_rounded, size: 48, color: Colors.grey.shade400),
                                  const SizedBox(height: 12),
                                  Text(
                                    _filterRange == 'all'
                                        ? 'No facility bookings found.'
                                        : 'No bookings found for $_filterRange.',
                                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: filteredList.length,
                              itemBuilder: (context, index) {
                                final b = filteredList[index];
                                return _buildBookingCard(b);
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final bool isSelected = _filterRange == key;
    return InkWell(
      onTap: () => setState(() => _filterRange = key),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildBookingCard(dynamic booking) {
    final bookingId = booking['id'] ?? booking['bookingId'];
    final facilityName = booking['facilityName'] ?? 'Facility #${booking['facilityId']}';
    final dateStr = booking['bookingDate'] != null
        ? DateTime.parse(booking['bookingDate']).toLocal().toString().split(' ')[0]
        : '—';
    final startTime = booking['startTime']?.toString().substring(0, 5) ?? '';
    final endTime = booking['endTime']?.toString().substring(0, 5) ?? '';

    // Check if booking is in the future
    bool isUpcoming = false;
    if (booking['bookingDate'] != null) {
      try {
        final bDate = DateTime.parse(booking['bookingDate']).toLocal();
        final now = DateTime.now();
        if (booking['startTime'] != null) {
          final parts = booking['startTime'].toString().split(':');
          final bDateTime = DateTime(
            bDate.year,
            bDate.month,
            bDate.day,
            int.parse(parts[0]),
            int.parse(parts[1]),
          );
          isUpcoming = bDateTime.isAfter(now);
        } else {
          isUpcoming = DateTime(bDate.year, bDate.month, bDate.day, 23, 59).isAfter(now);
        }
      } catch (_) {}
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isUpcoming ? const Color(0xFFE2E8F0) : const Color(0xFFF1F5F9),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Facility Icon, Name, and Status Pill Badge
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: isUpcoming ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isUpcoming ? const Color(0xFFDBEAFE) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Icon(
                    _getFacilityIcon(facilityName),
                    color: isUpcoming ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        facilityName,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: isUpcoming ? const Color(0xFF0F172A) : const Color(0xFF475569),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isUpcoming ? 'Upcoming Reservation' : 'Completed Reservation',
                        style: TextStyle(
                          fontSize: 12,
                          color: isUpcoming ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isUpcoming ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isUpcoming ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Text(
                    isUpcoming ? 'Upcoming' : 'Past',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: isUpcoming ? const Color(0xFF1D4ED8) : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Date & Time Details Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 6),
                      Text(
                        dateStr,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF334155),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 6),
                      Text(
                        '$startTime – $endTime',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF334155),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Action Row (For Upcoming Bookings)
          if (isUpcoming) ...[
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: bookingId != null ? () => _cancelBooking(bookingId, facilityName) : null,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                      side: const BorderSide(color: Color(0xFFFCA5A5)),
                      backgroundColor: const Color(0xFFFEF2F2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Cancel Booking',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 14),
          ],
        ],
      ),
    );
  }

  IconData _getFacilityIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('pool') || lower.contains('swim')) return Icons.pool_rounded;
    if (lower.contains('gym') || lower.contains('fitness') || lower.contains('workout')) return Icons.fitness_center_rounded;
    if (lower.contains('tennis') || lower.contains('court') || lower.contains('badminton') || lower.contains('squash')) return Icons.sports_tennis_rounded;
    if (lower.contains('hall') || lower.contains('party') || lower.contains('club') || lower.contains('event')) return Icons.celebration_rounded;
    if (lower.contains('bbq') || lower.contains('grill')) return Icons.outdoor_grill_rounded;
    if (lower.contains('park') || lower.contains('garden')) return Icons.park_rounded;
    if (lower.contains('sauna') || lower.contains('spa')) return Icons.hot_tub_rounded;
    return Icons.domain_rounded;
  }
}
