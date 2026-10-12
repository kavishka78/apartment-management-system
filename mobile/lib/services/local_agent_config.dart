import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class LocalAgentConfig {
  static String _url(String key, String defined, int port) {
    final configured = defined.isNotEmpty ? defined : dotenv.env[key];
    return (configured?.trim().isNotEmpty == true
            ? configured!.trim()
            : 'http://${kIsWeb ? 'localhost' : '10.0.2.2'}:$port')
        .replaceFirst(RegExp(r'/+$'), '');
  }

  static String get facility => _url('FACILITY_AGENT_URL',
      const String.fromEnvironment('FACILITY_AGENT_URL'), 8002);
  static String get maintenance => _url('MAINTENANCE_AGENT_URL',
      const String.fromEnvironment('MAINTENANCE_AGENT_URL'), 8000);
}
