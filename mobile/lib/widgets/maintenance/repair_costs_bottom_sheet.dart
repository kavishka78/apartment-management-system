import 'package:flutter/material.dart';
import '../../models/maintenance/maintenance_model.dart';
import 'package:intl/intl.dart';
import '../../screens/payment/my_invoices_screen.dart';

class RepairCostsBottomSheet extends StatelessWidget {
  final List<MaintenanceTicket> tickets;

  const RepairCostsBottomSheet({
    super.key,
    required this.tickets,
  });

  @override
  Widget build(BuildContext context) {
    // Calculate stats
    final resolvedTickets = tickets.where((t) => t.repairCost > 0).toList();
    final double totalCost = resolvedTickets.fold(0, (sum, t) => sum + t.repairCost);
    final double maxCost = resolvedTickets.isEmpty ? 1000 : resolvedTickets.map((t) => t.repairCost).reduce((a, b) => a > b ? a : b);
    
    // Create a normalized distribution for the graph
    List<double> dataPoints = List.filled(10, 0.0);
    if (resolvedTickets.isNotEmpty && maxCost > 0) {
      for (var t in resolvedTickets) {
        int bucket = ((t.repairCost / maxCost) * 9).floor();
        if (bucket > 9) bucket = 9;
        dataPoints[bucket] += 1.0;
      }
      // Normalize
      double maxCount = dataPoints.reduce((a, b) => a > b ? a : b);
      if (maxCount > 0) {
        for (int i = 0; i < dataPoints.length; i++) {
          dataPoints[i] = dataPoints[i] / maxCount;
        }
      }
    } else {
      dataPoints = [0.1, 0.2, 0.4, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1]; // Fallback dummy curve
    }

    return Container(
      padding: const EdgeInsets.only(top: 24, left: 24, right: 24, bottom: 0),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
      ),
      height: MediaQuery.of(context).size.height * 0.85,
      child: SafeArea(
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SizedBox(width: 24),
              const Text('Repair Costs Analysis', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1E2532))),
              InkWell(
                onTap: () => Navigator.pop(context),
                child: const Icon(Icons.close, color: Colors.black87),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          const Text('Total Expenditures', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
          const SizedBox(height: 8),
          Text(
            'Rs. ${totalCost.toStringAsFixed(2)}',
            style: const TextStyle(fontSize: 24, color: Color(0xFF4FC3F7), fontWeight: FontWeight.bold),
          ),
          
          const SizedBox(height: 32),
          
          // The Graph
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              height: 100,
              width: double.infinity,
              child: CustomPaint(
                painter: _CurvedGraphPainter(dataPoints: dataPoints),
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          const Text('Cost Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
          const SizedBox(height: 16),
          
          Expanded(
            child: resolvedTickets.isEmpty 
              ? Center(child: Text('No repair costs recorded.', style: TextStyle(color: Colors.grey.shade500)))
              : ListView.separated(
                  itemCount: resolvedTickets.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final t = resolvedTickets[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFF4FC3F7).withOpacity(0.1),
                        child: const Icon(Icons.build, color: Color(0xFF4FC3F7), size: 18),
                      ),
                      title: Text(t.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      subtitle: Text(DateFormat('MMM dd, yyyy').format(t.createdAt), style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                      trailing: Text('Rs. ${t.repairCost.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    );
                  },
                ),
          ),
          
          const SizedBox(height: 16),
          
          // Pay Now Button
          SizedBox(
            width: double.infinity,
            height: 56,
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: const Text('Pay Pending Costs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
      ),
    );
  }
}

class _CurvedGraphPainter extends CustomPainter {
  final List<double> dataPoints;

  _CurvedGraphPainter({required this.dataPoints});

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFF4FC3F7).withOpacity(0.5),
          const Color(0xFF4FC3F7).withOpacity(0.1),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    final Path path = Path();
    
    final double stepX = size.width / (dataPoints.length - 1);
    
    path.moveTo(0, size.height);
    
    for (int i = 0; i < dataPoints.length; i++) {
      final double x = i * stepX;
      final double y = size.height - (dataPoints[i] * size.height * 0.9); // max height is 90%
      
      if (i == 0) {
        path.lineTo(x, y);
      } else {
        // Curve smoothing
        final double prevX = (i - 1) * stepX;
        final double prevY = size.height - (dataPoints[i - 1] * size.height * 0.9);
        final double controlX = prevX + (x - prevX) / 2;
        path.cubicTo(controlX, prevY, controlX, y, x, y);
      }
    }
    
    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CurvedGraphPainter oldDelegate) {
    return true;
  }
}
