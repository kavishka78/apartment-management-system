import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';

class PaymentApiService {
  static String get baseUrl => const String.fromEnvironment(
    'PAYMENT_API_URL',
    defaultValue: kIsWeb
        ? 'http://localhost:5073/api'
        : 'http://10.0.2.2:5073/api',
  );
  static String get agentUrl => const String.fromEnvironment(
    'PAYMENT_AGENT_URL',
    defaultValue: kIsWeb ? 'http://localhost:8001' : 'http://10.0.2.2:8001',
  );

  static Future<Map<String, String>> _headers() async {
    final session = await AuthService.getSession();
    if (session == null || !session.isValid) {
      throw StateError('Please sign in to view payments.');
    }
    return AuthService.authHeaders();
  }

  static Future<Map<String, dynamic>> _request(
    String url, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final headers = await _headers();
      final response =
          await (body == null
                  ? http.get(Uri.parse(url), headers: headers)
                  : http.post(
                      Uri.parse(url),
                      headers: headers,
                      body: jsonEncode(body),
                    ))
              .timeout(const Duration(seconds: 60));
      if (response.statusCode == 401 || response.statusCode == 403) {
        return {
          'success': false,
          'message': 'Your session is invalid or access was denied. Please sign in again.',
        };
      }
      dynamic data;
      try {
        data = jsonDecode(response.body);
      } catch (_) {
        data = null;
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': data};
      }
      return {
        'success': false,
        'message': data is Map
            ? data['message'] ??
                  data['detail']?.toString() ??
                  'Payment request failed.'
            : 'Payment request failed (${response.statusCode}).',
      };
    } catch (_) {
      return {
        'success': false,
        'message':
            'Unable to connect. Check your connection and sign-in session.',
      };
    }
  }

  // Fetch every page; the backend selects the resident from the JWT.
  static Future<Map<String, dynamic>> _allPages(String path) async {
    final items = <dynamic>[];
    var page = 1;
    while (true) {
      final result = await _request('$baseUrl/$path?page=$page&pageSize=100');
      if (result['success'] != true) return result;
      final data = result['data'] as Map<String, dynamic>;
      items.addAll(data['items'] as List);
      if (page >= (data['totalPages'] as int)) break;
      page++;
    }
    return {
      'success': true,
      'data': {'items': items},
    };
  }

  static Future<Map<String, dynamic>> getInvoices() => _allPages('invoices');
  static Future<Map<String, dynamic>> getInvoiceById(int invoiceId) =>
      _request('$baseUrl/invoices/$invoiceId');
  static Future<Map<String, dynamic>> getPaymentsForResident() =>
      _allPages('payments');
  static Future<Map<String, dynamic>> getReceipt(int paymentId) =>
      _request('$baseUrl/payments/$paymentId/receipt');

  static Future<Map<String, dynamic>> getReceiptsForResident() async {
    final result = await getPaymentsForResident();
    if (result['success'] != true) return result;
    final receipts = <dynamic>[];
    for (final payment in result['data']['items']) {
      if (payment['status'] != 'Verified') continue;
      final receipt = await getReceipt(payment['id'] as int);
      if (receipt['success'] != true) return receipt;
      receipts.add(receipt['data']);
    }
    return {
      'success': true,
      'data': {'items': receipts},
    };
  }

  static Future<Map<String, dynamic>> createPaymentIntent({
    required int invoiceId,
  }) => _request(
    '$baseUrl/payments/create-intent',
    body: {'invoiceId': invoiceId},
  );
  static Future<Map<String, dynamic>> confirmStripePayment({
    required String paymentIntentId,
  }) => _request(
    '$baseUrl/payments/confirm-stripe',
    body: {'paymentIntentId': paymentIntentId},
  );

  static Future<Map<String, dynamic>> chat(String message) => _request(
    '$agentUrl/chat',
    body: {'message': message, 'local_time': DateTime.now().toIso8601String()},
  );
}
