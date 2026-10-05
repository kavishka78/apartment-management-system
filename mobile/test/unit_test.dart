import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Flutter Unit Tests - Helper & Logic Validation', () {
    test('Format Time string helper converts 24-hour time to 12-hour AM/PM string', () {
      String formatTime(String? timeStr) {
        if (timeStr == null || timeStr.isEmpty) return '—';
        final parts = timeStr.split(':');
        final h = int.parse(parts[0]);
        final m = parts[1];
        final ampm = h >= 12 ? 'PM' : 'AM';
        final h12 = h % 12 == 0 ? 12 : h % 12;
        return '$h12:$m $ampm';
      }

      expect(formatTime('08:30:00'), equals('8:30 AM'));
      expect(formatTime('14:45:00'), equals('2:45 PM'));
      expect(formatTime('00:00:00'), equals('12:00 AM'));
      expect(formatTime('12:00:00'), equals('12:00 PM'));
      expect(formatTime(null), equals('—'));
    });

    test('Facility capacity calculator determines available slots correctly', () {
      int calculateRemainingSlots(int totalCapacity, int currentBookings) {
        final remaining = totalCapacity - currentBookings;
        return remaining < 0 ? 0 : remaining;
      }

      expect(calculateRemainingSlots(20, 5), equals(15));
      expect(calculateRemainingSlots(10, 10), equals(0));
      expect(calculateRemainingSlots(5, 8), equals(0)); // Overbooked safety
    });
  });
}
