import 'package:flutter/material.dart';
import 'dart:math';

class CostFilterBottomSheet extends StatefulWidget {
  final double currentMin;
  final double currentMax;
  final Function(double, double) onApply;

  const CostFilterBottomSheet({
    super.key,
    required this.currentMin,
    required this.currentMax,
    required this.onApply,
  });

  @override
  State<CostFilterBottomSheet> createState() => _CostFilterBottomSheetState();
}

class _CostFilterBottomSheetState extends State<CostFilterBottomSheet> {
  late double _minVal;
  late double _maxVal;

  @override
  void initState() {
    super.initState();
    _minVal = widget.currentMin;
    _maxVal = widget.currentMax;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox(width: 24), // Balance for centering
                const Text('Filters', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1E2532))),
                InkWell(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, color: Colors.black87),
                ),
              ],
            ),
            const SizedBox(height: 32),
            
            const Text('Repair Cost Range', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
            const SizedBox(height: 8),
            Text(
              '\$${_minVal.toInt()} - \$${_maxVal.toInt()}',
              style: TextStyle(fontSize: 15, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 4),
            Text(
              'The average repair cost is \$120',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
            ),
            
            const SizedBox(height: 32),
            
            // The Graph and Slider
            Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                // The curved graph
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    height: 80,
                    width: double.infinity,
                    child: CustomPaint(
                      painter: _CurvedGraphPainter(
                        minVal: 0,
                        maxVal: 5000,
                        currentMin: _minVal,
                        currentMax: _maxVal,
                      ),
                    ),
                  ),
                ),
                
                // The Range Slider
                Positioned(
                  bottom: -20,
                  left: -10,
                  right: -10,
                  child: SliderTheme(
                    data: SliderThemeData(
                      trackHeight: 4,
                      activeTrackColor: const Color(0xFF4FC3F7),
                      inactiveTrackColor: Colors.grey.shade200,
                      thumbColor: Colors.white,
                      overlayColor: const Color(0xFF4FC3F7).withOpacity(0.1),
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 12, elevation: 4),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 24),
                    ),
                    child: RangeSlider(
                      min: 0,
                      max: 5000,
                      values: RangeValues(_minVal, _maxVal),
                      onChanged: (values) {
                        setState(() {
                          _minVal = values.start;
                          _maxVal = values.end;
                        });
                      },
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 50),
            
            // Apply Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  widget.onApply(_minVal, _maxVal);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2532),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('Apply Filter', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CurvedGraphPainter extends CustomPainter {
  final double minVal;
  final double maxVal;
  final double currentMin;
  final double currentMax;

  _CurvedGraphPainter({
    required this.minVal,
    required this.maxVal,
    required this.currentMin,
    required this.currentMax,
  });

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
    
    // A dummy distribution curve (like a bell curve right-skewed)
    // Points represent the density at different price points
    final List<double> dataPoints = [0.1, 0.2, 0.4, 0.8, 1.0, 0.8, 0.6, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05, 0.02, 0.0];
    
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

    // Determine the active selection range to clip or highlight
    // In this basic version, we draw the whole graph. 
    // To make it look exactly like the image where ONLY the active range is colored blue, 
    // we can use a clipRect.
    
    final double startRatio = (currentMin - minVal) / (maxVal - minVal);
    final double endRatio = (currentMax - minVal) / (maxVal - minVal);
    
    final Rect clipRect = Rect.fromLTRB(
      size.width * startRatio, 
      0, 
      size.width * endRatio, 
      size.height
    );

    // Draw inactive gray area first
    final Paint inactivePaint = Paint()
      ..color = Colors.grey.shade200
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, inactivePaint);
    
    // Clip and draw active blue area
    canvas.save();
    canvas.clipRect(clipRect);
    canvas.drawPath(path, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CurvedGraphPainter oldDelegate) {
    return oldDelegate.currentMin != currentMin || oldDelegate.currentMax != currentMax;
  }
}
