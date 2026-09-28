import 'package:flutter/material.dart';

import '../../services/payment/payment_api_service.dart';
import 'card_payment_screen.dart';

class PaymentChatScreen extends StatefulWidget {
  const PaymentChatScreen({super.key});

  @override
  State<PaymentChatScreen> createState() => _PaymentChatScreenState();
}

class _PaymentChatScreenState extends State<PaymentChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final _messages = <Map<String, dynamic>>[];
  bool _busy = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send(String message) async {
    if (_busy || message.trim().isEmpty) return;
    // Keep apparent credentials/card data out of chat history and the agent.
    if (RegExp(
      r'(?:\d[ -]?){13,19}|\b(?:cvv|cvc|expiry|expiration|password|bearer|api[_ -]?key|secret[_ -]?key)\b|(?:sk|pk)_(?:live|test)_|AIza|eyJ[A-Za-z0-9_-]+\.',
      caseSensitive: false,
    ).hasMatch(message)) {
      _input.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Do not share card details or credentials. Use the secure payment window.',
          ),
        ),
      );
      return;
    }
    setState(() {
      _busy = true;
      _messages.add({'message': message, 'fromResident': true});
      _input.clear();
    });
    final result = await PaymentApiService.chat(message);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _messages.add(
        result['success'] == true
            ? Map<String, dynamic>.from(result['data'])
            : {'message': result['message']},
      );
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pay(Map<String, dynamic> card) async {
    if (_busy) return;
    setState(() => _busy = true);
    // Recheck ownership and eligibility; chat cards may be stale.
    final result = await PaymentApiService.getInvoiceById(card['id'] as int);
    if (!mounted) return;
    if (result['success'] == true && result['data']['canPay'] == true) {
      final invoice = result['data'];
      final paid = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => CardPaymentScreen(
            invoiceId: invoice['id'] as int,
            invoiceNumber: invoice['invoiceNumber'].toString(),
            amount: _amount(invoice['totalAmount']),
          ),
        ),
      );
      if (!mounted) return;
      if (paid == true) {
        // Invalidate all old action cards, then retrieve fresh server state.
        _messages.clear();
        _messages.add({
          'message': 'Payment successful. Awaiting admin verification; your receipt will appear after verification.',
        });
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ??
                'This invoice is no longer payable.',
          ),
        ),
      );
    }
    setState(() => _busy = false);
    await _send('Show my pending invoices');
  }

  String _amount(dynamic value) =>
      value is num ? 'LKR ${value.toStringAsFixed(2)}' : 'LKR $value';

  Widget _card(Map<String, dynamic> item) {
    final status =
        item['paymentStatus'] ??
        (item['status'] == 'Successful'
            ? 'Successful — awaiting admin verification'
            : item['status']);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              (item['receiptNumber'] ??
                      item['paymentReference'] ??
                      item['invoiceNumber'] ??
                      'Invoice')
                  .toString(),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            if (item['invoiceNumber'] != null)
              Text(item['invoiceNumber'].toString()),
            if (item['totalAmount'] != null || item['amount'] != null)
              Text(_amount(item['totalAmount'] ?? item['amount'])),
            if (status != null) Text(status.toString()),
            if (item['dueDate'] != null)
              Text('Due: ${item['dueDate'].toString().split('T').first}'),
            if (item['paidAt'] != null)
              Text('Paid: ${item['paidAt'].toString().split('T').first}'),
            if (item['canPay'] == true)
              FilledButton(
                onPressed: _busy ? null : () => _pay(item),
                child: const Text('Pay Now'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _message(Map<String, dynamic> message) {
    final data = message['data'];
    final cards = data is List
        ? data
        : data is Map && data['invoices'] is List
        ? data['invoices'] as List
        : data is Map && data['invoiceId'] != null
        ? [data]
        : <dynamic>[];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            message['fromResident'] == true ? 'You' : 'Payment Assistant',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Text(message['message']?.toString() ?? ''),
          if (data is Map && data['totalOutstanding'] != null)
            Text('Outstanding balance: ${_amount(data['totalOutstanding'])}'),
          ...cards.map((item) => _card(Map<String, dynamic>.from(item))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Payment Assistant')),
    body: SafeArea(
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text(
              'Ask about invoices, payments and receipts. Enter card details only in the secure payment window.',
            ),
          ),
          Wrap(
            spacing: 8,
            children: [
              for (final label in [
                'Pending invoices',
                'Payment history',
                'Receipts',
                'Outstanding balance',
              ])
                ActionChip(
                  label: Text(label),
                  onPressed: _busy ? null : () => _send(label),
                ),
            ],
          ),
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              children: _messages.map(_message).toList(),
            ),
          ),
          if (_busy) const LinearProgressIndicator(),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    maxLength: 2000,
                    enabled: !_busy,
                    onSubmitted: _send,
                    decoration: const InputDecoration(
                      hintText: 'Ask about your payments',
                      counterText: '',
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _busy ? null : () => _send(_input.text),
                  icon: const Icon(Icons.send),
                  tooltip: 'Send',
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
