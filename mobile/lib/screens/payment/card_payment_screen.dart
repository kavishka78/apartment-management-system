import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

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
  Future<void> _submitPayment() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return const Center(child: CircularProgressIndicator());
      },
    );

    try {
      // 1. Ask our ASP.NET backend to create a Stripe PaymentIntent.
      final result = await PaymentApiService.createPaymentIntent(
        invoiceId: widget.invoiceId,
      );

      if (!mounted) return;

      // Close loading dialog.
      Navigator.of(context).pop();

      if (result['success'] != true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message']?.toString() ?? 'Unable to start payment.',
            ),
          ),
        );
        return;
      }

      final data = Map<String, dynamic>.from(result['data']);

      final clientSecret = data['clientSecret']?.toString();

      if (clientSecret == null || clientSecret.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Stripe client secret was not received.'),
          ),
        );
        return;
      }

      // 2. Configure Stripe PaymentSheet.
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Apartment Management',
        ),
      );

      // 3. Open Stripe's secure payment UI.
      await Stripe.instance.presentPaymentSheet();

      if (!mounted) return;

      final paymentIntentId = data['paymentIntentId']?.toString();

      if (paymentIntentId == null || paymentIntentId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Payment completed, but payment ID was not received.',
            ),
          ),
        );
        return;
      }

      // 4. Ask our backend to verify the payment directly with Stripe
      //    and save the successful payment in PostgreSQL.
      final confirmResult = await PaymentApiService.confirmStripePayment(
        paymentIntentId: paymentIntentId,
      );

      if (!mounted) return;

      if (confirmResult['success'] != true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              confirmResult['message']?.toString() ??
                  'Payment completed, but server confirmation failed.',
            ),
          ),
        );
        return;
      }

      if (!mounted) return;

      // Return to Invoice Details screen.
      Navigator.pop(context, true);
    } on StripeException catch (e) {
      if (!mounted) return;

      // Close loading dialog if it is still visible.
      if (Navigator.of(context).canPop()) {
        // Do not pop here because PaymentSheet may already
        // have handled its own route.
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.error.localizedMessage ?? 'Stripe payment was cancelled.',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Payment error: $e')));
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
                    style: TextStyle(color: Color(0xFFB8C2CC), fontSize: 13),
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

            const SizedBox(height: 12),

            const Text(
              'Your card details will be entered securely in the Stripe payment window. '
              'We do not store your card number or CVV.',
              style: TextStyle(fontSize: 13, height: 1.5, color: Colors.grey),
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
                  shape: const StadiumBorder(),
                ),
                child: Text(
                  'Pay Securely ${widget.amount}',
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
                Icon(Icons.lock_outline, size: 16, color: Color(0xFF788477)),
                SizedBox(width: 7),
                Flexible(
                  child: Text(
                    'Card details are used only to process this payment.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
