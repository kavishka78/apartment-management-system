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


  String _formatTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 1) return DateFormat('MMM d, h:mm a').format(date);
    if (diff.inDays == 1) return 'Yesterday ${DateFormat('h:mm a').format(date)}';
    if (diff.inHours > 0) return '${diff.inHours} hours ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes} minutes ago';
    return 'Just now';
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
            child: const Text('Mark all read', style: TextStyle(color: Color(0xFF1E2532), fontWeight: FontWeight.w600)),
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
                        itemCount: _notifications.length,
                        separatorBuilder: (context, index) => const Divider(height: 1, thickness: 1, color: Color(0xFFF0F0F0)),
                        itemBuilder: (context, index) {
                          final n = _notifications[index];
                          final bool isRead = n['isRead'];
                          final createdAt = DateTime.parse(n['createdAt']);

                          return GestureDetector(
                            onTap: () {
                              if (!isRead) _markAsRead(n['id']);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                              color: isRead ? Colors.transparent : Colors.blue.withOpacity(0.05),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Blue Dot
                                  Padding(
                                    padding: const EdgeInsets.only(top: 6, right: 12),
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: isRead ? Colors.transparent : const Color(0xFF1E2532),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                  // Content
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          n['title'],
                                          style: TextStyle(
                                            fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                                            fontSize: 15,
                                            color: const Color(0xFF1E2532),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          n['message'],
                                          style: TextStyle(
                                            color: isRead ? Colors.grey.shade600 : const Color(0xFF1E2532).withOpacity(0.85),
                                            fontSize: 14,
                                            height: 1.4,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          _formatTimeAgo(createdAt),
                                          style: TextStyle(
                                            color: Colors.grey.shade400,
                                            fontSize: 12,
                                          ),
                                        ),
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
