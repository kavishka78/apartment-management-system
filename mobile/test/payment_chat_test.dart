import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/auth/resident_session.dart';
import 'package:mobile/services/auth/auth_service.dart';
import 'package:mobile/screens/payment/payment_chat_screen.dart';
import 'package:mobile/screens/payment/card_payment_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await AuthService.clearSession();
    await AuthService.saveSession(const ResidentSession(
      residentId: 101, tenantId: 1, token: 'fixture-jwt', name: 'Resident',
      email: 'resident@example.invalid', phone: '', unitNumber: 'A1',
    ));
  });

  testWidgets('Chat forwards JWT and Pay Now reuses PaymentSheet, then hides paid actions', (tester) async {
    var confirmed = false;
    final stripeCalls = <String>[];
    const channel = MethodChannel('flutter.stripe/payments', JSONMethodCodec());
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(channel, (call) async {
      stripeCalls.add(call.method);
      return <String, dynamic>{};
    });
    Stripe.publishableKey = 'pk_test_fixture';
    final mock = MockClient((request) async {
      expect(request.headers['Authorization'], 'Bearer fixture-jwt');
      expect(request.url.queryParameters.containsKey('residentId'), isFalse);
      final invoice = {'id': 4, 'invoiceNumber': 'FIXTURE-4', 'totalAmount': 100,
        'status': 'Pending', 'canPay': !confirmed,
        'paymentStatus': confirmed ? 'Awaiting admin verification' : 'Pending'};
      Object data;
      switch (request.url.path) {
        case '/chat':
          final body = jsonDecode(request.body) as Map;
          expect(body.containsKey('resident_id'), isFalse);
          expect(body.containsKey('token'), isFalse);
          data = {'message': 'Your invoices', 'action': {'type': 'show_invoices'}, 'data': [invoice]};
        case '/api/invoices/4':
          data = invoice;
        case '/api/payments/create-intent':
          expect(jsonDecode(request.body), {'invoiceId': 4});
          data = {'clientSecret': 'fixture-client-secret', 'paymentIntentId': 'pi_fixture'};
        case '/api/payments/confirm-stripe':
          expect(jsonDecode(request.body), {'paymentIntentId': 'pi_fixture'});
          expect(stripeCalls, contains('presentPaymentSheet'));
          confirmed = true;
          data = {'status': 'Successful'};
        default:
          throw StateError('Unexpected payment request');
      }
      return http.Response(jsonEncode(data), 200, headers: {'content-type': 'application/json'});
    });
    await http.runWithClient(() async {
      await tester.pumpWidget(const MaterialApp(home: PaymentChatScreen()));
      await tester.tap(find.text('Pending invoices'));
      await tester.pumpAndSettle();
      expect(find.text('Pay Now'), findsOneWidget);
      await tester.tap(find.text('Pay Now'));
      await tester.pumpAndSettle();
      expect(find.byType(CardPaymentScreen), findsOneWidget);
      await tester.tap(find.text('Pay Securely LKR 100.00'));
      await tester.pumpAndSettle();
      expect(stripeCalls, containsAllInOrder(['initialise', 'initPaymentSheet', 'presentPaymentSheet']));
      expect(confirmed, isTrue);
      expect(find.byType(PaymentChatScreen), findsOneWidget);
      expect(find.text('Pay Now'), findsNothing);
      expect(find.text('Awaiting admin verification'), findsOneWidget);
    }, () => mock);
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(channel, null);
  });

  testWidgets('Successful payment card cannot offer another Pay Now', (tester) async {
    await http.runWithClient(() async {
      await tester.pumpWidget(const MaterialApp(home: PaymentChatScreen()));
      await tester.tap(find.text('Pending invoices'));
      await tester.pumpAndSettle();
      expect(find.text('Pay Now'), findsNothing);
      expect(find.text('Awaiting admin verification'), findsOneWidget);
    }, () => MockClient((request) async => http.Response(jsonEncode({
      'message': 'Payment received', 'data': [
        {'id': 4, 'invoiceNumber': 'FIXTURE-4', 'canPay': false, 'totalAmount': 100,
          'paymentStatus': 'Awaiting admin verification'}
      ],
    }), 200)));
  });
}
