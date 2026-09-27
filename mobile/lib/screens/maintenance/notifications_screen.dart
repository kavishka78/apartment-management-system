import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'maintenance_home_screen.dart'; // For CURRENT_RESIDENT_ID

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    
    try {
      final response = await http.get(Uri.parse('http://10.0.2.2:5073/api/Notifications/resident/$CURRENT_RESIDENT_ID'));
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _notifications = json.decode(response.body);
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Failed to load notifications';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Connection error. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _markAsRead(int id) async {
    try {
      await http.post(Uri.parse('http://10.0.2.2:5073/api/Notifications/$id/read'));
      _loadNotifications(); // Reload to update UI
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await http.post(Uri.parse('http://10.0.2.2:5073/api/Notifications/resident/$CURRENT_RESIDENT_ID/read-all'));
      _loadNotifications();
    } catch (e) {
      // Ignore
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _notifications.any((n) => n['isRead'] == false) ? _markAllAsRead : null,
            child: const Text('Mark all read', style: TextStyle(color: Color(0xFF4FC3F7), fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1E2532)))
          : _error.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
                      const SizedBox(height: 16),
                      Text(_error, style: TextStyle(color: Colors.red.shade400)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadNotifications, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E2532)), child: const Text('Retry', style: TextStyle(color: Colors.white)))
                    ],
                  ),
                )
              : _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text('No notifications yet', style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadNotifications,
                      color: const Color(0xFF1E2532),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _notifications.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final n = _notifications[index];
                          final bool isRead = n['isRead'];
                          final createdAt = DateTime.parse(n['createdAt']);

                          return GestureDetector(
                            onTap: () {
                              if (!isRead) _markAsRead(n['id']);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isRead ? Colors.white : const Color(0xFFE3F2FD).withOpacity(0.5),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: isRead ? const Color(0xFFE8ECEF) : const Color(0xFF4FC3F7).withOpacity(0.3)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: isRead ? Colors.grey.shade100 : const Color(0xFF4FC3F7).withOpacity(0.2),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(Icons.build_circle, color: isRead ? Colors.grey.shade500 : const Color(0xFF1E88E5), size: 24),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(child: Text(n['title'], style: TextStyle(fontWeight: isRead ? FontWeight.w600 : FontWeight.w800, fontSize: 15, color: const Color(0xFF1E2532)))),
                                            if (!isRead)
                                              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(n['message'], style: TextStyle(color: isRead ? Colors.grey.shade600 : const Color(0xFF1E2532).withOpacity(0.8), fontSize: 13, height: 1.4)),
                                        const SizedBox(height: 10),
                                        Text(DateFormat('MMM d, h:mm a').format(createdAt), style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
