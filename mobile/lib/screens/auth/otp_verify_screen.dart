import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pinput/pinput.dart';
import '../../services/auth/auth_service.dart';
import '../../services/auth/resident_auth_api.dart';
import '../main_navigation_screen.dart';

/// Handles both Phone OTP and Email OTP verification in a single screen.
///
/// When [contactType] is "phone":
///   • Firebase sends an SMS OTP.
///   • User enters the 6-digit code.
///   • Verification → Firebase ID token → backend JWT.
///
/// When [contactType] is "email":
///   • Firebase sends a 6-digit email OTP (sign-in with email link / OOB code).
///   • Same flow thereafter.
class OtpVerifyScreen extends StatefulWidget {
  final String contact;        // Phone number or email
  final String contactType;    // "phone" | "email"
  final String residentName;
  final String unitNumber;
  final String complexName;

  const OtpVerifyScreen({
    super.key,
    required this.contact,
    required this.contactType,
    required this.residentName,
    required this.unitNumber,
    required this.complexName,
  });

  @override
  State<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends State<OtpVerifyScreen> {
  final _pinController = TextEditingController();

  // Firebase phone verification state
  String? _verificationId;

  bool _isSending = true;   // Sending the OTP to Firebase
  bool _isVerifying = false; // Verifying the OTP the user typed
  bool _canResend = false;
  int _resendCountdown = 60;

  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _sendOtp();
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  // ── OTP Sending ────────────────────────────────────────────────────────────

  Future<void> _sendOtp() async {
    setState(() {
      _isSending = true;
      _errorMessage = null;
      _canResend = false;
      _resendCountdown = 60;
    });

    if (widget.contactType == 'phone') {
      await _sendPhoneOtp();
    } else {
      await _sendEmailOtp();
    }

    _startResendCountdown();
  }

  Future<void> _sendPhoneOtp() async {
    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: widget.contact,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (PhoneAuthCredential credential) async {
        // Auto-verified (Android only) — sign in immediately
        await _signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        if (mounted) {
          setState(() {
            _isSending = false;
            _errorMessage =
                'Failed to send OTP. Please check the phone number and try again.\n(${e.message})';
          });
        }
      },
      codeSent: (String verificationId, int? resendToken) {
        if (mounted) {
          setState(() {
            _verificationId = verificationId;
            _isSending = false;
          });
        }
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        _verificationId = verificationId;
      },
    );
  }

  Future<void> _sendEmailOtp() async {
    // Firebase email OTP via email link (passwordless)
    try {
      await FirebaseAuth.instance.sendSignInLinkToEmail(
        email: widget.contact,
        actionCodeSettings: ActionCodeSettings(
          url:
              'https://smartapartment.page.link/login', // Deep-link configured in Firebase console
          handleCodeInApp: true,
          androidPackageName: 'com.example.mobile',
          androidInstallApp: true,
          iOSBundleId: 'com.example.mobile',
        ),
      );
      if (mounted) setState(() => _isSending = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSending = false;
          _errorMessage =
              'Failed to send email OTP. Please try again.\n($e)';
        });
      }
    }
  }

  void _startResendCountdown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() {
        _resendCountdown--;
        if (_resendCountdown <= 0) _canResend = true;
      });
      return _resendCountdown > 0;
    });
  }

  // ── OTP Verification ───────────────────────────────────────────────────────

  Future<void> _verifyOtp(String code) async {
    if (code.length != 6) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      if (widget.contactType == 'phone') {
        final credential = PhoneAuthProvider.credential(
          verificationId: _verificationId ?? '',
          smsCode: code,
        );
        await _signInWithCredential(credential);
      } else {
        // Email OTP: treat the 6-digit code as a sign-in OTP
        // This uses Firebase's email link OTP (OOB code) flow
        final credential = EmailAuthProvider.credentialWithLink(
          email: widget.contact,
          emailLink: code, // the magic link / OOB code from the email
        );
        await _signInWithCredential(credential);
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() {
          _isVerifying = false;
          _errorMessage = e.code == 'invalid-verification-code'
              ? 'Incorrect OTP. Please check and try again.'
              : 'Verification failed: ${e.message}';
        });
        _pinController.clear();
      }
    }
  }

  Future<void> _signInWithCredential(AuthCredential credential) async {
    final userCredential =
        await FirebaseAuth.instance.signInWithCredential(credential);
    final firebaseIdToken = await userCredential.user?.getIdToken();

    if (firebaseIdToken == null) {
      if (mounted) {
        setState(() {
          _isVerifying = false;
          _errorMessage = 'Could not retrieve authentication token. Please try again.';
        });
      }
      return;
    }

    // Exchange Firebase token for our app's JWT
    final session = await ResidentAuthApi.exchangeFirebaseToken(firebaseIdToken);

    if (!mounted) return;

    if (session == null || !session.isValid) {
      setState(() {
        _isVerifying = false;
        _errorMessage =
            'Your account could not be verified by the server.\nPlease contact your building admin.';
      });
      return;
    }

    await AuthService.saveSession(session);

    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
      (_) => false,
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isPhone = widget.contactType == 'phone';

    return Scaffold(
      backgroundColor: const Color(0xFF17212B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF17212B),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 8, 28, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.verified_user_outlined,
                            color: Color(0xFFB8C2CC), size: 14),
                        const SizedBox(width: 6),
                        Text(
                          isPhone ? 'Phone Verification' : 'Email Verification',
                          style: const TextStyle(
                            color: Color(0xFFB8C2CC),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Hi, ${widget.residentName.split(' ').first}!',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isPhone
                        ? 'We sent a 6-digit code to\n${widget.contact}'
                        : 'We sent a sign-in link to\n${widget.contact}',
                    style: const TextStyle(
                      color: Color(0xFF8A9BAB),
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),

            // ── Card ───────────────────────────────────────────────
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFF5F7F8),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // Unit info chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF17212B).withOpacity(0.06),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.home_outlined,
                                size: 16, color: Color(0xFF17212B)),
                            const SizedBox(width: 6),
                            Text(
                              'Unit ${widget.unitNumber} · ${widget.complexName}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF17212B),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 36),

                      if (_isSending) ...[
                        const CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                              Color(0xFF17212B)),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Sending verification code…',
                          style: TextStyle(color: Color(0xFF5A6A77)),
                        ),
                      ] else ...[
                        // PIN input
                        Pinput(
                          controller: _pinController,
                          length: 6,
                          autofocus: true,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          defaultPinTheme: PinTheme(
                            width: 52,
                            height: 58,
                            textStyle: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF17212B),
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color: const Color(0xFFDDE2E7)),
                            ),
                          ),
                          focusedPinTheme: PinTheme(
                            width: 52,
                            height: 58,
                            textStyle: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF17212B),
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color: const Color(0xFF17212B), width: 2),
                            ),
                          ),
                          onCompleted: _verifyOtp,
                        ),

                        const SizedBox(height: 28),

                        // Verify button
                        SizedBox(
                          width: double.infinity,
                          height: 54,
                          child: ElevatedButton(
                            onPressed: _isVerifying
                                ? null
                                : () => _verifyOtp(_pinController.text),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF17212B),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 0,
                            ),
                            child: _isVerifying
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      valueColor:
                                          AlwaysStoppedAnimation<Color>(
                                              Colors.white),
                                    ),
                                  )
                                : const Text(
                                    'Verify & Sign In',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Resend
                        TextButton(
                          onPressed: _canResend ? _sendOtp : null,
                          child: Text(
                            _canResend
                                ? 'Resend OTP'
                                : 'Resend in ${_resendCountdown}s',
                            style: TextStyle(
                              color: _canResend
                                  ? const Color(0xFF17212B)
                                  : const Color(0xFFADB8C2),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],

                      // Error banner
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFEEEE),
                            borderRadius: BorderRadius.circular(14),
                            border:
                                Border.all(color: const Color(0xFFFFCCCC)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.error_outline_rounded,
                                  color: Color(0xFFCC4444), size: 18),
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
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
