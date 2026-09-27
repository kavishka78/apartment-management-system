import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class PaymentApiService {
  // Android Emulator -> PC ASP.NET backend
  static const String baseUrl = 'http://10.0.2.2:5073/api';

  // =========================================================
  // CREATE PAYMENT
  // =========================================================
  static Future<Map<String, dynamic>> createPayment({
    required int invoiceId,
    required double amount,
    required String cardholderName,
    required String cardNumber,
    required String expiryDate,
    required String cvv,
  }) async {
    final url = Uri.parse('$baseUrl/payments/create');

    final cleanCardNumber = cardNumber.replaceAll(' ', '');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'invoiceId': invoiceId,
          'amount': amount,
          'paymentMethod': 'Card',
          'cardholderName': cardholderName.trim(),
          'cardNumber': cleanCardNumber,
          'expiryDate': expiryDate,
          'cvv': cvv,
        }),
      );

      debugPrint('PAYMENT STATUS CODE: ${response.statusCode}');
      debugPrint('PAYMENT RESPONSE BODY: ${response.body}');

      dynamic decoded;

      if (response.body.isNotEmpty) {
        try {
          decoded = jsonDecode(response.body);
        } catch (_) {
          decoded = null;
        }
      }

      if (response.statusCode >= 200 &&
          response.statusCode < 300) {
        return {
          'success': true,
          'data': decoded,
        };
      }

      String errorMessage = 'Payment failed';

      if (decoded is Map<String, dynamic>) {
        if (decoded['message'] != null) {
          errorMessage = decoded['message'].toString();
        } else if (decoded['errors'] != null) {
          errorMessage = decoded['errors'].toString();
        } else if (decoded['title'] != null) {
          errorMessage = decoded['title'].toString();
        }
      } else if (response.body.isNotEmpty) {
        errorMessage = response.body;
      }

      return {
        'success': false,
        'message': '$errorMessage (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('PAYMENT API ERROR: $e');

      return {
        'success': false,
        'message': 'Cannot connect to server: $e',
      };
    }
  }

  // =========================================================
  // GET INVOICES
  // =========================================================
  static Future<Map<String, dynamic>> getInvoices({
    int? residentId,
  }) async {
    try {
      String endpoint = '$baseUrl/invoices';

      if (residentId != null) {
        endpoint += '?residentId=$residentId';
      }

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      debugPrint('INVOICES STATUS: ${response.statusCode}');
      debugPrint('INVOICES RESPONSE: ${response.body}');

      dynamic decoded;

      if (response.body.isNotEmpty) {
        try {
          decoded = jsonDecode(response.body);
        } catch (_) {
          decoded = null;
        }
      }

      if (response.statusCode >= 200 &&
          response.statusCode < 300) {
        return {
          'success': true,
          'data': decoded,
        };
      }

      return {
        'success': false,
        'message':
            'Failed to load invoices (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('GET INVOICES ERROR: $e');

      return {
        'success': false,
        'message': 'Cannot connect to server: $e',
      };
    }
  }

  // =========================================================
// GET SINGLE INVOICE BY ID
// =========================================================
static Future<Map<String, dynamic>> getInvoiceById(
  int invoiceId,
) async {
  try {
    final url = Uri.parse('$baseUrl/invoices/$invoiceId');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
      },
    );

    debugPrint('INVOICE DETAILS STATUS: ${response.statusCode}');
    debugPrint('INVOICE DETAILS RESPONSE: ${response.body}');

    dynamic decoded;

    if (response.body.isNotEmpty) {
      try {
        decoded = jsonDecode(response.body);
      } catch (_) {
        decoded = null;
      }
    }

    if (response.statusCode >= 200 &&
        response.statusCode < 300) {
      return {
        'success': true,
        'data': decoded,
      };
    }

    String errorMessage = 'Failed to load invoice details';

    if (decoded is Map<String, dynamic> &&
        decoded['message'] != null) {
      errorMessage = decoded['message'].toString();
    }

    return {
      'success': false,
      'message': '$errorMessage (${response.statusCode})',
    };
  } catch (e) {
    debugPrint('GET INVOICE DETAILS ERROR: $e');

    return {
      'success': false,
      'message': 'Cannot connect to server: $e',
    };
  }
}

// =========================================================
// GET PAYMENTS FOR RESIDENT
// =========================================================
static Future<Map<String, dynamic>>
    getPaymentsForResident({
  required int residentId,
}) async {
  try {
    // First get this resident's invoices.
    final invoiceResult = await getInvoices(
      residentId: residentId,
    );

    if (invoiceResult['success'] != true) {
      return {
        'success': false,
        'message':
            'Failed to load resident invoices.',
      };
    }

    final invoiceData = invoiceResult['data'];

    final List<dynamic> invoices =
        invoiceData?['items'] ?? [];

    final List<Map<String, dynamic>>
        residentPayments = [];

    // Get payments for each invoice.
    for (final invoiceData in invoices) {
      final invoice =
          Map<String, dynamic>.from(invoiceData);

      final invoiceId =
          int.tryParse(invoice['id'].toString());

      if (invoiceId == null) {
        continue;
      }

      final url = Uri.parse(
        '$baseUrl/payments?invoiceId=$invoiceId&pageSize=100',
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
      );

      debugPrint(
        'PAYMENTS FOR INVOICE $invoiceId STATUS: '
        '${response.statusCode}',
      );

      debugPrint(
        'PAYMENTS FOR INVOICE $invoiceId RESPONSE: '
        '${response.body}',
      );

      if (response.statusCode >= 200 &&
          response.statusCode < 300) {
        final decoded =
            jsonDecode(response.body);

        final List<dynamic> payments =
            decoded?['items'] ?? [];

        for (final paymentData in payments) {
          final payment =
              Map<String, dynamic>.from(
            paymentData,
          );

          residentPayments.add(payment);
        }
      }
    }

    // Newest payments first.
    residentPayments.sort((a, b) {
      final aDate = DateTime.tryParse(
        a['paidAt']?.toString() ?? '',
      );

      final bDate = DateTime.tryParse(
        b['paidAt']?.toString() ?? '',
      );

      if (aDate == null && bDate == null) {
        return 0;
      }

      if (aDate == null) {
        return 1;
      }

      if (bDate == null) {
        return -1;
      }

      return bDate.compareTo(aDate);
    });

    return {
      'success': true,
      'data': {
        'items': residentPayments,
      },
    };
  } catch (e) {
    debugPrint(
      'GET RESIDENT PAYMENTS ERROR: $e',
    );

    return {
      'success': false,
      'message':
          'Cannot load payment history: $e',
    };
  }
}

// =========================================================
// GET RECEIPTS FOR RESIDENT
// =========================================================
static Future<Map<String, dynamic>>
    getReceiptsForResident({
  required int residentId,
}) async {
  try {
    final paymentsResult =
        await getPaymentsForResident(
      residentId: residentId,
    );

    if (paymentsResult['success'] != true) {
      return {
        'success': false,
        'message':
            'Failed to load resident payments.',
      };
    }

    final paymentData =
        paymentsResult['data'];

    final List<dynamic> payments =
        paymentData?['items'] ?? [];

    final List<Map<String, dynamic>>
        receipts = [];

    for (final paymentData in payments) {
      final payment =
          Map<String, dynamic>.from(
        paymentData,
      );

      final status =
          payment['status']?.toString() ?? '';

      if (status.toLowerCase() !=
          'verified') {
        continue;
      }

      final paymentId =
          int.tryParse(
        payment['id'].toString(),
      );

      if (paymentId == null) {
        continue;
      }

      final url = Uri.parse(
        '$baseUrl/payments/$paymentId/receipt',
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
      );

      debugPrint(
        'RECEIPT $paymentId STATUS: '
        '${response.statusCode}',
      );

      debugPrint(
        'RECEIPT $paymentId RESPONSE: '
        '${response.body}',
      );

      if (response.statusCode >= 200 &&
          response.statusCode < 300) {
        final decoded =
            jsonDecode(response.body);

        if (decoded
            is Map<String, dynamic>) {
          receipts.add(decoded);
        }
      }
    }

    receipts.sort((a, b) {
      final aDate = DateTime.tryParse(
        a['issuedAt']?.toString() ?? '',
      );

      final bDate = DateTime.tryParse(
        b['issuedAt']?.toString() ?? '',
      );

      if (aDate == null &&
          bDate == null) {
        return 0;
      }

      if (aDate == null) {
        return 1;
      }

      if (bDate == null) {
        return -1;
      }

      return bDate.compareTo(aDate);
    });

    return {
      'success': true,
      'data': {
        'items': receipts,
      },
    };
  } catch (e) {
    debugPrint(
      'GET RESIDENT RECEIPTS ERROR: $e',
    );

    return {
      'success': false,
      'message':
          'Cannot load receipts: $e',
    };
  }
}



}
