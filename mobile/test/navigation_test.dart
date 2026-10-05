import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Flutter Navigation & Routing Tests', () {
    testWidgets('Navigates from Facilities Screen to Booking Screen upon clicking Book Now', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          initialRoute: '/',
          routes: {
            '/': (context) => Scaffold(
                appBar: AppBar(title: const Text('Amenities')),
                body: ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/book');
                  },
                  child: const Text('Book Swimming Pool'),
                ),
              ),
            '/book': (context) => Scaffold(
                appBar: AppBar(title: const Text('Book Facility')),
                body: const Text('Booking Details Form'),
              ),
          },
        ),
      );

      // Assert initial screen
      expect(find.text('Amenities'), findsOneWidget);
      expect(find.text('Book Swimming Pool'), findsOneWidget);

      // Tap navigation button
      await tester.tap(find.text('Book Swimming Pool'));
      await tester.pumpAndSettle(); // Wait for page transition animation to complete

      // Assert destination screen
      expect(find.text('Book Facility'), findsOneWidget);
      expect(find.text('Booking Details Form'), findsOneWidget);
    });
  });
}
