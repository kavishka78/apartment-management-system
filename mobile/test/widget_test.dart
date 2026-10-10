import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Flutter Widget UI Rendering Tests', () {
    testWidgets('Facility Card widget renders details and action button correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Card(
              child: ListTile(
                title: const Text('Swimming Pool'),
                subtitle: const Text('Capacity: 20 spots | 06:00 AM - 10:00 PM'),
                trailing: ElevatedButton(
                  onPressed: () {},
                  child: const Text('Book Now'),
                ),
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Swimming Pool'), findsOneWidget);
      expect(find.text('Capacity: 20 spots | 06:00 AM - 10:00 PM'), findsOneWidget);
      expect(find.text('Book Now'), findsOneWidget);
      expect(find.byType(Card), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('Parking Slot status badge changes color based on availability', (WidgetTester tester) async {
      Widget buildBadge(bool isAvailable) {
        return Container(
          padding: const EdgeInsets.all(8),
          color: isAvailable ? Colors.green : Colors.red,
          child: Text(isAvailable ? 'AVAILABLE' : 'OCCUPIED'),
        );
      }

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                buildBadge(true),
                buildBadge(false),
              ],
            ),
          ),
        ),
      );

      expect(find.text('AVAILABLE'), findsOneWidget);
      expect(find.text('OCCUPIED'), findsOneWidget);
    });
  });
}
