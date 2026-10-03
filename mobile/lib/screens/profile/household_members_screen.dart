import 'package:flutter/material.dart';
import '../../models/profile/profile_models.dart';
import '../../services/auth/auth_service.dart';
import '../../services/profile/profile_api_service.dart';

class HouseholdMembersScreen extends StatefulWidget {
  final int residentId;
  const HouseholdMembersScreen({super.key, required this.residentId});

  @override
  State<HouseholdMembersScreen> createState() => _HouseholdMembersScreenState();
}

class _HouseholdMembersScreenState extends State<HouseholdMembersScreen> {
  List<HouseholdMemberModel> _members = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    setState(() => _isLoading = true);
    final members = await ProfileApiService.getHouseholdMembers(widget.residentId);
    if (mounted) {
      setState(() {
        _members = members;
        _isLoading = false;
      });
    }
  }

  void _showAddMemberSheet() {
    final nameCtrl = TextEditingController();
    final ageCtrl = TextEditingController();
    String selectedRelation = 'Spouse';
    final relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Roommate'];

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
                  'Add Household Member',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF17212B),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Register an occupant living with you in this unit.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 20),

                // Full Name
                const Text(
                  'Full Name',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: nameCtrl,
                  decoration: InputDecoration(
                    hintText: 'e.g. Nimalka Silva',
                    prefixIcon: const Icon(Icons.person_outline, size: 20),
                    filled: true,
                    fillColor: const Color(0xFFF5F7F8),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // Relationship & Age
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Relationship',
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
                                value: selectedRelation,
                                isExpanded: true,
                                items: relations
                                    .map((r) => DropdownMenuItem(
                                          value: r,
                                          child: Text(r, style: const TextStyle(fontSize: 14)),
                                        ))
                                    .toList(),
                                onChanged: (v) {
                                  if (v != null) {
                                    setSheetState(() => selectedRelation = v);
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Age',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: ageCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              hintText: '28',
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
                const SizedBox(height: 24),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      final name = nameCtrl.text.trim();
                      if (name.isEmpty) return;

                      Navigator.pop(ctx);
                      setState(() => _isLoading = true);

                      await ProfileApiService.addHouseholdMember(
                        widget.residentId,
                        name: name,
                        relation: selectedRelation,
                        age: ageCtrl.text.trim().isEmpty ? 'N/A' : ageCtrl.text.trim(),
                      );
                      _loadMembers();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF17212B),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Save Member',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(HouseholdMemberModel member) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Member'),
        content: Text('Remove ${member.name} from your registered household?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      await ProfileApiService.removeHouseholdMember(widget.residentId, member.id);
      _loadMembers();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        title: const Text(
          'Household Members',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF17212B),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showAddMemberSheet,
            icon: const Icon(Icons.person_add_alt_1_rounded),
            tooltip: 'Add Member',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF17212B)),
              ),
            )
          : _members.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.family_restroom_rounded,
                            size: 48,
                            color: Color(0xFF17212B),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No Household Members',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Register family members or co-residents living in your apartment unit.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _showAddMemberSheet,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Add First Member'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF17212B),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMembers,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: _members.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, idx) {
                      final m = _members[idx];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE8ECEF)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: const Color(0xFF17212B).withOpacity(0.08),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.person_rounded,
                                color: Color(0xFF17212B),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    m.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.shade50,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          m.relation,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue.shade800,
                                          ),
                                        ),
                                      ),
                                      if (m.age.isNotEmpty && m.age != 'N/A') ...[
                                        const SizedBox(width: 8),
                                        Text(
                                          'Age: ${m.age}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () => _confirmDelete(m),
                              icon: const Icon(Icons.delete_outline_rounded,
                                  color: Colors.redAccent, size: 20),
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
