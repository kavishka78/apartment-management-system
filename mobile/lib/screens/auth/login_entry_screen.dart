import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../models/auth/contact_check_result.dart';
import '../../services/auth/resident_auth_api.dart';
import 'email_auth_options_screen.dart';
import 'otp_verify_screen.dart';

/// Step 1 of the login flow.
///
/// The resident enters the phone number OR email that the building admin
/// registered them with. If the contact is found in the system, the user
/// is forwarded to the appropriate verification screen.
class LoginEntryScreen extends StatefulWidget {
  const LoginEntryScreen({super.key});

  @override
  State<LoginEntryScreen> createState() => _LoginEntryScreenState();
}

class _LoginEntryScreenState extends State<LoginEntryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneFocus = FocusNode();
  final _emailFocus = FocusNode();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      // Clear error when switching tabs
      if (mounted) setState(() => _errorMessage = null);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _phoneFocus.dispose();
    _emailFocus.dispose();
    super.dispose();
  }

  bool get _isPhoneTab => _tabController.index == 0;

  String get _currentInput =>
      _isPhoneTab ? _phoneController.text.trim() : _emailController.text.trim();

  Future<void> _onContinue() async {
    final input = _currentInput;
    if (input.isEmpty) {
      setState(
        () => _errorMessage = _isPhoneTab
            ? 'Please enter your phone number.'
            : 'Please enter your email address.',
      );
      return;
    }

    // Basic format validation
    if (_isPhoneTab) {
      if (!RegExp(r'^[0-9+\s\-]{7,15}$').hasMatch(input)) {
        setState(() => _errorMessage = 'Please enter a valid phone number.');
        return;
      }
    } else {
      if (!RegExp(r'^[\w\.\+\-]+@[\w\-]+\.\w+$').hasMatch(input)) {
        setState(() => _errorMessage = 'Please enter a valid email address.');
        return;
      }
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await ResidentAuthApi.verifyContact(input);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!result.found) {
      setState(
        () => _errorMessage = _isPhoneTab
            ? 'This phone number is not registered with any apartment complex.\nPlease contact your building admin.'
            : 'This email is not registered with any apartment complex.\nPlease contact your building admin.',
      );
      return;
    }

    // Navigate to the right auth screen
    if (_isPhoneTab) {
      _goToPhoneOtp(input, result);
    } else {
      _goToEmailOptions(input, result);
    }
  }

  void _goToPhoneOtp(String phone, ContactCheckResult result) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OtpVerifyScreen(
          contact: phone,
          contactType: 'phone',
          residentName: result.name,
          unitNumber: result.unitNumber,
          complexName: result.complexName,
        ),
      ),
    );
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
                                'Use the phone number or email that your\nbuilding admin registered you with.',
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
                                // Tab bar
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                    24,
                                    24,
                                    24,
                                    0,
                                  ),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    child: TabBar(
                                      controller: _tabController,
                                      indicator: BoxDecoration(
                                        color: const Color(0xFF17212B),
                                        borderRadius: BorderRadius.circular(30),
                                      ),
                                      dividerColor: Colors.transparent,
                                      labelColor: Colors.white,
                                      unselectedLabelColor: const Color(
                                        0xFF5A6A77,
                                      ),
                                      labelStyle: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                      tabs: const [
                                        Tab(
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                Icons.phone_rounded,
                                                size: 16,
                                              ),
                                              SizedBox(width: 6),
                                              Text('Phone Number'),
                                            ],
                                          ),
                                        ),
                                        Tab(
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                Icons.email_outlined,
                                                size: 16,
                                              ),
                                              SizedBox(width: 6),
                                              Text('Email Address'),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                                // Input fields view
                                AnimatedBuilder(
                                  animation: _tabController,
                                  builder: (context, _) {
                                    return _isPhoneTab
                                        ? _buildPhoneInput()
                                        : _buildEmailInput();
                                  },
                                ),

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

  Widget _buildPhoneInput() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _phoneController,
            focusNode: _phoneFocus,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s\-]')),
            ],
            style: const TextStyle(fontSize: 16, color: Color(0xFF17212B)),
            decoration:
                _inputDecoration(
                  hint: '77 123 4567',
                  icon: Icons.phone_outlined,
                ).copyWith(
                  prefixIcon: IntrinsicWidth(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.phone_outlined,
                            color: Color(0xFF5A6A77),
                            size: 20,
                          ),
                          const SizedBox(width: 6),
                          const Text('🇱🇰', style: TextStyle(fontSize: 18)),
                          const SizedBox(width: 6),
                          const Text(
                            '+94',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF17212B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            width: 1,
                            height: 24,
                            color: const Color(0xFFDDE2E7),
                          ),
                          const SizedBox(width: 6),
                        ],
                      ),
                    ),
                  ),
                ),
            onFieldSubmitted: (_) => _onContinue(),
          ),
          const SizedBox(height: 12),
          const Text(
            'Enter the mobile number your building admin\nregistered for your apartment unit.',
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
