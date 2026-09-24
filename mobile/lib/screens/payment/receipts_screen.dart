import 'package:flutter/material.dart';

import '../../services/payment/payment_api_service.dart';

class ReceiptsScreen extends StatefulWidget {
  const ReceiptsScreen({super.key});

  @override
  State<ReceiptsScreen> createState() => _ReceiptsScreenState();
}

class _ReceiptsScreenState extends State<ReceiptsScreen> {
  // Temporary until authentication is connected.
  static const int residentId = 6;

  bool _isLoading = true;
  String? _errorMessage;

  List<Map<String, dynamic>> _receipts = [];

  @override
  void initState() {
    super.initState();
    _loadReceipts();
  }

  Future<void> _loadReceipts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result =
        await PaymentApiService.getReceiptsForResident(
      residentId: residentId,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      final data = result['data'];

      final List<dynamic> items =
          data?['items'] ?? [];

      setState(() {
        _receipts = items
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
                'Failed to load receipts.';

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
      return '-';
    }

    final date =
        DateTime.tryParse(value.toString());

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7F8),
        elevation: 0,
        title: const Text(
          'Receipts',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF17212B),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _loadReceipts,
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
                onPressed: _loadReceipts,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    if (_receipts.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadReceipts,
        child: ListView(
          physics:
              const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: const [
            SizedBox(height: 120),
            Icon(
              Icons.description_outlined,
              size: 65,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'No receipts found',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF17212B),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Receipts will appear after payments are verified.',
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
      onRefresh: _loadReceipts,
      child: ListView.separated(
        physics:
            const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        itemCount: _receipts.length,
        separatorBuilder: (context, index) =>
            const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final receipt = _receipts[index];

          return Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
                  BorderRadius.circular(16),
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
                    Container(
                      width: 45,
                      height: 45,
                      decoration: BoxDecoration(
                        color:
                            const Color(0xFFE8F4EC),
                        borderRadius:
                            BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.receipt_long_outlined,
                        color: Color(0xFF3E7B57),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(
                            receipt['receiptNumber']
                                    ?.toString() ??
                                '-',
                            style: const TextStyle(
                              fontWeight:
                                  FontWeight.bold,
                              fontSize: 15,
                              color:
                                  Color(0xFF17212B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            receipt['invoiceNumber']
                                    ?.toString() ??
                                '-',
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                Text(
                  _formatAmount(
                    receipt['amount'],
                  ),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF17212B),
                  ),
                ),

                const SizedBox(height: 18),

                _ReceiptInfoRow(
                  title: 'Payment Reference',
                  value:
                      receipt['paymentReference']
                              ?.toString() ??
                          '-',
                ),

                const SizedBox(height: 10),

                _ReceiptInfoRow(
                  title: 'Payment Method',
                  value:
                      receipt['paymentMethod']
                              ?.toString() ??
                          '-',
                ),

                const SizedBox(height: 10),

                _ReceiptInfoRow(
                  title: 'Issued Date',
                  value: _formatDate(
                    receipt['issuedAt'],
                  ),
                ),

                const SizedBox(height: 10),

                _ReceiptInfoRow(
                  title: 'Card',
                  value: receipt[
                              'cardLastFourDigits'] !=
                          null
                      ? '•••• ${receipt['cardLastFourDigits']}'
                      : '-',
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ReceiptInfoRow extends StatelessWidget {
  final String title;
  final String value;

  const _ReceiptInfoRow({
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$title:',
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 12,
          ),
        ),
        const SizedBox(width: 8),
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