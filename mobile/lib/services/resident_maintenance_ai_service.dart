import 'dart:convert';
import 'package:http/http.dart' as http;

import 'auth/auth_service.dart';
import 'api_config.dart';
import '../models/maintenance/resident_ai_response.dart';

class ResidentMaintenanceAiService {
  Future<ResidentAiResponse> sendChatMessage(List<Map<String, String>> messages) async {
    final token = await AuthService.getToken();
    if (token.isEmpty) throw Exception('No token found');

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/maintenance/chat'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'messages': messages,
      }),
    );

    if (response.statusCode == 200) {
      return ResidentAiResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to communicate with AI');
    }
  }
}
