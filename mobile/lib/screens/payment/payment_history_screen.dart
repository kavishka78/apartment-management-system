import 'package:flutter/material.dart';

import '../../services/payment/payment_api_service.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() =>
      _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState
    extends State<PaymentHistoryScreen> {
  // Temporary until authentication is connected.
  static const int residentId = 6;

  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _payments = [];

  @override
  void initState() {
    super.initState();
    _loadPaymentHistory();
  }

  Future<void> _loadPaymentHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result =
        await PaymentApiService.getPaymentsForResident(
      residentId: residentId,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      final data = result['data'];

      final List<dynamic> items = data?['items'] ?? [];

      setState(() {
        _payments = items
            .map(
              (item) =>
                  Map<String, dynamic>.from(item),
            )
            .toList();

        _isLoading = false;
      });
    } else {
      setState(() {
        _errorMessage =
            result['message']?.toString() ??
                'Failed to load payment history.';
        _isLoading = false;
      });
    }
  }

  String _formatAmount(dynamic value) {
    final amount =
        double.tryParse(value.toString()) ?? 0;

    return 'LKR ${amount.toStringAsFixed(2)}';
  }

  String _formatDate(dynamic value) {
    if (value == null) {
      return 'Not available';
    }

    final date = DateTime.tryParse(value.toString());

    if (date == null) {
      return value.toString();
    }

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return '${date.day} '
        '${months[date.month - 1]} '
        '${date.year}';
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'verified':
        return const Color(0xFF3E7B57);

      case 'successful':
        return const Color(0xFFC58B2A);

      case 'failed':
        return const Color(0xFFB84A4A);

      default:
        return Colors.grey;
    }
  }

  Color _statusBackgroundColor(String status) {
    switch (status.toLowerCase()) {
      case 'verified':
        return const Color(0xFFE8F4EC);

      case 'successful':
        return const Color(0xFFFFF4DE);

      case 'failed':
        return const Color(0xFFFBEAEA);

      default:
        return const Color(0xFFEEF1F2);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7F8),
        elevation: 0,
        title: const Text(
          'Payment History',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF17212B),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _loadPaymentHistory,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                size: 50,
                color: Color(0xFFB84A4A),
              ),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadPaymentHistory,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    if (_payments.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadPaymentHistory,
        child: ListView(
          physics:
              const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: const [
            SizedBox(height: 120),
            Icon(
              Icons.history_rounded,
              size: 65,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'No payment history found',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF17212B),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Your payment transactions will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadPaymentHistory,
      child: ListView.separated(
        physics:
            const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        itemCount: _payments.length,
        separatorBuilder: (context, index) =>
            const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final payment = _payments[index];

          final status =
              payment['status']?.toString() ??
                  'Unknown';

          final invoiceNumber =
              payment['invoiceNumber']?.toString() ?? '-';

          return Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFE8ECEF),
              ),
            ),
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        payment['paymentReference']
                                ?.toString() ??
                            '-',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF17212B),
                        ),
                      ),
                    ),
                    Container(
                      padding:
                          const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color:
                            _statusBackgroundColor(
                          status,
                        ),
                        borderRadius:
                            BorderRadius.circular(20),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          color:
                              _statusColor(status),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                Text(
                  _formatAmount(
                    payment['amount'],
                  ),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF17212B),
                  ),
                ),

                const SizedBox(height: 16),

                _PaymentInfoRow(
                  icon: Icons.receipt_long_outlined,
                  title: 'Invoice',
                  value: invoiceNumber,
                ),

                const SizedBox(height: 10),

                _PaymentInfoRow(
                  icon: Icons.credit_card_outlined,
                  title: 'Method',
                  value:
                      payment['paymentMethod']
                              ?.toString() ??
                          '-',
                ),

                const SizedBox(height: 10),

                _PaymentInfoRow(
                  icon: Icons.calendar_today_outlined,
                  title: 'Payment Date',
                  value: _formatDate(
                    payment['paidAt'],
                  ),
                ),

                if (payment['cardLastFourDigits'] !=
                    null) ...[
                  const SizedBox(height: 10),
                  _PaymentInfoRow(
                    icon: Icons.lock_outline,
                    title: 'Card',
                    value:
                        '•••• ${payment['cardLastFourDigits']}',
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _PaymentInfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _PaymentInfoRow({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 17,
          color: Colors.grey,
        ),
        const SizedBox(width: 8),
        Text(
          '$title:',
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 12,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: Color(0xFF17212B),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}