import 'package:flutter/material.dart';

import '../../services/payment/payment_api_service.dart';
import 'invoice_details_screen.dart';

class MyInvoicesScreen extends StatefulWidget {
  const MyInvoicesScreen({super.key});

  @override
  State<MyInvoicesScreen> createState() => _MyInvoicesScreenState();
}

class _MyInvoicesScreenState extends State<MyInvoicesScreen> {
  // Temporary until resident authentication is connected.
  static const int residentId = 6;

  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _invoices = [];

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
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

      setState(() {
        _invoices = data?['items'] ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        _errorMessage =
            result['message']?.toString() ?? 'Failed to load invoices.';
        _isLoading = false;
      });
    }
  }

  String _formatMonth(String? value) {
    if (value == null) return '-';

    final date = DateTime.tryParse(value);

    if (date == null) return value;

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return '${months[date.month - 1]} ${date.year}';
  }

  String _formatDate(String? value) {
    if (value == null) return '-';

    final date = DateTime.tryParse(value);

    if (date == null) return value;

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

    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _formatAmount(dynamic value) {
    final amount = double.tryParse(value.toString()) ?? 0;

    return 'LKR ${amount.toStringAsFixed(2)}';
  }

  String _displayStatus(Map<String, dynamic> invoice) {
    final status = invoice['status']?.toString() ?? 'Pending';

    if (status.toLowerCase() == 'paid') {
      return 'Paid';
    }

    final dueDate = DateTime.tryParse(
      invoice['dueDate']?.toString() ?? '',
    );

    if (dueDate != null && dueDate.isBefore(DateTime.now())) {
      return 'Overdue';
    }

    return status;
  }

  int get _pendingCount {
    return _invoices.where((invoice) {
      final item = Map<String, dynamic>.from(invoice);
      return _displayStatus(item).toLowerCase() != 'paid';
    }).length;
  }

  double get _outstandingAmount {
    double total = 0;

    for (final invoice in _invoices) {
      final item = Map<String, dynamic>.from(invoice);

      if (_displayStatus(item).toLowerCase() != 'paid') {
        total +=
            double.tryParse(item['totalAmount'].toString()) ?? 0;
      }
    }

    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7F8),
        elevation: 0,
        title: const Text(
          'My Invoices',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF17212B),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _loadInvoices,
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
                color: Colors.redAccent,
              ),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadInvoices,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInvoices,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF17212B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _SummaryItem(
                    title: 'Outstanding Invoices',
                    value: _pendingCount.toString(),
                  ),
                ),
                Container(
                  width: 1,
                  height: 45,
                  color: const Color(0xFF45515C),
                ),
                Expanded(
                  child: _SummaryItem(
                    title: 'Outstanding',
                    value:
                        'LKR ${_outstandingAmount.toStringAsFixed(2)}',
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),

          const Text(
            'Invoices',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF17212B),
            ),
          ),

          const SizedBox(height: 15),

          if (_invoices.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 50),
              child: Center(
                child: Text(
                  'No invoices found.',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 15,
                  ),
                ),
              ),
            ),

          ..._invoices.map((invoiceData) {
            final invoice =
                Map<String, dynamic>.from(invoiceData);

            final invoiceId =
                int.tryParse(invoice['id'].toString()) ?? 0;

            final invoiceNumber =
                invoice['invoiceNumber']?.toString() ?? '-';

            final billingMonth =
                _formatMonth(invoice['billingMonth']?.toString());

            final dueDate =
                _formatDate(invoice['dueDate']?.toString());

            final amount =
                _formatAmount(invoice['totalAmount']);

            final status = _displayStatus(invoice);

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InvoiceCard(
                invoiceNumber: invoiceNumber,
                billingMonth: billingMonth,
                dueDate: dueDate,
                amount: amount,
                status: status,
                onTap: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          InvoiceDetailsScreen(
                        invoiceId: invoiceId,
                        invoiceNumber: invoiceNumber,
                        billingMonth: billingMonth,
                        dueDate: dueDate,
                        amount: amount,
                        status: status,
                      ),
                    ),
                  );

                  // Reload after returning from details/payment.
                  _loadInvoices();
                },
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final String title;
  final String value;

  const _SummaryItem({
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFFB8C2CC),
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class InvoiceCard extends StatelessWidget {
  final String invoiceNumber;
  final String billingMonth;
  final String dueDate;
  final String amount;
  final String status;
  final VoidCallback onTap;

  const InvoiceCard({
    super.key,
    required this.invoiceNumber,
    required this.billingMonth,
    required this.dueDate,
    required this.amount,
    required this.status,
    required this.onTap,
  });

  Color get statusColor {
    switch (status.toLowerCase()) {
      case 'paid':
        return const Color(0xFF3E7B57);
      case 'overdue':
        return const Color(0xFFB84A4A);
      default:
        return const Color(0xFFC58B2A);
    }
  }

  Color get statusBackgroundColor {
    switch (status.toLowerCase()) {
      case 'paid':
        return const Color(0xFFE8F4EC);
      case 'overdue':
        return const Color(0xFFFBEAEA);
      default:
        return const Color(0xFFFFF4DE);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFFE8ECEF),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      invoiceNumber,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF17212B),
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: statusBackgroundColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 15),

              Text(
                billingMonth,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),

              const SizedBox(height: 6),

              Text(
                amount,
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF17212B),
                ),
              ),

              const SizedBox(height: 15),

              Row(
                children: [
                  const Icon(
                    Icons.calendar_today_outlined,
                    size: 15,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 7),
                  Text(
                    'Due $dueDate',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'View Details',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF17212B),
                    ),
                  ),
                  const SizedBox(width: 3),
                  const Icon(
                    Icons.chevron_right,
                    size: 18,
                    color: Color(0xFF17212B),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}