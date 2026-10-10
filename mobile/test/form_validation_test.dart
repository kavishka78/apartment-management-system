import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Flutter Form Validation Tests', () {
    testWidgets('Validates required fields in pre-registration form', (WidgetTester tester) async {
      final formKey = GlobalKey<FormState>();
      final nameController = TextEditingController();
      final phoneController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Visitor Name'),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Visitor name is required';
                      }
                      return null;
                    },
                  ),
                  TextFormField(
                    controller: phoneController,
                    decoration: const InputDecoration(labelText: 'Phone Number'),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Phone number is required';
                      }
                      if (val.length < 10) {
                        return 'Enter a valid 10-digit phone number';
                      }
                      return null;
                    },
                  ),
                  ElevatedButton(
                    onPressed: () {
                      formKey.currentState?.validate();
                    },
                    child: const Text('Submit'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Act 1: Tap submit with empty fields
      await tester.tap(find.text('Submit'));
      await tester.pump();

      // Assert 1: Validation error messages displayed
      expect(find.text('Visitor name is required'), findsOneWidget);
      expect(find.text('Phone number is required'), findsOneWidget);

      // Act 2: Enter valid values
      await tester.enterText(find.byType(TextFormField).at(0), 'John Doe');
      await tester.enterText(find.byType(TextFormField).at(1), '0771234567');
      await tester.tap(find.text('Submit'));
      await tester.pump();

      // Assert 2: Validation errors disappear
      expect(find.text('Visitor name is required'), findsNothing);
      expect(find.text('Phone number is required'), findsNothing);
    });
  });
}
