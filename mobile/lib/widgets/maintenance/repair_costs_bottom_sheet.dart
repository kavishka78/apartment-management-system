import 'package:flutter/material.dart';
import '../../models/maintenance/maintenance_model.dart';
import 'package:intl/intl.dart';
import '../../screens/payment/my_invoices_screen.dart';

class RepairCostsBottomSheet extends StatefulWidget {
  final List<MaintenanceTicket> tickets;

  const RepairCostsBottomSheet({
    super.key,
    required this.tickets,
  });

  @override
  State<RepairCostsBottomSheet> createState() => _RepairCostsBottomSheetState();
}

class _RepairCostsBottomSheetState extends State<RepairCostsBottomSheet> {
  int? _selectedBarIndex;
  String _filterMode = 'Monthly'; // 'Daily', 'Monthly', 'Yearly'

  @override
  Widget build(BuildContext context) {
    // 1. Calculate general stats
    final resolvedTickets = widget.tickets.where((t) => t.repairCost > 0).toList();
    resolvedTickets.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final double totalCost = resolvedTickets.fold(0, (sum, t) => sum + t.repairCost);

    // 2. Prepare Chart Data dynamically based on Filter Mode
    final now = DateTime.now();
    final List<String> xAxisLabels = [];
    final List<double> chartCosts = [];
    
    if (_filterMode == 'Monthly') {
      for (int i = 5; i >= 0; i--) {
        final targetDate = DateTime(now.year, now.month - i, 1);
        xAxisLabels.add(DateFormat('MMM').format(targetDate));
        double cost = 0;
        for (var t in resolvedTickets) {
          if (t.createdAt.year == targetDate.year && t.createdAt.month == targetDate.month) {
            cost += t.repairCost;
          }
        }
        chartCosts.add(cost);
      }
    } else if (_filterMode == 'Yearly') {
      for (int i = 4; i >= 0; i--) {
        final targetYear = now.year - i;
        xAxisLabels.add(targetYear.toString());
        double cost = 0;
        for (var t in resolvedTickets) {
          if (t.createdAt.year == targetYear) cost += t.repairCost;
        }
        chartCosts.add(cost);
      }
    } else if (_filterMode == 'Daily') {
      for (int i = 6; i >= 0; i--) {
        final targetDate = now.subtract(Duration(days: i));
        xAxisLabels.add(DateFormat('E').format(targetDate)); // Mon, Tue...
        double cost = 0;
        for (var t in resolvedTickets) {
          if (t.createdAt.year == targetDate.year && t.createdAt.month == targetDate.month && t.createdAt.day == targetDate.day) {
            cost += t.repairCost;
          }
        }
        chartCosts.add(cost);
      }
    }

    // 3. Chart Scaling
    double maxCost = chartCosts.isEmpty ? 0 : chartCosts.reduce((a, b) => a > b ? a : b);
    if (maxCost == 0) maxCost = 10000;
    
    final double stepValue = maxCost / 4;
    final List<double> yAxisValues = [maxCost, stepValue * 3, stepValue * 2, stepValue, 0];

    return Container(
      padding: const EdgeInsets.only(top: 24, left: 0, right: 0, bottom: 0),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
      ),
      height: MediaQuery.of(context).size.height * 0.88,
      child: SafeArea(
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox(width: 24),
                const Text('Repair Costs Analysis', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
                InkWell(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                    child: const Icon(Icons.close, color: Colors.black87, size: 18),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Expenditures', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black54)),
                    const SizedBox(height: 4),
                    Text(
                      'Rs. ${totalCost.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 26, color: Color(0xFF1E2532), fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
                // Upgraded Dropdown Filter UI
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F9FA),
                    border: Border.all(color: const Color(0xFFE8ECEF), width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
                    ],
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _filterMode,
                      icon: const Padding(
                        padding: EdgeInsets.only(left: 8),
                        child: Icon(Icons.tune_rounded, color: Color(0xFF1E2532), size: 16),
                      ),
                      isDense: true,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E2532)),
                      dropdownColor: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      items: ['Daily', 'Monthly', 'Yearly'].map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        );
                      }).toList(),
                      onChanged: (newValue) {
                        if (newValue != null) {
                          setState(() {
                            _filterMode = newValue;
                            _selectedBarIndex = null;
                          });
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Interactive Bar Chart Area - FIXED OVERFLOW
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: SizedBox(
              height: 220, // Increased height to prevent tooltip + bar overflow
              child: Row(
                children: [
                  // Y-Axis Labels
                  Padding(
                    padding: const EdgeInsets.only(bottom: 24), // Offset to align with bottom of bars
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: yAxisValues.map((val) {
                        String label = val >= 1000 ? '${(val / 1000).toStringAsFixed(1)}k' : val.toStringAsFixed(0);
                        return Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade400, fontWeight: FontWeight.w600, height: 1));
                      }).toList(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Chart Area
                  Expanded(
                    child: Stack(
                      children: [
                        // Background Grid Lines
                        Padding(
                          padding: const EdgeInsets.only(bottom: 24), 
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: List.generate(5, (index) {
                              return Divider(color: Colors.grey.shade100, thickness: 1, height: 1);
                            }),
                          ),
                        ),
                        
                        // Interactive Bars
                        Positioned.fill(
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () => setState(() => _selectedBarIndex = null),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: List.generate(xAxisLabels.length, (index) {
                                // Lowered max multiplier to 140 to guarantee no vertical overflow
                                final double barHeight = maxCost == 0 ? 0 : (chartCosts[index] / maxCost) * 140; 
                                final bool isSelected = _selectedBarIndex == index;
                                
                                return GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _selectedBarIndex = isSelected ? null : index;
                                    });
                                  },
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      // Tooltip
                                      Opacity(
                                        opacity: isSelected ? 1.0 : 0.0,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                          margin: const EdgeInsets.only(bottom: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1E2532),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'Rs.${chartCosts[index].toStringAsFixed(0)}',
                                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                      // Bar
                                      Container(
                                        width: _filterMode == 'Yearly' ? 32 : 24,
                                        height: barHeight,
                                        decoration: BoxDecoration(
                                          color: chartCosts[index] > 0 
                                              ? (isSelected ? const Color(0xFF1E2532) : const Color(0xFF4FC3F7)) 
                                              : Colors.transparent,
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(6),
                                            topRight: Radius.circular(6),
                                            bottomLeft: Radius.circular(2),
                                            bottomRight: Radius.circular(2),
                                          ),
                                          boxShadow: isSelected && chartCosts[index] > 0 ? [
                                            BoxShadow(color: const Color(0xFF1E2532).withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2))
                                          ] : [],
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      // X-Axis Label
                                      Text(
                                        xAxisLabels[index],
                                        style: TextStyle(
                                          fontSize: 10, 
                                          color: isSelected ? const Color(0xFF1E2532) : Colors.grey.shade500, 
                                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text('Recent Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
          ),
          const SizedBox(height: 12),
          
          Expanded(
            child: resolvedTickets.isEmpty 
              ? Center(child: Text('No repair costs recorded.', style: TextStyle(color: Colors.grey.shade500)))
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  itemCount: resolvedTickets.length,
                  separatorBuilder: (context, index) => Divider(height: 24, color: Colors.grey.shade100),
                  itemBuilder: (context, index) {
                    final t = resolvedTickets[index];
                    return Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4FC3F7).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF4FC3F7), size: 20),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF1E2532)), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Text(DateFormat('MMM dd, yyyy').format(t.createdAt), style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                            ],
                          ),
                        ),
                        Text('Rs. ${t.repairCost.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF1E2532))),
                      ],
                    );
                  },
                ),
          ),
          
          // Pay Now Button Area
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MyInvoicesScreen()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2532),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Pay Pending Costs', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ),
            ),
          ),
        ],
      ),
      ),
    );
  }
}
