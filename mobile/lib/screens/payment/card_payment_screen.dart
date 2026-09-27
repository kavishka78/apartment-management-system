import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/payment/payment_api_service.dart';

class CardPaymentScreen extends StatefulWidget {
  final int invoiceId;
  final String invoiceNumber;
  final String amount;

  const CardPaymentScreen({
    super.key,
    required this.invoiceId,
    required this.invoiceNumber,
    required this.amount,
  });

  @override
  State<CardPaymentScreen> createState() => _CardPaymentScreenState();
}

class _CardPaymentScreenState extends State<CardPaymentScreen> {
  final _formKey = GlobalKey<FormState>();

  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();

  bool _hideCvv = true;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  Future<void> _submitPayment() async {
  if (!_formKey.currentState!.validate()) {
    return;
  }

  // "LKR 6,500.00" -> 6500.00
  final cleanAmount = widget.amount
      .replaceAll('LKR', '')
      .replaceAll(',', '')
      .trim();

  final amount = double.tryParse(cleanAmount);

  if (amount == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Invalid payment amount.'),
      ),
    );
    return;
  }

  // Show loading dialog
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    },
  );

  final result = await PaymentApiService.createPayment(
    invoiceId: widget.invoiceId,
    amount: amount,
    cardholderName: _cardHolderController.text,
    cardNumber: _cardNumberController.text,
    expiryDate: _expiryController.text,
    cvv: _cvvController.text,
  );

  if (!mounted) return;

  // Close loading dialog
  Navigator.of(context).pop();

  if (result['success'] == true) {
    final data = result['data'];

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          data?['message']?.toString() ??
              'Payment submitted successfully.',
        ),
      ),
    );

    debugPrint('PAYMENT RESPONSE: $data');
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result['message']?.toString() ??
              'Payment failed.',
        ),
      ),
    );
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
          'Card Payment',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF17212B),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Amount to Pay',
                      style: TextStyle(
                        color: Color(0xFFB8C2CC),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      widget.amount,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 29,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 15),
                    Text(
                      widget.invoiceNumber,
                      style: const TextStyle(
                        color: Color(0xFFD5DADF),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              const Text(
                'Card Details',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF17212B),
                ),
              ),

              const SizedBox(height: 18),

              _label('Cardholder Name'),

              TextFormField(
                controller: _cardHolderController,
                textCapitalization: TextCapitalization.words,
                decoration: _inputDecoration(
                  hint: 'Enter cardholder name',
                  icon: Icons.person_outline,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Enter the cardholder name';
                  }

                  if (value.trim().length < 3) {
                    return 'Enter a valid cardholder name';
                  }

                  return null;
                },
              ),

              const SizedBox(height: 18),

              _label('Card Number'),

              TextFormField(
                controller: _cardNumberController,
                keyboardType: TextInputType.number,
                inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(16),
                    CardNumberFormatter(),
                ],
                decoration: _inputDecoration(
                    hint: '0000 0000 0000 0000',
                    icon: Icons.credit_card,
                ),
                validator: (value) {
                    if (value == null || value.isEmpty) {
                    return 'Enter your card number';
                    }

                    final digits = value.replaceAll(' ', '');

                    if (digits.length != 16) {
                    return 'Card number must contain 16 digits';
                    }

                    return null;
                },
                ),

              const SizedBox(height: 18),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Expiry Date'),
                       TextFormField(
                            controller: _expiryController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(4),
                                ExpiryDateFormatter(),
                            ],
                            decoration: _inputDecoration(
                                hint: 'MM/YY',
                                icon: Icons.calendar_month_outlined,
                            ),
                            validator: (value) {
                                if (value == null || value.isEmpty) {
                                return 'Required';
                                }

                                final pattern = RegExp(r'^(0[1-9]|1[0-2])\/\d{2}$');

                                if (!pattern.hasMatch(value)) {
                                return 'Use MM/YY';
                                }

                                return null;
                            },
                            ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 14),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('CVV'),
                        TextFormField(
                          controller: _cvvController,
                          keyboardType: TextInputType.number,
                          obscureText: _hideCvv,
                          maxLength: 3,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: _inputDecoration(
                            hint: '123',
                            icon: Icons.lock_outline,
                          ).copyWith(
                            counterText: '',
                            suffixIcon: IconButton(
                              onPressed: () {
                                setState(() {
                                  _hideCvv = !_hideCvv;
                                });
                              },
                              icon: Icon(
                                _hideCvv
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Required';
                            }

                            if (value.length != 3) {
                              return '3 digits';
                            }

                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _submitPayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF17212B),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'Pay ${widget.amount}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 18),

              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lock_outline,
                    size: 16,
                    color: Color(0xFF788477),
                  ),
                  SizedBox(width: 7),
                  Flexible(
                    child: Text(
                      'Card details are used only to process this payment.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF17212B),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: Color(0xFFE0E5E8),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: Color(0xFFE0E5E8),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: Color(0xFF17212B),
          width: 1.5,
        ),
      ),
    );
  }
}

class CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(' ', '');

    final buffer = StringBuffer();

    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) {
        buffer.write(' ');
      }

      buffer.write(digits[i]);
    }

    final formatted = buffer.toString();

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(
        offset: formatted.length,
      ),
    );
  }
}

class ExpiryDateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll('/', '');

    if (digits.length <= 2) {
      return TextEditingValue(
        text: digits,
        selection: TextSelection.collapsed(
          offset: digits.length,
        ),
      );
    }

    final formatted =
        '${digits.substring(0, 2)}/${digits.substring(2)}';

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(
        offset: formatted.length,
      ),
    );
  }
}