import 'package:flutter/material.dart';
import '../../models/maintenance/maintenance_model.dart';
import '../../services/maintenance/maintenance_api_service.dart';
import '../../widgets/maintenance/maintenance_widgets.dart';
import '../../widgets/maintenance/maintenance_skeleton.dart';
import 'maintenance_details_screen.dart';
import 'maintenance_home_screen.dart'; // for CURRENT_RESIDENT_ID

class MyComplaintsScreen extends StatefulWidget {
  const MyComplaintsScreen({super.key});

  @override
  State<MyComplaintsScreen> createState() => _MyComplaintsScreenState();
}

class _MyComplaintsScreenState extends State<MyComplaintsScreen> {
  bool _isLoading = true;
  String _error = '';
  List<MaintenanceTicket> _allTickets = [];
  List<MaintenanceTicket> _filteredTickets = [];
  
  String _searchQuery = '';
  String _statusFilter = 'All';
  String _categoryFilter = 'All Categories';
  List<String> _categories = ['All Categories'];

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

    final result = await MaintenanceApiService.getComplaints(residentId: CURRENT_RESIDENT_ID);
    
    if (result['success'] == true) {
      final items = result['data'] as List;
      if (mounted) {
        setState(() {
          _allTickets = items.map((e) => MaintenanceTicket.fromJson(e)).toList();
          
          // Exclude Resolved and Closed from "My Complaints" active view if desired, but requirements didn't explicitly ask for it, 
          // they asked for a separate History screen. So we'll exclude Closed to keep it clean.
          _allTickets = _allTickets.where((t) => t.status != 'Closed').toList();
          
          _allTickets.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          
          // Populate categories for filter
          final cats = _allTickets.map((e) => e.category?.name ?? 'General').toSet().toList();
          _categories = ['All Categories', ...cats];

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
        final matchesSearch = t.title.toLowerCase().contains(_searchQuery) ||
                              t.description.toLowerCase().contains(_searchQuery);
        final matchesStatus = _statusFilter == 'All' || t.status == _statusFilter;
        final tCategory = t.category?.name ?? 'General';
        final matchesCategory = _categoryFilter == 'All Categories' || tCategory == _categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'My Complaints',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w700, fontSize: 18),
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
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE8ECEF)),
              ),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search tickets...',
                  hintStyle: TextStyle(color: Colors.grey),
                  prefixIcon: Icon(Icons.search, color: Colors.grey),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: (val) {
                  _searchQuery = val.toLowerCase();
                  _applyFilters();
                },
              ),
            ),
          ),
          
          // Filters Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE8ECEF)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        borderRadius: BorderRadius.circular(16), dropdownColor: Colors.white, elevation: 8, value: _categoryFilter,
                        isExpanded: true,
                        icon: const Icon(Icons.arrow_drop_down, color: Colors.grey),
                        style: const TextStyle(color: Colors.black87, fontSize: 13, fontWeight: FontWeight.w500),
                        onChanged: (String? newValue) {
                          if (newValue != null) {
                            setState(() {
                              _categoryFilter = newValue;
                              _applyFilters();
                            });
                          }
                        },
                        items: _categories.map<DropdownMenuItem<String>>((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Padding(padding: const EdgeInsets.symmetric(vertical: 8.0), child: Text(value, style: const TextStyle(fontSize: 14))),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Status Filter Chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'].map((status) {
                final isSelected = _statusFilter == status;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(status),
                    selected: isSelected,
                    selectedColor: const Color(0xFF1E2532),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: isSelected ? const Color(0xFF1E2532) : const Color(0xFFE8ECEF),
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

          Expanded(
            child: _isLoading
                ? const MaintenanceSkeleton(itemCount: 4)
                : _error.isNotEmpty
                    ? Center(child: Text(_error, style: const TextStyle(color: Colors.red)))
                    : _filteredTickets.isEmpty
                        ? const EmptyStateWidget(
                            title: 'No complaints found',
                            message: "You don't have any active maintenance requests matching the filters.",
                            icon: Icons.list_alt,
                          )
                        : RefreshIndicator(
                            onRefresh: _loadTickets,
                            color: const Color(0xFF1E2532),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(20),
                              itemCount: _filteredTickets.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final t = _filteredTickets[index];
                                return InkWell(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => MaintenanceDetailsScreen(ticketId: t.id),
                                      ),
                                    ).then((_) => _loadTickets());
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: const Color(0xFFE8ECEF)),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.02),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 50,
                                          height: 50,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF5F7F8),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          clipBehavior: Clip.antiAlias,
                                          child: t.photoPath != null && t.photoPath!.isNotEmpty
                                              ? Image.network(
                                                  'http://10.0.2.2:5073${t.photoPath}',
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (context, error, stackTrace) => 
                                                    const Icon(Icons.build_circle, color: Color(0xFF1E2532), size: 24),
                                                )
                                              : const Icon(Icons.build_circle, color: Color(0xFF1E2532), size: 24),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Text(
                                                    'TKT-${t.id}',
                                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w600),
                                                  ),
                                                  Text(
                                                    t.createdAt.toString().substring(0, 10),
                                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                                                  )
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                t.title,
                                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF17212B)),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 6),
                                              Row(
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: t.status == 'Pending' ? Colors.orange.shade50 : 
                                                             t.status == 'In Progress' ? Colors.blue.shade50 :
                                                             t.status == 'Resolved' ? Colors.green.shade50 :
                                                             Colors.grey.shade100,
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                    child: Text(
                                                      t.status,
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w600,
                                                        color: t.status == 'Pending' ? Colors.orange.shade700 : 
                                                               t.status == 'In Progress' ? Colors.blue.shade700 :
                                                               t.status == 'Resolved' ? Colors.green.shade700 :
                                                               Colors.grey.shade700,
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(t.category?.name ?? 'General', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                                ],
                                              )
                                            ],
                                          ),
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
