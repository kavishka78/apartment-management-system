import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../../services/maintenance/maintenance_api_service.dart';
import '../../services/auth/auth_service.dart';
import 'my_complaints_screen.dart';
import 'maintenance_details_screen.dart';
import '../../models/maintenance/maintenance_model.dart';
 // IMPORTANT: Import for navigation!

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
      final resId = AuthService.currentSession?.residentId ?? 0;
      final response = await http.get(
        Uri.parse('http://10.0.2.2:5073/api/Notifications/resident/$resId'),
        headers: await AuthService.authHeaders(),
      );
      if (response.statusCode == 200) {
        setState(() {
          _notifications = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load notifications';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error. Please try again.';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(int id) async {
    try {
      await http.post(
        Uri.parse('http://10.0.2.2:5073/api/Notifications/$id/read'),
        headers: await AuthService.authHeaders(),
      );
      _loadNotifications(); // Reload to update UI
    } catch (e) {
      // Ignore error for now
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final resId = AuthService.currentSession?.residentId ?? 0;
      await http.post(
        Uri.parse('http://10.0.2.2:5073/api/Notifications/resident/$resId/read-all'),
        headers: await AuthService.authHeaders(),
      );
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
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error, style: const TextStyle(color: Colors.red)),
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
                              
                              if (n['title'] == 'Maintenance Resolved') {
                                // Extract the title from the message string: "Your request 'TV not working' has been resolved..."
                                final msg = n['message'] as String;
                                String? ticketTitle;
                                if (msg.startsWith("Your request '") && msg.contains("' has been resolved")) {
                                  ticketTitle = msg.substring(14, msg.indexOf("' has been resolved"));
                                }
                                
                                if (ticketTitle != null) {
                                  // Show quick loading snackbar while we fetch
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opening ticket details...'), duration: Duration(seconds: 1)));
                                  
                                  MaintenanceApiService.getComplaints().then((result) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    
                                    if (result['success'] == true) {
                                      final items = result['data'] as List;
                                      final tickets = items.map((j) => MaintenanceTicket.fromJson(j)).toList();
                                      
                                      try {
                                        final matchedTicket = tickets.firstWhere(
                                          (t) => t.title == ticketTitle && (t.status == 'Resolved' || t.status == 'Closed')
                                        );
                                        
                                        Navigator.push(
                                          context, 
                                          MaterialPageRoute(builder: (_) => MaintenanceDetailsScreen(ticketId: matchedTicket.id))
                                        );
                                      } catch (e) {
                                        Navigator.push(context, MaterialPageRoute(builder: (_) => const MyComplaintsScreen()));
                                      }
                                    } else {
                                      Navigator.push(context, MaterialPageRoute(builder: (_) => const MyComplaintsScreen()));
                                    }
                                  }).catchError((e) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const MyComplaintsScreen()));
                                  });
                                } else {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MyComplaintsScreen()));
                                }
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                              color: isRead ? Colors.transparent : Colors.blue.withValues(alpha: 0.05),
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
                                            color: isRead ? Colors.grey.shade600 : const Color(0xFF1E2532).withValues(alpha: 0.85),
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
