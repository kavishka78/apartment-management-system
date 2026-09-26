import 'package:flutter/material.dart';

import '../../services/payment/payment_api_service.dart';
import 'card_payment_screen.dart';

class InvoiceDetailsScreen extends StatefulWidget {
  final int invoiceId;
  final String invoiceNumber;
  final String billingMonth;
  final String dueDate;
  final String amount;
  final String status;

  const InvoiceDetailsScreen({
    super.key,
    required this.invoiceId,
    required this.invoiceNumber,
    required this.billingMonth,
    required this.dueDate,
    required this.amount,
    required this.status,
  });

  @override
  State<InvoiceDetailsScreen> createState() =>
      _InvoiceDetailsScreenState();
}

class _InvoiceDetailsScreenState
    extends State<InvoiceDetailsScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _invoice;
  bool _hasPendingVerification = false;

  @override
  void initState() {
    super.initState();
    _loadInvoiceDetails();
  }

  Future<void> _loadInvoiceDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result =
        await PaymentApiService.getInvoiceById(widget.invoiceId);

    if (!mounted) return;

   if (result['success'] == true) {
      final invoice =
          Map<String, dynamic>.from(result['data']);

      final payments =
          (invoice['payments'] as List?) ?? [];

      final hasPendingVerification = payments.any((payment) {
        final status =
            payment['status']?.toString().toLowerCase() ?? '';

        return status == 'successful';
      });

      setState(() {
        _invoice = invoice;
        _hasPendingVerification = hasPendingVerification;
        _isLoading = false;
      });
    } else {
      setState(() {
        _errorMessage =
            result['message']?.toString() ??
                'Failed to load invoice details.';
        _isLoading = false;
      });
    }
  }

  String _formatAmount(dynamic value) {
    final amount =
        double.tryParse(value.toString()) ?? 0;

    return 'LKR ${amount.toStringAsFixed(2)}';
  }

  bool get _isPaid {
    final status =
        _invoice?['status']?.toString() ?? widget.status;

    return status.toLowerCase() == 'paid';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7F8),
        elevation: 0,
        title: const Text(
          'Invoice Details',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF17212B),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _loadInvoiceDetails,
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
                onPressed: _loadInvoiceDetails,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    final invoice = _invoice!;

    final invoiceItems =
        (invoice['invoiceItems'] as List?) ?? [];

    final invoiceNumber =
        invoice['invoiceNumber']?.toString() ??
            widget.invoiceNumber;

    final status =
        invoice['status']?.toString() ??
            widget.status;

    final billingMonthRaw =
    invoice['billingMonth']?.toString() ?? '';

    final billingMonth = billingMonthRaw.isNotEmpty
        ? billingMonthRaw.substring(0, 7)
        : '-';        

    final dueDateRaw =
    invoice['dueDate']?.toString() ?? '';

    final dueDate = dueDateRaw.isNotEmpty
        ? dueDateRaw.substring(0, 10)
        : '-';

    final totalAmount =
        _formatAmount(invoice['totalAmount']);

    return RefreshIndicator(
      onRefresh: _loadInvoiceDetails,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: const Color(0xFF17212B),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Invoice',
                    style: TextStyle(
                      color: Color(0xFFB8C2CC),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    invoiceNumber,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: _HeaderInfo(
                          title: 'Billing Month',
                          value: billingMonth,
                        ),
                      ),
                      Expanded(
                        child: _HeaderInfo(
                          title: 'Status',
                          value: status,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            const Text(
              'Charge Breakdown',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF17212B),
              ),
            ),

            const SizedBox(height: 14),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: const Color(0xFFE8ECEF),
                ),
              ),
              child: invoiceItems.isEmpty
                  ? const Text(
                      'No charge items found.',
                      style: TextStyle(
                        color: Colors.grey,
                      ),
                    )
                  : Column(
                      children: [
                        for (int i = 0;
                            i < invoiceItems.length;
                            i++) ...[
                          _ChargeRow(
                            title: invoiceItems[i]
                                        ['description']
                                    ?.toString() ??
                                invoiceItems[i]
                                        ['chargeType']
                                    ?.toString() ??
                                'Charge',
                            amount: _formatAmount(
                              invoiceItems[i]['amount'],
                            ),
                          ),
                          if (i <
                              invoiceItems.length - 1)
                            const Padding(
                              padding:
                                  EdgeInsets.symmetric(
                                      vertical: 12),
                              child: Divider(),
                            ),
                        ],
                      ],
                    ),
            ),

            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: const Color(0xFFE8ECEF),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Text(
                        'Total Amount',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        totalAmount,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF17212B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Divider(),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 17,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Due Date',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        dueDate,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),

        // 1. No payment yet -> show Pay Now
        if (!_isPaid && !_hasPendingVerification)
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF17212B),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CardPaymentScreen(
                      invoiceId: widget.invoiceId,
                      invoiceNumber: invoiceNumber,
                      amount: totalAmount,
                    ),
                  ),
                );

                _loadInvoiceDetails();
              },
              child: const Text(
                'Pay Now',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

        // 2. Payment submitted but admin has not verified
        if (!_isPaid && _hasPendingVerification)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF4DE),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.hourglass_top_rounded,
                  color: Color(0xFFC58B2A),
                ),
                SizedBox(width: 8),
                Text(
                  'Payment awaiting verification',
                  style: TextStyle(
                    color: Color(0xFFC58B2A),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

        // 3. Admin verified -> invoice paid


            if (_isPaid)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F4EC),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Row(
                  mainAxisAlignment:
                      MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle_outline,
                      color: Color(0xFF3E7B57),
                    ),
                    SizedBox(width: 8),
                    Text(
                      'This invoice has been paid',
                      style: TextStyle(
                        color: Color(0xFF3E7B57),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _HeaderInfo extends StatelessWidget {
  final String title;
  final String value;

  const _HeaderInfo({
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFFB8C2CC),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _ChargeRow extends StatelessWidget {
  final String title;
  final String amount;

  const _ChargeRow({
    required this.title,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF555F68),
            ),
          ),
        ),
        Text(
          amount,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF17212B),
          ),
        ),
      ],
    );
  }
}