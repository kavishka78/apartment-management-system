import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../services/auth/auth_service.dart';
import '../../services/auth/resident_auth_api.dart';
import '../main_navigation_screen.dart';
import 'otp_verify_screen.dart';

/// Shown when the resident chooses to log in via their registered email.
///
/// Offers two paths:
///   1. Continue with Google — triggers Google OAuth, uses the existing
///      POST /api/v1/auth/google backend endpoint.
///   2. Send Email OTP — sends a Firebase email OTP and opens OtpVerifyScreen.
class EmailAuthOptionsScreen extends StatefulWidget {
  final String email;
  final String residentName;
  final String unitNumber;
  final String complexName;

  const EmailAuthOptionsScreen({
    super.key,
    required this.email,
    required this.residentName,
    required this.unitNumber,
    required this.complexName,
  });

  @override
  State<EmailAuthOptionsScreen> createState() => _EmailAuthOptionsScreenState();
}

class _EmailAuthOptionsScreenState extends State<EmailAuthOptionsScreen> {
  bool _isGoogleLoading = false;
  bool _isOtpLoading = false;
  String? _errorMessage;

  // ── Google Sign-In ─────────────────────────────────────────────────────────

  Future<void> _signInWithGoogle() async {
    setState(() {
      _isGoogleLoading = true;
      _errorMessage = null;
    });

    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        // Web client ID from Firebase project (apartment-hub-861ec)
        clientId:
            '414056943213-3pd3450umj94cu8l0sicv1orgmjpo3pk.apps.googleusercontent.com',
      );

      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();

      if (googleUser == null) {
        // User cancelled
        setState(() => _isGoogleLoading = false);
        return;
      }

      // Verify the signed-in email matches what was registered
      if (googleUser.email.toLowerCase() != widget.email.toLowerCase()) {
        await googleSignIn.signOut();
        setState(() {
          _isGoogleLoading = false;
          _errorMessage =
              'The Google account (${googleUser.email}) does not match the registered email (${widget.email}).\nPlease sign in with the correct Google account.';
        });
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with the Google credential
      final userCredential =
          await FirebaseAuth.instance.signInWithCredential(credential);
      final firebaseIdToken = await userCredential.user?.getIdToken();

      if (firebaseIdToken == null) {
        setState(() {
          _isGoogleLoading = false;
          _errorMessage = 'Google sign-in failed. Please try again.';
        });
        return;
      }

      // Exchange Firebase/Google token for our app JWT
      final session =
          await ResidentAuthApi.exchangeFirebaseToken(firebaseIdToken);

      if (!mounted) return;

      if (session == null || !session.isValid) {
        setState(() {
          _isGoogleLoading = false;
          _errorMessage =
              'Your Google account is not linked to a registered resident account.\nPlease contact your building admin.';
        });
        return;
      }

      await AuthService.saveSession(session);

      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
        (_) => false,
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _isGoogleLoading = false;
          _errorMessage = 'Google sign-in error: $e';
        });
      }
    }
  }

  // ── Email OTP ──────────────────────────────────────────────────────────────

  void _goToEmailOtp() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OtpVerifyScreen(
          contact: widget.email,
          contactType: 'email',
          residentName: widget.residentName,
          unitNumber: widget.unitNumber,
          complexName: widget.complexName,
        ),
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
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
                  const Text(
                    'Choose how to sign in',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        color: Color(0xFF8A9BAB),
                        fontSize: 14,
                        height: 1.5,
                      ),
                      children: [
                        const TextSpan(text: 'Registered email: '),
                        TextSpan(
                          text: widget.email,
                          style: const TextStyle(
                            color: Color(0xFFB8C2CC),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),

            // ── Options card ───────────────────────────────────────
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFF5F7F8),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Unit chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF17212B).withOpacity(0.06),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.home_outlined,
                                size: 15, color: Color(0xFF17212B)),
                            const SizedBox(width: 6),
                            Text(
                              '${widget.residentName} · Unit ${widget.unitNumber}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF17212B),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 28),

                      // ── Option 1: Google ─────────────────────────
                      _AuthOptionCard(
                        icon: _GoogleIcon(),
                        title: 'Continue with Google',
                        subtitle:
                            'Sign in using your Google account linked to ${widget.email}',
                        isLoading: _isGoogleLoading,
                        onTap: _isGoogleLoading || _isOtpLoading
                            ? null
                            : _signInWithGoogle,
                        color: Colors.white,
                        textColor: const Color(0xFF17212B),
                        borderColor: const Color(0xFFDDE2E7),
                      ),

                      const SizedBox(height: 14),

                      // Divider
                      Row(
                        children: [
                          const Expanded(
                              child: Divider(color: Color(0xFFDDE2E7))),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 14),
                            child: Text(
                              'or',
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const Expanded(
                              child: Divider(color: Color(0xFFDDE2E7))),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // ── Option 2: Email OTP ──────────────────────
                      _AuthOptionCard(
                        icon: const Icon(Icons.mark_email_unread_outlined,
                            color: Colors.white, size: 24),
                        title: 'Send Email OTP',
                        subtitle:
                            'We\'ll send a one-time code to ${widget.email}',
                        isLoading: _isOtpLoading,
                        onTap: _isGoogleLoading || _isOtpLoading
                            ? null
                            : _goToEmailOtp,
                        color: const Color(0xFF17212B),
                        textColor: Colors.white,
                        subtitleColor: const Color(0xFFB8C2CC),
                        borderColor: Colors.transparent,
                      ),

                      // Error banner
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 20),
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

                      const SizedBox(height: 32),

                      // Security note
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F4F7),
                          borderRadius: BorderRadius.circular(14),
                          border:
                              Border.all(color: const Color(0xFFDDE2E7)),
                        ),
                        child: const Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.lock_outline_rounded,
                                size: 16, color: Color(0xFF5A6A77)),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Each session requires identity verification. Your account was set up by your building administrator.',
                                style: TextStyle(
                                  color: Color(0xFF5A6A77),
                                  fontSize: 12,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
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

// ── Reusable auth option card ─────────────────────────────────────────────────

class _AuthOptionCard extends StatelessWidget {
  final Widget icon;
  final String title;
  final String subtitle;
  final bool isLoading;
  final VoidCallback? onTap;
  final Color color;
  final Color textColor;
  final Color? subtitleColor;
  final Color borderColor;

  const _AuthOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isLoading,
    required this.onTap,
    required this.color,
    required this.textColor,
    required this.borderColor,
    this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            children: [
              icon,
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: subtitleColor ??
                            textColor.withOpacity(0.6),
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (isLoading)
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(textColor),
                  ),
                )
              else
                Icon(Icons.arrow_forward_ios_rounded,
                    size: 14, color: textColor.withOpacity(0.5)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Google colored icon ───────────────────────────────────────────────────────

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 24,
      height: 24,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(shape: BoxShape.circle),
            child: const Text(
              'G',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4285F4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
