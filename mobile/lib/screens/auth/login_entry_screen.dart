import 'package:flutter/material.dart';

import '../../models/auth/contact_check_result.dart';
import '../../services/auth/resident_auth_api.dart';
import 'email_auth_options_screen.dart';

/// Step 1 of the login flow.
///
/// The resident enters the email that the building admin registered them
/// with, then continues to the email authentication options.
class LoginEntryScreen extends StatefulWidget {
  const LoginEntryScreen({super.key});

  @override
  State<LoginEntryScreen> createState() => _LoginEntryScreenState();
}

class _LoginEntryScreenState extends State<LoginEntryScreen> {
  final _emailController = TextEditingController();
  final _emailFocus = FocusNode();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _emailFocus.dispose();
    super.dispose();
  }

  Future<void> _onContinue() async {
    final input = _emailController.text.trim();
    if (input.isEmpty) {
      setState(() => _errorMessage = 'Please enter your email address.');
      return;
    }

    // Basic format validation
    if (!RegExp(r'^[\w\.\+\-]+@[\w\-]+\.\w+$').hasMatch(input)) {
      setState(() => _errorMessage = 'Please enter a valid email address.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await ResidentAuthApi.verifyContact(input);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result.errorMessage != null) {
      setState(() => _errorMessage = result.errorMessage);
      return;
    }

    if (!result.found) {
      setState(
        () => _errorMessage =
            'This email is not registered with any apartment complex.\nPlease contact your building admin.',
      );
      return;
    }

    _goToEmailOptions(input, result);
  }

  void _goToEmailOptions(String email, ContactCheckResult result) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => EmailAuthOptionsScreen(
          email: email,
          residentName: result.name,
          unitNumber: result.unitNumber,
          complexName: result.complexName,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF17212B),
      body: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF17212B),
          image: DecorationImage(
            image: AssetImage('assets/images/generated_login_dark.jpg'),
            fit: BoxFit.cover,
            alignment: Alignment.center,
            colorFilter: ColorFilter.mode(Colors.black26, BlendMode.darken),
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Header ──────────────────────────────────────────────
                        Padding(
                          padding: const EdgeInsets.fromLTRB(28, 24, 28, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Welcome back !',
                                style: TextStyle(
                                  color: Color(0xFFD1D5DB),
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              RichText(
                                text: const TextSpan(
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 34,
                                    fontWeight: FontWeight.bold,
                                    height: 1.2,
                                  ),
                                  children: [
                                    TextSpan(text: 'Sign in to your\n'),
                                    TextSpan(
                                      text: 'apartment',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                    TextSpan(text: ' account'),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Use the email address that your\nbuilding admin registered you with.',
                                style: TextStyle(
                                  color: Color(0xFF9CA3AF),
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF17212B),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.security_rounded,
                                          color: Colors.white,
                                          size: 22,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'Secure\nAccess',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          height: 1.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF17212B),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.home_rounded,
                                          color: Colors.white,
                                          size: 22,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'Your\nApartment',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          height: 1.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF17212B),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.people_alt_rounded,
                                          color: Colors.white,
                                          size: 22,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'Manage\nServices',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          height: 1.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── Card area (Expands to fill entire bottom space) ─────
                        Expanded(
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F7F8),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(32),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 20,
                                  offset: const Offset(0, -5),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                _buildEmailInput(),

                                // Error banner
                                if (_errorMessage != null)
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                      24,
                                      0,
                                      24,
                                      12,
                                    ),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFEEEE),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                          color: const Color(0xFFFFCCCC),
                                        ),
                                      ),
                                      child: Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Icon(
                                            Icons.info_outline_rounded,
                                            color: Color(0xFFCC4444),
                                            size: 22,
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Text(
                                              _errorMessage!,
                                              style: const TextStyle(
                                                color: Color(0xFFCC4444),
                                                fontSize: 13,
                                                height: 1.4,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                const Spacer(),

                                // Continue button
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                    24,
                                    0,
                                    24,
                                    16,
                                  ),
                                  child: SizedBox(
                                    width: double.infinity,
                                    height: 52,
                                    child: ElevatedButton(
                                      onPressed: _isLoading
                                          ? null
                                          : _onContinue,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(
                                          0xFF17212B,
                                        ),
                                        foregroundColor: Colors.white,
                                        disabledBackgroundColor: const Color(
                                          0xFF17212B,
                                        ).withValues(alpha: 0.6),
                                        shape: const StadiumBorder(),
                                        elevation: 0,
                                      ),
                                      child: _isLoading
                                          ? const SizedBox(
                                              width: 22,
                                              height: 22,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.5,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(Colors.white),
                                              ),
                                            )
                                          : const Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Text(
                                                  'Continue',
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                                SizedBox(width: 8),
                                                Icon(
                                                  Icons.arrow_forward_rounded,
                                                  size: 22,
                                                ),
                                              ],
                                            ),
                                    ),
                                  ),
                                ),

                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildEmailInput() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _emailController,
            focusNode: _emailFocus,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(fontSize: 16, color: Color(0xFF17212B)),
            decoration: _inputDecoration(
              hint: 'you@example.com',
              icon: Icons.email_outlined,
            ),
            onFieldSubmitted: (_) => _onContinue(),
          ),
          const SizedBox(height: 12),
          const Text(
            'Enter the email address your building admin\nregistered for your apartment unit.',
            style: TextStyle(
              color: Color(0xFF8A9BAB),
              fontSize: 12,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFFADB8C2)),
      prefixIcon: Icon(icon, color: const Color(0xFF5A6A77), size: 20),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: Color(0xFFDDE2E7)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: Color(0xFFDDE2E7)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: Color(0xFF17212B), width: 1.5),
      ),
    );
  }
}
