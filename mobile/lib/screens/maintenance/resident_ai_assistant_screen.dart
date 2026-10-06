import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/resident_maintenance_ai_service.dart';
import '../../models/maintenance/resident_ai_response.dart';
import '../../services/maintenance/maintenance_api_service.dart';
import '../../services/auth/auth_service.dart';

class ResidentAiAssistantScreen extends StatefulWidget {
  const ResidentAiAssistantScreen({Key? key}) : super(key: key);

  @override
  State<ResidentAiAssistantScreen> createState() =>
      _ResidentAiAssistantScreenState();
}

class _ResidentAiAssistantScreenState extends State<ResidentAiAssistantScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ResidentMaintenanceAiService _aiService =
      ResidentMaintenanceAiService();
  

  List<Map<String, String>> _messages = [
    {
      "role": "assistant",
      "content": "Hi! I'm your Maintenance Assistant. Describe the issue you're having, and I'll help you prepare a repair request.",
    },
  ];

  bool _isLoading = false;
  DraftComplaint? _finalDraft;
  bool _isSubmitting = false;



  // --- Local Chat History Logic ---
  Future<void> _saveChatHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final String encodedData = json.encode(_messages);
    await prefs.setString('resident_ai_chat_history', encodedData);
  }

  Future<void> _loadChatHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final String? encodedData = prefs.getString('resident_ai_chat_history');
    if (encodedData != null) {
      final List<dynamic> decodedList = json.decode(encodedData);
      setState(() {
        _messages = decodedList.map((e) => Map<String, String>.from(e)).toList();
      });
      // Scroll to bottom
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No chat history found."), duration: Duration(seconds: 2)),
      );
    }
  }
  // --------------------------------

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() { _messages.add({"role": "user", "content": text}); _isLoading = true; });
    _saveChatHistory();
    _messageController.clear();
    _scrollToBottom();

    try {
      final response = await _aiService.sendChatMessage(_messages);

      setState(() {
        _messages.add({"role": "assistant", "content": response.reply});
        if (response.status.toLowerCase() == 'ready' && response.draftComplaint != null) {
          _finalDraft = response.draftComplaint;
        }
      });
    } catch (e) {
      setState(() {
        _messages.add({
          "role": "assistant",
          "content": "Sorry, I encountered an error connecting to the system.",
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      _saveChatHistory();
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  
  void _submitComplaint() async {
    if (_finalDraft == null) return;
    setState(() => _isSubmitting = true);
    
    try {
      final session = await AuthService.getSession();
      if (session == null) throw Exception('Please sign in to create a complaint.');
      final response = await MaintenanceApiService.createComplaint(
        residentId: session.residentId,
        title: _finalDraft!.title,
        description: _finalDraft!.description,
        categoryId: _finalDraft!.categoryId,
        priority: 'Medium', // Default for AI, manager triage fixes it
      );
      
      if (response['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Maintenance request submitted successfully!')),
        );
        Navigator.pop(context, true); // True indicates refresh needed
      } else {
        throw Exception(response['message'] ?? 'Unknown error');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.history, color: Colors.black54),
            tooltip: 'Load Chat History',
            onPressed: _loadChatHistory,
          ),
        ],
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: Colors.blueAccent, size: 20),
            SizedBox(width: 8),
            Text(
              'Maintenance AI',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg["role"] == "user";
                return _buildMessageBubble(msg["content"]!, isUser);
              },
            ),
          ),
          
          
          if (_isLoading) _buildTypingIndicator(),
          _buildQuickReplies(),
          if (_finalDraft != null) _buildDraftCard(),

          _buildInputArea(),
        ],
      ),
    );
  }


  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, left: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF003893),
          borderRadius: BorderRadius.circular(20).copyWith(bottomLeft: const Radius.circular(0)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5, offset: const Offset(0, 2))],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
            SizedBox(width: 8),
            Text("Agent is typing...", style: TextStyle(color: Colors.white, fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(String text, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUser ? const Color(0xFF003893) : Colors.white,
          borderRadius: BorderRadius.circular(20).copyWith(
            bottomRight: isUser
                ? const Radius.circular(0)
                : const Radius.circular(20),
            bottomLeft: !isUser
                ? const Radius.circular(0)
                : const Radius.circular(20),
          ),
          boxShadow: [
            if (!isUser)
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Text(
            text,
            style: TextStyle(
              color: isUser ? Colors.white : Colors.black87,
              fontSize: 15,
            ),
          ),
      ),
    );
  }

  Widget _buildDraftCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE3F2FD),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.assignment_turned_in, color: Colors.blue),
              SizedBox(width: 8),
              Text(
                "Draft Complaint Ready",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            "Title: ${_finalDraft!.title}",
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text("Description: ${_finalDraft!.description}"),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF003893),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onPressed: _isSubmitting ? null : _submitComplaint,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      "Submit Official Complaint",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildQuickReplies() {
    if (_messages.length > 1 || _isLoading) return const SizedBox.shrink();
    
    final options = [
      {
        "text": "My kitchen sink is leaking water",
        "icon": Icons.water_drop_outlined,
        "color": Colors.blue,
        "bgColor": Colors.blue.withValues(alpha: 0.1),
      },
      {
        "text": "The power went out in my apartment",
        "icon": Icons.electrical_services_outlined,
        "color": Colors.purple,
        "bgColor": Colors.purple.withValues(alpha: 0.1),
      },
      {
        "text": "My air conditioner is not cooling",
        "icon": Icons.ac_unit,
        "color": Colors.orange,
        "bgColor": Colors.orange.withValues(alpha: 0.1),
      },
      {
        "text": "There is a strange noise from the heater",
        "icon": Icons.air,
        "color": Colors.green,
        "bgColor": Colors.green.withValues(alpha: 0.1),
      },
    ];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: options.map((opt) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                _messageController.text = opt["text"] as String;
                _sendMessage();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.transparent, // They can be transparent by default like the screenshot
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: opt["bgColor"] as Color,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        opt["icon"] as IconData,
                        color: opt["color"] as Color,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        opt["text"] as String,
                        style: const TextStyle(
                          fontSize: 15,
                          color: Color(0xFF333333),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Describe the issue...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF1F3F5),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                ),
                onSubmitted: (_) => _sendMessage(),
                enabled: _finalDraft == null, // disable if draft is ready
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: Color(0xFF1E2532),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white, size: 20),
                onPressed: _finalDraft == null ? _sendMessage : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
