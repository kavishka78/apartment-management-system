import 'package:flutter/material.dart';

import '../../models/maintenance/maintenance_model.dart';
import '../../services/maintenance/maintenance_api_service.dart';
import '../../widgets/maintenance/maintenance_widgets.dart';
import 'maintenance_details_screen.dart';
import '../../widgets/maintenance/maintenance_skeleton.dart';

class MaintenanceHistoryScreen extends StatefulWidget {
  const MaintenanceHistoryScreen({super.key});

  @override
  State<MaintenanceHistoryScreen> createState() =>
      _MaintenanceHistoryScreenState();
}

class _MaintenanceHistoryScreenState extends State<MaintenanceHistoryScreen> {
  bool _isLoading = true;
  String _error = '';
  List<MaintenanceTicket> _allTickets = [];
  List<MaintenanceTicket> _filteredTickets = [];

  String _searchQuery = '';
  String _statusFilter = 'All History';

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    final result = await MaintenanceApiService.getComplaints();

    if (result['success'] == true) {
      final items = result['data'] as List;

      if (mounted) {
        setState(() {
          _allTickets = items
              .map((e) => MaintenanceTicket.fromJson(e))
              .toList();
          // Sort by newest first
          _allTickets.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          _applyFilters();
          _isLoading = false;
        });
      }
    } else {
      if (mounted) {
        setState(() {
          _error = result['message'];
          _isLoading = false;
        });
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredTickets = _allTickets.where((t) {
        final matchesSearch =
            t.title.toLowerCase().contains(_searchQuery) ||
            t.description.toLowerCase().contains(_searchQuery);

        bool matchesStatus = false;
        if (_statusFilter == 'All History') {
          matchesStatus = true;
        } else if (_statusFilter == 'Resolved') {
          matchesStatus = t.status == 'Resolved' || t.status == 'Closed';
        } else {
          matchesStatus = t.status == _statusFilter;
        }

        return matchesSearch && matchesStatus;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'Maintenance History',
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
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 15),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: const Color(0xFFE8ECEF)),
              ),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search history...',
                  hintStyle: TextStyle(color: Colors.grey),
                  prefixIcon: Icon(Icons.search, color: Colors.grey),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
                onChanged: (val) {
                  _searchQuery = val.toLowerCase();
                  _applyFilters();
                },
              ),
            ),
          ),

          // Status Filter Chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: ['All History', 'Resolved', 'Closed'].map((status) {
                final isSelected = _statusFilter == status;

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(status),
                    selected: isSelected,
                    selectedColor: const Color(0xFF2C3E50),
                    checkmarkColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.w400,
                    ),
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: isSelected
                          ? const Color(0xFF2C3E50)
                          : const Color(0xFFE8ECEF),
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _statusFilter = status;
                          _applyFilters();
                        });
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 10),

          // List
          Expanded(
            child: _isLoading
                ? const MaintenanceSkeleton(itemCount: 5)
                : _error.isNotEmpty
                ? Center(
                    child: Text(
                      _error,
                      style: const TextStyle(color: Colors.red),
                    ),
                  )
                : _filteredTickets.isEmpty
                ? const EmptyStateWidget(
                    message: "You don't have any resolved or closed maintenance requests yet.",
                    title: 'No history found',
                    icon: Icons.history,
                  )
                : RefreshIndicator(
                    onRefresh: _loadTickets,
                    color: const Color(0xFF1E2532),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(20),
                      itemCount: _filteredTickets.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final t = _filteredTickets[index];
                        return InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    MaintenanceDetailsScreen(ticketId: t.id),
                              ),
                            ).then((_) => _loadTickets());
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFFE8ECEF),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  child: const Icon(
                                    Icons.check_circle,
                                    color: Colors.green,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'TKT-${t.id}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade500,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          Text(
                                            t.createdAt.toString().substring(
                                              0,
                                              10,
                                            ),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade500,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        t.title,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF17212B),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: t.status == 'Pending'
                                                  ? Colors.orange.shade50
                                                  : t.status == 'In Progress'
                                                  ? Colors.blue.shade50
                                                  : (t.status == 'Resolved' ||
                                                        t.status == 'Assigned')
                                                  ? Colors.green.shade50
                                                  : t.status == 'Closed'
                                                  ? Colors.red.shade50
                                                  : Colors.grey.shade100,
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              t.status,
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: t.status == 'Pending'
                                                    ? Colors.orange.shade700
                                                    : t.status == 'In Progress'
                                                    ? Colors.blue.shade700
                                                    : (t.status == 'Resolved' ||
                                                          t.status ==
                                                              'Assigned')
                                                    ? Colors.green.shade700
                                                    : t.status == 'Closed'
                                                    ? Colors.red.shade700
                                                    : Colors.grey.shade700,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            t.category?.name ?? 'General',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade600,
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            'Rs. ${t.repairCost.toStringAsFixed(0)}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF1E2532),
                                              fontSize: 14,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.chevron_right,
                                  color: Colors.grey.shade400,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
