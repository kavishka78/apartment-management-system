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

  void _scrollToLatest() {
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
    _scrollToLatest();
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
    _scrollToLatest();
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

  Widget _assistantAvatar({double size = 30}) => Container(
    width: size,
    height: size,
    decoration: const BoxDecoration(
      shape: BoxShape.circle,
      gradient: LinearGradient(
        colors: [Color(0xFF3D8B83), Color(0xFF24635F)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    child: Icon(Icons.auto_awesome_rounded, color: Colors.white, size: size * .55),
  );

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
    final isUser = message['fromResident'] == true;
    final data = message['data'];
    final cards = data is List
        ? data
        : data is Map && data['invoices'] is List
        ? data['invoices'] as List
        : data is Map && data['invoiceId'] != null
        ? [data]
        : <dynamic>[];
    final bubble = ConstrainedBox(
      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
        decoration: BoxDecoration(
          color: isUser ? const Color(0xFF17212B) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 18 : 5),
            bottomRight: Radius.circular(isUser ? 5 : 18),
          ),
          border: isUser ? null : Border.all(color: const Color(0xFFE6ECEA)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser)
              const Padding(
                padding: EdgeInsets.only(bottom: 5),
                child: Text(
                  'PAYMENT AI',
                  style: TextStyle(
                    color: Color(0xFF24635F),
                    fontWeight: FontWeight.w800,
                    fontSize: 10,
                    letterSpacing: .8,
                  ),
                ),
              ),
            if ((message['message']?.toString() ?? '').isNotEmpty)
              Text(
                message['message'].toString(),
                style: TextStyle(
                  height: 1.42,
                  color: isUser ? Colors.white : const Color(0xFF28343A),
                  fontSize: 14.5,
                ),
              ),
            if (data is Map && data['totalOutstanding'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 7),
                child: Text(
                  'Outstanding balance: ${_amount(data['totalOutstanding'])}',
                  style: TextStyle(
                    color: isUser ? Colors.white : const Color(0xFF17212B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ...cards.map((item) => _card(Map<String, dynamic>.from(item))),
          ],
        ),
      ),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Padding(
              padding: const EdgeInsets.only(right: 8, bottom: 2),
              child: _assistantAvatar(),
            ),
            Flexible(child: bubble),
          ] else
            Flexible(child: bubble),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFF5F7F8),
    appBar: AppBar(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      elevation: 0,
      titleSpacing: 0,
      title: Row(
        children: [
          _assistantAvatar(size: 38),
          const SizedBox(width: 11),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Payment AI', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              Text('Apartment payment assistant', style: TextStyle(color: Color(0xFF78838A), fontSize: 11)),
            ],
          ),
        ],
      ),
    ),
    body: SafeArea(
      child: Column(children: [
        Expanded(
          child: _messages.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 30),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE6F1EF),
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: const Icon(Icons.auto_awesome_rounded, color: Color(0xFF24635F), size: 31),
                        ),
                        const SizedBox(height: 16),
                        const Text('How can I help?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 7),
                        const Text(
                          'Ask me about your invoices, payments, receipts or outstanding balance.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFF68747A), height: 1.4),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  controller: _scroll,
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(14, 18, 14, 12),
                  itemCount: _messages.length + (_busy ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index < _messages.length) return _message(_messages[index]);
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(children: [
                        Padding(padding: const EdgeInsets.only(right: 8), child: _assistantAvatar()),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFE6ECEA)),
                          ),
                          child: const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF24635F)),
                          ),
                        ),
                      ]),
                    );
                  },
                ),
        ),
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: [
              for (final label in ['Pending invoices', 'Payment history', 'Receipts', 'Outstanding balance'])
                Padding(
                  padding: const EdgeInsets.only(right: 7),
                  child: ActionChip(
                    label: Text(label),
                    visualDensity: VisualDensity.compact,
                    side: const BorderSide(color: Color(0xFFDDE5E3)),
                    backgroundColor: Colors.white,
                    onPressed: _busy ? null : () => _send(label),
                  ),
                ),
            ],
          ),
        ),
        SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 9, 12, 10),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE8ECEB))),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    maxLength: 2000,
                    minLines: 1,
                    maxLines: 4,
                    enabled: !_busy,
                    textInputAction: TextInputAction.send,
                    onSubmitted: _send,
                    decoration: InputDecoration(
                      hintText: 'Ask about your payments',
                      counterText: '',
                      filled: true,
                      fillColor: const Color(0xFFF5F7F8),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Material(
                  color: const Color(0xFF24635F),
                  shape: const CircleBorder(),
                  child: IconButton(
                    onPressed: _busy ? null : () => _send(_input.text),
                    color: Colors.white,
                    disabledColor: Colors.white54,
                    icon: const Icon(Icons.arrow_upward_rounded),
                    tooltip: 'Send message',
                  ),
                ),
              ],
            ),
          ),
        ),
      ]),
    ),
  );
}
