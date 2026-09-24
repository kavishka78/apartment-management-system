import 'package:flutter/material.dart';

import '../../services/payment/payment_api_service.dart';
import 'my_invoices_screen.dart';

import 'payment_history_screen.dart';
import 'receipts_screen.dart';


class PaymentHomeScreen extends StatefulWidget {
  const PaymentHomeScreen({super.key});

  @override
  State<PaymentHomeScreen> createState() => _PaymentHomeScreenState();
}

class _PaymentHomeScreenState extends State<PaymentHomeScreen> {
  // Temporary until authentication is connected.
  static const int residentId = 6;

  bool _isLoading = true;
  String? _errorMessage;

  double _outstandingBalance = 0;
  int _outstandingInvoiceCount = 0;

  @override
  void initState() {
    super.initState();
    _loadPaymentSummary();
  }

  Future<void> _loadPaymentSummary() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await PaymentApiService.getInvoices(
      residentId: residentId,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      final data = result['data'];

      final List<dynamic> invoices = data?['items'] ?? [];

      double outstanding = 0;
      int outstandingCount = 0;

      for (final invoiceData in invoices) {
        final invoice =
            Map<String, dynamic>.from(invoiceData);

        final status =
            invoice['status']?.toString().toLowerCase() ??
                'pending';

        if (status != 'paid') {
          outstanding +=
              double.tryParse(
                    invoice['totalAmount'].toString(),
                  ) ??
                  0;

          outstandingCount++;
        }
      }

      setState(() {
        _outstandingBalance = outstanding;
        _outstandingInvoiceCount = outstandingCount;
        _isLoading = false;
      });
    } else {
      setState(() {
        _errorMessage =
            result['message']?.toString() ??
                'Failed to load payment information.';
        _isLoading = false;
      });
    }
  }

  String _formatAmount(double amount) {
    return 'LKR ${amount.toStringAsFixed(2)}';
  }

  String get _balanceMessage {
    if (_outstandingInvoiceCount == 0) {
      return 'No outstanding payments';
    }

    if (_outstandingInvoiceCount == 1) {
      return '1 outstanding invoice';
    }

    return '$_outstandingInvoiceCount outstanding invoices';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7F8),
        elevation: 0,
        title: const Text(
          'Payments',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF17212B),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _loadPaymentSummary,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadPaymentSummary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Outstanding balance card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: const Color(0xFF17212B),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 85,
                        child: Center(
                          child: CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        ),
                      )
                    : Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Outstanding Balance',
                            style: TextStyle(
                              color: Color(0xFFB8C2CC),
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _formatAmount(
                              _outstandingBalance,
                            ),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _balanceMessage,
                            style: const TextStyle(
                              color: Color(0xFFD5DADF),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBEAEA),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: Color(0xFFB84A4A),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: Color(0xFFB84A4A),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 30),

              const Text(
                'Payment Services',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF17212B),
                ),
              ),

              const SizedBox(height: 15),

              PaymentOptionCard(
                icon: Icons.receipt_long_outlined,
                title: 'My Invoices',
                subtitle:
                    'View your current and previous invoices',
                onTap: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          const MyInvoicesScreen(),
                    ),
                  );

                  // Refresh balance after returning.
                  _loadPaymentSummary();
                },
              ),

              const SizedBox(height: 12),

              PaymentOptionCard(
                icon: Icons.history_rounded,
                title: 'Payment History',
                subtitle:
                    'View your previous payment transactions',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          const PaymentHistoryScreen(),
                    ),
                  );
                },
              ),

              const SizedBox(height: 12),

              PaymentOptionCard(
                icon: Icons.description_outlined,
                title: 'Receipts',
                subtitle:
                    'View and print your payment receipts',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          const ReceiptsScreen(),
                    ),
                  );
                },
              ),

              const SizedBox(height: 30),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFE8ECEF),
                  ),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.lock_outline_rounded,
                      color: Color(0xFF788477),
                    ),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Secure Payments',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Your payment information is handled securely.',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PaymentOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const PaymentOptionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFFE8ECEF),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF1F2),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  icon,
                  color: const Color(0xFF17212B),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF17212B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: Colors.grey,
              ),
            ],
          ),
        ),
      ),
    );
  }
}