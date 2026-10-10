import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/screens/maintenance/create_complaint_screen.dart';
import 'package:mobile/services/auth/auth_service.dart';
import 'package:mobile/services/maintenance/maintenance_api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUpAll(() {
    dotenv.testLoad(fileInput: 'API_URL=https://test.example/api');
  });

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await AuthService.clearSession();
  });

  test('complaints are filtered to the requested resident', () async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', 'test-token');
    await prefs.setInt('auth_residentId', 24);
    final result = await http.runWithClient(
      () => MaintenanceApiService.getComplaints(),
      () => MockClient(
        (_) async => http.Response(
          jsonEncode([
            {'id': 1, 'residentId': 24},
            {'id': 2, 'residentId': 25},
          ]),
          200,
        ),
      ),
    );

    expect(result['success'], isTrue);
    expect((result['data'] as List).map((complaint) => complaint['id']), [1]);
  });

  testWidgets('requires a maintenance category before moving to details', (
    tester,
  ) async {
    await http.runWithClient(
      () async {
        await tester.pumpWidget(
          const MaterialApp(home: CreateComplaintScreen()),
        );
        await tester.pumpAndSettle();

        expect(find.text('Select Category'), findsOneWidget);
        await tester.tap(find.text('Next'));
        await tester.pump();

        expect(find.text('Please select a category.'), findsOneWidget);
        expect(find.text('Select Category'), findsOneWidget);
      },
      () => MockClient((request) async {
        if (request.url.path.endsWith('/maintenance/categories')) {
          return http.Response(
            jsonEncode([
              {'id': 1, 'name': 'Plumbing'},
            ]),
            200,
          );
        }
        return http.Response('Not found', 404);
      }),
    );
  });

  test(
    'complaint creation sends its fields and resident identity to the API',
    () async {
      http.Request? capturedRequest;
      final result = await http.runWithClient(
        () => MaintenanceApiService.createComplaint(
          residentId: 24,
          categoryId: 3,
          title: 'Kitchen sink leak',
          description: 'Water is leaking below the sink.',
          priority: 'Pending Assessment',
        ),
        () => MockClient((request) async {
          capturedRequest = request;
          return http.Response(jsonEncode({'id': 7, 'residentId': 24}), 201);
        }),
      );

      expect(result['success'], isTrue);
      expect(capturedRequest?.method, 'POST');
      expect(capturedRequest?.url.path, endsWith('/maintenance'));
      expect(jsonDecode(capturedRequest!.body), {
        'residentId': 24,
        'categoryId': 3,
        'title': 'Kitchen sink leak',
        'description': 'Water is leaking below the sink.',
        'priority': 'Pending Assessment',
      });
    },
  );

  test(
    'complaint creation returns a failure for a rejected API request',
    () async {
      final result = await http.runWithClient(
        () => MaintenanceApiService.createComplaint(
          residentId: 24,
          categoryId: 999,
          title: 'Kitchen sink leak',
          description: 'Water is leaking below the sink.',
          priority: 'Pending Assessment',
        ),
        () => MockClient(
          (_) async =>
              http.Response(jsonEncode({'message': 'Invalid category.'}), 400),
        ),
      );

      expect(result['success'], isFalse);
      expect(result['message'], contains('Invalid category.'));
      expect(result['message'], contains('400'));
    },
  );

  testWidgets('validates required details before showing the review step', (
    tester,
  ) async {
    await http.runWithClient(
      () async {
        await tester.pumpWidget(
          const MaterialApp(home: CreateComplaintScreen()),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('Plumbing'));
        await tester.tap(find.text('Next'));
        await tester.pumpAndSettle();

        expect(find.text('Request Details'), findsOneWidget);
        await tester.tap(find.text('Next'));
        await tester.pump();

        expect(find.text('Title is required'), findsOneWidget);
        expect(find.text('Request Details'), findsOneWidget);
      },
      () => MockClient((request) async {
        if (request.url.path.endsWith('/maintenance/categories')) {
          return http.Response(
            jsonEncode([
              {'id': 1, 'name': 'Plumbing'},
            ]),
            200,
          );
        }
        return http.Response('Not found', 404);
      }),
    );
  });
}
