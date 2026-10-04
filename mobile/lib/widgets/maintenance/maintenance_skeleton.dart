import 'package:flutter/material.dart';

class MaintenanceSkeleton extends StatefulWidget {
  final int itemCount;
  const MaintenanceSkeleton({super.key, this.itemCount = 3});

  @override
  State<MaintenanceSkeleton> createState() => _MaintenanceSkeletonState();
}

class _MaintenanceSkeletonState extends State<MaintenanceSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    
    _animation = Tween<double>(begin: 0.3, end: 0.8).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: widget.itemCount,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        return FadeTransition(
          opacity: _animation,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE8ECEF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(height: 16, width: 150, color: Colors.grey.shade200),
                    Container(
                      height: 24,
                      width: 70,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(height: 14, width: 100, color: Colors.grey.shade200),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(height: 14, width: 80, color: Colors.grey.shade200),
                    Container(height: 14, width: 90, color: Colors.grey.shade200),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
