import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Flutter API Service Integration Tests', () {
    test('Parse API JSON response correctly for Facilities endpoint', () {
      const jsonResponse = '''
      [
        {"facilityId": 1, "facilityName": "Swimming Pool", "capacity": 20, "isActive": true},
        {"facilityId": 2, "facilityName": "Gym", "capacity": 15, "isActive": true}
      ]
      ''';

      final List<dynamic> decoded = jsonDecode(jsonResponse);
      expect(decoded.length, equals(2));
      expect(decoded[0]['facilityName'], equals('Swimming Pool'));
      expect(decoded[1]['capacity'], equals(15));
    });

    test('Handles API Error JSON payload gracefully', () {
      const errorJson = '{"message": "Cannot connect to server (Timeout or Network Error)"}';

      final Map<String, dynamic> decoded = jsonDecode(errorJson);
      expect(decoded['message'], contains('Cannot connect to server'));
    });
  });
}
