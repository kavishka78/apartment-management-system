import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/maintenance/maintenance_model.dart';
import '../../services/maintenance/maintenance_api_service.dart';
import 'complaint_success_screen.dart';
import 'maintenance_home_screen.dart'; // for CURRENT_RESIDENT_ID

class CreateComplaintScreen extends StatefulWidget {
  const CreateComplaintScreen({super.key});

  @override
  State<CreateComplaintScreen> createState() => _CreateComplaintScreenState();
}

class _CreateComplaintScreenState extends State<CreateComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  
  bool _isLoading = true;
  bool _isSubmitting = false;
  String _error = '';
  
  List<MaintenanceCategory> _categories = [];
  MaintenanceCategory? _selectedCategory;
  String _selectedPriority = 'Pending Assessment';
  
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  int _currentStep = 0;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    final result = await MaintenanceApiService.getCategories();
    if (mounted) {
      if (result['success'] == true) {
        final List<dynamic> items = result['data'];
        setState(() {
          _categories = items.map((e) => MaintenanceCategory.fromJson(e)).toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result['message'];
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source, imageQuality: 70);
      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error picking image: $e')));
    }
  }

  Future<void> _submitComplaint() async {
    if (_selectedCategory == null) {
      setState(() => _error = 'Please select a category first.');
      return;
    }
    
    setState(() {
      _isSubmitting = true;
      _error = '';
    });

    final result = await MaintenanceApiService.createComplaint(
      residentId: CURRENT_RESIDENT_ID,
      categoryId: _selectedCategory!.id,
      title: _titleController.text.trim(),
      description: _descController.text.trim(),
      priority: _selectedPriority,
    );

    if (result['success'] == true) {
      final ticket = MaintenanceTicket.fromJson(result['data']);
      
      if (_imageFile != null) {
        await MaintenanceApiService.uploadPhoto(ticket.id, _imageFile!.path);
      }

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => ComplaintSuccessScreen(ticket: ticket)),
        );
      }
    } else {
      if (mounted) {
        setState(() {
          _error = result['message'];
          _isSubmitting = false;
        });
      }
    }
  }

  void _nextStep() {
    if (_currentStep == 0 && _selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a category.')));
      return;
    }
    if (_currentStep == 1) {
      if (!_formKey.currentState!.validate()) return;
    }
    if (_currentStep < 2) {
      setState(() => _currentStep++);
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submitComplaint();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      Navigator.pop(context);
    }
  }

  IconData _getCategoryIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('plumb') || lower.contains('water')) return Icons.water_drop;
    if (lower.contains('elect') || lower.contains('light')) return Icons.lightbulb_outline;
    if (lower.contains('cool') || lower.contains('ac') || lower.contains('air') || lower.contains('hvac')) return Icons.ac_unit;
    if (lower.contains('appli')) return Icons.kitchen;
    if (lower.contains('door') || lower.contains('lock') || lower.contains('key')) return Icons.door_front_door_outlined;
    if (lower.contains('paint')) return Icons.format_paint;
    if (lower.contains('clean')) return Icons.cleaning_services;
    if (lower.contains('secur')) return Icons.security;
    if (lower.contains('elevat')) return Icons.elevator;
    if (lower.contains('build') || lower.contains('struct')) return Icons.apartment;
    return Icons.build;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('New Request', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black87, size: 22),
          onPressed: _prevStep,
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1E2532)))
          : Column(
              children: [
                _buildProgressHeader(),
                const SizedBox(height: 16),
                if (_error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text(_error, style: TextStyle(color: Colors.red.shade800)),
                    ),
                  ),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _buildStep1Category(),
                      _buildStep2Details(),
                      _buildStep3Review(),
                    ],
                  ),
                ),
                _buildBottomActions(),
              ],
            ),
    );
  }

  Widget _buildProgressHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildProgressStep(0, 'Category'),
          _buildProgressLine(0),
          _buildProgressStep(1, 'Details'),
          _buildProgressLine(1),
          _buildProgressStep(2, 'Review'),
        ],
      ),
    );
  }

  Widget _buildProgressStep(int stepIndex, String title) {
    bool isActive = _currentStep >= stepIndex;
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF10B981) : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? const Color(0xFF10B981) : Colors.grey.shade300, width: 2),
          ),
          child: Center(
            child: isActive && _currentStep > stepIndex
                ? const Icon(Icons.check, color: Colors.white, size: 18)
                : Text(
                    '${stepIndex + 1}',
                    style: TextStyle(
                      color: isActive ? Colors.white : Colors.grey.shade400,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            color: isActive ? const Color(0xFF10B981) : Colors.grey.shade500,
          ),
        )
      ],
    );
  }

  Widget _buildProgressLine(int stepIndex) {
    bool isActive = _currentStep > stepIndex;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 24, left: 8, right: 8),
        color: isActive ? const Color(0xFF10B981) : Colors.grey.shade300,
      ),
    );
  }

  Widget _buildStep1Category() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Category', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.9,
            ),
            itemCount: _categories.length,
            itemBuilder: (context, index) {
              final cat = _categories[index];
              final isSelected = _selectedCategory?.id == cat.id;
              return GestureDetector(
                onTap: () => setState(() => _selectedCategory = cat),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF1E2532) : const Color(0xFFE8ECEF),
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: isSelected ? [BoxShadow(color: const Color(0xFF1E2532).withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 4))] : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _getCategoryIcon(cat.name),
                        size: 32,
                        color: isSelected ? const Color(0xFF1E2532) : const Color(0xFF4FC3F7),
                      ),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          cat.name,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? const Color(0xFF1E2532) : Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildStep2Details() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Request Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
            const SizedBox(height: 20),
            
            const Text('Title', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: 'e.g., Kitchen sink is leaking',
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.all(16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              ),
              validator: (val) => val == null || val.isEmpty ? 'Title is required' : null,
            ),
            const SizedBox(height: 20),

            const Text('Description', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Provide details about the issue...',
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.all(16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              ),
              validator: (val) => val == null || val.isEmpty ? 'Description is required' : null,
            ),
            const SizedBox(height: 24),
            
            const Text('Add Photos (Optional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_imageFile != null)
                  Container(
                    width: 100,
                    height: 100,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      image: DecorationImage(image: FileImage(_imageFile!), fit: BoxFit.cover),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          top: 4, right: 4,
                          child: InkWell(
                            onTap: () => setState(() => _imageFile = null),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                              child: const Icon(Icons.close, color: Colors.white, size: 16),
                            ),
                          ),
                        )
                      ],
                    ),
                  ),
                InkWell(
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      builder: (ctx) => SafeArea(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ListTile(
                              leading: const Icon(Icons.camera_alt),
                              title: const Text('Take Photo'),
                              onTap: () {
                                Navigator.pop(ctx);
                                _pickImage(ImageSource.camera);
                              },
                            ),
                            ListTile(
                              leading: const Icon(Icons.photo_library),
                              title: const Text('Choose from Gallery'),
                              onTap: () {
                                Navigator.pop(ctx);
                                _pickImage(ImageSource.gallery);
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E2532).withOpacity(0.3), style: BorderStyle.solid),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.add_a_photo_outlined, color: Color(0xFF1E2532)),
                        SizedBox(height: 8),
                        Text('Add Photo', style: TextStyle(fontSize: 12, color: Color(0xFF1E2532), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3Review() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Review Request', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1E2532))),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE8ECEF)),
            ),
            child: Column(
              children: [
                _buildReviewRow(Icons.category, 'Category', _selectedCategory?.name ?? ''),
                const Divider(height: 32),
                _buildReviewRow(Icons.title, 'Title', _titleController.text),
                const Divider(height: 32),
                _buildReviewRow(Icons.description, 'Description', _descController.text),
                if (_imageFile != null) ...[
                  const Divider(height: 32),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.image, color: Color(0xFF10B981), size: 24),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Photo', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(_imageFile!, height: 100, width: 100, fit: BoxFit.cover),
                            ),
                          ],
                        ),
                      )
                    ],
                  )
                ]
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildReviewRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF10B981), size: 24),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E2532))),
            ],
          ),
        )
      ],
    );
  }

Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: SizedBox(
                height: 56,
                child: OutlinedButton(
                onPressed: _isSubmitting ? null : _prevStep,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF1E2532),
                  side: const BorderSide(color: Color(0xFFE8ECEF), width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Back', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            child: SizedBox(
              height: 56,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _nextStep,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2532),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isSubmitting
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(_currentStep == 2 ? 'Submit Request' : 'Next', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
